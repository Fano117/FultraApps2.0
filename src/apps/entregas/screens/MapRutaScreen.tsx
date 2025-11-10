import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MapViewComponent, LoadingSpinner } from '../components';
import { Entrega, Coordenadas } from '../types';
import { locationService, geofenceService, deliveryApiService } from '../services';
import { colors, spacing } from '@/design-system';

type RootStackParamList = {
  MapRuta: { choferId: string };
  ConfirmarEntrega: { entrega: Entrega };
};

type MapRutaScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MapRuta'>;
type MapRutaScreenRouteProp = RouteProp<RootStackParamList, 'MapRuta'>;

interface MapRutaScreenProps {
  navigation: MapRutaScreenNavigationProp;
  route: MapRutaScreenRouteProp;
}

export const MapRutaScreen: React.FC<MapRutaScreenProps> = ({ navigation, route }) => {
  const { choferId } = route.params;
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordenadas | undefined>();
  const [routeCoordinates, setRouteCoordinates] = useState<Coordenadas[]>([]);
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completadas: 0,
    pendientes: 0,
    distanciaTotal: 0,
    tiempoEstimado: 0,
  });

  useEffect(() => {
    loadRoute();
    startLocationTracking();

    return () => {
      locationService.stopForegroundTracking();
      geofenceService.stopMonitoring();
    };
  }, []);

  const loadRoute = async () => {
    try {
      setIsLoading(true);
      const ruta = await deliveryApiService.getRutaOptimizada(choferId);
      
      setEntregas(ruta.entregas);
      setRouteCoordinates(ruta.puntos);
      setStats({
        total: ruta.entregas.length,
        completadas: ruta.entregas.filter((e) => e.estatus === 'COMPLETADA').length,
        pendientes: ruta.entregas.filter((e) => e.estatus === 'PENDIENTE' || e.estatus === 'EN_RUTA').length,
        distanciaTotal: ruta.distanciaTotal,
        tiempoEstimado: ruta.tiempoEstimado,
      });

      setupGeofencing(ruta.entregas);
    } catch (error) {
      console.error('Error loading route:', error);
      Alert.alert('Error', 'No se pudo cargar la ruta');
    } finally {
      setIsLoading(false);
    }
  };

  const startLocationTracking = async () => {
    const hasPermission = await locationService.requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permisos necesarios', 'Se requiere acceso a la ubicación para continuar');
      return;
    }

    const location = await locationService.getCurrentLocation();
    if (location) {
      setCurrentLocation({
        latitud: location.latitude,
        longitud: location.longitude,
      });
    }

    await locationService.startForegroundTracking(choferId);
  };

  const setupGeofencing = (entregasList: Entrega[]) => {
    const regions = entregasList
      .filter((e) => e.estatus !== 'COMPLETADA')
      .map((e) => ({
        identifier: e.id,
        latitude: e.direccion.coordenadas.latitud,
        longitude: e.direccion.coordenadas.longitud,
        radius: 200,
      }));

    geofenceService.startMonitoring(regions, (region, event) => {
      if (event === 'ENTER') {
        const entrega = entregasList.find((e) => e.id === region.identifier);
        if (entrega) {
          Alert.alert(
            'Llegando a destino',
            `Te estás acercando a la entrega de ${entrega.cliente.nombre}`
          );
        }
      }
    });
  };

  const handleEntregaSelect = (entrega: Entrega) => {
    setSelectedEntrega(entrega);
  };

  const handleConfirmarEntrega = () => {
    if (selectedEntrega) {
      navigation.navigate('ConfirmarEntrega', { entrega: selectedEntrega });
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Cargando ruta..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ruta del día</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.completadas}/{stats.total}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{(stats.distanciaTotal / 1000).toFixed(1)} km</Text>
            <Text style={styles.statLabel}>Distancia</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{Math.round(stats.tiempoEstimado / 60)} min</Text>
            <Text style={styles.statLabel}>Tiempo est.</Text>
          </View>
        </View>
      </View>

      <MapViewComponent
        entregas={entregas}
        currentLocation={currentLocation}
        selectedEntrega={selectedEntrega}
        onEntregaSelect={handleEntregaSelect}
        showRoute={true}
        routeCoordinates={routeCoordinates}
      />

      {selectedEntrega && selectedEntrega.estatus !== 'COMPLETADA' && (
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetContent}>
            <Text style={styles.clientName}>{selectedEntrega.cliente.nombre}</Text>
            <Text style={styles.address}>{selectedEntrega.direccion.calle}</Text>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmarEntrega}>
              <Text style={styles.confirmButtonText}>Confirmar entrega</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[100],
  },
  header: {
    backgroundColor: 'white',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  statLabel: {
    fontSize: 12,
    color: colors.neutral[600],
    marginTop: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheetContent: {
    padding: spacing[6],
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  address: {
    fontSize: 14,
    color: colors.neutral[600],
    marginBottom: spacing[4],
  },
  confirmButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
