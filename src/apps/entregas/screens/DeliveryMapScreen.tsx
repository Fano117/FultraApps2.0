import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, Polyline, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { locationTrackingService, LocationUpdate, Coordinates } from '@/shared/services/locationTrackingService';
import { geofencingService, DeliveryAuthorizationStatus } from '@/shared/services/geofencingService';
import { permissionsService } from '@/shared/services/permissionsService';
import { routingService, RutaOptima } from '@/apps/entregas/services/routingService';
import { EntregasStackParamList } from '@/navigation/types';
import { TipoRegistro } from '@/apps/entregas/models';
import { colors, spacing, typography } from '@/design-system/theme';

type DeliveryMapScreenRouteProp = RouteProp<EntregasStackParamList, 'EntregaTracking'>;
type DeliveryMapScreenNavigationProp = NativeStackNavigationProp<EntregasStackParamList, 'EntregaTracking'>;

const { width, height } = Dimensions.get('window');

export const DeliveryMapScreen: React.FC = () => {
  const navigation = useNavigation<DeliveryMapScreenNavigationProp>();
  const route = useRoute<DeliveryMapScreenRouteProp>();
  
  // Parámetros de la ruta
  const { 
    entregaId, 
    folio, 
    puntoEntrega, 
    nombreCliente 
  } = route.params;

  // Estado
  const [currentLocation, setCurrentLocation] = useState<LocationUpdate | null>(null);
  const [authorizationStatus, setAuthorizationStatus] = useState<DeliveryAuthorizationStatus>({
    isAuthorized: false,
    reason: 'Iniciando tracking...',
    distance: 0,
    requiredDistance: 50,
    geofenceId: null
  });
  const [isTracking, setIsTracking] = useState(false);
  const [geofenceId, setGeofenceId] = useState<string | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  // Estado para la ruta optimizada
  const [rutaOptima, setRutaOptima] = useState<RutaOptima | null>(null);
  const [cargandoRuta, setCargandoRuta] = useState(false);
  const [mostrarRuta, setMostrarRuta] = useState(true);
  
  // Estado para pantalla de carga inicial
  const [inicializando, setInicializando] = useState(true);
  const [mensajeCarga, setMensajeCarga] = useState('Iniciando tracking...');
  
  // Estado para simulación de acercamiento
  const [simulandoAcercamiento, setSimulandoAcercamiento] = useState(false);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Referencias
  const mapRef = useRef<MapView>(null);
  const trackingSubscription = useRef<any>(null);
  const authorizationSubscription = useRef<any>(null);

  /**
   * Configurar tracking y permisos al montar componente
   */
  useEffect(() => {
    initializeTracking();
    
    return () => {
      cleanup();
    };
  }, []);

  /**
   * Inicializar tracking y geofencing
   */
  const initializeTracking = async () => {
    try {
      console.log('[DELIVERY MAP] 🚀 Inicializando tracking para entrega:', {
        entregaId,
        folio,
        cliente: nombreCliente,
        destino: `${puntoEntrega.latitud}, ${puntoEntrega.longitud}`
      });

      // Verificar permisos
      setMensajeCarga('Verificando permisos...');
      const permissions = await permissionsService.checkAllPermissions();
      if (!permissions.location.granted) {
        const locationPermission = await permissionsService.requestLocationPermissions();
        if (!locationPermission.granted) {
          setInicializando(false);
          Alert.alert(
            'Permisos Requeridos',
            'Se necesitan permisos de ubicación para el tracking de entregas.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
      }
      setPermissionsGranted(true);

      // Iniciar tracking de ubicación
      setMensajeCarga('Iniciando GPS...');
      const trackingStarted = await locationTrackingService.startTracking();
      if (!trackingStarted) {
        setInicializando(false);
        Alert.alert('Error', 'No se pudo iniciar el tracking de ubicación');
        return;
      }
      setIsTracking(true);

      // Crear geofence para la entrega
      setMensajeCarga('Configurando zona de entrega...');
      const targetCoordinates: Coordinates = {
        latitude: puntoEntrega.latitud,
        longitude: puntoEntrega.longitud
      };

      const newGeofenceId = await geofencingService.createDeliveryGeofence(
        entregaId,
        folio,
        nombreCliente,
        targetCoordinates,
        50 // 50 metros de radio
      );
      setGeofenceId(newGeofenceId);

      // Suscribirse a actualizaciones de ubicación
      trackingSubscription.current = locationTrackingService.location$.subscribe(
        (location) => {
          if (location) {
            setCurrentLocation(location);
            
            // Recalcular ruta si la ubicación cambió significativamente (más de 50m)
            if (rutaOptima && rutaOptima.coordinates.length > 0) {
              const primeraCoord = rutaOptima.coordinates[0];
              const distancia = calcularDistanciaHaversine(
                location.coordinates.latitude,
                location.coordinates.longitude,
                primeraCoord.latitude,
                primeraCoord.longitude
              );
              
              if (distancia > 50) {
                console.log('[DELIVERY MAP] 📍 Ubicación cambió significativamente, recalculando ruta...');
                calcularRutaOptima(location.coordinates, targetCoordinates);
              }
            }
          }
        }
      );

      // Suscribirse a actualizaciones de autorización
      authorizationSubscription.current = geofencingService.deliveryAuthorization$.subscribe(
        (authorization) => {
          setAuthorizationStatus(authorization);
          console.log('[DELIVERY MAP] 🔐 Autorización actualizada:', {
            autorizada: authorization.isAuthorized ? '✅' : '❌',
            distancia: authorization.distance.toFixed(1) + 'm'
          });
        }
      );

      // Obtener ubicación inicial y centrar mapa
      setMensajeCarga('Obteniendo ubicación actual...');
      const initialLocation = await locationTrackingService.getCurrentLocation();
      if (initialLocation) {
        setCurrentLocation(initialLocation);
        centerMapOnBothLocations(initialLocation.coordinates, targetCoordinates);
        
        // Calcular ruta inicial
        setMensajeCarga('Calculando ruta óptima...');
        await calcularRutaOptima(initialLocation.coordinates, targetCoordinates);
      }

      // Finalizar carga
      setMensajeCarga('¡Listo!');
      setTimeout(() => {
        setInicializando(false);
      }, 500);

    } catch (error) {
      console.error('[DELIVERY MAP] ❌ Error inicializando tracking:', error);
      setInicializando(false);
      Alert.alert('Error', 'Error inicializando el tracking de entrega');
    }
  };

  /**
   * Calcular ruta optimizada usando HERE Maps
   */
  const calcularRutaOptima = useCallback(async (origen: Coordinates, destino: Coordinates) => {
    try {
      setCargandoRuta(true);
      console.log('[DELIVERY MAP] 🗺️ Calculando ruta optimizada...', {
        origen: `${origen.latitude.toFixed(6)}, ${origen.longitude.toFixed(6)}`,
        destino: `${destino.latitude.toFixed(6)}, ${destino.longitude.toFixed(6)}`
      });

      const ruta = await routingService.obtenerRutaOptima(origen, destino);
      
      if (ruta && ruta.coordinates.length > 0) {
        setRutaOptima(ruta);
        console.log('[DELIVERY MAP] ✅ Ruta calculada:', {
          distancia: `${(ruta.distance / 1000).toFixed(2)} km`,
          duracion: `${ruta.duration.toFixed(0)} min`,
          puntos: ruta.coordinates.length
        });

        // Ajustar el zoom del mapa para mostrar toda la ruta
        setTimeout(() => {
          if (mapRef.current && ruta.coordinates.length > 0) {
            const lats = ruta.coordinates.map(c => c.latitude);
            const lngs = ruta.coordinates.map(c => c.longitude);
            
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            
            const padding = 0.01; // Padding adicional
            
            mapRef.current.animateToRegion({
              latitude: (minLat + maxLat) / 2,
              longitude: (minLng + maxLng) / 2,
              latitudeDelta: (maxLat - minLat) + padding,
              longitudeDelta: (maxLng - minLng) + padding,
            }, 1000);
            
            console.log('[DELIVERY MAP] 🗺️ Mapa ajustado para mostrar ruta completa');
          }
        }, 500);
      }
    } catch (error) {
      console.error('[DELIVERY MAP] ❌ Error calculando ruta:', error);
      // No mostrar alerta, solo log del error
    } finally {
      setCargandoRuta(false);
    }
  }, []);

  /**
   * Calcular distancia entre dos puntos usando Haversine
   */
  const calcularDistanciaHaversine = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  /**
   * Centrar mapa en ubicación específica
   */
  const centerMapOnLocation = useCallback((coordinates: Coordinates) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  }, []);

  /**
   * Centrar mapa para mostrar ambas ubicaciones (chofer y destino)
   */
  const centerMapOnBothLocations = useCallback((current: Coordinates, target: Coordinates) => {
    if (mapRef.current) {
      const latitudeDelta = Math.abs(current.latitude - target.latitude) * 2;
      const longitudeDelta = Math.abs(current.longitude - target.longitude) * 2;

      mapRef.current.animateToRegion({
        latitude: (current.latitude + target.latitude) / 2,
        longitude: (current.longitude + target.longitude) / 2,
        latitudeDelta: Math.max(latitudeDelta, 0.01),
        longitudeDelta: Math.max(longitudeDelta, 0.01),
      }, 500);
    }
  }, []);

  /**
   * Centrar en mi ubicación
   */
  const centerOnMyLocation = () => {
    if (currentLocation) {
      centerMapOnLocation(currentLocation.coordinates);
    }
  };

  /**
   * Centrar en destino
   */
  const centerOnDestination = () => {
    const targetCoordinates: Coordinates = {
      latitude: puntoEntrega.latitud,
      longitude: puntoEntrega.longitud
    };
    centerMapOnLocation(targetCoordinates);
  };

  /**
   * Simular acercamiento al destino para testing/desarrollo
   */
  const simularAcercamiento = useCallback(() => {
    if (simulandoAcercamiento) {
      // Detener simulación
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      setSimulandoAcercamiento(false);
      console.log('[DELIVERY MAP] 🛑 Simulación detenida');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Error', 'No se ha obtenido la ubicación actual');
      return;
    }

    setSimulandoAcercamiento(true);
    console.log('[DELIVERY MAP] 🎮 Iniciando simulación de acercamiento...');

    const destino: Coordinates = {
      latitude: puntoEntrega.latitud,
      longitude: puntoEntrega.longitud
    };

    let currentLat = currentLocation.coordinates.latitude;
    let currentLng = currentLocation.coordinates.longitude;

    // Calcular dirección y pasos para acercarse
    const latDiff = destino.latitude - currentLat;
    const lngDiff = destino.longitude - currentLng;
    const totalDistance = calcularDistanciaHaversine(currentLat, currentLng, destino.latitude, destino.longitude);
    
    console.log(`[DELIVERY MAP] 📍 Distancia inicial: ${totalDistance.toFixed(0)}m`);

    // Número de pasos (cada paso será de aproximadamente 10 metros)
    const steps = Math.ceil(totalDistance / 250);
    const latStep = latDiff / steps;
    const lngStep = lngDiff / steps;

    let currentStep = 0;

    // Intervalo de simulación (cada 500ms da un paso)
    simulationIntervalRef.current = setInterval(() => {
      currentStep++;
      currentLat += latStep;
      currentLng += lngStep;

      const newLocation: LocationUpdate = {
        coordinates: {
          latitude: currentLat,
          longitude: currentLng
        },
        accuracy: 5,
        timestamp: Date.now(),
        speed: 5, // 5 m/s (18 km/h - velocidad de caminata rápida)
        heading: Math.atan2(lngDiff, latDiff) * (180 / Math.PI)
      };

      // Actualizar ubicación simulada
      setCurrentLocation(newLocation);

      // Calcular distancia restante
      const remainingDistance = calcularDistanciaHaversine(
        currentLat,
        currentLng,
        destino.latitude,
        destino.longitude
      );

      console.log(`[DELIVERY MAP] 🚗 Paso ${currentStep}/${steps}, Distancia: ${remainingDistance.toFixed(0)}m`);

      // Actualizar estado de autorización manualmente
      const isWithinGeofence = remainingDistance <= 50;
      
      setAuthorizationStatus({
        isAuthorized: isWithinGeofence,
        reason: isWithinGeofence 
          ? '✅ Dentro del área de entrega (simulado)' 
          : `📍 A ${Math.round(remainingDistance)}m del destino (simulado)`,
        distance: remainingDistance,
        requiredDistance: 50,
        geofenceId: geofenceId
      });

      // Centrar mapa en la nueva ubicación
      if (mapRef.current) {
        mapRef.current.animateCamera({
          center: {
            latitude: currentLat,
            longitude: currentLng
          },
          zoom: 16
        }, { duration: 400 });
      }

      // Detener simulación cuando llegue al destino o esté dentro del geofence
      if (remainingDistance <= 50 || currentStep >= steps) {
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
          simulationIntervalRef.current = null;
        }
        setSimulandoAcercamiento(false);
        console.log('[DELIVERY MAP] ✅ Simulación completada - Llegaste al destino!');
        
        Alert.alert(
          '✅ Llegaste al Destino',
          'Ahora puedes realizar la entrega',
          [{ text: 'OK' }]
        );
      }
    }, 500);

  }, [currentLocation, simulandoAcercamiento, puntoEntrega, geofenceId, calcularDistanciaHaversine]);

  /**
   * Navegar al formulario de entrega si está autorizado
   */
  const navigateToDeliveryForm = () => {
    if (authorizationStatus.isAuthorized) {
      navigation.navigate('FormularioEntrega', {
        clienteCarga: `${nombreCliente}_${entregaId}`,
        entrega: {
          id: entregaId,
          ordenVenta: folio,
          folio: folio,
          tipoEntrega: 'ENTREGA',
          estado: 'PENDIENTE',
          articulos: [],
          cargaCuentaCliente: `CARGA_${entregaId}`
        },
        tipoRegistro: TipoRegistro.COMPLETO
      });
    } else {
      Alert.alert(
        'Entrega No Autorizada',
        `${authorizationStatus.reason}\n\nDebe estar dentro del área de 50m para realizar la entrega.`,
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Obtener color del estado
   */
  const getStatusColor = (): string => {
    if (!authorizationStatus) return colors.neutral[500];
    
    const distance = authorizationStatus.distance;
    if (distance <= 50) return colors.success[500];
    if (distance <= 100) return colors.warning[500];
    return colors.error[500];
  };

  /**
   * Obtener mensaje de estado
   */
  const getStatusMessage = (): string => {
    if (!authorizationStatus) return 'Calculando distancia...';
    
    const distance = Math.round(authorizationStatus.distance);
    if (authorizationStatus.isAuthorized) {
      return `🎉 Listo para entregar (${distance}m)`;
    } else {
      return `📍 ${distance}m del destino`;
    }
  };

  /**
   * Limpiar recursos
   */
  const cleanup = async () => {
    console.log('[DELIVERY MAP] 🧹 Limpiando recursos...');
    
    // Detener simulación si está activa
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    
    if (trackingSubscription.current) {
      trackingSubscription.current.unsubscribe();
    }
    if (authorizationSubscription.current) {
      authorizationSubscription.current.unsubscribe();
    }
    if (geofenceId) {
      geofencingService.removeGeofence(geofenceId);
    }
    await locationTrackingService.stopTracking();
  };

  // Coordenadas del destino
  const targetCoordinates: Coordinates = {
    latitude: puntoEntrega.latitud,
    longitude: puntoEntrega.longitud
  };

  // Logs de depuración para la ruta
  useEffect(() => {
    console.log('[DELIVERY MAP] 📊 Estado de ruta:', {
      rutaOptima: rutaOptima ? 'existe' : 'null',
      coordenadas: rutaOptima?.coordinates.length || 0,
      mostrarRuta,
      cargandoRuta,
      distancia: rutaOptima ? `${(rutaOptima.distance / 1000).toFixed(2)} km` : 'N/A',
      duracion: rutaOptima ? `${rutaOptima.duration.toFixed(0)} min` : 'N/A'
    });
  }, [rutaOptima, mostrarRuta, cargandoRuta]);

  // Pantalla de carga
  if (inicializando) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary[600]} />
        
        {/* Header durante carga */}
        <View style={[styles.loadingHeader, { backgroundColor: colors.primary[600] }]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{nombreCliente}</Text>
            <Text style={styles.headerSubtitle}>Folio: {folio}</Text>
          </View>
        </View>

        {/* Contenido de carga */}
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconContainer}>
            <Ionicons name="location" size={64} color={colors.primary[600]} />
          </View>
          <Text style={styles.loadingTitle}>Preparando Tracking</Text>
          <Text style={styles.loadingMessage}>{mensajeCarga}</Text>
          <View style={styles.loadingSpinner}>
            <Text style={styles.spinnerText}>●●●</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={getStatusColor()} />
      
      {/* Header compacto */}
      <View style={[styles.header, { backgroundColor: getStatusColor() }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{nombreCliente}</Text>
          <Text style={styles.headerSubtitle}>Folio: {folio}</Text>
        </View>
      </View>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={false}
          showsMyLocationButton={false}
          initialRegion={{
            latitude: puntoEntrega.latitud,
            longitude: puntoEntrega.longitud,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Línea de ruta optimizada - RENDERIZAR PRIMERO para que esté debajo */}
          {mostrarRuta && rutaOptima && rutaOptima.coordinates.length > 0 && (
            <Polyline
              coordinates={rutaOptima.coordinates}
              strokeColor="#2563EB"
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
              geodesic={true}
              zIndex={1}
            />
          )}

          {/* Círculo de advertencia (100m) */}
          <Circle
            center={targetCoordinates}
            radius={100}
            fillColor="rgba(251, 191, 36, 0.1)"
            strokeColor="rgba(251, 191, 36, 0.5)"
            strokeWidth={1}
            zIndex={2}
          />

          {/* Círculo de geofence (50m) */}
          <Circle
            center={targetCoordinates}
            radius={50}
            fillColor="rgba(34, 197, 94, 0.2)"
            strokeColor="rgba(34, 197, 94, 0.8)"
            strokeWidth={2}
            zIndex={3}
          />

          {/* Marcador de ubicación actual del chofer */}
          {currentLocation && (
            <Marker
              coordinate={currentLocation.coordinates}
              title="Mi ubicación"
              description="Ubicación actual del chofer"
              zIndex={5}
            >
              <View style={styles.driverMarker}>
                <Ionicons name="car" size={20} color="white" />
              </View>
            </Marker>
          )}

          {/* Marcador del destino */}
          <Marker
            coordinate={targetCoordinates}
            title={nombreCliente}
            description="Punto de entrega"
            zIndex={4}
          >
            <View style={styles.destinationMarker}>
              <Ionicons name="location" size={24} color="white" />
            </View>
          </Marker>
        </MapView>

        {/* Controles del mapa */}
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={centerOnMyLocation}
          >
            <Ionicons name="locate" size={20} color={colors.primary[600]} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={centerOnDestination}
          >
            <Ionicons name="flag" size={20} color={colors.error[600]} />
          </TouchableOpacity>

          {/* Botón para mostrar/ocultar ruta */}
          <TouchableOpacity 
            style={[styles.mapButton, !mostrarRuta && styles.mapButtonInactive]}
            onPress={() => setMostrarRuta(!mostrarRuta)}
          >
            <Ionicons 
              name={mostrarRuta ? "eye" : "eye-off"} 
              size={20} 
              color={mostrarRuta ? colors.primary[600] : colors.neutral[400]} 
            />
          </TouchableOpacity>

          {/* Botón para recalcular ruta */}
          {currentLocation && (
            <TouchableOpacity 
              style={[styles.mapButton, cargandoRuta && styles.mapButtonInactive]}
              onPress={() => calcularRutaOptima(currentLocation.coordinates, targetCoordinates)}
              disabled={cargandoRuta}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={cargandoRuta ? colors.neutral[400] : colors.primary[600]} 
              />
            </TouchableOpacity>
          )}

          {/* Botón para simular acercamiento (DESARROLLO/TESTING) */}
          {currentLocation && (
            <TouchableOpacity 
              style={[
                styles.mapButton,
                simulandoAcercamiento && styles.simulationButtonActive
              ]}
              onPress={simularAcercamiento}
            >
              <Ionicons 
                name={simulandoAcercamiento ? "stop-circle" : "play-circle"} 
                size={20} 
                color={simulandoAcercamiento ? colors.error[600] : colors.warning[600]} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Panel de estado */}
      <View style={styles.statusPanel}>
        {/* Banner de simulación */}
        {simulandoAcercamiento && (
          <View style={styles.simulationBanner}>
            <Ionicons name="play-circle" size={16} color="white" />
            <Text style={styles.simulationBannerText}>
              🎮 MODO SIMULACIÓN ACTIVO
            </Text>
          </View>
        )}

        <View style={styles.statusHeader}>
          <Ionicons 
            name={authorizationStatus.isAuthorized ? "checkmark-circle" : "location"} 
            size={24} 
            color={getStatusColor()} 
          />
          <Text style={[styles.statusMessage, { color: getStatusColor() }]}>
            {getStatusMessage()}
          </Text>
        </View>

        <View style={styles.statusDetails}>
          <View style={styles.statusRow}>
            <Ionicons name="speedometer" size={16} color={colors.neutral[600]} />
            <Text style={styles.statusDetailText}>
              Precisión: {currentLocation?.accuracy.toFixed(0) || 'N/A'}m
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Ionicons name="radio-button-on" size={16} color={colors.neutral[600]} />
            <Text style={styles.statusDetailText}>
              Radio requerido: {authorizationStatus.requiredDistance}m
            </Text>
          </View>

          {/* Información de la ruta */}
          {rutaOptima && (
            <>
              <View style={styles.statusRow}>
                <Ionicons name="navigate" size={16} color={colors.primary[600]} />
                <Text style={styles.statusDetailText}>
                  Distancia: {(rutaOptima.distance / 1000).toFixed(2)} km
                </Text>
              </View>
              
              <View style={styles.statusRow}>
                <Ionicons name="time" size={16} color={colors.primary[600]} />
                <Text style={styles.statusDetailText}>
                  Tiempo estimado: {rutaOptima.duration.toFixed(0)} min
                </Text>
              </View>
            </>
          )}

          {cargandoRuta && (
            <View style={styles.statusRow}>
              <Ionicons name="refresh" size={16} color={colors.neutral[600]} />
              <Text style={styles.statusDetailText}>
                Calculando ruta...
              </Text>
            </View>
          )}
        </View>

        {/* Botón de entrega */}
        <TouchableOpacity 
          style={[
            styles.deliveryButton,
            authorizationStatus.isAuthorized 
              ? styles.deliveryButtonEnabled 
              : styles.deliveryButtonDisabled
          ]}
          onPress={navigateToDeliveryForm}
          disabled={!authorizationStatus.isAuthorized}
        >
          <Ionicons 
            name={authorizationStatus.isAuthorized ? "checkmark-circle" : "lock-closed"} 
            size={20} 
            color="white" 
          />
          <Text style={styles.deliveryButtonText}>
            {authorizationStatus.isAuthorized ? 'Realizar Entrega' : 'Acércate al Destino'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    paddingTop: Platform.OS === 'ios' ? spacing[12] : spacing[4],
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  loadingIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  loadingTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  loadingMessage: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  loadingSpinner: {
    marginTop: spacing[4],
  },
  spinnerText: {
    ...typography.h2,
    color: colors.primary[600],
    letterSpacing: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    marginTop: spacing[0.5],
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    gap: spacing[2],
  },
  mapButton: {
    backgroundColor: 'white',
    padding: spacing[3],
    borderRadius: 25,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mapButtonInactive: {
    opacity: 0.5,
  },
  simulationButtonActive: {
    backgroundColor: colors.error[50],
    borderWidth: 2,
    borderColor: colors.error[600],
  },
  simulationBanner: {
    backgroundColor: colors.warning[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    marginBottom: spacing[3],
    borderRadius: 8,
    gap: spacing[2],
  },
  simulationBannerText: {
    ...typography.body2,
    color: 'white',
    fontWeight: 'bold',
  },
  driverMarker: {
    backgroundColor: colors.primary[600],
    padding: spacing[2],
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  destinationMarker: {
    backgroundColor: colors.error[600],
    padding: spacing[2],
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  statusPanel: {
    backgroundColor: 'white',
    padding: spacing[4],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  statusMessage: {
    ...typography.h4,
    marginLeft: spacing[2],
    flex: 1,
  },
  statusDetails: {
    marginBottom: spacing[4],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  statusDetailText: {
    ...typography.body1,
    color: colors.neutral[600],
    marginLeft: spacing[2],
  },
  deliveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    borderRadius: 12,
    gap: spacing[2],
  },
  deliveryButtonEnabled: {
    backgroundColor: colors.success[600],
  },
  deliveryButtonDisabled: {
    backgroundColor: colors.neutral[400],
  },
  deliveryButtonText: {
    ...typography.h4,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DeliveryMapScreen;