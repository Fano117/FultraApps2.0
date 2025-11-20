/**
 * Servicio de Geofencing - FultraApps
 * Maneja geofences para entregas, validación de proximidad y control de acceso
 * Secure by Default - valida ubicaciones y controla acceso a entregas
 */

import { locationTrackingService, Coordinates, GeofenceStatus } from './locationTrackingService';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';

export interface DeliveryGeofence {
  id: string;
  targetLocation: Coordinates;
  radiusInMeters: number;
  isActive: boolean;
  entregaId: number;
  folio: string;
  clienteNombre: string;
}

export interface GeofenceEvent {
  type: 'enter' | 'exit' | 'distance_update';
  geofenceId: string;
  distance: number;
  timestamp: number;
  status: GeofenceStatus;
}

export interface DeliveryAuthorizationStatus {
  isAuthorized: boolean;
  reason: string;
  distance: number;
  requiredDistance: number;
  geofenceId: string | null;
}

class GeofencingService {
  private activeGeofences = new Map<string, DeliveryGeofence>();
  private geofenceEventsSubject = new BehaviorSubject<GeofenceEvent[]>([]);
  private deliveryAuthorizationSubject = new BehaviorSubject<DeliveryAuthorizationStatus>({
    isAuthorized: false,
    reason: 'Sin geofence activo',
    distance: 0,
    requiredDistance: 50,
    geofenceId: null
  });

  // Observables públicos
  public geofenceEvents$ = this.geofenceEventsSubject.asObservable();
  public deliveryAuthorization$ = this.deliveryAuthorizationSubject.asObservable();

  // Configuración de distancias
  private readonly DEFAULT_DELIVERY_RADIUS = 50; // metros
  private readonly WARNING_DISTANCE = 100; // metros para alerta
  private readonly APPROACH_DISTANCE = 200; // metros para aproximación

  /**
   * Crear geofence para una entrega específica
   */
  async createDeliveryGeofence(
    entregaId: number,
    folio: string,
    clienteNombre: string,
    targetLocation: Coordinates,
    radiusInMeters: number = this.DEFAULT_DELIVERY_RADIUS
  ): Promise<string> {
    const geofenceId = `delivery_${entregaId}_${Date.now()}`;
    
    const geofence: DeliveryGeofence = {
      id: geofenceId,
      targetLocation,
      radiusInMeters,
      isActive: true,
      entregaId,
      folio,
      clienteNombre
    };

    this.activeGeofences.set(geofenceId, geofence);

    console.log('[GEOFENCING] 🎯 Creando geofence para entrega:', {
      id: geofenceId,
      entrega: entregaId,
      folio,
      cliente: clienteNombre,
      ubicación: `${targetLocation.latitude.toFixed(6)}, ${targetLocation.longitude.toFixed(6)}`,
      radio: radiusInMeters + 'm'
    });

    // Configurar seguimiento de este geofence
    this.setupGeofenceTracking(geofence);
    
    return geofenceId;
  }

  /**
   * Configurar seguimiento de un geofence específico
   */
  private setupGeofenceTracking(geofence: DeliveryGeofence): void {
    console.log('[GEOFENCING] 📡 Configurando tracking para geofence:', geofence.id);

    // Obtener observable de estado del geofence
    const geofenceStatus$ = locationTrackingService.setupGeofencing(
      geofence.targetLocation,
      geofence.radiusInMeters
    );

    // Suscribirse a cambios de estado
    geofenceStatus$.subscribe(status => {
      this.handleGeofenceStatusChange(geofence, status);
    });
  }

  /**
   * Manejar cambios de estado del geofence
   */
  private handleGeofenceStatusChange(
    geofence: DeliveryGeofence, 
    status: GeofenceStatus
  ): void {
    const event: GeofenceEvent = {
      type: status.isInside ? 'enter' : 'exit',
      geofenceId: geofence.id,
      distance: status.distance,
      timestamp: Date.now(),
      status
    };

    // Actualizar eventos
    const currentEvents = this.geofenceEventsSubject.getValue();
    this.geofenceEventsSubject.next([...currentEvents, event]);

    // Actualizar autorización de entrega
    this.updateDeliveryAuthorization(geofence, status);

    // Log del evento
    if (status.isInside) {
      console.log('[GEOFENCING] 🎉 ENTRÓ AL GEOFENCE:', {
        geofence: geofence.id,
        folio: geofence.folio,
        cliente: geofence.clienteNombre,
        distancia: status.distance.toFixed(1) + 'm'
      });
    } else {
      console.log('[GEOFENCING] 🚫 SALIÓ DEL GEOFENCE:', {
        geofence: geofence.id,
        folio: geofence.folio,
        distancia: status.distance.toFixed(1) + 'm'
      });
    }
  }

  /**
   * Actualizar autorización de entrega basada en geofence
   */
  private updateDeliveryAuthorization(
    geofence: DeliveryGeofence,
    status: GeofenceStatus
  ): void {
    const authorization: DeliveryAuthorizationStatus = {
      isAuthorized: status.isInside,
      reason: status.isInside 
        ? 'Chofer dentro del área de entrega' 
        : `Chofer fuera del área (${status.distance.toFixed(0)}m de distancia)`,
      distance: status.distance,
      requiredDistance: geofence.radiusInMeters,
      geofenceId: geofence.id
    };

    this.deliveryAuthorizationSubject.next(authorization);

    console.log('[GEOFENCING] 🔐 Autorización de entrega actualizada:', {
      autorizada: authorization.isAuthorized ? '✅' : '❌',
      razón: authorization.reason,
      distancia: authorization.distance.toFixed(1) + 'm',
      requerida: authorization.requiredDistance + 'm'
    });
  }

  /**
   * Verificar si una entrega está autorizada para el geofence actual
   */
  async isDeliveryAuthorized(entregaId: number): Promise<boolean> {
    const currentAuth = this.deliveryAuthorizationSubject.getValue();
    
    // Buscar geofence activo para esta entrega
    const activeGeofence = Array.from(this.activeGeofences.values())
      .find(g => g.entregaId === entregaId && g.isActive);

    if (!activeGeofence) {
      console.log('[GEOFENCING] ⚠️ No hay geofence activo para entrega:', entregaId);
      return false;
    }

    // Verificar ubicación actual
    const currentLocation = await locationTrackingService.getCurrentLocation();
    if (!currentLocation) {
      console.log('[GEOFENCING] ❌ No se pudo obtener ubicación actual');
      return false;
    }

    // Calcular estado del geofence
    const geofenceStatus = locationTrackingService.isInsideGeofence(
      currentLocation.coordinates,
      activeGeofence.targetLocation,
      activeGeofence.radiusInMeters
    );

    console.log('[GEOFENCING] 🔍 Verificación de autorización:', {
      entregaId,
      autorizada: geofenceStatus.isInside ? '✅' : '❌',
      distancia: geofenceStatus.distance.toFixed(1) + 'm',
      radioRequerido: activeGeofence.radiusInMeters + 'm'
    });

    return geofenceStatus.isInside;
  }

  /**
   * Obtener distancia actual a la entrega
   */
  async getDistanceToDelivery(entregaId: number): Promise<number | null> {
    const activeGeofence = Array.from(this.activeGeofences.values())
      .find(g => g.entregaId === entregaId && g.isActive);

    if (!activeGeofence) {
      return null;
    }

    const currentLocation = await locationTrackingService.getCurrentLocation();
    if (!currentLocation) {
      return null;
    }

    return locationTrackingService.calculateDistance(
      currentLocation.coordinates,
      activeGeofence.targetLocation
    );
  }

  /**
   * Obtener información de proximidad para UI
   */
  getProximityInfo(distance: number): {
    level: 'far' | 'approaching' | 'warning' | 'ready';
    color: string;
    message: string;
    icon: string;
  } {
    if (distance <= this.DEFAULT_DELIVERY_RADIUS) {
      return {
        level: 'ready',
        color: '#10B981', // green-500
        message: 'Listo para entregar',
        icon: 'checkmark-circle'
      };
    } else if (distance <= this.WARNING_DISTANCE) {
      return {
        level: 'warning',
        color: '#F59E0B', // amber-500
        message: `${distance.toFixed(0)}m - Acércate más`,
        icon: 'warning'
      };
    } else if (distance <= this.APPROACH_DISTANCE) {
      return {
        level: 'approaching',
        color: '#3B82F6', // blue-500
        message: `${distance.toFixed(0)}m - Aproximándose`,
        icon: 'navigate'
      };
    } else {
      return {
        level: 'far',
        color: '#6B7280', // gray-500
        message: `${distance.toFixed(0)}m - Distante`,
        icon: 'location'
      };
    }
  }

  /**
   * Activar geofence por ID
   */
  activateGeofence(geofenceId: string): boolean {
    const geofence = this.activeGeofences.get(geofenceId);
    if (geofence) {
      geofence.isActive = true;
      console.log('[GEOFENCING] ✅ Geofence activado:', geofenceId);
      return true;
    }
    return false;
  }

  /**
   * Desactivar geofence por ID
   */
  deactivateGeofence(geofenceId: string): boolean {
    const geofence = this.activeGeofences.get(geofenceId);
    if (geofence) {
      geofence.isActive = false;
      console.log('[GEOFENCING] ⏹️ Geofence desactivado:', geofenceId);
      return true;
    }
    return false;
  }

  /**
   * Eliminar geofence
   */
  removeGeofence(geofenceId: string): boolean {
    const removed = this.activeGeofences.delete(geofenceId);
    if (removed) {
      console.log('[GEOFENCING] 🗑️ Geofence eliminado:', geofenceId);
      
      // Reset authorization si era el geofence activo
      const currentAuth = this.deliveryAuthorizationSubject.getValue();
      if (currentAuth.geofenceId === geofenceId) {
        this.deliveryAuthorizationSubject.next({
          isAuthorized: false,
          reason: 'Geofence eliminado',
          distance: 0,
          requiredDistance: 50,
          geofenceId: null
        });
      }
    }
    return removed;
  }

  /**
   * Limpiar todos los geofences
   */
  clearAllGeofences(): void {
    console.log('[GEOFENCING] 🧹 Limpiando todos los geofences...');
    this.activeGeofences.clear();
    this.deliveryAuthorizationSubject.next({
      isAuthorized: false,
      reason: 'Todos los geofences eliminados',
      distance: 0,
      requiredDistance: 50,
      geofenceId: null
    });
  }

  /**
   * Obtener geofences activos
   */
  getActiveGeofences(): DeliveryGeofence[] {
    return Array.from(this.activeGeofences.values()).filter(g => g.isActive);
  }

  /**
   * Obtener estado actual de autorización
   */
  getCurrentAuthorizationStatus(): DeliveryAuthorizationStatus {
    return this.deliveryAuthorizationSubject.getValue();
  }
}

export const geofencingService = new GeofencingService();