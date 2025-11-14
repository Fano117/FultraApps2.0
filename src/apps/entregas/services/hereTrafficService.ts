/**
 * 🚦 HERE Traffic Service
 * 
 * Servicio para obtener información de tráfico en tiempo real usando HERE Traffic API v7
 * 
 * Documentación: https://developer.here.com/documentation/traffic-api/dev_guide/index.html
 * API Reference: https://developer.here.com/documentation/traffic-api/api-reference.html
 */

import { config } from '@/shared/config/environments';

/**
 * Tipos de incidentes de tráfico
 */
export enum TrafficIncidentType {
  ACCIDENT = 'ACCIDENT',
  CONGESTION = 'CONGESTION',
  DISABLED_VEHICLE = 'DISABLED_VEHICLE',
  ROAD_HAZARD = 'ROAD_HAZARD',
  CONSTRUCTION = 'CONSTRUCTION',
  PLANNED_EVENT = 'PLANNED_EVENT',
  MASS_TRANSIT = 'MASS_TRANSIT',
  OTHER_NEWS = 'OTHER_NEWS',
  WEATHER = 'WEATHER',
  MISC = 'MISC',
  ROAD_CLOSURE = 'ROAD_CLOSURE',
  LANE_RESTRICTION = 'LANE_RESTRICTION',
}

/**
 * Niveles de criticidad
 */
export enum CriticalityLevel {
  MINOR = 0,
  LOW = 1,
  MODERATE = 2,
  MAJOR = 3,
  CRITICAL = 4,
}

/**
 * Incidente de tráfico
 */
export interface TrafficIncident {
  id: string;
  type: TrafficIncidentType;
  criticality: CriticalityLevel;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  affectedRoads: string[];
  startTime: Date;
  endTime?: Date;
  verified: boolean;
  entryPoint?: {
    latitude: number;
    longitude: number;
  };
  exitPoint?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Información de flujo de tráfico
 */
export interface TrafficFlow {
  latitude: number;
  longitude: number;
  currentSpeed: number; // km/h
  freeFlowSpeed: number; // km/h
  jamFactor: number; // 0-10 (10 = completamente bloqueado)
  confidence: number; // 0-1
  roadName?: string;
}

/**
 * Bounding box para consultas
 */
export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Opciones para detectar incidentes en ruta
 */
export interface RouteIncidentOptions {
  routeCoordinates: Array<{ latitude: number; longitude: number }>;
  bufferMeters?: number; // Distancia de buffer alrededor de la ruta (default: 500m)
  minCriticality?: CriticalityLevel; // Criticidad mínima a reportar (default: MODERATE)
}

class HereTrafficService {
  private readonly API_KEY = config.hereMapsApiKey || '';
  private readonly TRAFFIC_API_BASE = 'https://data.traffic.hereapi.com/v7';
  
  /**
   * Obtener incidentes de tráfico en un área
   */
  async getTrafficIncidents(bbox: BoundingBox): Promise<TrafficIncident[]> {
    try {
      if (!this.API_KEY || this.API_KEY.length < 20) {
        console.warn('[HereTrafficService] API Key no configurada');
        return [];
      }

      const url = `${this.TRAFFIC_API_BASE}/incidents?` +
        `bbox=${bbox.west},${bbox.south},${bbox.east},${bbox.north}&` +
        `locationReferencing=shape&` +
        `apikey=${this.API_KEY}`;

      console.log('[HereTrafficService] Consultando incidentes de tráfico...');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Traffic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        console.log('[HereTrafficService] No se encontraron incidentes');
        return [];
      }

      const incidents = data.results.map((incident: any) => this.parseIncident(incident));
      
      console.log(`[HereTrafficService] ✅ ${incidents.length} incidentes encontrados`);
      
      return incidents;
    } catch (error) {
      console.error('[HereTrafficService] Error obteniendo incidentes:', error);
      return [];
    }
  }

  /**
   * Obtener flujo de tráfico en un área
   */
  async getTrafficFlow(bbox: BoundingBox): Promise<TrafficFlow[]> {
    try {
      if (!this.API_KEY || this.API_KEY.length < 20) {
        console.warn('[HereTrafficService] API Key no configurada');
        return [];
      }

      const url = `${this.TRAFFIC_API_BASE}/flow?` +
        `bbox=${bbox.west},${bbox.south},${bbox.east},${bbox.north}&` +
        `locationReferencing=shape&` +
        `apikey=${this.API_KEY}`;

      console.log('[HereTrafficService] Consultando flujo de tráfico...');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Traffic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        console.log('[HereTrafficService] No se encontró información de flujo');
        return [];
      }

      const flowData = data.results.map((flow: any) => this.parseTrafficFlow(flow));
      
      console.log(`[HereTrafficService] ✅ ${flowData.length} segmentos de flujo obtenidos`);
      
      return flowData;
    } catch (error) {
      console.error('[HereTrafficService] Error obteniendo flujo:', error);
      return [];
    }
  }

  /**
   * Detectar incidentes en una ruta específica
   */
  async detectIncidentsOnRoute(options: RouteIncidentOptions): Promise<TrafficIncident[]> {
    const bufferMeters = options.bufferMeters || 500;
    const minCriticality = options.minCriticality || CriticalityLevel.MODERATE;

    // Calcular bounding box de la ruta con buffer
    const bbox = this.calculateRouteBoundingBox(options.routeCoordinates, bufferMeters);

    // Obtener todos los incidentes en el área
    const allIncidents = await this.getTrafficIncidents(bbox);

    // Filtrar incidentes que realmente afectan la ruta
    const relevantIncidents = allIncidents.filter(incident => {
      // Filtrar por criticidad mínima
      if (incident.criticality < minCriticality) {
        return false;
      }

      // Verificar si el incidente está cerca de la ruta
      return this.isIncidentNearRoute(
        incident,
        options.routeCoordinates,
        bufferMeters
      );
    });

    console.log(
      `[HereTrafficService] ${relevantIncidents.length} incidentes afectan la ruta`
    );

    return relevantIncidents;
  }

  /**
   * Obtener recomendación de desvío si hay incidentes críticos
   */
  async getRouteDeviationRecommendation(
    routeCoordinates: Array<{ latitude: number; longitude: number }>,
    destination: { latitude: number; longitude: number }
  ): Promise<{
    shouldDeviate: boolean;
    reason?: string;
    incidents?: TrafficIncident[];
    alternativeNeeded?: boolean;
  }> {
    const incidents = await this.detectIncidentsOnRoute({
      routeCoordinates,
      minCriticality: CriticalityLevel.MAJOR,
    });

    if (incidents.length === 0) {
      return {
        shouldDeviate: false,
      };
    }

    // Verificar si hay incidentes críticos que requieren desvío
    const criticalIncidents = incidents.filter(
      i => i.criticality >= CriticalityLevel.CRITICAL ||
           i.type === TrafficIncidentType.ROAD_CLOSURE
    );

    if (criticalIncidents.length > 0) {
      return {
        shouldDeviate: true,
        reason: this.buildDeviationReason(criticalIncidents),
        incidents: criticalIncidents,
        alternativeNeeded: true,
      };
    }

    // Verificar congestión severa
    const severeIncidents = incidents.filter(
      i => i.type === TrafficIncidentType.CONGESTION &&
           i.criticality >= CriticalityLevel.MAJOR
    );

    if (severeIncidents.length > 0) {
      return {
        shouldDeviate: true,
        reason: 'Congestión severa detectada en la ruta',
        incidents: severeIncidents,
        alternativeNeeded: true,
      };
    }

    return {
      shouldDeviate: false,
      incidents: incidents,
    };
  }

  /**
   * Parsear incidente de la respuesta API
   */
  private parseIncident(incident: any): TrafficIncident {
    const location = incident.location?.shape?.links?.[0]?.points?.[0] || {};
    const entryPoint = incident.location?.shape?.links?.[0]?.points?.[0];
    const exitPoint = incident.location?.shape?.links?.[0]?.points?.slice(-1)[0];

    return {
      id: incident.id || '',
      type: this.mapIncidentType(incident.type),
      criticality: incident.criticality || CriticalityLevel.MINOR,
      description: incident.description?.value || 'Incidente de tráfico',
      location: {
        latitude: location.lat || 0,
        longitude: location.lng || 0,
      },
      affectedRoads: incident.location?.shape?.links?.map((l: any) => l.roadName).filter(Boolean) || [],
      startTime: new Date(incident.startTime || Date.now()),
      endTime: incident.endTime ? new Date(incident.endTime) : undefined,
      verified: incident.verified || false,
      entryPoint: entryPoint ? { latitude: entryPoint.lat, longitude: entryPoint.lng } : undefined,
      exitPoint: exitPoint ? { latitude: exitPoint.lat, longitude: exitPoint.lng } : undefined,
    };
  }

  /**
   * Parsear flujo de tráfico de la respuesta API
   */
  private parseTrafficFlow(flow: any): TrafficFlow {
    const location = flow.location?.shape?.links?.[0]?.points?.[0] || {};
    
    return {
      latitude: location.lat || 0,
      longitude: location.lng || 0,
      currentSpeed: flow.currentFlow?.speed || 0,
      freeFlowSpeed: flow.freeFlow?.speed || 0,
      jamFactor: flow.currentFlow?.jamFactor || 0,
      confidence: flow.currentFlow?.confidence || 0,
      roadName: flow.location?.shape?.links?.[0]?.roadName,
    };
  }

  /**
   * Mapear tipo de incidente de HERE a nuestro enum
   */
  private mapIncidentType(type: string): TrafficIncidentType {
    const mapping: Record<string, TrafficIncidentType> = {
      'ACCIDENT': TrafficIncidentType.ACCIDENT,
      'CONGESTION': TrafficIncidentType.CONGESTION,
      'DISABLED_VEHICLE': TrafficIncidentType.DISABLED_VEHICLE,
      'ROAD_HAZARD': TrafficIncidentType.ROAD_HAZARD,
      'CONSTRUCTION': TrafficIncidentType.CONSTRUCTION,
      'PLANNED_EVENT': TrafficIncidentType.PLANNED_EVENT,
      'MASS_TRANSIT': TrafficIncidentType.MASS_TRANSIT,
      'OTHER_NEWS': TrafficIncidentType.OTHER_NEWS,
      'WEATHER': TrafficIncidentType.WEATHER,
      'ROAD_CLOSURE': TrafficIncidentType.ROAD_CLOSURE,
      'LANE_RESTRICTION': TrafficIncidentType.LANE_RESTRICTION,
    };

    return mapping[type] || TrafficIncidentType.MISC;
  }

  /**
   * Calcular bounding box de una ruta con buffer
   */
  private calculateRouteBoundingBox(
    coordinates: Array<{ latitude: number; longitude: number }>,
    bufferMeters: number
  ): BoundingBox {
    if (coordinates.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    let north = coordinates[0].latitude;
    let south = coordinates[0].latitude;
    let east = coordinates[0].longitude;
    let west = coordinates[0].longitude;

    coordinates.forEach(coord => {
      north = Math.max(north, coord.latitude);
      south = Math.min(south, coord.latitude);
      east = Math.max(east, coord.longitude);
      west = Math.min(west, coord.longitude);
    });

    // Agregar buffer (aproximado: 1 grado ≈ 111km)
    const bufferDegrees = (bufferMeters / 1000) / 111;

    return {
      north: north + bufferDegrees,
      south: south - bufferDegrees,
      east: east + bufferDegrees,
      west: west - bufferDegrees,
    };
  }

  /**
   * Verificar si un incidente está cerca de la ruta
   */
  private isIncidentNearRoute(
    incident: TrafficIncident,
    routeCoordinates: Array<{ latitude: number; longitude: number }>,
    maxDistanceMeters: number
  ): boolean {
    // Verificar distancia del incidente a cada segmento de la ruta
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const segmentStart = routeCoordinates[i];
      const segmentEnd = routeCoordinates[i + 1];

      const distance = this.pointToSegmentDistance(
        incident.location,
        segmentStart,
        segmentEnd
      );

      if (distance <= maxDistanceMeters) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calcular distancia de un punto a un segmento de línea
   */
  private pointToSegmentDistance(
    point: { latitude: number; longitude: number },
    segmentStart: { latitude: number; longitude: number },
    segmentEnd: { latitude: number; longitude: number }
  ): number {
    // Simplificación: usar distancia al punto más cercano del segmento
    const distToStart = this.haversineDistance(point, segmentStart);
    const distToEnd = this.haversineDistance(point, segmentEnd);
    
    return Math.min(distToStart, distToEnd);
  }

  /**
   * Calcular distancia usando fórmula de Haversine
   */
  private haversineDistance(
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
   * Construir descripción de razón para desvío
   */
  private buildDeviationReason(incidents: TrafficIncident[]): string {
    if (incidents.length === 0) {
      return '';
    }

    if (incidents.length === 1) {
      const incident = incidents[0];
      return `${this.getIncidentTypeName(incident.type)}: ${incident.description}`;
    }

    return `${incidents.length} incidentes detectados en la ruta`;
  }

  /**
   * Obtener nombre legible del tipo de incidente
   */
  private getIncidentTypeName(type: TrafficIncidentType): string {
    const names: Record<TrafficIncidentType, string> = {
      [TrafficIncidentType.ACCIDENT]: 'Accidente',
      [TrafficIncidentType.CONGESTION]: 'Congestión',
      [TrafficIncidentType.DISABLED_VEHICLE]: 'Vehículo Varado',
      [TrafficIncidentType.ROAD_HAZARD]: 'Peligro en Carretera',
      [TrafficIncidentType.CONSTRUCTION]: 'Construcción',
      [TrafficIncidentType.PLANNED_EVENT]: 'Evento Planeado',
      [TrafficIncidentType.MASS_TRANSIT]: 'Transporte Público',
      [TrafficIncidentType.OTHER_NEWS]: 'Noticia',
      [TrafficIncidentType.WEATHER]: 'Clima',
      [TrafficIncidentType.MISC]: 'Otro',
      [TrafficIncidentType.ROAD_CLOSURE]: 'Cierre de Vialidad',
      [TrafficIncidentType.LANE_RESTRICTION]: 'Restricción de Carril',
    };

    return names[type] || 'Incidente';
  }
}

export const hereTrafficService = new HereTrafficService();
