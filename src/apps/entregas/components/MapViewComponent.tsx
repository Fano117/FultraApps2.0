import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, Region, Camera } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Entrega, Coordenadas } from '../types';
import { colors } from '@/design-system';

interface MapViewComponentProps {
  entregas: Entrega[];
  currentLocation?: Coordenadas;
  selectedEntrega?: Entrega;
  onEntregaSelect?: (entrega: Entrega) => void;
  showRoute?: boolean;
  routeCoordinates?: Coordenadas[];
  isSimulationMode?: boolean;
}

export const MapViewComponent: React.FC<MapViewComponentProps> = ({
  entregas,
  currentLocation,
  selectedEntrega,
  onEntregaSelect,
  showRoute = false,
  routeCoordinates = [],
  isSimulationMode = false,
}) => {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(15);

  useEffect(() => {
    if (currentLocation) {
      const initialRegion: Region = {
        latitude: currentLocation.latitud,
        longitude: currentLocation.longitud,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(initialRegion);
      setIsLoading(false);
    } else if (entregas.length > 0) {
      const firstEntrega = entregas[0];
      const initialRegion: Region = {
        latitude: firstEntrega.direccion.coordenadas.latitud,
        longitude: firstEntrega.direccion.coordenadas.longitud,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      setRegion(initialRegion);
      setIsLoading(false);
    }
  }, [currentLocation, entregas]);

  const centerOnLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitud,
        longitude: currentLocation.longitud,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const fitToMarkers = () => {
    if (mapRef.current && entregas.length > 0) {
      mapRef.current.fitToSuppliedMarkers(
        entregas.map((e) => e.id),
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        }
      );
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 1, 20);
    setZoomLevel(newZoom);
    if (mapRef.current && currentLocation) {
      const camera: Partial<Camera> = {
        center: {
          latitude: currentLocation.latitud,
          longitude: currentLocation.longitud,
        },
        zoom: newZoom,
      };
      mapRef.current.animateCamera(camera, { duration: 300 });
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 1, 5);
    setZoomLevel(newZoom);
    if (mapRef.current && currentLocation) {
      const camera: Partial<Camera> = {
        center: {
          latitude: currentLocation.latitud,
          longitude: currentLocation.longitud,
        },
        zoom: newZoom,
      };
      mapRef.current.animateCamera(camera, { duration: 300 });
    }
  };

  const getMarkerColor = (estatus: string): string => {
    switch (estatus) {
      case 'COMPLETADA':
        return colors.success[500];
      case 'EN_RUTA':
        return colors.primary[500];
      case 'EN_SITIO':
        return colors.warning[500];
      default:
        return colors.neutral[400];
    }
  };

  if (isLoading || !region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        loadingEnabled={true}
        zoomEnabled={true}
        zoomControlEnabled={false}
        scrollEnabled={true}
        pitchEnabled={isSimulationMode}
        rotateEnabled={isSimulationMode}
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitud,
              longitude: currentLocation.longitud,
            }}
            title="Mi ubicación"
            pinColor={colors.primary[500]}
          />
        )}

        {entregas.map((entrega, index) => (
          <Marker
            key={entrega.id}
            identifier={entrega.id}
            coordinate={{
              latitude: entrega.direccion.coordenadas.latitud,
              longitude: entrega.direccion.coordenadas.longitud,
            }}
            title={entrega.cliente.nombre}
            description={entrega.direccion.calle}
            pinColor={getMarkerColor(entrega.estatus)}
            onPress={() => onEntregaSelect?.(entrega)}
          >
            <View style={[styles.markerContainer, { backgroundColor: getMarkerColor(entrega.estatus) }]}>
              <Text style={styles.markerText}>{entrega.secuencia || index + 1}</Text>
            </View>
          </Marker>
        ))}

        {showRoute && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates.map((coord) => ({
              latitude: coord.latitud,
              longitude: coord.longitud,
            }))}
            strokeColor={colors.primary[500]}
            strokeWidth={4}
          />
        )}
      </MapView>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={centerOnLocation}>
          <Ionicons name="locate" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={fitToMarkers}>
          <Ionicons name="map-outline" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Controles de zoom */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
          <Ionicons name="add" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
          <Ionicons name="remove" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
  },
  controls: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    gap: 12,
  },
  controlButton: {
    backgroundColor: 'white',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButtonText: {
    fontSize: 24,
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  markerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    bottom: 200,
    backgroundColor: 'white',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  zoomButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.neutral[200],
  },
});
