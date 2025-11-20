/**
 * Servicio de Notificaciones de Proximidad - FultraApps
 * Maneja alertas y notificaciones para tracking de entregas
 * Secure by Default - solo notifica eventos de proximidad autorizados
 */

import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { geofencingService, GeofenceEvent } from './geofencingService';
import { Subscription } from 'rxjs';

export interface ProximityAlert {
  id: string;
  type: 'approaching' | 'warning' | 'entered' | 'exited';
  distance: number;
  threshold: number;
  timestamp: number;
  entregaId: number;
  folio: string;
  clienteNombre: string;
}

class ProximityNotificationService {
  private geofenceSubscription: Subscription | null = null;
  private lastAlertDistance: Map<string, number> = new Map();
  private alertHistory: ProximityAlert[] = [];
  
  // Umbrales de distancia para notificaciones
  private readonly DISTANCE_THRESHOLDS = {
    APPROACHING: 200, // metros - Se está acercando
    WARNING: 100,     // metros - Advertencia
    READY: 50,        // metros - Listo para entregar
  };

  // Control de spam de notificaciones
  private readonly NOTIFICATION_COOLDOWN = 30000; // 30 segundos
  private lastNotificationTime = new Map<string, number>();

  /**
   * Configurar notificaciones push
   */
  async setupNotifications(): Promise<boolean> {
    try {
      console.log('[PROXIMITY] 📱 Configurando notificaciones...');

      // Solicitar permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[PROXIMITY] ❌ Permisos de notificaciones denegados');
        return false;
      }

      // Configurar comportamiento de notificaciones
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      console.log('[PROXIMITY] ✅ Notificaciones configuradas');
      return true;
    } catch (error) {
      console.error('[PROXIMITY] ❌ Error configurando notificaciones:', error);
      return false;
    }
  }

  /**
   * Iniciar monitoreo de proximidad
   */
  startProximityMonitoring(): void {
    console.log('[PROXIMITY] 📡 Iniciando monitoreo de proximidad...');

    // Suscribirse a eventos de geofence
    this.geofenceSubscription = geofencingService.geofenceEvents$.subscribe(
      (events) => {
        if (events.length > 0) {
          const latestEvent = events[events.length - 1];
          this.handleGeofenceEvent(latestEvent);
        }
      }
    );

    // Suscribirse a cambios de autorización para detectar proximidad
    geofencingService.deliveryAuthorization$.subscribe(
      (authorization) => {
        if (authorization.geofenceId) {
          this.checkProximityThresholds(
            authorization.geofenceId,
            authorization.distance
          );
        }
      }
    );
  }

  /**
   * Detener monitoreo de proximidad
   */
  stopProximityMonitoring(): void {
    console.log('[PROXIMITY] ⏹️ Deteniendo monitoreo de proximidad...');
    
    if (this.geofenceSubscription) {
      this.geofenceSubscription.unsubscribe();
      this.geofenceSubscription = null;
    }
    
    this.lastAlertDistance.clear();
    this.lastNotificationTime.clear();
  }

  /**
   * Manejar eventos de geofence
   */
  private handleGeofenceEvent(event: GeofenceEvent): void {
    console.log('[PROXIMITY] 📍 Evento de geofence:', {
      tipo: event.type,
      geofence: event.geofenceId,
      distancia: event.distance.toFixed(1) + 'm'
    });

    const alert: ProximityAlert = {
      id: `${event.geofenceId}_${event.timestamp}`,
      type: event.type === 'enter' ? 'entered' : 'exited',
      distance: event.distance,
      threshold: 50, // Radio del geofence
      timestamp: event.timestamp,
      entregaId: 0, // Se obtendría del geofence
      folio: 'N/A',
      clienteNombre: 'Cliente'
    };

    this.addAlert(alert);

    if (event.type === 'enter') {
      this.showNotification(
        '🎉 Área de Entrega Alcanzada',
        'Ya puede realizar la entrega. Está dentro del área permitida.',
        'success'
      );
      
      // Vibración de confirmación
      if (Platform.OS === 'ios') {
        // iOS Haptic feedback
      } else {
        // Android vibration
      }
    } else if (event.type === 'exit') {
      this.showNotification(
        '⚠️ Salió del Área de Entrega',
        'Regrese al área de entrega para poder completar la entrega.',
        'warning'
      );
    }
  }

  /**
   * Verificar umbrales de proximidad
   */
  private checkProximityThresholds(geofenceId: string, currentDistance: number): void {
    const lastDistance = this.lastAlertDistance.get(geofenceId) || Number.MAX_VALUE;
    this.lastAlertDistance.set(geofenceId, currentDistance);

    // Aproximándose (200m)
    if (lastDistance > this.DISTANCE_THRESHOLDS.APPROACHING && 
        currentDistance <= this.DISTANCE_THRESHOLDS.APPROACHING) {
      
      const alert: ProximityAlert = {
        id: `${geofenceId}_approaching_${Date.now()}`,
        type: 'approaching',
        distance: currentDistance,
        threshold: this.DISTANCE_THRESHOLDS.APPROACHING,
        timestamp: Date.now(),
        entregaId: 0,
        folio: 'N/A',
        clienteNombre: 'Cliente'
      };
      
      this.addAlert(alert);
      this.showNotification(
        '📍 Acercándose al Destino',
        `Se encuentra a ${currentDistance.toFixed(0)}m del punto de entrega`,
        'info'
      );
    }

    // Advertencia (100m)
    if (lastDistance > this.DISTANCE_THRESHOLDS.WARNING && 
        currentDistance <= this.DISTANCE_THRESHOLDS.WARNING) {
      
      const alert: ProximityAlert = {
        id: `${geofenceId}_warning_${Date.now()}`,
        type: 'warning',
        distance: currentDistance,
        threshold: this.DISTANCE_THRESHOLDS.WARNING,
        timestamp: Date.now(),
        entregaId: 0,
        folio: 'N/A',
        clienteNombre: 'Cliente'
      };
      
      this.addAlert(alert);
      this.showNotification(
        '🎯 Cerca del Destino',
        `${currentDistance.toFixed(0)}m - Prepárese para la entrega`,
        'warning'
      );
    }
  }

  /**
   * Mostrar notificación
   */
  private async showNotification(
    title: string, 
    body: string, 
    type: 'success' | 'warning' | 'info' = 'info'
  ): Promise<void> {
    const notificationKey = `${title}_${type}`;
    const now = Date.now();
    const lastNotification = this.lastNotificationTime.get(notificationKey) || 0;

    // Control de spam: no mostrar la misma notificación muy seguido
    if (now - lastNotification < this.NOTIFICATION_COOLDOWN) {
      return;
    }

    try {
      this.lastNotificationTime.set(notificationKey, now);

      console.log('[PROXIMITY] 🔔 Mostrando notificación:', { title, body, type });

      // Mostrar alerta nativa
      Alert.alert(title, body, [{ text: 'OK' }]);

      // Mostrar notificación push (si la app está en background)
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type },
          sound: type === 'success' ? 'success.wav' : 'default',
        },
        trigger: null, // Inmediata
      });

    } catch (error) {
      console.error('[PROXIMITY] ❌ Error mostrando notificación:', error);
    }
  }

  /**
   * Agregar alerta al historial
   */
  private addAlert(alert: ProximityAlert): void {
    this.alertHistory.push(alert);
    
    // Mantener solo las últimas 50 alertas
    if (this.alertHistory.length > 50) {
      this.alertHistory = this.alertHistory.slice(-50);
    }

    console.log('[PROXIMITY] 📋 Alerta agregada:', {
      tipo: alert.type,
      distancia: alert.distance.toFixed(1) + 'm',
      umbral: alert.threshold + 'm',
      total: this.alertHistory.length
    });
  }

  /**
   * Obtener historial de alertas
   */
  getAlertHistory(): ProximityAlert[] {
    return [...this.alertHistory];
  }

  /**
   * Limpiar historial de alertas
   */
  clearAlertHistory(): void {
    console.log('[PROXIMITY] 🧹 Limpiando historial de alertas...');
    this.alertHistory = [];
    this.lastAlertDistance.clear();
    this.lastNotificationTime.clear();
  }

  /**
   * Obtener estadísticas de proximidad
   */
  getProximityStats(): {
    totalAlertas: number;
    alertasPorTipo: Record<string, number>;
    ultimaAlerta: ProximityAlert | null;
  } {
    const alertasPorTipo = this.alertHistory.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAlertas: this.alertHistory.length,
      alertasPorTipo,
      ultimaAlerta: this.alertHistory[this.alertHistory.length - 1] || null
    };
  }

  /**
   * Simular alerta de proximidad (para testing)
   */
  async simulateProximityAlert(type: ProximityAlert['type'], distance: number): Promise<void> {
    const alert: ProximityAlert = {
      id: `sim_${Date.now()}`,
      type,
      distance,
      threshold: 50,
      timestamp: Date.now(),
      entregaId: 999,
      folio: 'TEST-001',
      clienteNombre: 'Cliente de Prueba'
    };

    this.addAlert(alert);

    const messages = {
      approaching: ['🚗 Aproximándose', `${distance}m del destino`],
      warning: ['⚠️ Cerca del destino', `${distance}m - Prepárese`],
      entered: ['✅ En área de entrega', 'Puede realizar la entrega'],
      exited: ['❌ Fuera del área', 'Regrese al punto de entrega']
    };

    const [title, body] = messages[type];
    await this.showNotification(title, body, type === 'entered' ? 'success' : 'warning');
  }
}

export const proximityNotificationService = new ProximityNotificationService();