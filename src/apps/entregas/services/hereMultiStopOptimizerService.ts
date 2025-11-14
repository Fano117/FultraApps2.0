/**
 * 🗺️ HERE Multi-Stop Route Optimizer Service
 * 
 * Servicio para optimizar rutas con múltiples paradas usando HERE Routing API.
 * Encuentra el orden óptimo de entregas considerando distancia, tiempo y tráfico.
 * 
 * Documentación: https://developer.here.com/documentation/routing-api/dev_guide/index.html
 */

import { config } from '@/shared/config/environments';
import * as flexpolyline from '@here/flexpolyline';

/**
 * Punto de parada/destino
 */
export interface Waypoint {
  id: string;
  latitude: number;
  longitude: number;
  nombre: string;
  prioridad?: number; // 1-10 (10 = máxima prioridad)
  ventanaInicio?: Date; // Ventana de tiempo de entrega
  ventanaFin?: Date;
  tiempoServicio?: number; // Tiempo estimado de servicio en minutos
  notas?: string;
}

/**
 * Opciones de optimización
 */
export interface RouteOptimizationOptions {
  transportMode?: 'car' | 'truck' | 'pedestrian'; // Modo de transporte
  routingMode?: 'fast' | 'short' | 'balanced'; // Tipo de optimización
  considerTraffic?: boolean; // Considerar tráfico en tiempo real
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  avoidFerries?: boolean;
  // Restricciones de vehículo (para truck)
  vehicleWeight?: number; // Toneladas
  vehicleHeight?: number; // Metros
  vehicleWidth?: number; // Metros
  vehicleLength?: number; // Metros
}

/**
 * Ruta optimizada con múltiples paradas
 */
export interface OptimizedMultiStopRoute {
  waypointsOrder: string[]; // IDs de waypoints en orden óptimo
  waypoints: Waypoint[]; // Waypoints ordenados
  totalDistance: number; // Distancia total en metros
  totalDuration: number; // Tiempo total en segundos
  estimatedArrival: Date; // Hora estimada de finalización
  segments: RouteSegment[]; // Segmentos entre paradas
  coordinates: Array<{ latitude: number; longitude: number }>; // Polyline completa
  instructions: string[]; // Todas las instrucciones
}

/**
 * Segmento de ruta entre dos paradas
 */
export interface RouteSegment {
  from: string; // ID del waypoint origen
  to: string; // ID del waypoint destino
  distance: number; // Metros
  duration: number; // Segundos
  estimatedArrival: Date;
  coordinates: Array<{ latitude: number; longitude: number }>;
  instructions: string[];
}

class HereMultiStopOptimizerService {
  private readonly API_KEY = config.hereMapsApiKey || '';
  private readonly ROUTING_API_BASE = 'https://router.hereapi.com/v8';

  /**
   * Optimizar ruta con múltiples paradas
   * Encuentra el mejor orden para visitar todos los waypoints
   */
  async optimizeMultiStopRoute(
    origin: { latitude: number; longitude: number },
    waypoints: Waypoint[],
    options: RouteOptimizationOptions = {}
  ): Promise<OptimizedMultiStopRoute> {
    try {
      if (waypoints.length === 0) {
        throw new Error('Debe proporcionar al menos un waypoint');
      }

      console.log(
        `[HereMultiStopOptimizer] 🔄 Optimizando ruta con ${waypoints.length} paradas...`
      );

      // Si solo hay un waypoint, no necesitamos optimizar
      if (waypoints.length === 1) {
        return await this.calculateSimpleRoute(origin, waypoints, options);
      }

      // Para múltiples waypoints, calcular ruta optimizada
      // Estrategia: Usar algoritmo de vecino más cercano (Nearest Neighbor)
      const optimizedOrder = this.optimizeWaypointOrder(origin, waypoints);

      // Calcular ruta con el orden optimizado
      return await this.calculateOptimizedRoute(origin, optimizedOrder, options);
    } catch (error) {
      console.error('[HereMultiStopOptimizer] Error optimizando ruta:', error);
      throw error;
    }
  }

  /**
   * Calcular ruta con orden específico de waypoints
   */
  async calculateRouteWithOrder(
    origin: { latitude: number; longitude: number },
    waypointsInOrder: Waypoint[],
    options: RouteOptimizationOptions = {}
  ): Promise<OptimizedMultiStopRoute> {
    try {
      return await this.calculateOptimizedRoute(origin, waypointsInOrder, options);
    } catch (error) {
      console.error('[HereMultiStopOptimizer] Error calculando ruta:', error);
      throw error;
    }
  }

  /**
   * Optimizar orden de waypoints usando algoritmo de vecino más cercano
   */
  private optimizeWaypointOrder(
    origin: { latitude: number; longitude: number },
    waypoints: Waypoint[]
  ): Waypoint[] {
    // Separar waypoints con prioridad alta (deben ir primero)
    const highPriority = waypoints.filter(w => (w.prioridad || 0) >= 8);
    const normalPriority = waypoints.filter(w => (w.prioridad || 0) < 8);

    // Optimizar waypoints de prioridad normal
    const optimizedNormal = this.nearestNeighborOptimization(origin, normalPriority);

    // Combinar: primero alta prioridad, luego los optimizados
    return [...highPriority, ...optimizedNormal];
  }

  /**
   * Algoritmo de vecino más cercano para optimización
   */
  private nearestNeighborOptimization(
    start: { latitude: number; longitude: number },
    waypoints: Waypoint[]
  ): Waypoint[] {
    if (waypoints.length === 0) return [];

    const unvisited = [...waypoints];
    const route: Waypoint[] = [];
    let currentPosition = start;

    while (unvisited.length > 0) {
      // Encontrar waypoint más cercano
      let nearestIndex = 0;
      let minDistance = this.calculateDistance(currentPosition, unvisited[0]);

      for (let i = 1; i < unvisited.length; i++) {
        const distance = this.calculateDistance(currentPosition, unvisited[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }

      // Agregar waypoint más cercano a la ruta
      const nearest = unvisited.splice(nearestIndex, 1)[0];
      route.push(nearest);
      currentPosition = nearest;
    }

    return route;
  }

  /**
   * Calcular ruta simple con un solo waypoint
   */
  private async calculateSimpleRoute(
    origin: { latitude: number; longitude: number },
    waypoints: Waypoint[],
    options: RouteOptimizationOptions
  ): Promise<OptimizedMultiStopRoute> {
    const destination = waypoints[0];

    const url = this.buildRoutingUrl(
      origin,
      [destination],
      null, // Sin retorno al origen
      options
    );

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Routing API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No se encontró ruta');
    }

    const route = data.routes[0];
    const section = route.sections[0];
    const summary = section.summary;

    // Decodificar polyline
    const coordinates = this.decodePolyline(section.polyline);

    return {
      waypointsOrder: [destination.id],
      waypoints: [destination],
      totalDistance: summary.length,
      totalDuration: summary.duration,
      estimatedArrival: new Date(
        Date.now() + summary.duration * 1000 + (destination.tiempoServicio || 0) * 60000
      ),
      segments: [
        {
          from: 'origin',
          to: destination.id,
          distance: summary.length,
          duration: summary.duration,
          estimatedArrival: new Date(Date.now() + summary.duration * 1000),
          coordinates,
          instructions: this.extractInstructions(section),
        },
      ],
      coordinates,
      instructions: this.extractInstructions(section),
    };
  }

  /**
   * Calcular ruta optimizada con múltiples waypoints
   */
  private async calculateOptimizedRoute(
    origin: { latitude: number; longitude: number },
    waypoints: Waypoint[],
    options: RouteOptimizationOptions
  ): Promise<OptimizedMultiStopRoute> {
    const url = this.buildRoutingUrl(origin, waypoints, null, options);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Routing API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No se encontró ruta');
    }

    const route = data.routes[0];
    const segments: RouteSegment[] = [];
    const allCoordinates: Array<{ latitude: number; longitude: number }> = [];
    const allInstructions: string[] = [];

    let cumulativeDuration = 0;

    // Procesar cada sección (segmento entre paradas)
    route.sections.forEach((section: any, index: number) => {
      const summary = section.summary;
      const coordinates = this.decodePolyline(section.polyline);
      const instructions = this.extractInstructions(section);

      const fromWaypoint = index === 0 ? 'origin' : waypoints[index - 1].id;
      const toWaypoint = waypoints[index].id;

      segments.push({
        from: fromWaypoint,
        to: toWaypoint,
        distance: summary.length,
        duration: summary.duration,
        estimatedArrival: new Date(Date.now() + cumulativeDuration * 1000),
        coordinates,
        instructions,
      });

      allCoordinates.push(...coordinates);
      allInstructions.push(...instructions);

      cumulativeDuration += summary.duration;

      // Agregar tiempo de servicio
      if (waypoints[index].tiempoServicio) {
        cumulativeDuration += waypoints[index].tiempoServicio! * 60;
      }
    });

    // Calcular totales
    const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
    const serviceTime = waypoints.reduce((sum, wp) => sum + (wp.tiempoServicio || 0), 0) * 60;

    console.log(
      `[HereMultiStopOptimizer] ✅ Ruta optimizada: ${(totalDistance / 1000).toFixed(1)}km, ${Math.round(totalDuration / 60)}min + ${Math.round(serviceTime / 60)}min servicio`
    );

    return {
      waypointsOrder: waypoints.map(wp => wp.id),
      waypoints,
      totalDistance,
      totalDuration: totalDuration + serviceTime,
      estimatedArrival: new Date(Date.now() + (totalDuration + serviceTime) * 1000),
      segments,
      coordinates: allCoordinates,
      instructions: allInstructions,
    };
  }

  /**
   * Construir URL para Routing API
   */
  private buildRoutingUrl(
    origin: { latitude: number; longitude: number },
    waypoints: Waypoint[],
    returnToOrigin: { latitude: number; longitude: number } | null,
    options: RouteOptimizationOptions
  ): string {
    const transportMode = options.transportMode || 'car';
    const routingMode = options.routingMode || 'fast';

    let url = `${this.ROUTING_API_BASE}/routes?`;

    // Origen
    url += `origin=${origin.latitude},${origin.longitude}&`;

    // Waypoints intermedios
    waypoints.forEach(wp => {
      url += `via=${wp.latitude},${wp.longitude}&`;
    });

    // Destino (último waypoint o retorno al origen)
    if (returnToOrigin) {
      url += `destination=${returnToOrigin.latitude},${returnToOrigin.longitude}&`;
    } else {
      // El destino es el último waypoint, eliminamos el último via
      url = url.replace(/&via=([^&]+)&$/, '&destination=$1&');
    }

    // Parámetros
    url += `transportMode=${transportMode}&`;
    url += `routingMode=${routingMode}&`;
    url += `return=summary,polyline,actions&`;

    // Tráfico en tiempo real
    if (options.considerTraffic !== false) {
      url += `departureTime=now&`;
    }

    // Evitar opciones
    const avoid: string[] = [];
    if (options.avoidHighways) avoid.push('controlledAccessHighway');
    if (options.avoidTolls) avoid.push('tollRoad');
    if (options.avoidFerries) avoid.push('ferry');
    if (avoid.length > 0) {
      url += `avoid[features]=${avoid.join(',')}&`;
    }

    // Restricciones de vehículo para camiones
    if (transportMode === 'truck') {
      if (options.vehicleWeight) {
        url += `truck[grossWeight]=${options.vehicleWeight * 1000}&`; // Convertir a kg
      }
      if (options.vehicleHeight) {
        url += `truck[height]=${options.vehicleHeight * 100}&`; // Convertir a cm
      }
      if (options.vehicleWidth) {
        url += `truck[width]=${options.vehicleWidth * 100}&`; // Convertir a cm
      }
      if (options.vehicleLength) {
        url += `truck[length]=${options.vehicleLength * 100}&`; // Convertir a cm
      }
    }

    url += `apikey=${this.API_KEY}`;

    return url;
  }

  /**
   * Decodificar polyline de HERE
   */
  private decodePolyline(
    polylineString: string
  ): Array<{ latitude: number; longitude: number }> {
    try {
      const decoded = flexpolyline.decode(polylineString);
      return decoded.polyline.map((point: number[]) => ({
        latitude: point[0],
        longitude: point[1],
      }));
    } catch (error) {
      console.error('[HereMultiStopOptimizer] Error decodificando polyline:', error);
      return [];
    }
  }

  /**
   * Extraer instrucciones de navegación
   */
  private extractInstructions(section: any): string[] {
    const instructions: string[] = [];

    if (section.actions) {
      section.actions.forEach((action: any) => {
        if (action.instruction) {
          instructions.push(action.instruction);
        }
      });
    }

    if (instructions.length === 0) {
      instructions.push('Continúe por la ruta');
    }

    return instructions;
  }

  /**
   * Calcular distancia entre dos puntos (Haversine)
   */
  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
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
   * Estimar tiempo total de ruta incluyendo servicio
   */
  estimateTotalTime(route: OptimizedMultiStopRoute): {
    drivingTime: number;
    serviceTime: number;
    totalTime: number;
  } {
    const drivingTime = route.totalDuration;
    const serviceTime =
      route.waypoints.reduce((sum, wp) => sum + (wp.tiempoServicio || 0), 0) * 60;
    const totalTime = drivingTime + serviceTime;

    return {
      drivingTime,
      serviceTime,
      totalTime,
    };
  }

  /**
   * Validar ventanas de tiempo
   */
  validateTimeWindows(route: OptimizedMultiStopRoute): {
    valid: boolean;
    violations: Array<{ waypointId: string; reason: string }>;
  } {
    const violations: Array<{ waypointId: string; reason: string }> = [];
    let cumulativeTime = 0;

    route.segments.forEach(segment => {
      cumulativeTime += segment.duration;

      const waypoint = route.waypoints.find(wp => wp.id === segment.to);
      if (!waypoint) return;

      const arrivalTime = new Date(Date.now() + cumulativeTime * 1000);

      if (waypoint.ventanaInicio && arrivalTime < waypoint.ventanaInicio) {
        violations.push({
          waypointId: waypoint.id,
          reason: `Llegada antes de ventana de inicio (${waypoint.ventanaInicio.toLocaleTimeString()})`,
        });
      }

      if (waypoint.ventanaFin && arrivalTime > waypoint.ventanaFin) {
        violations.push({
          waypointId: waypoint.id,
          reason: `Llegada después de ventana de fin (${waypoint.ventanaFin.toLocaleTimeString()})`,
        });
      }

      // Agregar tiempo de servicio
      if (waypoint.tiempoServicio) {
        cumulativeTime += waypoint.tiempoServicio * 60;
      }
    });

    return {
      valid: violations.length === 0,
      violations,
    };
  }
}

export const hereMultiStopOptimizerService = new HereMultiStopOptimizerService();
