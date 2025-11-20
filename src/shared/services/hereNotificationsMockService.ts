// Servicio mock para simular notificaciones HERE Notifications API
// Este servicio dispara notificaciones locales usando Expo Notifications

import * as Notifications from 'expo-notifications';

export type HereNotificationType =
  | 'geofence_entry'
  | 'geofence_exit'
  | 'entrega_inicio'
  | 'entrega_fin'
  | 'nueva_ruta';

export interface HereNotificationPayload {
  type: HereNotificationType;
  title: string;
  body: string;
  data?: any;
}

export class HereNotificationsMockService {
  static async sendNotification(payload: HereNotificationPayload) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
      },
      trigger: null, // Inmediato
    });
  }

  // Simular evento de entrada/salida de geocerca
  static async simulateGeofenceEvent(event: 'entry' | 'exit', cliente: string, rango: number) {
    await HereNotificationsMockService.sendNotification({
      type: event === 'entry' ? 'geofence_entry' : 'geofence_exit',
      title: event === 'entry' ? '¡Entraste a la zona de entrega!' : 'Saliste de la zona de entrega',
      body: `Cliente: ${cliente}\nRango: ${rango}m`,
      data: { cliente, rango },
    });
  }

  // Simular inicio/fin de entrega
  static async simulateEntregaEvent(event: 'inicio' | 'fin', cliente: string) {
    await HereNotificationsMockService.sendNotification({
      type: event === 'inicio' ? 'entrega_inicio' : 'entrega_fin',
      title: event === 'inicio' ? 'Entrega iniciada' : 'Entrega finalizada',
      body: `Cliente: ${cliente}`,
      data: { cliente },
    });
  }

  // Simular nueva ruta de entrega
  static async simulateNuevaRuta(cliente: string) {
    await HereNotificationsMockService.sendNotification({
      type: 'nueva_ruta',
      title: 'Nueva ruta de entrega',
      body: `Se agregó una nueva ruta para el cliente ${cliente}`,
      data: { cliente },
    });
  }
}
