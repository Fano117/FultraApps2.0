/**
 * Pantalla de Ruta Multi-Parada
 *
 * Maneja el nuevo formato JSON de la API con múltiples direcciones.
 * Muestra todas las paradas en un mapa y permite navegar a cada una
 * usando DeliveryMapScreen para el tracking individual.
 *
 * Funcionalidades:
 * - Visualización de todas las paradas en el mapa
 * - Ruta optimizada entre todas las paradas
 * - Lista de paradas con estado (pendiente/completada)
 * - Navegación a cada parada individual
 * - Información de distancia y tiempo total
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { EntregasStackParamList, MultiStopDeliveryParams } from '@/navigation/types';
import { DireccionValidada } from '../types/api-delivery';
import { routingService, RutaOptima } from '../services/routingService';
import { colors, spacing, typography } from '@/design-system/theme';

type RutaMultiParadaRouteProp = RouteProp<EntregasStackParamList, 'RutaMultiParada'>;
type RutaMultiParadaNavigationProp = NativeStackNavigationProp<EntregasStackParamList, 'RutaMultiParada'>;

const { width, height } = Dimensions.get('window');

interface ParadaEstado {
  direccion: DireccionValidada;
  index: number;
  completada: boolean;
}

export const RutaMultiParadaScreen: React.FC = () => {
  const navigation = useNavigation<RutaMultiParadaNavigationProp>();
  const route = useRoute<RutaMultiParadaRouteProp>();

  // Validar que los parámetros existan (evita error "Cannot convert undefined value to object")
  const params = route.params ?? ({} as MultiStopDeliveryParams);
  const {
    folioEmbarque = '',
    idRutaHereMaps = null,
    direcciones = [],
    paradaActualIndex = 0
  } = params;

  // Estado
  const [paradas, setParadas] = useState<ParadaEstado[]>([]);
  const [rutaOptima, setRutaOptima] = useState<RutaOptima | null>(null);
  const [cargandoRuta, setCargandoRuta] = useState(false);
  const [paradaSeleccionada, setParadaSeleccionada] = useState<number | null>(null);
  const [mostrarLista, setMostrarLista] = useState(true);

  const mapRef = useRef<MapView>(null);

  // Inicializar paradas
  useEffect(() => {
    if (direcciones && direcciones.length > 0) {
      const paradasIniciales: ParadaEstado[] = direcciones
        .filter(d => d.esValida && d.coordenadas)
        .map((direccion, index) => ({
          direccion,
          index,
          completada: false,
        }));
      setParadas(paradasIniciales);

      console.log('[MULTI-PARADA] Inicializando con', paradasIniciales.length, 'paradas válidas');

      // Centrar mapa en las paradas
      if (paradasIniciales.length > 0) {
        setTimeout(() => {
          ajustarMapaAParadas(paradasIniciales);
        }, 500);
      }
    }
  }, [direcciones]);

  // Calcular ruta cuando hay paradas
  useEffect(() => {
    if (paradas.length >= 2) {
      calcularRutaCompleta();
    }
  }, [paradas]);

  /**
   * Ajustar mapa para mostrar todas las paradas
   */
  const ajustarMapaAParadas = useCallback((paradasList: ParadaEstado[]) => {
    if (!mapRef.current || paradasList.length === 0) return;

    const coordinates = paradasList
      .filter(p => p.direccion.coordenadas)
      .map(p => ({
        latitude: p.direccion.coordenadas!.latitud,
        longitude: p.direccion.coordenadas!.longitud,
      }));

    if (coordinates.length === 0) return;

    if (coordinates.length === 1) {
      mapRef.current.animateToRegion({
        ...coordinates[0],
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
      return;
    }

    const lats = coordinates.map(c => c.latitude);
    const lngs = coordinates.map(c => c.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const padding = 0.02;

    mapRef.current.animateToRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) + padding,
      longitudeDelta: (maxLng - minLng) + padding,
    }, 500);
  }, []);

  /**
   * Calcular ruta completa entre todas las paradas
   */
  const calcularRutaCompleta = useCallback(async () => {
    if (paradas.length < 2) return;

    setCargandoRuta(true);
    console.log('[MULTI-PARADA] Calculando ruta para', paradas.length, 'paradas');

    try {
      // Por ahora, calcular ruta punto a punto (origen -> primer destino)
      // TODO: Implementar ruta multi-waypoint cuando esté disponible
      const origen = paradas[0].direccion.coordenadas!;
      const destino = paradas[paradas.length - 1].direccion.coordenadas!;

      const ruta = await routingService.obtenerRutaOptima(
        { latitude: origen.latitud, longitude: origen.longitud },
        { latitude: destino.latitud, longitude: destino.longitud }
      );

      if (ruta) {
        setRutaOptima(ruta);
        console.log('[MULTI-PARADA] Ruta calculada:', {
          distancia: `${(ruta.distance / 1000).toFixed(2)} km`,
          duracion: `${ruta.duration.toFixed(0)} min`,
        });
      }
    } catch (error) {
      console.error('[MULTI-PARADA] Error calculando ruta:', error);
    } finally {
      setCargandoRuta(false);
    }
  }, [paradas]);

  /**
   * Navegar a una parada específica para tracking
   */
  const navegarAParada = useCallback((parada: ParadaEstado) => {
    if (!parada.direccion.coordenadas) {
      Alert.alert('Error', 'Esta dirección no tiene coordenadas válidas');
      return;
    }

    navigation.navigate('EntregaTracking', {
      entregaId: parada.index + 1,
      folio: folioEmbarque,
      puntoEntrega: {
        latitud: parada.direccion.coordenadas.latitud,
        longitud: parada.direccion.coordenadas.longitud,
      },
      nombreCliente: parada.direccion.original.cliente,
    });
  }, [navigation, folioEmbarque]);

  /**
   * Marcar parada como completada
   */
  const marcarParadaCompletada = useCallback((index: number) => {
    setParadas(prev => prev.map((p, i) =>
      i === index ? { ...p, completada: true } : p
    ));
  }, []);

  /**
   * Obtener color del marcador según estado
   */
  const getMarkerColor = (parada: ParadaEstado, isSelected: boolean): string => {
    if (parada.completada) return colors.success[600];
    if (isSelected) return colors.primary[600];
    return colors.error[600];
  };

  /**
   * Calcular estadísticas de la ruta
   */
  const getEstadisticas = () => {
    const completadas = paradas.filter(p => p.completada).length;
    const pendientes = paradas.length - completadas;
    return { completadas, pendientes, total: paradas.length };
  };

  const stats = getEstadisticas();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[600]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Ruta de Entregas</Text>
          <Text style={styles.headerSubtitle}>
            Folio: {folioEmbarque} • {stats.pendientes} pendientes
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setMostrarLista(!mostrarLista)}
          style={styles.toggleButton}
        >
          <Ionicons
            name={mostrarLista ? "map" : "list"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Mapa */}
      <View style={[styles.mapContainer, mostrarLista && styles.mapContainerSmall]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation={true}
          showsMyLocationButton={false}
          initialRegion={{
            latitude: 19.4326,
            longitude: -99.1332,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {/* Línea de ruta */}
          {rutaOptima && rutaOptima.coordinates.length > 0 && (
            <Polyline
              coordinates={rutaOptima.coordinates}
              strokeColor={colors.primary[600]}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Marcadores de paradas */}
          {paradas.map((parada, index) => {
            if (!parada.direccion.coordenadas) return null;

            const isSelected = paradaSeleccionada === index;

            return (
              <Marker
                key={`parada-${index}`}
                coordinate={{
                  latitude: parada.direccion.coordenadas.latitud,
                  longitude: parada.direccion.coordenadas.longitud,
                }}
                title={parada.direccion.original.cliente}
                description={parada.direccion.original.direccion}
                onPress={() => setParadaSeleccionada(index)}
              >
                <View style={[
                  styles.markerContainer,
                  { backgroundColor: getMarkerColor(parada, isSelected) }
                ]}>
                  <Text style={styles.markerText}>{index + 1}</Text>
                  {parada.completada && (
                    <Ionicons name="checkmark" size={12} color="white" />
                  )}
                </View>
              </Marker>
            );
          })}
        </MapView>

        {/* Info de ruta */}
        {rutaOptima && (
          <View style={styles.routeInfo}>
            <View style={styles.routeInfoItem}>
              <Ionicons name="navigate" size={16} color={colors.primary[600]} />
              <Text style={styles.routeInfoText}>
                {(rutaOptima.distance / 1000).toFixed(1)} km
              </Text>
            </View>
            <View style={styles.routeInfoItem}>
              <Ionicons name="time" size={16} color={colors.primary[600]} />
              <Text style={styles.routeInfoText}>
                {Math.round(rutaOptima.duration)} min
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Lista de paradas */}
      {mostrarLista && (
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Paradas ({stats.total})</Text>
            <View style={styles.statsContainer}>
              <View style={[styles.statBadge, styles.statPendiente]}>
                <Text style={styles.statText}>{stats.pendientes} pendientes</Text>
              </View>
              <View style={[styles.statBadge, styles.statCompletada]}>
                <Text style={styles.statText}>{stats.completadas} completadas</Text>
              </View>
            </View>
          </View>

          <ScrollView style={styles.paradasList}>
            {paradas.map((parada, index) => (
              <TouchableOpacity
                key={`list-${index}`}
                style={[
                  styles.paradaItem,
                  parada.completada && styles.paradaItemCompletada,
                  paradaSeleccionada === index && styles.paradaItemSelected,
                ]}
                onPress={() => {
                  setParadaSeleccionada(index);
                  if (parada.direccion.coordenadas && mapRef.current) {
                    mapRef.current.animateToRegion({
                      latitude: parada.direccion.coordenadas.latitud,
                      longitude: parada.direccion.coordenadas.longitud,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }, 500);
                  }
                }}
              >
                <View style={[
                  styles.paradaNumber,
                  { backgroundColor: getMarkerColor(parada, false) }
                ]}>
                  <Text style={styles.paradaNumberText}>{index + 1}</Text>
                </View>

                <View style={styles.paradaInfo}>
                  <Text style={styles.paradaCliente} numberOfLines={1}>
                    {parada.direccion.original.cliente}
                  </Text>
                  <Text style={styles.paradaDireccion} numberOfLines={2}>
                    {parada.direccion.original.direccion}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.paradaButton,
                    parada.completada && styles.paradaButtonCompletada,
                  ]}
                  onPress={() => {
                    if (parada.completada) {
                      marcarParadaCompletada(index);
                    } else {
                      navegarAParada(parada);
                    }
                  }}
                >
                  <Ionicons
                    name={parada.completada ? "checkmark-circle" : "navigate"}
                    size={20}
                    color={parada.completada ? colors.success[600] : "white"}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    paddingTop: Platform.OS === 'ios' ? spacing[12] : spacing[3],
  },
  backButton: {
    marginRight: spacing[3],
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h4,
    color: 'white',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  toggleButton: {
    padding: spacing[2],
  },
  mapContainer: {
    flex: 1,
  },
  mapContainerSmall: {
    flex: 0.4,
  },
  map: {
    flex: 1,
  },
  routeInfo: {
    position: 'absolute',
    bottom: spacing[4],
    left: spacing[4],
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: spacing[2],
    gap: spacing[3],
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  routeInfoText: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '600',
  },
  markerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'white',
  },
  markerText: {
    ...typography.body2,
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 0.6,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: spacing[4],
  },
  listHeader: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  listTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  statBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 12,
  },
  statPendiente: {
    backgroundColor: colors.warning[100],
  },
  statCompletada: {
    backgroundColor: colors.success[100],
  },
  statText: {
    ...typography.caption,
    fontWeight: '600',
  },
  paradasList: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  paradaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  paradaItemCompletada: {
    backgroundColor: colors.success[50],
    borderColor: colors.success[200],
  },
  paradaItemSelected: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  paradaNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  paradaNumberText: {
    ...typography.body2,
    color: 'white',
    fontWeight: 'bold',
  },
  paradaInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
  paradaCliente: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  paradaDireccion: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  paradaButton: {
    backgroundColor: colors.primary[600],
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paradaButtonCompletada: {
    backgroundColor: colors.success[100],
  },
});

export default RutaMultiParadaScreen;
