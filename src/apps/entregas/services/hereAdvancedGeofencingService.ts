/**
 * 🎯 HERE Advanced Geofencing Service (SIMULADO)
 * 
 * Servicio simulado para geofencing avanzado con soporte para múltiples tipos de geocercas,
 * análisis de tiempo en zonas, y monitoreo server-side.
 * 
 * NOTA: Este es un servicio SIMULADO que no realiza llamadas reales a la API de HERE Maps.
 * Los datos son generados localmente para permitir testing y desarrollo sin backend.
 * 
 * Documentación HERE Geofencing:
 * https://developer.here.com/documentation/geofencing/dev_guide/index.html
 */

import { config } from '@/shared/config/environments';

/**
 * Tipo de geocerca
 */
export enum GeofenceType {
  CIRCULAR = 'circular',
  POLYGON = 'polygon',
  CORRIDOR = 'corridor', // Ruta con buffer
}

/**
 * Evento de geocerca
 */
export enum GeofenceEventType {
  ENTER = 'enter',
  EXIT = 'exit',
  DWELL = 'dwell', // Permanencia por tiempo
  APPROACH = 'approach', // Acercamiento
}

/**
 * Geocerca circular
 */
export interface CircularGeofence {
  id: string;
  name: string;
  type: GeofenceType.CIRCULAR;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // metros
  metadata?: Record<string, any>;
}

/**
 * Geocerca poligonal
 */
export interface PolygonGeofence {
  id: string;
  name: string;
  type: GeofenceType.POLYGON;
  vertices: Array<{
    latitude: number;
    longitude: number;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Geocerca de corredor (ruta con buffer)
 */
export interface CorridorGeofence {
  id: string;
  name: string;
  type: GeofenceType.CORRIDOR;
  route: Array<{
    latitude: number;
    longitude: number;
  }>;
  bufferRadius: number; // metros del buffer a cada lado de la ruta
  metadata?: Record<string, any>;
}

/**
 * Unión de todos los tipos de geocercas
 */
export type Geofence = CircularGeofence | PolygonGeofence | CorridorGeofence;

/**
 * Capa de geocercas (para organizar múltiples geocercas)
 */
export interface GeofenceLayer {
  id: string;
  name: string;
  description?: string;
  geofences: Geofence[];
  isActive: boolean;
}

/**
 * Evento de geocerca
 */
export interface GeofenceEvent {
  id: string;
  timestamp: Date;
  geofenceId: string;
  geofenceName: string;
  eventType: GeofenceEventType;
  location: {
    latitude: number;
    longitude: number;
  };
  entityId: string; // ID del vehículo/conductor
  entityName?: string;
  metadata?: Record<string, any>;
}

/**
 * Estadísticas de tiempo en geocerca
 */
export interface GeofenceTimeStats {
  geofenceId: string;
  geofenceName: string;
  entityId: string;
  totalTimeInside: number; // segundos
  visits: number;
  lastEntry?: Date;
  lastExit?: Date;
  averageVisitDuration: number; // segundos
}

/**
 * Resultado de verificación de posición
 */
export interface GeofenceCheckResult {
  isInside: boolean;
  geofence?: Geofence;
  distance?: number; // metros (solo para circular)
  closestPoint?: {
    // punto más cercano de la geocerca
    latitude: number;
    longitude: number;
  };
}

class HereAdvancedGeofencingService {
  private readonly API_KEY = config.hereMapsApiKey || '';
  
  // Simulación de almacenamiento local de eventos
  private eventHistory: Map<string, GeofenceEvent[]> = new Map();
  private timeStats: Map<string, GeofenceTimeStats> = new Map();

  /**
   * Simula creación de capa de geocercas
   */
  async createGeofenceLayer(
    name: string,
    geofences: Geofence[]
  ): Promise<GeofenceLayer> {
    console.log(`[HereAdvancedGeofencing] 🎯 Creando capa de geocercas: ${name} con ${geofences.length} geocercas...`);

    await this.simulateDelay(300, 500);

    const layer: GeofenceLayer = {
      id: `layer-${Date.now()}`,
      name,
      geofences,
      isActive: true,
    };

    console.log(`[HereAdvancedGeofencing] ✅ Capa creada: ${layer.id}`);

    return layer;
  }

  /**
   * Simula verificación de si una ubicación está dentro de una geocerca
   */
  async checkGeofence(
    location: { latitude: number; longitude: number },
    geofence: Geofence
  ): Promise<GeofenceCheckResult> {
    await this.simulateDelay(50, 100);

    switch (geofence.type) {
      case GeofenceType.CIRCULAR:
        return this.checkCircularGeofence(location, geofence);
      case GeofenceType.POLYGON:
        return this.checkPolygonGeofence(location, geofence);
      case GeofenceType.CORRIDOR:
        return this.checkCorridorGeofence(location, geofence);
    }
  }

  /**
   * Simula verificación de ubicación en múltiples geocercas
   */
  async checkMultipleGeofences(
    location: { latitude: number; longitude: number },
    geofences: Geofence[]
  ): Promise<{
    inside: Geofence[];
    outside: Geofence[];
    nearest?: {
      geofence: Geofence;
      distance: number;
    };
  }> {
    console.log(
      `[HereAdvancedGeofencing] 📍 Verificando ubicación en ${geofences.length} geocercas...`
    );

    await this.simulateDelay(100, 300);

    const inside: Geofence[] = [];
    const outside: Geofence[] = [];
    let nearestDistance = Infinity;
    let nearestGeofence: Geofence | undefined;

    for (const geofence of geofences) {
      const result = await this.checkGeofence(location, geofence);

      if (result.isInside) {
        inside.push(geofence);
      } else {
        outside.push(geofence);

        if (result.distance !== undefined && result.distance < nearestDistance) {
          nearestDistance = result.distance;
          nearestGeofence = geofence;
        }
      }
    }

    console.log(
      `[HereAdvancedGeofencing] ✅ Dentro de ${inside.length}, fuera de ${outside.length} geocercas`
    );

    return {
      inside,
      outside,
      nearest: nearestGeofence
        ? { geofence: nearestGeofence, distance: nearestDistance }
        : undefined,
    };
  }

  /**
   * Simula registro de evento de geocerca
   */
  async recordGeofenceEvent(
    geofence: Geofence,
    eventType: GeofenceEventType,
    location: { latitude: number; longitude: number },
    entityId: string,
    entityName?: string
  ): Promise<GeofenceEvent> {
    console.log(
      `[HereAdvancedGeofencing] 📝 Registrando evento: ${entityName || entityId} ${eventType} ${geofence.name}`
    );

    await this.simulateDelay(100, 200);

    const event: GeofenceEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      geofenceId: geofence.id,
      geofenceName: geofence.name,
      eventType,
      location,
      entityId,
      entityName,
      metadata: geofence.metadata,
    };

    // Almacenar en historial
    const entityEvents = this.eventHistory.get(entityId) || [];
    entityEvents.push(event);
    this.eventHistory.set(entityId, entityEvents);

    // Actualizar estadísticas de tiempo
    if (eventType === GeofenceEventType.ENTER || eventType === GeofenceEventType.EXIT) {
      this.updateTimeStats(event);
    }

    console.log(`[HereAdvancedGeofencing] ✅ Evento registrado: ${event.id}`);

    return event;
  }

  /**
   * Simula obtención de eventos de una entidad
   */
  async getEntityEvents(
    entityId: string,
    options: {
      geofenceId?: string;
      eventType?: GeofenceEventType;
      startTime?: Date;
      endTime?: Date;
      limit?: number;
    } = {}
  ): Promise<GeofenceEvent[]> {
    console.log(`[HereAdvancedGeofencing] 📜 Obteniendo eventos para entidad ${entityId}...`);

    await this.simulateDelay(200, 400);

    let events = this.eventHistory.get(entityId) || [];

    // Aplicar filtros
    if (options.geofenceId) {
      events = events.filter(e => e.geofenceId === options.geofenceId);
    }

    if (options.eventType) {
      events = events.filter(e => e.eventType === options.eventType);
    }

    if (options.startTime) {
      events = events.filter(e => e.timestamp >= options.startTime!);
    }

    if (options.endTime) {
      events = events.filter(e => e.timestamp <= options.endTime!);
    }

    // Ordenar por timestamp descendente
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Limitar resultados
    if (options.limit) {
      events = events.slice(0, options.limit);
    }

    console.log(`[HereAdvancedGeofencing] ✅ ${events.length} eventos encontrados`);

    return events;
  }

  /**
   * Simula obtención de estadísticas de tiempo en geocercas
   */
  async getTimeStats(
    entityId?: string,
    geofenceId?: string
  ): Promise<GeofenceTimeStats[]> {
    console.log(`[HereAdvancedGeofencing] 📊 Obteniendo estadísticas de tiempo...`);

    await this.simulateDelay(200, 400);

    let stats = Array.from(this.timeStats.values());

    if (entityId) {
      stats = stats.filter(s => s.entityId === entityId);
    }

    if (geofenceId) {
      stats = stats.filter(s => s.geofenceId === geofenceId);
    }

    console.log(`[HereAdvancedGeofencing] ✅ ${stats.length} estadísticas encontradas`);

    return stats;
  }

  /**
   * Simula análisis de geocercas visitadas por una entidad
   */
  async analyzeGeofenceVisits(
    entityId: string,
    period: {
      start: Date;
      end: Date;
    }
  ): Promise<{
    totalVisits: number;
    uniqueGeofences: number;
    totalTimeInGeofences: number; // segundos
    mostVisited: Array<{
      geofence: string;
      visits: number;
      totalTime: number;
    }>;
    visitsByHour: Array<{ hour: number; visits: number }>;
  }> {
    console.log(`[HereAdvancedGeofencing] 📊 Analizando visitas de ${entityId}...`);

    await this.simulateDelay(400, 600);

    const events = await this.getEntityEvents(entityId, {
      startTime: period.start,
      endTime: period.end,
    });

    // Contar visitas por geocerca
    const visitCounts = new Map<string, number>();
    const timeCounts = new Map<string, number>();

    events.forEach(event => {
      if (event.eventType === GeofenceEventType.ENTER) {
        visitCounts.set(
          event.geofenceName,
          (visitCounts.get(event.geofenceName) || 0) + 1
        );
      }
    });

    // Calcular tiempo en cada geocerca
    const stats = await this.getTimeStats(entityId);
    stats.forEach(stat => {
      timeCounts.set(stat.geofenceName, stat.totalTimeInside);
    });

    // Geocercas más visitadas
    const mostVisited = Array.from(visitCounts.entries())
      .map(([geofence, visits]) => ({
        geofence,
        visits,
        totalTime: timeCounts.get(geofence) || 0,
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    // Visitas por hora
    const visitsByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      visits: events.filter(e => e.timestamp.getHours() === hour).length,
    }));

    const analysis = {
      totalVisits: events.filter(e => e.eventType === GeofenceEventType.ENTER).length,
      uniqueGeofences: visitCounts.size,
      totalTimeInGeofences: Array.from(timeCounts.values()).reduce(
        (sum, time) => sum + time,
        0
      ),
      mostVisited,
      visitsByHour,
    };

    console.log(
      `[HereAdvancedGeofencing] ✅ Análisis completo: ${analysis.totalVisits} visitas, ${analysis.uniqueGeofences} geocercas únicas`
    );

    return analysis;
  }

  /**
   * Simula generación de geocercas dinámicas alrededor de puntos
   */
  async generateDynamicGeofences(
    points: Array<{ latitude: number; longitude: number; name: string }>,
    radius: number = 200
  ): Promise<CircularGeofence[]> {
    console.log(
      `[HereAdvancedGeofencing] 🎯 Generando ${points.length} geocercas dinámicas con radio ${radius}m...`
    );

    await this.simulateDelay(300, 500);

    const geofences: CircularGeofence[] = points.map((point, index) => ({
      id: `dynamic-${Date.now()}-${index}`,
      name: point.name,
      type: GeofenceType.CIRCULAR,
      center: {
        latitude: point.latitude,
        longitude: point.longitude,
      },
      radius,
      metadata: {
        dynamic: true,
        generatedAt: new Date().toISOString(),
      },
    }));

    console.log(`[HereAdvancedGeofencing] ✅ ${geofences.length} geocercas generadas`);

    return geofences;
  }

  /**
   * Verifica geocerca circular
   */
  private checkCircularGeofence(
    location: { latitude: number; longitude: number },
    geofence: CircularGeofence
  ): GeofenceCheckResult {
    const distance = this.calculateDistance(location, geofence.center);
    const isInside = distance <= geofence.radius;

    return {
      isInside,
      geofence,
      distance,
      closestPoint: geofence.center,
    };
  }

  /**
   * Verifica geocerca poligonal
   */
  private checkPolygonGeofence(
    location: { latitude: number; longitude: number },
    geofence: PolygonGeofence
  ): GeofenceCheckResult {
    // Algoritmo ray-casting para punto en polígono
    const { latitude, longitude } = location;
    let inside = false;

    const vertices = geofence.vertices;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].latitude;
      const yi = vertices[i].longitude;
      const xj = vertices[j].latitude;
      const yj = vertices[j].longitude;

      const intersect =
        yi > longitude !== yj > longitude &&
        latitude < ((xj - xi) * (longitude - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return {
      isInside: inside,
      geofence,
    };
  }

  /**
   * Verifica geocerca de corredor
   */
  private checkCorridorGeofence(
    location: { latitude: number; longitude: number },
    geofence: CorridorGeofence
  ): GeofenceCheckResult {
    // Calcular distancia mínima al corredor
    let minDistance = Infinity;

    for (let i = 0; i < geofence.route.length - 1; i++) {
      const segmentStart = geofence.route[i];
      const segmentEnd = geofence.route[i + 1];

      const distance = this.pointToSegmentDistance(
        location,
        segmentStart,
        segmentEnd
      );

      minDistance = Math.min(minDistance, distance);
    }

    const isInside = minDistance <= geofence.bufferRadius;

    return {
      isInside,
      geofence,
      distance: minDistance,
    };
  }

  /**
   * Actualiza estadísticas de tiempo en geocerca
   */
  private updateTimeStats(event: GeofenceEvent): void {
    const statsKey = `${event.entityId}-${event.geofenceId}`;
    let stats = this.timeStats.get(statsKey);

    if (!stats) {
      stats = {
        geofenceId: event.geofenceId,
        geofenceName: event.geofenceName,
        entityId: event.entityId,
        totalTimeInside: 0,
        visits: 0,
        averageVisitDuration: 0,
      };
      this.timeStats.set(statsKey, stats);
    }

    if (event.eventType === GeofenceEventType.ENTER) {
      stats.visits += 1;
      stats.lastEntry = event.timestamp;
    } else if (event.eventType === GeofenceEventType.EXIT && stats.lastEntry) {
      const duration =
        (event.timestamp.getTime() - stats.lastEntry.getTime()) / 1000;
      stats.totalTimeInside += duration;
      stats.averageVisitDuration = stats.totalTimeInside / stats.visits;
      stats.lastExit = event.timestamp;
    }
  }

  /**
   * Calcula distancia de punto a segmento de línea
   */
  private pointToSegmentDistance(
    point: { latitude: number; longitude: number },
    segmentStart: { latitude: number; longitude: number },
    segmentEnd: { latitude: number; longitude: number }
  ): number {
    // Simplificación: usar distancia al punto más cercano del segmento
    const distToStart = this.calculateDistance(point, segmentStart);
    const distToEnd = this.calculateDistance(point, segmentEnd);

    return Math.min(distToStart, distToEnd);
  }

  /**
   * Calcula distancia usando fórmula Haversine
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
   * Simula delay de red
   */
  private simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

export const hereAdvancedGeofencingService = new HereAdvancedGeofencingService();
