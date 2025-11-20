import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useNavigation as useStackNavigation } from '@react-navigation/native';
import twrnc from 'twrnc';

import { EntregasStackParamList } from '../../../navigation/types';
import { routingService, RutaOptima } from '../services/routingService';
import { gpsTrackingService } from '../../../shared/services/gpsTrackingService';

type RutaEntregaScreenRouteProp = RouteProp<EntregasStackParamList, 'RutaEntrega'>;

interface UbicacionActual {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

const RutaEntregaScreen: React.FC = () => {
  const route = useRoute<RutaEntregaScreenRouteProp>();
  const navigation = useStackNavigation();
  
  const { 
    destino, 
    cliente, 
    direccion, 
    ordenVenta,
    geofenceId 
  } = route.params;

  // Estados
  const [ubicacionActual, setUbicacionActual] = useState<UbicacionActual | null>(null);
  const [rutaOptima, setRutaOptima] = useState<RutaOptima | null>(null);
  const [cargandoRuta, setCargandoRuta] = useState(false);
  const [dentroGeofence, setDentroGeofence] = useState(false);
  const [distanciaDestino, setDistanciaDestino] = useState<number | null>(null);
  const [trackingActivo, setTrackingActivo] = useState(false);

  // Región inicial del mapa
  const [region, setRegion] = useState({
    latitude: destino.latitude,
    longitude: destino.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  /**
   * Calcular y obtener ruta óptima
   */
  const calcularRuta = useCallback(async () => {
    if (!ubicacionActual) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
      return;
    }

    setCargandoRuta(true);
    try {
      const ruta = await routingService.obtenerRutaOptima(
        {
          latitude: ubicacionActual.latitude,
          longitude: ubicacionActual.longitude
        },
        destino
      );

      setRutaOptima(ruta);
      
      // Ajustar región del mapa para mostrar toda la ruta
      const coordinates = [
        { latitude: ubicacionActual.latitude, longitude: ubicacionActual.longitude },
        ...ruta.coordinates,
        destino
      ];
      
      const minLat = Math.min(...coordinates.map(c => c.latitude));
      const maxLat = Math.max(...coordinates.map(c => c.latitude));
      const minLng = Math.min(...coordinates.map(c => c.longitude));
      const maxLng = Math.max(...coordinates.map(c => c.longitude));
      
      const deltaLat = (maxLat - minLat) * 1.5;
      const deltaLng = (maxLng - minLng) * 1.5;
      
      setRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(deltaLat, 0.01),
        longitudeDelta: Math.max(deltaLng, 0.01),
      });

    } catch (error) {
      console.error('Error calculando ruta:', error);
      Alert.alert('Error', 'No se pudo calcular la ruta óptima');
    } finally {
      setCargandoRuta(false);
    }
  }, [ubicacionActual, destino]);

  /**
   * Abrir navegación externa
   */
  const abrirNavegacionExterna = async () => {
    try {
      await routingService.abrirNavegacionExterna(
        destino,
        ubicacionActual
          ? { latitude: ubicacionActual.latitude, longitude: ubicacionActual.longitude }
          : { latitude: region.latitude, longitude: region.longitude }
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la aplicación de navegación');
    }
  };

  /**
   * Volver al formulario
   */
  const volverAlFormulario = () => {
    navigation.goBack();
  };

  /**
   * Centrar mapa en ubicación actual
   */
  const centrarEnUbicacionActual = () => {
    if (ubicacionActual) {
      setRegion({
        latitude: ubicacionActual.latitude,
        longitude: ubicacionActual.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  // Mock de ubicación actual cercana al destino para pruebas realistas
  const generarUbicacionCercana = useCallback(() => {
    // Generar ubicación actual cerca del destino (1-5 km de distancia)
    const offsetLat = (Math.random() - 0.5) * 0.05; // ~2.5km máximo
    const offsetLng = (Math.random() - 0.5) * 0.05;
    
    return {
      latitude: destino.latitude + offsetLat,
      longitude: destino.longitude + offsetLng,
      accuracy: 10 + Math.random() * 15, // 10-25m de precisión
      timestamp: Date.now()
    };
  }, [destino]);

  /**
   * Calcular distancia entre dos coordenadas usando fórmula Haversine
   */
  const calcularDistancia = (punto1: any, punto2: any): number => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = punto1.latitude * Math.PI / 180;
    const φ2 = punto2.latitude * Math.PI / 180;
    const Δφ = (punto2.latitude - punto1.latitude) * Math.PI / 180;
    const Δλ = (punto2.longitude - punto1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Inicializar ubicación y calcular ruta automáticamente
  useEffect(() => {
    const ubicacionMock = generarUbicacionCercana();
    setUbicacionActual(ubicacionMock);
    setTrackingActivo(true);
    
    console.log(`[RutaEntrega] 📍 Ubicación actual: ${ubicacionMock.latitude}, ${ubicacionMock.longitude}`);
    console.log(`[RutaEntrega] 🎯 Destino: ${destino.latitude}, ${destino.longitude}`);
  }, [destino, generarUbicacionCercana]);

  // Calcular distancia cuando cambie la ubicación
  useEffect(() => {
    if (ubicacionActual) {
      const distancia = calcularDistancia(ubicacionActual, destino);
      setDistanciaDestino(distancia);
      setDentroGeofence(distancia <= 50); // 50m geofence

      // Auto-calcular ruta si no existe
      if (!rutaOptima && !cargandoRuta) {
        calcularRuta();
      }
    }
  }, [ubicacionActual, destino, rutaOptima, cargandoRuta, calcularRuta]);

  // Monitorear geofence y actualizar estado (simplificado)
  useEffect(() => {
    // La lógica de geofence ya se maneja en el useEffect anterior
    // Solo mantenemos esto para compatibilidad si hay más lógica específica
  }, [geofenceId, distanciaDestino]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={volverAlFormulario} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Ruta a Cliente</Text>
          <Text style={styles.headerSubtitle}>{cliente}</Text>
        </View>
        <TouchableOpacity onPress={centrarEnUbicacionActual} style={styles.locationButton}>
          <Ionicons name="locate" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsTraffic={true}
          loadingEnabled={true}
        >
          {/* Ubicación actual */}
          {ubicacionActual && (
            <Marker
              coordinate={ubicacionActual}
              title="Mi ubicación"
              description="Ubicación actual del chofer"
            >
              <View style={styles.currentLocationMarker}>
                <Ionicons name="navigate" size={20} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Ubicación de entrega */}
          <Marker
            coordinate={destino}
            title={cliente}
            description={direccion}
            pinColor="#E53E3E"
          />

          {/* Geofence circle */}
          <Circle
            center={destino}
            radius={50}
            strokeColor={dentroGeofence ? "#10B981" : "#EF4444"}
            fillColor={dentroGeofence ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"}
            strokeWidth={2}
          />

          {/* Ruta optimizada */}
          {rutaOptima && rutaOptima.coordinates.length > 0 && (
            <Polyline
              coordinates={rutaOptima.coordinates}
              strokeColor="#3B82F6"
              strokeWidth={4}
              lineDashPattern={[5, 5]}
            />
          )}
        </MapView>

        {/* Indicador de carga de ruta */}
        {cargandoRuta && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Calculando ruta óptima...</Text>
          </View>
        )}
      </View>

      {/* Panel de información */}
      <View style={styles.infoPanel}>
        <ScrollView style={styles.infoContent}>
          {/* Información de la entrega */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>📍 Destino</Text>
            <Text style={styles.clienteName}>{cliente}</Text>
            <Text style={styles.direccionText}>{direccion}</Text>
            <Text style={styles.ordenText}>Orden: {ordenVenta}</Text>
          </View>

          {/* Estado del tracking */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>📡 Estado GPS</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, { backgroundColor: trackingActivo ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.statusText}>
                {trackingActivo ? 'GPS Activo' : 'GPS Inactivo'}
              </Text>
            </View>
            {ubicacionActual && (
              <Text style={styles.precisionText}>
                Precisión: {ubicacionActual.accuracy.toFixed(0)}m
              </Text>
            )}
          </View>

          {/* Información de distancia */}
          {distanciaDestino !== null && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>📏 Distancia</Text>
              <Text style={styles.distanciaText}>
                {routingService.formatearDistancia(distanciaDestino)}
              </Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusIndicator, { backgroundColor: dentroGeofence ? '#10B981' : '#EF4444' }]} />
                <Text style={styles.statusText}>
                  {dentroGeofence ? 'En zona de entrega' : 'Fuera de zona de entrega'}
                </Text>
              </View>
            </View>
          )}

          {/* Información de ruta */}
          {rutaOptima && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>🚗 Ruta Optimizada</Text>
              <View style={styles.routeInfo}>
                <View style={styles.routeMetric}>
                  <Text style={styles.metricValue}>
                    {routingService.formatearDistancia(rutaOptima.distance)}
                  </Text>
                  <Text style={styles.metricLabel}>Distancia</Text>
                </View>
                <View style={styles.routeMetric}>
                  <Text style={styles.metricValue}>
                    {routingService.formatearDuracion(rutaOptima.duration)}
                  </Text>
                  <Text style={styles.metricLabel}>Tiempo estimado</Text>
                </View>
              </View>
              <Text style={styles.arrivalTime}>
                Llegada estimada: {rutaOptima.estimatedArrival.toLocaleTimeString()}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.recalculateButton]}
            onPress={calcularRuta}
            disabled={cargandoRuta || !ubicacionActual}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Recalcular</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.navigateButton]}
            onPress={abrirNavegacionExterna}
          >
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Navegar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  locationButton: {
    padding: 8,
  },
  mapContainer: {
    flex: 0.6,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  currentLocationMarker: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  loadingText: {
    marginTop: 8,
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  infoPanel: {
    flex: 0.4,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 20,
    elevation: 8,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  clienteName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  direccionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  ordenText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
  },
  precisionText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
  },
  distanciaText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  routeMetric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  arrivalTime: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  recalculateButton: {
    backgroundColor: '#6B7280',
  },
  navigateButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RutaEntregaScreen;