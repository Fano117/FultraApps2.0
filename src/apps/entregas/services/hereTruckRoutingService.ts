/**
 * 🚛 HERE Truck Routing Service (SIMULADO)
 * 
 * Servicio simulado para calcular rutas optimizadas para camiones considerando restricciones específicas
 * como peso, altura, materiales peligrosos, peajes, etc.
 * 
 * NOTA: Este es un servicio SIMULADO que no realiza llamadas reales a la API de HERE Maps.
 * Los datos son generados localmente para permitir testing y desarrollo sin backend.
 * 
 * Documentación HERE Truck Routing: 
 * https://developer.here.com/documentation/routing-api/dev_guide/topics/truck-routing.html
 */

import { config } from '@/shared/config/environments';

/**
 * Especificaciones del camión
 */
export interface TruckSpecs {
  // Dimensiones
  grossWeight?: number; // Peso bruto en toneladas
  weightPerAxle?: number; // Peso por eje en toneladas
  height?: number; // Altura en metros
  width?: number; // Ancho en metros
  length?: number; // Longitud en metros
  axleCount?: number; // Número de ejes
  
  // Materiales peligrosos (HazMat)
  shippedHazardousGoods?: Array<
    | 'explosive'
    | 'gas'
    | 'flammable'
    | 'combustible'
    | 'organic'
    | 'poison'
    | 'radioactive'
    | 'corrosive'
    | 'poisonousInhalation'
    | 'harmfulToWater'
    | 'other'
  >;
  
  // Categoría de túnel
  tunnelCategory?: 'B' | 'C' | 'D' | 'E';
  
  // Tipo de camión
  trailerCount?: number;
  truckType?: 'straight' | 'tractor';
}

/**
 * Opciones de ruteo para camiones
 */
export interface TruckRoutingOptions {
  truckSpecs: TruckSpecs;
  avoidTolls?: boolean;
  avoidFerries?: boolean;
  avoidDirtRoads?: boolean;
  routingMode?: 'fast' | 'short' | 'balanced';
  departureTime?: Date | 'now';
}

/**
 * Restricción detectada en la ruta
 */
export interface RouteRestriction {
  type: 'weight' | 'height' | 'width' | 'length' | 'tunnel' | 'hazmat' | 'toll' | 'lowEmissionZone';
  location: {
    latitude: number;
    longitude: number;
  };
  description: string;
  severity: 'warning' | 'critical';
  canAvoid: boolean;
}

/**
 * Ruta optimizada para camión
 */
export interface TruckRoute {
  distance: number; // metros
  duration: number; // segundos
  coordinates: Array<{ latitude: number; longitude: number }>;
  instructions: string[];
  estimatedArrival: Date;
  fuelConsumption?: number; // litros estimados
  tollCosts?: number; // pesos mexicanos estimados
  restrictions: RouteRestriction[];
  summary: {
    totalDistance: number;
    totalDuration: number;
    highwayDistance: number;
    urbanDistance: number;
    ruralDistance: number;
  };
}

class HereTruckRoutingService {
  private readonly API_KEY = config.hereMapsApiKey || '';

  /**
   * Simula cálculo de ruta optimizada para camión con restricciones
   * 
   * SIMULACIÓN: No realiza llamadas reales a la API, genera datos de ejemplo
   */
  async calculateTruckRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    options: TruckRoutingOptions
  ): Promise<TruckRoute> {
    console.log('[HereTruckRouting] 🚛 Simulando cálculo de ruta para camión...');
    console.log(`[HereTruckRouting] 📏 Especificaciones: Peso=${options.truckSpecs.grossWeight}t, Altura=${options.truckSpecs.height}m`);

    // Simular delay de red
    await this.simulateDelay(500, 1000);

    // Calcular distancia base usando Haversine
    const baseDistance = this.calculateDistance(origin, destination);
    
    // Ajustar distancia según restricciones (los camiones deben tomar rutas más largas)
    const routeFactor = this.calculateRouteFactor(options.truckSpecs);
    const actualDistance = baseDistance * routeFactor;
    
    // Calcular duración (velocidad promedio más baja para camiones)
    const avgSpeed = this.calculateAverageSpeed(options);
    const duration = (actualDistance / 1000) / avgSpeed * 3600;

    // Generar polyline simulada (ruta interpolada)
    const coordinates = this.generateRouteCoordinates(origin, destination, 15);

    // Detectar restricciones simuladas en la ruta
    const restrictions = this.simulateRestrictions(origin, destination, options.truckSpecs);

    // Calcular consumo de combustible estimado (camión consume ~30-35 litros/100km)
    const fuelConsumption = (actualDistance / 1000) * 0.32; // 32 litros/100km promedio

    // Estimar costos de peaje
    const tollCosts = options.avoidTolls ? 0 : this.estimateTollCosts(actualDistance);

    // Clasificar distancia por tipo de vía
    const summary = {
      totalDistance: actualDistance,
      totalDuration: duration,
      highwayDistance: actualDistance * 0.6, // 60% autopista
      urbanDistance: actualDistance * 0.25,   // 25% urbano
      ruralDistance: actualDistance * 0.15,   // 15% rural
    };

    const route: TruckRoute = {
      distance: actualDistance,
      duration,
      coordinates,
      instructions: this.generateTruckInstructions(options.truckSpecs, restrictions),
      estimatedArrival: new Date(Date.now() + duration * 1000),
      fuelConsumption: Math.round(fuelConsumption * 10) / 10,
      tollCosts: Math.round(tollCosts),
      restrictions,
      summary,
    };

    console.log(
      `[HereTruckRouting] ✅ Ruta calculada: ${(actualDistance / 1000).toFixed(1)}km, ` +
      `${Math.round(duration / 60)}min, ${restrictions.length} restricciones`
    );

    return route;
  }

  /**
   * Simula análisis de restricciones en múltiples rutas para comparar
   */
  async analyzeRouteAlternatives(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    options: TruckRoutingOptions
  ): Promise<{
    mainRoute: TruckRoute;
    alternatives: TruckRoute[];
    recommendation: string;
  }> {
    console.log('[HereTruckRouting] 🔍 Analizando alternativas de ruta para camión...');

    await this.simulateDelay(800, 1200);

    // Ruta principal
    const mainRoute = await this.calculateTruckRoute(origin, destination, options);

    // Generar 2 rutas alternativas con variaciones
    const alt1Options = { ...options, avoidTolls: true };
    const alt2Options = { ...options, routingMode: 'short' as const };

    const alternative1 = await this.calculateTruckRoute(origin, destination, alt1Options);
    const alternative2 = await this.calculateTruckRoute(origin, destination, alt2Options);

    // Ajustar ligeramente para diferenciación
    alternative1.distance = mainRoute.distance * 1.15;
    alternative1.duration = mainRoute.duration * 1.2;
    alternative1.tollCosts = 0;

    alternative2.distance = mainRoute.distance * 0.95;
    alternative2.duration = mainRoute.duration * 1.1;
    alternative2.restrictions = mainRoute.restrictions.slice(0, 1);

    const recommendation = this.generateRecommendation(mainRoute, [alternative1, alternative2]);

    return {
      mainRoute,
      alternatives: [alternative1, alternative2],
      recommendation,
    };
  }

  /**
   * Simula validación de ruta para un camión específico
   */
  async validateTruckRoute(
    route: Array<{ latitude: number; longitude: number }>,
    truckSpecs: TruckSpecs
  ): Promise<{
    isValid: boolean;
    issues: RouteRestriction[];
    suggestions: string[];
  }> {
    console.log('[HereTruckRouting] 🔍 Validando ruta para especificaciones del camión...');

    await this.simulateDelay(300, 500);

    const issues = this.simulateRestrictions(
      route[0],
      route[route.length - 1],
      truckSpecs
    );

    const criticalIssues = issues.filter(i => i.severity === 'critical');

    const suggestions: string[] = [];
    
    if (criticalIssues.length > 0) {
      suggestions.push('Se recomienda buscar ruta alternativa que evite restricciones críticas');
    }
    
    if (truckSpecs.grossWeight && truckSpecs.grossWeight > 20) {
      suggestions.push('Considere solicitar permisos especiales para carga sobredimensionada');
    }
    
    if (truckSpecs.shippedHazardousGoods && truckSpecs.shippedHazardousGoods.length > 0) {
      suggestions.push('Verifique regulaciones locales para transporte de materiales peligrosos');
    }

    return {
      isValid: criticalIssues.length === 0,
      issues,
      suggestions,
    };
  }

  /**
   * Calcula factor de ajuste de ruta según especificaciones del camión
   */
  private calculateRouteFactor(specs: TruckSpecs): number {
    let factor = 1.0;

    // Camiones deben evitar ciertas calles, aumenta distancia
    if (specs.grossWeight && specs.grossWeight > 12) {
      factor += 0.15; // +15% para camiones pesados
    }

    if (specs.height && specs.height > 4.0) {
      factor += 0.08; // +8% para camiones altos (evitar puentes bajos)
    }

    if (specs.shippedHazardousGoods && specs.shippedHazardousGoods.length > 0) {
      factor += 0.12; // +12% para materiales peligrosos (rutas especiales)
    }

    if (specs.trailerCount && specs.trailerCount > 1) {
      factor += 0.10; // +10% para trailers múltiples
    }

    return factor;
  }

  /**
   * Calcula velocidad promedio según tipo de camión y condiciones
   */
  private calculateAverageSpeed(options: TruckRoutingOptions): number {
    const baseSpeed = 55; // km/h base para camiones

    let speed = baseSpeed;

    if (options.truckSpecs.grossWeight && options.truckSpecs.grossWeight > 20) {
      speed -= 10; // Camiones muy pesados van más lentos
    }

    if (options.routingMode === 'short') {
      speed -= 5; // Rutas cortas pueden incluir más vías urbanas
    }

    if (options.avoidTolls) {
      speed -= 8; // Evitar autopistas reduce velocidad promedio
    }

    return Math.max(speed, 35); // Mínimo 35 km/h
  }

  /**
   * Simula detección de restricciones en la ruta
   */
  private simulateRestrictions(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    specs: TruckSpecs
  ): RouteRestriction[] {
    const restrictions: RouteRestriction[] = [];

    // Simular restricción de peso si el camión es pesado
    if (specs.grossWeight && specs.grossWeight > 15) {
      restrictions.push({
        type: 'weight',
        location: {
          latitude: (origin.latitude + destination.latitude) / 2,
          longitude: (origin.longitude + destination.longitude) / 2,
        },
        description: `Puente con límite de peso de 15t (su camión: ${specs.grossWeight}t)`,
        severity: specs.grossWeight > 20 ? 'critical' : 'warning',
        canAvoid: true,
      });
    }

    // Simular restricción de altura
    if (specs.height && specs.height > 4.0) {
      restrictions.push({
        type: 'height',
        location: {
          latitude: origin.latitude + (destination.latitude - origin.latitude) * 0.3,
          longitude: origin.longitude + (destination.longitude - origin.longitude) * 0.3,
        },
        description: `Puente bajo: 4.0m (su camión: ${specs.height}m)`,
        severity: 'critical',
        canAvoid: true,
      });
    }

    // Simular zona de bajas emisiones en área urbana
    const urbanProximity = this.isNearUrbanArea(destination);
    if (urbanProximity) {
      restrictions.push({
        type: 'lowEmissionZone',
        location: destination,
        description: 'Zona de bajas emisiones en centro urbano',
        severity: 'warning',
        canAvoid: false,
      });
    }

    // Simular restricción de materiales peligrosos
    if (specs.shippedHazardousGoods && specs.shippedHazardousGoods.length > 0) {
      restrictions.push({
        type: 'hazmat',
        location: {
          latitude: origin.latitude + (destination.latitude - origin.latitude) * 0.6,
          longitude: origin.longitude + (destination.longitude - origin.longitude) * 0.6,
        },
        description: `Túnel no permite materiales peligrosos (${specs.shippedHazardousGoods.join(', ')})`,
        severity: 'critical',
        canAvoid: true,
      });
    }

    return restrictions;
  }

  /**
   * Estima costos de peaje basado en distancia
   */
  private estimateTollCosts(distanceMeters: number): number {
    const distanceKm = distanceKm / 1000;
    
    // Simulación de tarifas de peaje en México
    // Aproximadamente $1.50 MXN por km en autopistas de cuota
    const avgTollPerKm = 1.50;
    const tollDistance = distanceKm * 0.6; // Asumiendo 60% en autopistas
    
    return tollDistance * avgTollPerKm;
  }

  /**
   * Genera instrucciones específicas para camiones
   */
  private generateTruckInstructions(
    specs: TruckSpecs,
    restrictions: RouteRestriction[]
  ): string[] {
    const instructions: string[] = [
      'Iniciar ruta desde origen',
    ];

    if (restrictions.length > 0) {
      instructions.push(`⚠️ ADVERTENCIA: ${restrictions.length} restricción(es) detectada(s) en la ruta`);
    }

    restrictions.forEach(restriction => {
      if (restriction.severity === 'critical') {
        instructions.push(`🚫 CRÍTICO: ${restriction.description}`);
      } else {
        instructions.push(`⚠️ Advertencia: ${restriction.description}`);
      }
    });

    if (specs.grossWeight && specs.grossWeight > 20) {
      instructions.push('ℹ️ Camión de carga pesada: Mantenga velocidad moderada');
    }

    instructions.push('Continuar por ruta optimizada para camiones');
    instructions.push('Llegar al destino');

    return instructions;
  }

  /**
   * Genera recomendación basada en análisis de rutas
   */
  private generateRecommendation(
    mainRoute: TruckRoute,
    alternatives: TruckRoute[]
  ): string {
    const criticalRestrictions = mainRoute.restrictions.filter(r => r.severity === 'critical');

    if (criticalRestrictions.length > 0) {
      const bestAlt = alternatives.find(alt => 
        alt.restrictions.filter(r => r.severity === 'critical').length === 0
      );
      
      if (bestAlt) {
        return `Se recomienda ruta alternativa para evitar ${criticalRestrictions.length} restricción(es) crítica(s)`;
      }
    }

    if (mainRoute.tollCosts && mainRoute.tollCosts > 500) {
      const noTollAlt = alternatives.find(alt => (alt.tollCosts || 0) === 0);
      if (noTollAlt && noTollAlt.duration < mainRoute.duration * 1.3) {
        return `Ruta sin peajes ahorra $${Math.round(mainRoute.tollCosts)} con solo ${Math.round((noTollAlt.duration - mainRoute.duration) / 60)} min adicionales`;
      }
    }

    return 'Ruta principal es la opción óptima para este camión';
  }

  /**
   * Verifica si una ubicación está cerca de zona urbana
   */
  private isNearUrbanArea(location: { latitude: number; longitude: number }): boolean {
    // Simulación simple: considerar zonas urbanas principales de México
    const urbanCenters = [
      { lat: 19.4326, lng: -99.1332, name: 'CDMX' }, // Ciudad de México
      { lat: 25.6866, lng: -100.3161, name: 'Monterrey' },
      { lat: 20.6597, lng: -103.3496, name: 'Guadalajara' },
    ];

    return urbanCenters.some(center => {
      const distance = this.calculateDistance(location, { latitude: center.lat, longitude: center.lng });
      return distance < 50000; // Dentro de 50km del centro
    });
  }

  /**
   * Genera coordenadas interpoladas para ruta
   */
  private generateRouteCoordinates(
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number },
    points: number
  ): Array<{ latitude: number; longitude: number }> {
    const coords: Array<{ latitude: number; longitude: number }> = [];
    
    for (let i = 0; i <= points; i++) {
      const ratio = i / points;
      coords.push({
        latitude: start.latitude + (end.latitude - start.latitude) * ratio,
        longitude: start.longitude + (end.longitude - start.longitude) * ratio,
      });
    }
    
    return coords;
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

export const hereTruckRoutingService = new HereTruckRoutingService();
