/**
 * 🚦 HERE Traffic Service
 *
 * Servicio para obtener información de tráfico en tiempo real usando HERE Traffic API v7
 *
 * Documentación: https://developer.here.com/documentation/traffic-api/dev_guide/index.html
 * API Reference: https://developer.here.com/documentation/traffic-api/api-reference.html
 */

import { config } from '@/shared/config/environments';
import { hereMockConfig, mockLog } from './hereMockConfig';

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
      // Verificar si debe usar modo mock
      if (hereMockConfig.shouldUseMock('traffic')) {
        mockLog('TrafficService', `Consultando incidentes en bbox: ${bbox.west.toFixed(4)},${bbox.south.toFixed(4)} - ${bbox.east.toFixed(4)},${bbox.north.toFixed(4)}`);
        return this.getTrafficIncidentsMock(bbox);
      }

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
      // Verificar si debe usar modo mock
      if (hereMockConfig.shouldUseMock('traffic')) {
        mockLog('TrafficService', 'Consultando flujo de tráfico mock');
        return this.getTrafficFlowMock(bbox);
      }

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

  // ========== MÉTODOS MOCK ==========

  /**
   * Generar incidentes de tráfico mock
   */
  private async getTrafficIncidentsMock(bbox: BoundingBox): Promise<TrafficIncident[]> {
    await hereMockConfig.simulateDelay('traffic');

    const tiposIncidente = [
      TrafficIncidentType.CONGESTION,
      TrafficIncidentType.ACCIDENT,
      TrafficIncidentType.CONSTRUCTION,
      TrafficIncidentType.ROAD_CLOSURE,
      TrafficIncidentType.LANE_RESTRICTION,
    ];

    const calles = ['Av. Reforma', 'Periférico', 'Insurgentes', 'Circuito Interior', 'Viaducto'];

    // Generar 0-5 incidentes aleatorios
    const numIncidentes = Math.floor(Math.random() * 6);
    const incidentes: TrafficIncident[] = [];

    for (let i = 0; i < numIncidentes; i++) {
      const tipo = tiposIncidente[Math.floor(Math.random() * tiposIncidente.length)];
      const calle = calles[Math.floor(Math.random() * calles.length)];

      // Coordenadas dentro del bbox
      const lat = bbox.south + Math.random() * (bbox.north - bbox.south);
      const lng = bbox.west + Math.random() * (bbox.east - bbox.west);

      incidentes.push({
        id: `mock_incident_${Date.now()}_${i}`,
        type: tipo,
        criticality: Math.floor(Math.random() * 5) as CriticalityLevel,
        description: this.generateMockIncidentDescription(tipo, calle),
        location: { latitude: lat, longitude: lng },
        affectedRoads: [calle],
        startTime: new Date(Date.now() - Math.random() * 3600000), // Última hora
        endTime: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 7200000) : undefined,
        verified: Math.random() > 0.3,
      });
    }

    mockLog('TrafficService', `${incidentes.length} incidentes generados`);
    return incidentes;
  }

  /**
   * Generar flujo de tráfico mock
   */
  private async getTrafficFlowMock(bbox: BoundingBox): Promise<TrafficFlow[]> {
    await hereMockConfig.simulateDelay('traffic');

    const calles = ['Av. Reforma', 'Periférico', 'Insurgentes', 'Circuito Interior', 'Viaducto'];
    const numSegmentos = Math.floor(Math.random() * 10) + 5;
    const flujos: TrafficFlow[] = [];

    for (let i = 0; i < numSegmentos; i++) {
      const lat = bbox.south + Math.random() * (bbox.north - bbox.south);
      const lng = bbox.west + Math.random() * (bbox.east - bbox.west);
      const freeFlowSpeed = 50 + Math.random() * 30; // 50-80 km/h
      const jamFactor = Math.random() * 10;
      const currentSpeed = freeFlowSpeed * (1 - jamFactor / 15); // Velocidad reducida por tráfico

      flujos.push({
        latitude: lat,
        longitude: lng,
        currentSpeed: Math.max(5, currentSpeed),
        freeFlowSpeed: freeFlowSpeed,
        jamFactor: jamFactor,
        confidence: 0.7 + Math.random() * 0.3,
        roadName: calles[Math.floor(Math.random() * calles.length)],
      });
    }

    mockLog('TrafficService', `${flujos.length} segmentos de flujo generados`);
    return flujos;
  }

  /**
   * Generar descripción de incidente mock
   */
  private generateMockIncidentDescription(type: TrafficIncidentType, calle: string): string {
    const descripciones: Record<TrafficIncidentType, string[]> = {
      [TrafficIncidentType.CONGESTION]: [
        `Tráfico lento en ${calle}`,
        `Congestión vehicular en ${calle}`,
        `Alto volumen de tráfico en ${calle}`,
      ],
      [TrafficIncidentType.ACCIDENT]: [
        `Accidente en ${calle}, carriles reducidos`,
        `Colisión múltiple en ${calle}`,
        `Accidente vehicular en ${calle}`,
      ],
      [TrafficIncidentType.CONSTRUCTION]: [
        `Obras en ${calle}`,
        `Reparación de pavimento en ${calle}`,
        `Mantenimiento vial en ${calle}`,
      ],
      [TrafficIncidentType.ROAD_CLOSURE]: [
        `Cierre total de ${calle}`,
        `Vialidad cerrada en ${calle}`,
        `${calle} cerrado al tráfico`,
      ],
      [TrafficIncidentType.LANE_RESTRICTION]: [
        `Carril cerrado en ${calle}`,
        `Reducción de carriles en ${calle}`,
        `Un carril bloqueado en ${calle}`,
      ],
      [TrafficIncidentType.DISABLED_VEHICLE]: [`Vehículo descompuesto en ${calle}`],
      [TrafficIncidentType.ROAD_HAZARD]: [`Obstáculo en ${calle}`],
      [TrafficIncidentType.PLANNED_EVENT]: [`Evento programado en ${calle}`],
      [TrafficIncidentType.MASS_TRANSIT]: [`Afectación de transporte en ${calle}`],
      [TrafficIncidentType.OTHER_NEWS]: [`Incidente en ${calle}`],
      [TrafficIncidentType.WEATHER]: [`Condiciones climáticas adversas en ${calle}`],
      [TrafficIncidentType.MISC]: [`Incidente reportado en ${calle}`],
    };

    const opciones = descripciones[type] || [`Incidente en ${calle}`];
    return opciones[Math.floor(Math.random() * opciones.length)];
  }
}

export const hereTrafficService = new HereTrafficService();
