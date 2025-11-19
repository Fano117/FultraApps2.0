/**
 * 🧭 HERE Navigation Service
 * 
 * Servicio para navegación en tiempo real con indicaciones paso a paso,
 * recalculación automática de ruta y detección de desvíos.
 * 
 * Características:
 * - Navegación en tercera persona
 * - Indicaciones en tiempo real
 * - Recalculación automática al desviarse
 * - Integración con tráfico en tiempo real
 * - Alertas de desvíos recomendados
 */

import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { routingService, RutaOptima, Ubicacion } from './routingService';
import { hereTrafficService, TrafficIncident, CriticalityLevel } from './hereTrafficService';
import { locationTrackingService } from '@/shared/services/locationTrackingService';

/**
 * Estados de navegación
 */
export enum NavigationStatus {
  IDLE = 'IDLE',
  CALCULATING = 'CALCULATING',
  NAVIGATING = 'NAVIGATING',
  RECALCULATING = 'RECALCULATING',
  OFF_ROUTE = 'OFF_ROUTE',
  ARRIVED = 'ARRIVED',
  CANCELLED = 'CANCELLED',
}

/**
 * Tipo de maniobra
 */
export enum ManeuverType {
  DEPART = 'DEPART',
  ARRIVE = 'ARRIVE',
  TURN_LEFT = 'TURN_LEFT',
  TURN_RIGHT = 'TURN_RIGHT',
  CONTINUE = 'CONTINUE',
  UTURN = 'UTURN',
  ROUNDABOUT = 'ROUNDABOUT',
  HIGHWAY_ENTER = 'HIGHWAY_ENTER',
  HIGHWAY_EXIT = 'HIGHWAY_EXIT',
}

/**
 * Instrucción de navegación
 */
export interface NavigationInstruction {
  index: number;
  maneuver: ManeuverType;
  instruction: string;
  distance: number; // Distancia hasta esta maniobra en metros
  duration: number; // Tiempo estimado en segundos
  roadName?: string;
  location: Ubicacion;
}

/**
 * Estado actual de navegación
 */
export interface NavigationState {
  status: NavigationStatus;
  currentRoute: RutaOptima | null;
  destination: Ubicacion | null;
  currentLocation: Ubicacion | null;
  currentInstruction: NavigationInstruction | null;
  nextInstruction: NavigationInstruction | null;
  distanceToNextManeuver: number; // metros
  distanceRemaining: number; // metros
  durationRemaining: number; // segundos
  eta: Date | null;
  currentSpeed: number; // km/h
  speedLimit?: number; // km/h
  isOffRoute: boolean;
  needsReroute: boolean;
  trafficIncidents: TrafficIncident[];
  deviationRecommended: boolean;
  deviationReason?: string;
}

/**
 * Opciones de navegación
 */
export interface NavigationOptions {
  autoReroute?: boolean; // Recalcular ruta automáticamente (default: true)
  offRouteThreshold?: number; // Metros para considerar fuera de ruta (default: 50)
  checkTrafficInterval?: number; // Intervalo para verificar tráfico en ms (default: 60000)
  arrivalThreshold?: number; // Metros para considerar llegada (default: 20)
  voiceGuidance?: boolean; // Activar guía de voz (default: false)
  speedLimitWarning?: boolean; // Alertar exceso de velocidad (default: false)
}

/**
 * Callback para eventos de navegación
 */
export type NavigationEventCallback = (state: NavigationState) => void;

class HereNavigationService {
  private navigationState$ = new BehaviorSubject<NavigationState>(this.getInitialState());
  private positionSubscription: Subscription | null = null;
  private trafficCheckSubscription: Subscription | null = null;
  private options: Required<NavigationOptions>;
  private eventCallbacks: NavigationEventCallback[] = [];

  constructor() {
    this.options = {
      autoReroute: true,
      offRouteThreshold: 50,
      checkTrafficInterval: 60000, // 1 minuto
      arrivalThreshold: 20,
      voiceGuidance: false,
      speedLimitWarning: false,
    };
  }

  /**
   * Iniciar navegación a un destino
   */
  async startNavigation(
    destination: Ubicacion,
    options?: NavigationOptions
  ): Promise<void> {
    try {
      // Actualizar opciones
      if (options) {
        this.options = { ...this.options, ...options };
      }

      // Actualizar estado a calculando
      this.updateState({
        status: NavigationStatus.CALCULATING,
        destination,
      });

      console.log('[HereNavigationService] 🧭 Iniciando navegación...');

      // Obtener ubicación actual
      const currentLocation = await locationTrackingService.getCurrentLocation();
      if (!currentLocation) {
        throw new Error('No se pudo obtener ubicación actual');
      }

      const origin: Ubicacion = {
        latitude: currentLocation.coordinates.latitude,
        longitude: currentLocation.coordinates.longitude,
      };

      // Calcular ruta inicial
      const route = await routingService.obtenerRutaOptima(origin, destination);

      // Extraer instrucciones
      const instructions = this.extractInstructions(route);

      // Actualizar estado
      this.updateState({
        status: NavigationStatus.NAVIGATING,
        currentRoute: route,
        currentLocation: origin,
        currentInstruction: instructions[0] || null,
        nextInstruction: instructions[1] || null,
        distanceRemaining: route.distance,
        durationRemaining: route.duration,
        eta: route.estimatedArrival,
        isOffRoute: false,
        needsReroute: false,
      });

      // Iniciar seguimiento de posición
      this.startPositionTracking();

      // Iniciar verificación de tráfico
      this.startTrafficMonitoring();

      console.log('[HereNavigationService] ✅ Navegación iniciada');
      
      this.notifyEventCallbacks();
    } catch (error) {
      console.error('[HereNavigationService] Error iniciando navegación:', error);
      this.updateState({
        status: NavigationStatus.IDLE,
      });
      throw error;
    }
  }

  /**
   * Detener navegación
   */
  stopNavigation(): void {
    console.log('[HereNavigationService] 🛑 Deteniendo navegación');

    // Detener suscripciones
    if (this.positionSubscription) {
      this.positionSubscription.unsubscribe();
      this.positionSubscription = null;
    }

    if (this.trafficCheckSubscription) {
      this.trafficCheckSubscription.unsubscribe();
      this.trafficCheckSubscription = null;
    }

    // Limpiar estado
    this.navigationState$.next(this.getInitialState());
    
    this.notifyEventCallbacks();
  }

  /**
   * Obtener estado de navegación como Observable
   */
  getNavigationState$(): Observable<NavigationState> {
    return this.navigationState$.asObservable();
  }

  /**
   * Obtener estado actual de navegación
   */
  getCurrentState(): NavigationState {
    return this.navigationState$.value;
  }

  /**
   * Suscribirse a eventos de navegación
   */
  onNavigationEvent(callback: NavigationEventCallback): () => void {
    this.eventCallbacks.push(callback);
    
    // Retornar función para desuscribirse
    return () => {
      const index = this.eventCallbacks.indexOf(callback);
      if (index > -1) {
        this.eventCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Forzar recalculación de ruta
   */
  async recalculateRoute(): Promise<void> {
    const state = this.navigationState$.value;

    if (!state.destination || !state.currentLocation) {
      console.warn('[HereNavigationService] No hay ruta activa para recalcular');
      return;
    }

    this.updateState({ status: NavigationStatus.RECALCULATING });

    try {
      const newRoute = await routingService.obtenerRutaOptima(
        state.currentLocation,
        state.destination
      );

      const instructions = this.extractInstructions(newRoute);

      this.updateState({
        status: NavigationStatus.NAVIGATING,
        currentRoute: newRoute,
        currentInstruction: instructions[0] || null,
        nextInstruction: instructions[1] || null,
        distanceRemaining: newRoute.distance,
        durationRemaining: newRoute.duration,
        eta: newRoute.estimatedArrival,
        isOffRoute: false,
        needsReroute: false,
      });

      console.log('[HereNavigationService] ✅ Ruta recalculada');
      
      this.notifyEventCallbacks();
    } catch (error) {
      console.error('[HereNavigationService] Error recalculando ruta:', error);
      this.updateState({ status: NavigationStatus.NAVIGATING });
    }
  }

  /**
   * Iniciar seguimiento de posición
   */
  private startPositionTracking(): void {
    // Actualizar posición cada segundo
    this.positionSubscription = interval(1000).subscribe(async () => {
      await this.updatePosition();
    });
  }

  /**
   * Iniciar monitoreo de tráfico
   */
  private startTrafficMonitoring(): void {
    // Verificar tráfico periódicamente
    this.trafficCheckSubscription = interval(this.options.checkTrafficInterval).subscribe(
      async () => {
        await this.checkTrafficIncidents();
      }
    );

    // Verificar inmediatamente
    this.checkTrafficIncidents();
  }

  /**
   * Actualizar posición y estado de navegación
   */
  private async updatePosition(): Promise<void> {
    const state = this.navigationState$.value;

    if (state.status !== NavigationStatus.NAVIGATING) {
      return;
    }

    try {
      // Obtener ubicación actual
      const location = await locationTrackingService.getCurrentLocation();
      if (!location) return;

      const currentLocation: Ubicacion = {
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
      };

      // Verificar si llegamos al destino
      if (state.destination) {
        const distanceToDestination = this.calculateDistance(
          currentLocation,
          state.destination
        );

        if (distanceToDestination <= this.options.arrivalThreshold) {
          this.handleArrival();
          return;
        }
      }

      // Verificar si estamos fuera de ruta
      const isOffRoute = this.checkIfOffRoute(currentLocation, state.currentRoute);

      if (isOffRoute && !state.isOffRoute) {
        console.log('[HereNavigationService] ⚠️ Fuera de ruta detectado');
        this.updateState({ isOffRoute: true, needsReroute: true });
        
        if (this.options.autoReroute) {
          await this.recalculateRoute();
        }
        
        this.notifyEventCallbacks();
        return;
      }

      // Actualizar distancia a próxima maniobra
      const distanceToNextManeuver = this.calculateDistanceToNextManeuver(
        currentLocation,
        state.currentInstruction
      );

      // Verificar si debemos avanzar a la siguiente instrucción
      const shouldAdvanceInstruction = distanceToNextManeuver < 30; // 30 metros antes

      let updates: Partial<NavigationState> = {
        currentLocation,
        distanceToNextManeuver,
        currentSpeed: location.speed || 0,
      };

      if (shouldAdvanceInstruction && state.currentRoute) {
        const instructions = this.extractInstructions(state.currentRoute);
        const currentIndex = state.currentInstruction?.index || 0;
        const nextIndex = currentIndex + 1;

        if (nextIndex < instructions.length) {
          updates = {
            ...updates,
            currentInstruction: instructions[nextIndex],
            nextInstruction: instructions[nextIndex + 1] || null,
          };
        }
      }

      this.updateState(updates);
    } catch (error) {
      console.error('[HereNavigationService] Error actualizando posición:', error);
    }
  }

  /**
   * Verificar incidentes de tráfico en la ruta
   */
  private async checkTrafficIncidents(): Promise<void> {
    const state = this.navigationState$.value;

    if (!state.currentRoute || state.status !== NavigationStatus.NAVIGATING) {
      return;
    }

    try {
      const recommendation = await hereTrafficService.getRouteDeviationRecommendation(
        state.currentRoute.coordinates,
        state.destination!
      );

      this.updateState({
        trafficIncidents: recommendation.incidents || [],
        deviationRecommended: recommendation.shouldDeviate,
        deviationReason: recommendation.reason,
      });

      if (recommendation.shouldDeviate) {
        console.log(
          `[HereNavigationService] 🚨 Desvío recomendado: ${recommendation.reason}`
        );
        this.notifyEventCallbacks();
      }
    } catch (error) {
      console.error('[HereNavigationService] Error verificando tráfico:', error);
    }
  }

  /**
   * Verificar si estamos fuera de ruta
   */
  private checkIfOffRoute(
    currentLocation: Ubicacion,
    route: RutaOptima | null
  ): boolean {
    if (!route || route.coordinates.length === 0) {
      return false;
    }

    const distanceFromRoute = this.calculateDistanceFromRoute(
      currentLocation,
      route.coordinates
    );

    return distanceFromRoute > this.options.offRouteThreshold;
  }

  /**
   * Calcular distancia de un punto a la ruta
   */
  private calculateDistanceFromRoute(
    point: Ubicacion,
    routeCoordinates: Ubicacion[]
  ): number {
    let minDistance = Infinity;

    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const segmentStart = routeCoordinates[i];
      const segmentEnd = routeCoordinates[i + 1];

      const distance = this.pointToSegmentDistance(point, segmentStart, segmentEnd);

      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    return minDistance;
  }

  /**
   * Calcular distancia de un punto a un segmento
   */
  private pointToSegmentDistance(
    point: Ubicacion,
    segmentStart: Ubicacion,
    segmentEnd: Ubicacion
  ): number {
    // Simplificación: distancia al punto más cercano
    const distToStart = this.calculateDistance(point, segmentStart);
    const distToEnd = this.calculateDistance(point, segmentEnd);

    return Math.min(distToStart, distToEnd);
  }

  /**
   * Calcular distancia a próxima maniobra
   */
  private calculateDistanceToNextManeuver(
    currentLocation: Ubicacion,
    instruction: NavigationInstruction | null
  ): number {
    if (!instruction) {
      return 0;
    }

    return this.calculateDistance(currentLocation, instruction.location);
  }

  /**
   * Calcular distancia entre dos puntos usando Haversine
   */
  private calculateDistance(point1: Ubicacion, point2: Ubicacion): number {
    const R = 6371000; // Radio de la Tierra en metros
    const lat1Rad = (point1.latitude * Math.PI) / 180;
    const lat2Rad = (point2.latitude * Math.PI) / 180;
    const deltaLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const deltaLng = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Extraer instrucciones de navegación de una ruta
   */
  private extractInstructions(route: RutaOptima): NavigationInstruction[] {
    const instructions: NavigationInstruction[] = [];

    // Primera instrucción: Salida
    if (route.coordinates.length > 0) {
      instructions.push({
        index: 0,
        maneuver: ManeuverType.DEPART,
        instruction: route.instructions[0] || 'Iniciar ruta',
        distance: 0,
        duration: 0,
        location: route.coordinates[0],
      });
    }

    // Instrucciones intermedias (simplificado)
    for (let i = 1; i < route.instructions.length - 1; i++) {
      const coordIndex = Math.floor(
        (i / route.instructions.length) * route.coordinates.length
      );

      instructions.push({
        index: i,
        maneuver: ManeuverType.CONTINUE,
        instruction: route.instructions[i],
        distance: (route.distance * i) / route.instructions.length,
        duration: (route.duration * i) / route.instructions.length,
        location: route.coordinates[coordIndex] || route.coordinates[0],
      });
    }

    // Última instrucción: Llegada
    if (route.coordinates.length > 0) {
      instructions.push({
        index: instructions.length,
        maneuver: ManeuverType.ARRIVE,
        instruction: 'Ha llegado a su destino',
        distance: route.distance,
        duration: route.duration,
        location: route.coordinates[route.coordinates.length - 1],
      });
    }

    return instructions;
  }

  /**
   * Manejar llegada al destino
   */
  private handleArrival(): void {
    console.log('[HereNavigationService] 🎉 Llegada al destino');

    this.updateState({
      status: NavigationStatus.ARRIVED,
      distanceRemaining: 0,
      durationRemaining: 0,
    });

    this.notifyEventCallbacks();

    // Detener navegación
    setTimeout(() => {
      this.stopNavigation();
    }, 3000);
  }

  /**
   * Actualizar estado
   */
  private updateState(updates: Partial<NavigationState>): void {
    const currentState = this.navigationState$.value;
    this.navigationState$.next({
      ...currentState,
      ...updates,
    });
  }

  /**
   * Notificar a callbacks de eventos
   */
  private notifyEventCallbacks(): void {
    const state = this.navigationState$.value;
    this.eventCallbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('[HereNavigationService] Error en callback:', error);
      }
    });
  }

  /**
   * Obtener estado inicial
   */
  private getInitialState(): NavigationState {
    return {
      status: NavigationStatus.IDLE,
      currentRoute: null,
      destination: null,
      currentLocation: null,
      currentInstruction: null,
      nextInstruction: null,
      distanceToNextManeuver: 0,
      distanceRemaining: 0,
      durationRemaining: 0,
      eta: null,
      currentSpeed: 0,
      isOffRoute: false,
      needsReroute: false,
      trafficIncidents: [],
      deviationRecommended: false,
    };
  }
}

export const hereNavigationService = new HereNavigationService();
