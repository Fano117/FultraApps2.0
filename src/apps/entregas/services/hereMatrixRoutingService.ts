/**
 * 📊 HERE Matrix Routing Service (SIMULADO)
 * 
 * Servicio simulado para calcular matrices de distancia y tiempo entre múltiples puntos.
 * Permite optimización masiva de rutas calculando todas las combinaciones posibles.
 * 
 * NOTA: Este es un servicio SIMULADO que no realiza llamadas reales a la API de HERE Maps.
 * Los datos son generados localmente para permitir testing y desarrollo sin backend.
 * 
 * Documentación HERE Matrix Routing:
 * https://developer.here.com/documentation/matrix-routing-api/dev_guide/index.html
 */

import { config } from '@/shared/config/environments';

/**
 * Punto para matriz de rutas
 */
export interface MatrixPoint {
  id: string;
  latitude: number;
  longitude: number;
  nombre?: string;
}

/**
 * Opciones para cálculo de matriz
 */
export interface MatrixRoutingOptions {
  transportMode?: 'car' | 'truck' | 'pedestrian';
  departureTime?: Date | 'now';
  considerTraffic?: boolean;
  routingMode?: 'fast' | 'short';
}

/**
 * Entrada de la matriz (distancia/tiempo entre dos puntos)
 */
export interface MatrixEntry {
  originId: string;
  destinationId: string;
  distance: number; // metros
  duration: number; // segundos
  durationInTraffic?: number; // segundos considerando tráfico actual
}

/**
 * Resultado de matriz de rutas
 */
export interface MatrixResult {
  origins: MatrixPoint[];
  destinations: MatrixPoint[];
  entries: MatrixEntry[];
  calculatedAt: Date;
  summary: {
    totalCalculations: number;
    averageDistance: number;
    averageDuration: number;
    minDistance: MatrixEntry;
    maxDistance: MatrixEntry;
    minDuration: MatrixEntry;
    maxDuration: MatrixEntry;
  };
}

/**
 * Resultados de optimización basada en matriz
 */
export interface MatrixOptimizationResult {
  optimalAssignments: Array<{
    originId: string;
    destinationId: string;
    distance: number;
    duration: number;
    reason: string;
  }>;
  totalDistance: number;
  totalDuration: number;
  savings: {
    distanceSaved: number; // metros ahorrados vs asignación aleatoria
    timeSaved: number; // segundos ahorrados
    percentageImprovement: number;
  };
}

class HereMatrixRoutingService {
  private readonly API_KEY = config.hereMapsApiKey || '';

  /**
   * Simula cálculo de matriz de distancias/tiempos entre múltiples puntos
   * 
   * SIMULACIÓN: Calcula distancias usando Haversine y estima tiempos
   * No realiza llamadas reales a la API
   */
  async calculateMatrix(
    origins: MatrixPoint[],
    destinations: MatrixPoint[],
    options: MatrixRoutingOptions = {}
  ): Promise<MatrixResult> {
    console.log(
      `[HereMatrixRouting] 📊 Simulando matriz ${origins.length}×${destinations.length}...`
    );

    // Simular delay de red proporcional al tamaño de la matriz
    const calculationCount = origins.length * destinations.length;
    const delayMs = Math.min(2000, 300 + calculationCount * 20);
    await this.simulateDelay(delayMs, delayMs + 200);

    const entries: MatrixEntry[] = [];
    const transportMode = options.transportMode || 'car';

    // Calcular cada combinación origen-destino
    for (const origin of origins) {
      for (const destination of destinations) {
        const distance = this.calculateDistance(origin, destination);
        
        // Calcular duración base según modo de transporte
        const baseSpeed = this.getAverageSpeed(transportMode);
        const baseDuration = (distance / 1000 / baseSpeed) * 3600;

        // Ajustar duración considerando tráfico
        let durationInTraffic = baseDuration;
        if (options.considerTraffic !== false) {
          // Simular impacto de tráfico (5-25% más lento)
          const trafficFactor = 1.05 + Math.random() * 0.2;
          durationInTraffic = baseDuration * trafficFactor;
        }

        entries.push({
          originId: origin.id,
          destinationId: destination.id,
          distance: Math.round(distance),
          duration: Math.round(baseDuration),
          durationInTraffic: Math.round(durationInTraffic),
        });
      }
    }

    // Calcular estadísticas
    const summary = this.calculateSummary(entries);

    console.log(
      `[HereMatrixRouting] ✅ Matriz calculada: ${calculationCount} combinaciones, ` +
      `promedio ${(summary.averageDistance / 1000).toFixed(1)}km / ${Math.round(summary.averageDuration / 60)}min`
    );

    return {
      origins,
      destinations,
      entries,
      calculatedAt: new Date(),
      summary,
    };
  }

  /**
   * Simula optimización de asignación de vehículos a destinos
   * Encuentra la mejor asignación minimizando distancia total o tiempo
   */
  async optimizeAssignments(
    vehicles: MatrixPoint[],
    destinations: MatrixPoint[],
    options: {
      optimizeFor?: 'distance' | 'time';
      transportMode?: 'car' | 'truck';
      considerTraffic?: boolean;
    } = {}
  ): Promise<MatrixOptimizationResult> {
    console.log(
      `[HereMatrixRouting] 🎯 Optimizando asignación de ${vehicles.length} vehículos a ${destinations.length} destinos...`
    );

    await this.simulateDelay(500, 800);

    // Calcular matriz completa
    const matrix = await this.calculateMatrix(vehicles, destinations, {
      transportMode: options.transportMode,
      considerTraffic: options.considerTraffic,
    });

    // Algoritmo de asignación óptima (greedy - vecino más cercano)
    const assignments = this.findOptimalAssignments(
      matrix,
      options.optimizeFor || 'distance'
    );

    // Calcular totales
    const totalDistance = assignments.reduce((sum, a) => sum + a.distance, 0);
    const totalDuration = assignments.reduce((sum, a) => sum + a.duration, 0);

    // Calcular ahorros vs asignación aleatoria
    const randomAssignment = this.calculateRandomAssignment(matrix);
    const savings = {
      distanceSaved: randomAssignment.totalDistance - totalDistance,
      timeSaved: randomAssignment.totalDuration - totalDuration,
      percentageImprovement:
        ((randomAssignment.totalDistance - totalDistance) / randomAssignment.totalDistance) * 100,
    };

    console.log(
      `[HereMatrixRouting] ✅ Optimización completa: ${(totalDistance / 1000).toFixed(1)}km total, ` +
      `ahorro de ${savings.percentageImprovement.toFixed(1)}%`
    );

    return {
      optimalAssignments: assignments,
      totalDistance,
      totalDuration,
      savings,
    };
  }

  /**
   * Simula búsqueda del punto más cercano a una ubicación
   */
  async findNearestPoints(
    referencePoint: MatrixPoint,
    candidates: MatrixPoint[],
    options: {
      limit?: number;
      maxDistance?: number; // metros
      transportMode?: 'car' | 'truck' | 'pedestrian';
    } = {}
  ): Promise<Array<{
    point: MatrixPoint;
    distance: number;
    duration: number;
    rank: number;
  }>> {
    console.log(
      `[HereMatrixRouting] 🔍 Buscando puntos más cercanos a ${referencePoint.nombre || referencePoint.id}...`
    );

    await this.simulateDelay(200, 400);

    // Calcular matriz 1×N
    const matrix = await this.calculateMatrix(
      [referencePoint],
      candidates,
      { transportMode: options.transportMode }
    );

    // Ordenar por distancia
    const results = matrix.entries
      .map((entry, index) => ({
        point: candidates.find(c => c.id === entry.destinationId)!,
        distance: entry.distance,
        duration: entry.duration,
        rank: index + 1,
      }))
      .sort((a, b) => a.distance - b.distance);

    // Aplicar filtros
    let filtered = results;
    
    if (options.maxDistance) {
      filtered = filtered.filter(r => r.distance <= options.maxDistance!);
    }
    
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    // Actualizar ranks
    filtered = filtered.map((item, index) => ({ ...item, rank: index + 1 }));

    console.log(`[HereMatrixRouting] ✅ ${filtered.length} puntos cercanos encontrados`);

    return filtered;
  }

  /**
   * Simula análisis de cobertura geográfica de una flota
   */
  async analyzeCoverage(
    depots: MatrixPoint[],
    serviceAreas: MatrixPoint[],
    options: {
      maxServiceDistance?: number; // metros
      transportMode?: 'car' | 'truck';
    } = {}
  ): Promise<{
    coverage: Array<{
      depotId: string;
      coveredAreas: string[];
      coveragePercentage: number;
      averageDistance: number;
      averageDuration: number;
    }>;
    totalCoverage: number; // porcentaje de áreas cubiertas
    uncoveredAreas: MatrixPoint[];
    recommendations: string[];
  }> {
    console.log(
      `[HereMatrixRouting] 📍 Analizando cobertura de ${depots.length} almacenes...`
    );

    await this.simulateDelay(600, 1000);

    const maxDistance = options.maxServiceDistance || 50000; // 50km por defecto

    // Calcular matriz depots × service areas
    const matrix = await this.calculateMatrix(depots, serviceAreas, {
      transportMode: options.transportMode,
    });

    const coverage = depots.map(depot => {
      // Encontrar áreas que puede cubrir este depot
      const depotEntries = matrix.entries.filter(e => e.originId === depot.id);
      const coveredEntries = depotEntries.filter(e => e.distance <= maxDistance);
      const coveredAreas = coveredEntries.map(e => e.destinationId);

      const averageDistance =
        coveredEntries.reduce((sum, e) => sum + e.distance, 0) / coveredEntries.length || 0;
      const averageDuration =
        coveredEntries.reduce((sum, e) => sum + e.duration, 0) / coveredEntries.length || 0;

      return {
        depotId: depot.id,
        coveredAreas,
        coveragePercentage: (coveredAreas.length / serviceAreas.length) * 100,
        averageDistance: Math.round(averageDistance),
        averageDuration: Math.round(averageDuration),
      };
    });

    // Calcular cobertura total
    const allCoveredAreaIds = new Set(coverage.flatMap(c => c.coveredAreas));
    const totalCoverage = (allCoveredAreaIds.size / serviceAreas.length) * 100;

    // Encontrar áreas sin cobertura
    const uncoveredAreas = serviceAreas.filter(area => !allCoveredAreaIds.has(area.id));

    // Generar recomendaciones
    const recommendations: string[] = [];
    
    if (totalCoverage < 100) {
      recommendations.push(
        `${uncoveredAreas.length} área(s) sin cobertura. Considere agregar almacén adicional.`
      );
    }
    
    const lowCoverageDepots = coverage.filter(c => c.coveragePercentage < 30);
    if (lowCoverageDepots.length > 0) {
      recommendations.push(
        `${lowCoverageDepots.length} almacén(es) con baja cobertura (<30%). Evaluar reubicación.`
      );
    }

    console.log(
      `[HereMatrixRouting] ✅ Análisis completo: ${totalCoverage.toFixed(1)}% cobertura total`
    );

    return {
      coverage,
      totalCoverage,
      uncoveredAreas,
      recommendations,
    };
  }

  /**
   * Calcula estadísticas de la matriz
   */
  private calculateSummary(entries: MatrixEntry[]): MatrixResult['summary'] {
    if (entries.length === 0) {
      throw new Error('No hay entradas en la matriz');
    }

    const totalDistance = entries.reduce((sum, e) => sum + e.distance, 0);
    const totalDuration = entries.reduce((sum, e) => sum + e.duration, 0);

    const sortedByDistance = [...entries].sort((a, b) => a.distance - b.distance);
    const sortedByDuration = [...entries].sort((a, b) => a.duration - b.duration);

    return {
      totalCalculations: entries.length,
      averageDistance: totalDistance / entries.length,
      averageDuration: totalDuration / entries.length,
      minDistance: sortedByDistance[0],
      maxDistance: sortedByDistance[sortedByDistance.length - 1],
      minDuration: sortedByDuration[0],
      maxDuration: sortedByDuration[sortedByDuration.length - 1],
    };
  }

  /**
   * Encuentra asignaciones óptimas usando algoritmo greedy
   */
  private findOptimalAssignments(
    matrix: MatrixResult,
    optimizeFor: 'distance' | 'time'
  ): MatrixOptimizationResult['optimalAssignments'] {
    const assignments: MatrixOptimizationResult['optimalAssignments'] = [];
    const usedOrigins = new Set<string>();
    const usedDestinations = new Set<string>();

    // Ordenar entradas por el criterio de optimización
    const sortedEntries = [...matrix.entries].sort((a, b) => {
      if (optimizeFor === 'distance') {
        return a.distance - b.distance;
      } else {
        return (a.durationInTraffic || a.duration) - (b.durationInTraffic || b.duration);
      }
    });

    // Asignar greedily (vecino más cercano)
    for (const entry of sortedEntries) {
      if (usedOrigins.has(entry.originId) || usedDestinations.has(entry.destinationId)) {
        continue;
      }

      const origin = matrix.origins.find(o => o.id === entry.originId);
      const destination = matrix.destinations.find(d => d.id === entry.destinationId);

      assignments.push({
        originId: entry.originId,
        destinationId: entry.destinationId,
        distance: entry.distance,
        duration: entry.durationInTraffic || entry.duration,
        reason: `${origin?.nombre || entry.originId} → ${destination?.nombre || entry.destinationId} (${optimizeFor === 'distance' ? (entry.distance / 1000).toFixed(1) + 'km' : Math.round(entry.duration / 60) + 'min'})`,
      });

      usedOrigins.add(entry.originId);
      usedDestinations.add(entry.destinationId);

      // Si ya asignamos todos los orígenes o destinos posibles, terminar
      if (
        usedOrigins.size >= matrix.origins.length ||
        usedDestinations.size >= matrix.destinations.length
      ) {
        break;
      }
    }

    return assignments;
  }

  /**
   * Calcula totales de una asignación aleatoria (para comparación)
   */
  private calculateRandomAssignment(matrix: MatrixResult): {
    totalDistance: number;
    totalDuration: number;
  } {
    // Simular asignación aleatoria tomando una entrada aleatoria por origen
    const randomEntries: MatrixEntry[] = [];
    const usedDestinations = new Set<string>();

    for (const origin of matrix.origins) {
      const availableEntries = matrix.entries.filter(
        e => e.originId === origin.id && !usedDestinations.has(e.destinationId)
      );

      if (availableEntries.length > 0) {
        const randomEntry =
          availableEntries[Math.floor(Math.random() * availableEntries.length)];
        randomEntries.push(randomEntry);
        usedDestinations.add(randomEntry.destinationId);
      }
    }

    return {
      totalDistance: randomEntries.reduce((sum, e) => sum + e.distance, 0),
      totalDuration: randomEntries.reduce((sum, e) => sum + e.duration, 0),
    };
  }

  /**
   * Obtiene velocidad promedio según modo de transporte
   */
  private getAverageSpeed(mode: string): number {
    const speeds: Record<string, number> = {
      car: 45, // km/h
      truck: 40, // km/h
      pedestrian: 5, // km/h
    };

    return speeds[mode] || 45;
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

export const hereMatrixRoutingService = new HereMatrixRoutingService();
