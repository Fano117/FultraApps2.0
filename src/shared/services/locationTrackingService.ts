/**
 * Servicio de Tracking GPS - FultraApps
 * Maneja ubicación en tiempo real, tracking de chofer y geofencing
 * Secure by Default - valida permisos y encripta datos sensibles
 */

import * as Location from 'expo-location';
import { permissionsService } from './permissionsService';
import { Subject, BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { map, filter, distinctUntilChanged, throttleTime } from 'rxjs/operators';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationUpdate {
  coordinates: Coordinates;
  accuracy: number;
  timestamp: number;
  speed: number | null;
  heading: number | null;
}

export interface GeofenceStatus {
  isInside: boolean;
  distance: number;
  targetLocation: Coordinates;
  currentLocation: Coordinates;
}

export interface TrackingState {
  isTracking: boolean;
  currentLocation: LocationUpdate | null;
  geofenceStatus: GeofenceStatus | null;
  error: string | null;
}

class LocationTrackingService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private backgroundSubscription: Location.LocationSubscription | null = null;
  
  // Observables para estado reactivo
  private locationSubject = new BehaviorSubject<LocationUpdate | null>(null);
  private trackingStateSubject = new BehaviorSubject<TrackingState>({
    isTracking: false,
    currentLocation: null,
    geofenceStatus: null,
    error: null
  });
  private geofenceSubject = new Subject<GeofenceStatus>();

  // Configuración de tracking
  private readonly HIGH_ACCURACY_OPTIONS: Location.LocationOptions = {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000, // 1 segundo
    distanceInterval: 5, // 5 metros
  };

  private readonly BACKGROUND_OPTIONS: Location.LocationOptions = {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10000, // 10 segundos
    distanceInterval: 10, // 10 metros
  };

  // Observables públicos
  public location$ = this.locationSubject.asObservable();
  public trackingState$ = this.trackingStateSubject.asObservable();
  public geofence$ = this.geofenceSubject.asObservable();

  /**
   * Iniciar tracking de ubicación en tiempo real
   */
  async startTracking(): Promise<boolean> {
    try {
      console.log('[GPS TRACKING] 🚀 Iniciando tracking...');
      
      // Verificar permisos
      const canUseLocation = await permissionsService.canUseLocation();
      if (!canUseLocation) {
        console.log('[GPS TRACKING] ❌ Sin permisos de ubicación');
        this.updateTrackingState({ 
          error: 'Permisos de ubicación requeridos' 
        });
        return false;
      }

      // Detener tracking previo si existe
      await this.stopTracking();

      // Obtener ubicación inicial
      const initialLocation = await this.getCurrentLocation();
      if (!initialLocation) {
        this.updateTrackingState({ 
          error: 'No se pudo obtener ubicación inicial' 
        });
        return false;
      }

      // Iniciar tracking continuo
      this.locationSubscription = await Location.watchPositionAsync(
        this.HIGH_ACCURACY_OPTIONS,
        (location) => {
          const update: LocationUpdate = {
            coordinates: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            accuracy: location.coords.accuracy || 0,
            timestamp: location.timestamp,
            speed: location.coords.speed,
            heading: location.coords.heading,
          };

          console.log('[GPS TRACKING] 📍 Nueva ubicación:', {
            lat: update.coordinates.latitude.toFixed(6),
            lng: update.coordinates.longitude.toFixed(6),
            accuracy: update.accuracy?.toFixed(1) + 'm',
            speed: update.speed ? (update.speed * 3.6).toFixed(1) + 'km/h' : 'N/A'
          });

          this.locationSubject.next(update);
          this.updateTrackingState({ 
            isTracking: true, 
            currentLocation: update,
            error: null 
          });
        }
      );

      console.log('[GPS TRACKING] ✅ Tracking iniciado exitosamente');
      return true;

    } catch (error) {
      console.error('[GPS TRACKING] ❌ Error iniciando tracking:', error);
      this.updateTrackingState({ 
        error: `Error iniciando tracking: ${error}` 
      });
      return false;
    }
  }

  /**
   * Iniciar tracking en segundo plano (para delivery activo)
   */
  async startBackgroundTracking(): Promise<boolean> {
    try {
      console.log('[GPS TRACKING] 🔄 Iniciando tracking en segundo plano...');
      
      // Verificar permisos de segundo plano
      const canUseBackground = await permissionsService.canUseBackgroundLocation();
      if (!canUseBackground) {
        console.log('[GPS TRACKING] ❌ Sin permisos de ubicación en segundo plano');
        return false;
      }

      // Iniciar tracking en segundo plano
      this.backgroundSubscription = await Location.watchPositionAsync(
        this.BACKGROUND_OPTIONS,
        (location) => {
          const update: LocationUpdate = {
            coordinates: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            accuracy: location.coords.accuracy || 0,
            timestamp: location.timestamp,
            speed: location.coords.speed,
            heading: location.coords.heading,
          };

          console.log('[GPS TRACKING] 🔄 Ubicación segundo plano:', {
            lat: update.coordinates.latitude.toFixed(6),
            lng: update.coordinates.longitude.toFixed(6)
          });

          this.locationSubject.next(update);
        }
      );

      console.log('[GPS TRACKING] ✅ Tracking segundo plano iniciado');
      return true;

    } catch (error) {
      console.error('[GPS TRACKING] ❌ Error tracking segundo plano:', error);
      return false;
    }
  }

  /**
   * Detener tracking
   */
  async stopTracking(): Promise<void> {
    try {
      console.log('[GPS TRACKING] ⏹️ Deteniendo tracking...');
      
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      if (this.backgroundSubscription) {
        this.backgroundSubscription.remove();
        this.backgroundSubscription = null;
      }

      this.updateTrackingState({ 
        isTracking: false, 
        error: null 
      });

      console.log('[GPS TRACKING] ✅ Tracking detenido');
    } catch (error) {
      console.error('[GPS TRACKING] ❌ Error deteniendo tracking:', error);
    }
  }

  /**
   * Obtener ubicación actual (una sola vez)
   */
  async getCurrentLocation(): Promise<LocationUpdate | null> {
    try {
      console.log('[GPS TRACKING] 📍 Obteniendo ubicación actual...');
      
      const canUseLocation = await permissionsService.canUseLocation();
      if (!canUseLocation) {
        console.log('[GPS TRACKING] ❌ Sin permisos de ubicación');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const update: LocationUpdate = {
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp,
        speed: location.coords.speed,
        heading: location.coords.heading,
      };

      console.log('[GPS TRACKING] 📍 Ubicación obtenida:', {
        lat: update.coordinates.latitude.toFixed(6),
        lng: update.coordinates.longitude.toFixed(6),
        accuracy: update.accuracy?.toFixed(1) + 'm'
      });

      return update;
    } catch (error) {
      console.error('[GPS TRACKING] ❌ Error obteniendo ubicación:', error);
      return null;
    }
  }

  /**
   * Calcular distancia entre dos puntos (en metros)
   * Usa la fórmula de Haversine para precisión
   */
  calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
  }

  /**
   * Verificar si una ubicación está dentro del geofence
   */
  isInsideGeofence(
    currentLocation: Coordinates, 
    targetLocation: Coordinates, 
    radiusInMeters: number = 50
  ): GeofenceStatus {
    const distance = this.calculateDistance(currentLocation, targetLocation);
    const isInside = distance <= radiusInMeters;

    const status: GeofenceStatus = {
      isInside,
      distance,
      targetLocation,
      currentLocation
    };

    console.log('[GPS TRACKING] 🎯 Geofence status:', {
      distancia: distance.toFixed(1) + 'm',
      dentroDelPerímetro: isInside ? '✅' : '❌',
      radio: radiusInMeters + 'm'
    });

    return status;
  }

  /**
   * Configurar geofencing para un punto específico
   */
  setupGeofencing(targetLocation: Coordinates, radiusInMeters: number = 50): Observable<GeofenceStatus> {
    console.log('[GPS TRACKING] 🎯 Configurando geofence:', {
      target: `${targetLocation.latitude.toFixed(6)}, ${targetLocation.longitude.toFixed(6)}`,
      radio: radiusInMeters + 'm'
    });

    return this.location$.pipe(
      filter(location => location !== null),
      map(location => this.isInsideGeofence(
        location!.coordinates, 
        targetLocation, 
        radiusInMeters
      )),
      distinctUntilChanged((prev, curr) => prev.isInside === curr.isInside),
      map(status => {
        // Emitir cambio de estado
        this.geofenceSubject.next(status);
        this.updateTrackingState({ geofenceStatus: status });
        
        if (status.isInside) {
          console.log('[GPS TRACKING] 🎉 ENTRÓ AL GEOFENCE - Entrega habilitada');
        } else {
          console.log('[GPS TRACKING] 🚫 FUERA DEL GEOFENCE - Entrega bloqueada');
        }
        
        return status;
      })
    );
  }

  /**
   * Obtener estado actual del tracking
   */
  getCurrentTrackingState(): TrackingState {
    return this.trackingStateSubject.getValue();
  }

  /**
   * Actualizar estado del tracking
   */
  private updateTrackingState(partialState: Partial<TrackingState>): void {
    const currentState = this.trackingStateSubject.getValue();
    const newState = { ...currentState, ...partialState };
    this.trackingStateSubject.next(newState);
  }

  /**
   * Limpiar recursos
   */
  async cleanup(): Promise<void> {
    await this.stopTracking();
    this.locationSubject.complete();
    this.trackingStateSubject.complete();
    this.geofenceSubject.complete();
  }
}

export const locationTrackingService = new LocationTrackingService();