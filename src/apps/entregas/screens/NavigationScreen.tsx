/**
 * 🧭 Pantalla de Navegación en Tercera Persona
 * 
 * Navegación en tiempo real con HERE Maps mostrando:
 * - Mapa en vista de tercera persona siguiendo vehículo
 * - Instrucciones de navegación paso a paso
 * - Indicador de próxima maniobra
 * - Alertas de tráfico e incidentes
 * - Recalculación automática de ruta
 * - Tiempo estimado de llegada actualizado
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, Camera } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  hereNavigationService,
  NavigationState,
  NavigationStatus,
  ManeuverType,
} from '@/apps/entregas/services/hereNavigationService';
import { routingService } from '@/apps/entregas/services/routingService';
import { colors, spacing, typography } from '@/design-system/theme';
import { EntregasStackParamList } from '@/navigation/types';

const { width, height } = Dimensions.get('window');

type NavigationScreenRouteProp = RouteProp<EntregasStackParamList, 'Navigation'>;
type NavigationScreenNavigationProp = NativeStackNavigationProp<
  EntregasStackParamList,
  'Navigation'
>;

export const NavigationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationScreenNavigationProp>();
  const route = useRoute<NavigationScreenRouteProp>();

  const { destino, nombreDestino } = route.params;

  const [navigationState, setNavigationState] = useState<NavigationState | null>(null);
  const [showTrafficAlert, setShowTrafficAlert] = useState(false);
  const [cameraHeading, setCameraHeading] = useState(0);

  const mapRef = useRef<MapView>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /**
   * Iniciar navegación al montar componente
   */
  useEffect(() => {
    startNavigation();

    return () => {
      cleanup();
    };
  }, []);

  /**
   * Actualizar cámara cuando cambia la ubicación
   */
  useEffect(() => {
    if (navigationState?.currentLocation && mapRef.current) {
      updateCamera();
    }
  }, [navigationState?.currentLocation]);

  /**
   * Mostrar alerta cuando se recomienda desvío
   */
  useEffect(() => {
    if (navigationState?.deviationRecommended && !showTrafficAlert) {
      handleTrafficAlert();
    }
  }, [navigationState?.deviationRecommended]);

  /**
   * Iniciar navegación
   */
  const startNavigation = async () => {
    try {
      // Suscribirse a eventos de navegación
      unsubscribeRef.current = hereNavigationService.onNavigationEvent(
        (state: NavigationState) => {
          setNavigationState(state);

          // Manejar llegada
          if (state.status === NavigationStatus.ARRIVED) {
            handleArrival();
          }
        }
      );

      // Iniciar navegación
      await hereNavigationService.startNavigation(destino, {
        autoReroute: true,
        offRouteThreshold: 50,
        checkTrafficInterval: 60000,
        arrivalThreshold: 20,
      });
    } catch (error) {
      console.error('Error iniciando navegación:', error);
      Alert.alert(
        'Error',
        'No se pudo iniciar la navegación. Por favor, intente nuevamente.',
        [
          {
            text: 'Volver',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  /**
   * Limpiar recursos
   */
  const cleanup = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    hereNavigationService.stopNavigation();
  };

  /**
   * Actualizar cámara del mapa en tercera persona
   */
  const updateCamera = () => {
    if (!navigationState?.currentLocation || !mapRef.current) {
      return;
    }

    const camera: Camera = {
      center: {
        latitude: navigationState.currentLocation.latitude,
        longitude: navigationState.currentLocation.longitude,
      },
      pitch: 60, // Vista en tercera persona
      heading: cameraHeading,
      altitude: 500,
      zoom: 17,
    };

    mapRef.current.animateCamera(camera, { duration: 1000 });
  };

  /**
   * Manejar alerta de tráfico
   */
  const handleTrafficAlert = () => {
    if (!navigationState?.deviationReason) {
      return;
    }

    setShowTrafficAlert(true);

    Alert.alert(
      '⚠️ Alerta de Tráfico',
      navigationState.deviationReason +
        '\n\n¿Desea recalcular la ruta para evitar este incidente?',
      [
        {
          text: 'Mantener Ruta',
          style: 'cancel',
          onPress: () => setShowTrafficAlert(false),
        },
        {
          text: 'Recalcular',
          onPress: async () => {
            setShowTrafficAlert(false);
            await hereNavigationService.recalculateRoute();
          },
        },
      ]
    );
  };

  /**
   * Manejar llegada al destino
   */
  const handleArrival = () => {
    Alert.alert(
      '🎉 ¡Llegada!',
      `Ha llegado a ${nombreDestino || 'su destino'}`,
      [
        {
          text: 'Finalizar',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  /**
   * Cancelar navegación
   */
  const handleCancel = () => {
    Alert.alert('Cancelar Navegación', '¿Está seguro que desea cancelar la navegación?', [
      {
        text: 'No',
        style: 'cancel',
      },
      {
        text: 'Sí, Cancelar',
        style: 'destructive',
        onPress: () => {
          cleanup();
          navigation.goBack();
        },
      },
    ]);
  };

  /**
   * Obtener icono de maniobra
   */
  const getManeuverIcon = (maneuver?: ManeuverType): string => {
    switch (maneuver) {
      case ManeuverType.TURN_LEFT:
        return 'arrow-back';
      case ManeuverType.TURN_RIGHT:
        return 'arrow-forward';
      case ManeuverType.UTURN:
        return 'return-up-back';
      case ManeuverType.CONTINUE:
        return 'arrow-up';
      case ManeuverType.ARRIVE:
        return 'flag';
      default:
        return 'navigate';
    }
  };

  /**
   * Formatear distancia
   */
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  /**
   * Formatear tiempo
   */
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  /**
   * Obtener color de estado
   */
  const getStatusColor = (): string => {
    switch (navigationState?.status) {
      case NavigationStatus.NAVIGATING:
        return colors.success;
      case NavigationStatus.RECALCULATING:
        return colors.warning;
      case NavigationStatus.OFF_ROUTE:
        return colors.error;
      default:
        return colors.neutral[500];
    }
  };

  if (!navigationState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="navigate-circle-outline" size={64} color={colors.primary} />
          <Text style={styles.loadingText}>Calculando ruta...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Mapa en tercera persona */}
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={true}
        pitchEnabled={true}
        rotateEnabled={true}
      >
        {/* Ruta */}
        {navigationState.currentRoute && (
          <Polyline
            coordinates={navigationState.currentRoute.coordinates}
            strokeColor={colors.primary}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Destino */}
        {navigationState.destination && (
          <Marker
            coordinate={navigationState.destination}
            title={nombreDestino || 'Destino'}
          >
            <View style={styles.destinationMarker}>
              <Ionicons name="flag" size={24} color={colors.error} />
            </View>
          </Marker>
        )}

        {/* Incidentes de tráfico */}
        {navigationState.trafficIncidents.map((incident, index) => (
          <Marker
            key={`incident-${index}`}
            coordinate={incident.location}
            title="Incidente de Tráfico"
            description={incident.description}
          >
            <View style={styles.incidentMarker}>
              <Ionicons name="warning" size={20} color={colors.warning} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Panel de instrucciones superior */}
      <View style={styles.instructionsPanel}>
        <View style={styles.instructionRow}>
          <View
            style={[
              styles.maneuverIcon,
              { backgroundColor: getStatusColor() },
            ]}
          >
            <Ionicons
              name={getManeuverIcon(navigationState.currentInstruction?.maneuver)}
              size={32}
              color="white"
            />
          </View>

          <View style={styles.instructionText}>
            <Text style={styles.instruction}>
              {navigationState.currentInstruction?.instruction || 'Calculando...'}
            </Text>
            <Text style={styles.distance}>
              {navigationState.distanceToNextManeuver > 0
                ? `En ${formatDistance(navigationState.distanceToNextManeuver)}`
                : 'Continúe por esta vía'}
            </Text>
          </View>
        </View>

        {/* Próxima instrucción */}
        {navigationState.nextInstruction && (
          <View style={styles.nextInstruction}>
            <Ionicons
              name={getManeuverIcon(navigationState.nextInstruction.maneuver)}
              size={16}
              color={colors.neutral[600]}
              style={{ marginRight: spacing[2] }}
            />
            <Text style={styles.nextInstructionText}>
              Luego: {navigationState.nextInstruction.instruction}
            </Text>
          </View>
        )}
      </View>

      {/* Panel de información inferior */}
      <View style={styles.infoPanel}>
        <View style={styles.infoRow}>
          {/* Tiempo restante */}
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={colors.neutral[600]} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Tiempo</Text>
              <Text style={styles.infoValue}>
                {formatTime(navigationState.durationRemaining)}
              </Text>
            </View>
          </View>

          {/* Distancia restante */}
          <View style={styles.infoItem}>
            <Ionicons name="navigate-outline" size={20} color={colors.neutral[600]} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Distancia</Text>
              <Text style={styles.infoValue}>
                {formatDistance(navigationState.distanceRemaining)}
              </Text>
            </View>
          </View>

          {/* ETA */}
          <View style={styles.infoItem}>
            <Ionicons name="flag-outline" size={20} color={colors.neutral[600]} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Llegada</Text>
              <Text style={styles.infoValue}>
                {navigationState.eta
                  ? navigationState.eta.toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '--:--'}
              </Text>
            </View>
          </View>
        </View>

        {/* Velocidad actual */}
        {navigationState.currentSpeed > 0 && (
          <View style={styles.speedContainer}>
            <Text style={styles.speedValue}>
              {Math.round(navigationState.currentSpeed)}
            </Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>
        )}

        {/* Alerta de fuera de ruta */}
        {navigationState.isOffRoute && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={20} color={colors.error} />
            <Text style={styles.alertText}>
              {navigationState.status === NavigationStatus.RECALCULATING
                ? 'Recalculando ruta...'
                : 'Fuera de ruta'}
            </Text>
          </View>
        )}

        {/* Alerta de incidentes */}
        {navigationState.trafficIncidents.length > 0 && (
          <View style={styles.trafficAlert}>
            <Ionicons name="car" size={16} color={colors.warning} />
            <Text style={styles.trafficAlertText}>
              {navigationState.trafficIncidents.length} incidente(s) en ruta
            </Text>
          </View>
        )}
      </View>

      {/* Botón de cancelar */}
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>

      {/* Botón de recentrar */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={() => updateCamera()}
      >
        <Ionicons name="locate" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[900],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.h3,
    color: colors.neutral[700],
    marginTop: spacing[4],
  },
  map: {
    flex: 1,
  },
  instructionsPanel: {
    position: 'absolute',
    top: 60,
    left: spacing[4],
    right: spacing[4],
    backgroundColor: 'white',
    borderRadius: 16,
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maneuverIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  instructionText: {
    flex: 1,
  },
  instruction: {
    ...typography.body1,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  distance: {
    ...typography.body2,
    color: colors.neutral[600],
  },
  nextInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  nextInstructionText: {
    ...typography.body3,
    color: colors.neutral[600],
    flex: 1,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 40,
    left: spacing[4],
    right: spacing[4],
    backgroundColor: 'white',
    borderRadius: 16,
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoTextContainer: {
    marginLeft: spacing[2],
  },
  infoLabel: {
    ...typography.caption,
    color: colors.neutral[600],
  },
  infoValue: {
    ...typography.body2,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  speedContainer: {
    alignItems: 'center',
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  speedValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  speedUnit: {
    ...typography.body3,
    color: colors.neutral[600],
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '20',
    padding: spacing[3],
    borderRadius: 8,
    marginTop: spacing[3],
  },
  alertText: {
    ...typography.body2,
    color: colors.error,
    marginLeft: spacing[2],
    fontWeight: 'bold',
  },
  trafficAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    padding: spacing[2],
    borderRadius: 8,
    marginTop: spacing[2],
  },
  trafficAlertText: {
    ...typography.body3,
    color: colors.warning,
    marginLeft: spacing[2],
  },
  cancelButton: {
    position: 'absolute',
    top: 60,
    right: spacing[4],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 200,
    right: spacing[4],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.error,
  },
  incidentMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.warning,
  },
});
