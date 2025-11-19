/**
 * 🚚 HERE Fleet Telematics & Tour Planning Service (SIMULADO)
 * 
 * Servicio simulado para gestión de flotas y planificación de rutas multi-vehículo.
 * Resuelve problemas de VRP (Vehicle Routing Problem) y optimiza asignaciones.
 * 
 * NOTA: Este es un servicio SIMULADO que no realiza llamadas reales a la API de HERE Maps.
 * Los datos son generados localmente para permitir testing y desarrollo sin backend.
 * 
 * Documentación HERE Tour Planning:
 * https://developer.here.com/documentation/tour-planning/dev_guide/index.html
 * 
 * Documentación HERE Fleet Telematics:
 * https://developer.here.com/documentation/fleet-telematics/dev_guide/index.html
 */

import { config } from '@/shared/config/environments';

/**
 * Vehículo de la flota
 */
export interface FleetVehicle {
  id: string;
  type: 'car' | 'van' | 'truck';
  capacity: {
    weight?: number; // kg
    volume?: number; // m³
    count?: number; // número de items
  };
  costs: {
    fixed: number; // Costo fijo por usar el vehículo (MXN)
    perKm: number; // Costo por kilómetro (MXN)
    perHour: number; // Costo por hora (MXN)
  };
  shift: {
    start: Date; // Hora de inicio del turno
    end: Date; // Hora de fin del turno
    breaks?: Array<{
      earliest: Date;
      latest: Date;
      duration: number; // minutos
    }>;
  };
  startLocation: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  endLocation?: {
    // Si retorna a depot al final
    latitude: number;
    longitude: number;
    name?: string;
  };
  skills?: string[]; // Ej: ['refrigerated', 'hazmat', 'heavy']
  currentLoad?: {
    // Carga actual (para reoptimización en ruta)
    weight?: number;
    volume?: number;
    count?: number;
  };
}

/**
 * Trabajo/Entrega a asignar
 */
export interface DeliveryJob {
  id: string;
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  demand: {
    // Demanda del trabajo
    weight?: number; // kg
    volume?: number; // m³
    count?: number; // número de items
  };
  timeWindow?: {
    earliest: Date; // No antes de esta hora
    latest: Date; // No después de esta hora
  };
  priority?: number; // 1-10 (10 = máxima prioridad)
  serviceTime: number; // Tiempo de servicio en minutos
  skillsRequired?: string[]; // Ej: ['refrigerated']
  type?: 'pickup' | 'delivery'; // Para pickup & delivery
  pairedWith?: string; // ID del job relacionado (pickup-delivery)
}

/**
 * Parada en la ruta de un vehículo
 */
export interface RouteStop {
  jobId: string;
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  arrivalTime: Date;
  startServiceTime: Date;
  endServiceTime: Date;
  departureTime: Date;
  waitingTime: number; // minutos esperando por ventana de tiempo
  load: {
    // Carga después de esta parada
    weight?: number;
    volume?: number;
    count?: number;
  };
  distance: number; // metros desde parada anterior
  duration: number; // segundos desde parada anterior
}

/**
 * Ruta asignada a un vehículo
 */
export interface VehicleRoute {
  vehicleId: string;
  stops: RouteStop[];
  statistics: {
    totalDistance: number; // metros
    totalDuration: number; // segundos (incluyendo servicio y esperas)
    drivingTime: number; // segundos solo conduciendo
    serviceTime: number; // segundos de servicio
    waitingTime: number; // segundos esperando
    breakTime: number; // segundos de descanso
    totalCost: number; // MXN
    utilizationPercentage: number; // % de capacidad utilizada
  };
  violations: Array<{
    type: 'timeWindow' | 'capacity' | 'shift' | 'skills';
    jobId: string;
    description: string;
  }>;
}

/**
 * Solución completa de tour planning
 */
export interface TourPlanningSolution {
  routes: VehicleRoute[];
  unassignedJobs: Array<{
    job: DeliveryJob;
    reason: string;
  }>;
  summary: {
    totalDistance: number;
    totalDuration: number;
    totalCost: number;
    vehiclesUsed: number;
    jobsAssigned: number;
    jobsUnassigned: number;
    averageUtilization: number;
  };
  computationTime: number; // ms
}

/**
 * Métricas de telemetría de vehículo
 */
export interface VehicleTelemetry {
  vehicleId: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    speed: number; // km/h
    heading: number; // grados
  };
  status: 'idle' | 'driving' | 'service' | 'break';
  fuel: {
    level: number; // porcentaje
    consumption: number; // litros/100km
  };
  engine: {
    temperature: number; // Celsius
    rpm: number;
    odometer: number; // km
  };
  driver: {
    id: string;
    name: string;
    hoursWorked: number;
    hoursRemaining: number;
  };
}

class HereFleetTelematicsService {
  private readonly API_KEY = config.hereMapsApiKey || '';

  /**
   * Simula planificación de tours para múltiples vehículos (VRP)
   * 
   * SIMULACIÓN: Usa algoritmo greedy para asignar trabajos a vehículos
   */
  async planTours(
    vehicles: FleetVehicle[],
    jobs: DeliveryJob[],
    options: {
      optimizeFor?: 'distance' | 'cost' | 'time';
      allowOvertimeMinutes?: number; // Minutos de overtime permitidos
    } = {}
  ): Promise<TourPlanningSolution> {
    console.log(
      `[HereFleetTelematics] 🚚 Planificando tours para ${vehicles.length} vehículos, ${jobs.length} trabajos...`
    );

    const startTime = Date.now();
    await this.simulateDelay(1000, 2000); // Tour planning es más costoso

    const optimizeFor = options.optimizeFor || 'distance';

    // Ordenar trabajos por prioridad y ventanas de tiempo
    const sortedJobs = [...jobs].sort((a, b) => {
      if ((a.priority || 0) !== (b.priority || 0)) {
        return (b.priority || 0) - (a.priority || 0);
      }
      if (a.timeWindow && b.timeWindow) {
        return a.timeWindow.earliest.getTime() - b.timeWindow.earliest.getTime();
      }
      return 0;
    });

    const routes: VehicleRoute[] = [];
    const unassignedJobs: TourPlanningSolution['unassignedJobs'] = [];

    // Asignar trabajos a vehículos usando algoritmo greedy
    const assignedJobIds = new Set<string>();

    for (const vehicle of vehicles) {
      const route = await this.buildVehicleRoute(
        vehicle,
        sortedJobs.filter(j => !assignedJobIds.has(j.id)),
        optimizeFor
      );

      routes.push(route);

      // Marcar trabajos asignados
      route.stops.forEach(stop => assignedJobIds.add(stop.jobId));
    }

    // Identificar trabajos no asignados
    jobs.forEach(job => {
      if (!assignedJobIds.has(job.id)) {
        unassignedJobs.push({
          job,
          reason: this.determineUnassignmentReason(job, vehicles),
        });
      }
    });

    // Calcular resumen
    const summary = {
      totalDistance: routes.reduce((sum, r) => sum + r.statistics.totalDistance, 0),
      totalDuration: routes.reduce((sum, r) => sum + r.statistics.totalDuration, 0),
      totalCost: routes.reduce((sum, r) => sum + r.statistics.totalCost, 0),
      vehiclesUsed: routes.filter(r => r.stops.length > 0).length,
      jobsAssigned: assignedJobIds.size,
      jobsUnassigned: unassignedJobs.length,
      averageUtilization:
        routes.reduce((sum, r) => sum + r.statistics.utilizationPercentage, 0) / routes.length,
    };

    const computationTime = Date.now() - startTime;

    console.log(
      `[HereFleetTelematics] ✅ Tours planificados: ${summary.vehiclesUsed} vehículos, ` +
      `${summary.jobsAssigned}/${jobs.length} trabajos asignados, ` +
      `${(summary.totalDistance / 1000).toFixed(1)}km total, ` +
      `$${Math.round(summary.totalCost)} MXN`
    );

    return {
      routes,
      unassignedJobs,
      summary,
      computationTime,
    };
  }

  /**
   * Simula reoptimización de rutas en tiempo real
   */
  async reoptimizeRoute(
    vehicle: FleetVehicle,
    currentLocation: { latitude: number; longitude: number },
    remainingJobs: DeliveryJob[],
    completedJobIds: string[]
  ): Promise<VehicleRoute> {
    console.log(
      `[HereFleetTelematics] 🔄 Reoptimizando ruta para ${vehicle.id}, ${remainingJobs.length} trabajos restantes...`
    );

    await this.simulateDelay(500, 800);

    // Actualizar ubicación de inicio del vehículo
    const updatedVehicle = {
      ...vehicle,
      startLocation: {
        ...currentLocation,
        name: 'Ubicación actual',
      },
    };

    // Recalcular ruta
    const newRoute = await this.buildVehicleRoute(updatedVehicle, remainingJobs, 'distance');

    console.log(
      `[HereFleetTelematics] ✅ Ruta reoptimizada: ${newRoute.stops.length} paradas, ` +
      `${(newRoute.statistics.totalDistance / 1000).toFixed(1)}km`
    );

    return newRoute;
  }

  /**
   * Simula obtención de telemetría en tiempo real de un vehículo
   */
  async getVehicleTelemetry(vehicleId: string): Promise<VehicleTelemetry> {
    console.log(`[HereFleetTelematics] 📡 Obteniendo telemetría de ${vehicleId}...`);

    await this.simulateDelay(200, 400);

    // Simular telemetría realista
    const telemetry: VehicleTelemetry = {
      vehicleId,
      timestamp: new Date(),
      location: {
        latitude: 19.4326 + (Math.random() - 0.5) * 0.1,
        longitude: -99.1332 + (Math.random() - 0.5) * 0.1,
        speed: 30 + Math.random() * 50, // 30-80 km/h
        heading: Math.random() * 360,
      },
      status: this.randomStatus(),
      fuel: {
        level: 30 + Math.random() * 60, // 30-90%
        consumption: 20 + Math.random() * 15, // 20-35 L/100km
      },
      engine: {
        temperature: 85 + Math.random() * 20, // 85-105°C
        rpm: 1000 + Math.random() * 3000,
        odometer: 50000 + Math.random() * 100000,
      },
      driver: {
        id: `DRV-${Math.floor(Math.random() * 100)}`,
        name: `Conductor ${vehicleId}`,
        hoursWorked: 4 + Math.random() * 6,
        hoursRemaining: 2 + Math.random() * 4,
      },
    };

    console.log(
      `[HereFleetTelematics] ✅ Telemetría: ${telemetry.status}, ` +
      `${Math.round(telemetry.location.speed)}km/h, ` +
      `combustible ${Math.round(telemetry.fuel.level)}%`
    );

    return telemetry;
  }

  /**
   * Simula análisis de eficiencia de conductor
   */
  async analyzeDriverBehavior(
    vehicleId: string,
    telemetryHistory: VehicleTelemetry[]
  ): Promise<{
    score: number; // 0-100
    metrics: {
      averageSpeed: number;
      excessiveSpeedEvents: number;
      harshBrakingEvents: number;
      harshAccelerationEvents: number;
      idlingTime: number; // minutos
      fuelEfficiency: number; // L/100km
    };
    recommendations: string[];
  }> {
    console.log(`[HereFleetTelematics] 📊 Analizando comportamiento del conductor ${vehicleId}...`);

    await this.simulateDelay(400, 600);

    // Simular métricas
    const metrics = {
      averageSpeed: 45 + Math.random() * 20,
      excessiveSpeedEvents: Math.floor(Math.random() * 10),
      harshBrakingEvents: Math.floor(Math.random() * 15),
      harshAccelerationEvents: Math.floor(Math.random() * 12),
      idlingTime: 10 + Math.random() * 30,
      fuelEfficiency: 20 + Math.random() * 10,
    };

    // Calcular score
    let score = 100;
    score -= metrics.excessiveSpeedEvents * 2;
    score -= metrics.harshBrakingEvents * 1.5;
    score -= metrics.harshAccelerationEvents * 1.5;
    score -= Math.min(20, metrics.idlingTime * 0.5);
    score = Math.max(0, Math.min(100, score));

    // Generar recomendaciones
    const recommendations: string[] = [];
    
    if (metrics.excessiveSpeedEvents > 5) {
      recommendations.push('Reducir velocidad excesiva para mejorar seguridad y eficiencia');
    }
    
    if (metrics.harshBrakingEvents > 10) {
      recommendations.push('Evitar frenazos bruscos manteniendo distancia de seguridad');
    }
    
    if (metrics.idlingTime > 20) {
      recommendations.push('Reducir tiempo de ralentí apagando motor en paradas largas');
    }
    
    if (metrics.fuelEfficiency > 25) {
      recommendations.push('Mejorar eficiencia de combustible con aceleraciones suaves');
    }

    if (score >= 85) {
      recommendations.push('¡Excelente desempeño! Mantener buenas prácticas de conducción');
    }

    console.log(
      `[HereFleetTelematics] ✅ Análisis completo: Score ${Math.round(score)}/100, ` +
      `${recommendations.length} recomendaciones`
    );

    return {
      score: Math.round(score),
      metrics,
      recommendations,
    };
  }

  /**
   * Construye ruta para un vehículo específico
   */
  private async buildVehicleRoute(
    vehicle: FleetVehicle,
    availableJobs: DeliveryJob[],
    optimizeFor: 'distance' | 'cost' | 'time'
  ): Promise<VehicleRoute> {
    const stops: RouteStop[] = [];
    const violations: VehicleRoute['violations'] = [];

    let currentLocation = vehicle.startLocation;
    let currentTime = new Date(vehicle.shift.start);
    let currentLoad = { weight: 0, volume: 0, count: 0 };

    // Filtrar trabajos que este vehículo puede hacer
    const eligibleJobs = availableJobs.filter(job => {
      // Verificar skills
      if (job.skillsRequired && vehicle.skills) {
        return job.skillsRequired.every(skill => vehicle.skills!.includes(skill));
      }
      return true;
    });

    // Ordenar por proximidad y prioridad
    const sortedJobs = this.sortJobsByProximityAndPriority(
      currentLocation,
      eligibleJobs,
      optimizeFor
    );

    for (const job of sortedJobs) {
      // Verificar capacidad
      const newWeight = currentLoad.weight! + (job.demand.weight || 0);
      const newVolume = currentLoad.volume! + (job.demand.volume || 0);
      const newCount = currentLoad.count! + (job.demand.count || 0);

      if (
        (vehicle.capacity.weight && newWeight > vehicle.capacity.weight) ||
        (vehicle.capacity.volume && newVolume > vehicle.capacity.volume) ||
        (vehicle.capacity.count && newCount > vehicle.capacity.count)
      ) {
        violations.push({
          type: 'capacity',
          jobId: job.id,
          description: 'Excede capacidad del vehículo',
        });
        continue; // No puede tomar este trabajo
      }

      // Calcular distancia y tiempo
      const distance = this.calculateDistance(currentLocation, job.location);
      const travelDuration = (distance / 1000 / 40) * 3600; // 40km/h promedio

      // Calcular tiempos de llegada y servicio
      const arrivalTime = new Date(currentTime.getTime() + travelDuration * 1000);
      let startServiceTime = arrivalTime;
      let waitingTime = 0;

      // Verificar ventana de tiempo
      if (job.timeWindow) {
        if (arrivalTime < job.timeWindow.earliest) {
          startServiceTime = new Date(job.timeWindow.earliest);
          waitingTime = (startServiceTime.getTime() - arrivalTime.getTime()) / 60000;
        } else if (arrivalTime > job.timeWindow.latest) {
          violations.push({
            type: 'timeWindow',
            jobId: job.id,
            description: `Llegada ${arrivalTime.toLocaleTimeString()} fuera de ventana ${job.timeWindow.latest.toLocaleTimeString()}`,
          });
        }
      }

      const endServiceTime = new Date(
        startServiceTime.getTime() + job.serviceTime * 60000
      );
      const departureTime = endServiceTime;

      // Actualizar carga
      currentLoad = {
        weight: newWeight,
        volume: newVolume,
        count: newCount,
      };

      stops.push({
        jobId: job.id,
        location: job.location,
        arrivalTime,
        startServiceTime,
        endServiceTime,
        departureTime,
        waitingTime,
        load: { ...currentLoad },
        distance,
        duration: travelDuration,
      });

      // Actualizar estado actual
      currentLocation = job.location;
      currentTime = departureTime;

      // Verificar si excedemos turno
      if (currentTime > vehicle.shift.end) {
        violations.push({
          type: 'shift',
          jobId: job.id,
          description: 'Excede horario de turno',
        });
        break; // No podemos tomar más trabajos
      }
    }

    // Calcular estadísticas
    const totalDistance = stops.reduce((sum, s) => sum + s.distance, 0);
    const drivingTime = stops.reduce((sum, s) => sum + s.duration, 0);
    const serviceTime = stops.reduce(
      (sum, s) =>
        sum +
        (s.endServiceTime.getTime() - s.startServiceTime.getTime()) / 1000,
      0
    );
    const waitingTimeTotal = stops.reduce((sum, s) => sum + s.waitingTime * 60, 0);
    const breakTime = 0; // Simplificado
    const totalDuration = drivingTime + serviceTime + waitingTimeTotal + breakTime;

    const totalCost =
      vehicle.costs.fixed +
      (totalDistance / 1000) * vehicle.costs.perKm +
      (totalDuration / 3600) * vehicle.costs.perHour;

    const maxCapacity = Math.max(
      vehicle.capacity.weight || 1,
      vehicle.capacity.volume || 1,
      vehicle.capacity.count || 1
    );
    const maxLoad = Math.max(
      currentLoad.weight || 0,
      currentLoad.volume || 0,
      currentLoad.count || 0
    );
    const utilizationPercentage = (maxLoad / maxCapacity) * 100;

    return {
      vehicleId: vehicle.id,
      stops,
      statistics: {
        totalDistance,
        totalDuration,
        drivingTime,
        serviceTime,
        waitingTime: waitingTimeTotal,
        breakTime,
        totalCost,
        utilizationPercentage,
      },
      violations,
    };
  }

  /**
   * Ordena trabajos por proximidad y prioridad
   */
  private sortJobsByProximityAndPriority(
    from: { latitude: number; longitude: number },
    jobs: DeliveryJob[],
    optimizeFor: string
  ): DeliveryJob[] {
    return [...jobs].sort((a, b) => {
      // Prioridad alta siempre primero
      if ((a.priority || 0) > 8 && (b.priority || 0) <= 8) return -1;
      if ((a.priority || 0) <= 8 && (b.priority || 0) > 8) return 1;

      // Luego por proximidad o ventana de tiempo
      if (optimizeFor === 'distance') {
        const distA = this.calculateDistance(from, a.location);
        const distB = this.calculateDistance(from, b.location);
        return distA - distB;
      }

      // Por ventana de tiempo
      if (a.timeWindow && b.timeWindow) {
        return (
          a.timeWindow.earliest.getTime() - b.timeWindow.earliest.getTime()
        );
      }

      return 0;
    });
  }

  /**
   * Determina por qué un trabajo no pudo ser asignado
   */
  private determineUnassignmentReason(
    job: DeliveryJob,
    vehicles: FleetVehicle[]
  ): string {
    // Verificar skills
    if (job.skillsRequired && job.skillsRequired.length > 0) {
      const hasSkills = vehicles.some(
        v => v.skills && job.skillsRequired!.every(s => v.skills!.includes(s))
      );
      if (!hasSkills) {
        return `Ningún vehículo tiene las habilidades requeridas: ${job.skillsRequired.join(', ')}`;
      }
    }

    // Verificar capacidad
    const exceedsAllCapacities = vehicles.every(v => {
      return (
        (v.capacity.weight && (job.demand.weight || 0) > v.capacity.weight) ||
        (v.capacity.volume && (job.demand.volume || 0) > v.capacity.volume) ||
        (v.capacity.count && (job.demand.count || 0) > v.capacity.count)
      );
    });

    if (exceedsAllCapacities) {
      return 'Excede la capacidad de todos los vehículos disponibles';
    }

    return 'No se pudo asignar dentro de las restricciones de tiempo y capacidad';
  }

  /**
   * Calcula distancia usando fórmula Haversine
   */
  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371000;
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
   * Genera status aleatorio
   */
  private randomStatus(): VehicleTelemetry['status'] {
    const statuses: VehicleTelemetry['status'][] = [
      'idle',
      'driving',
      'service',
      'break',
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  /**
   * Simula delay de red
   */
  private simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

export const hereFleetTelematicsService = new HereFleetTelematicsService();
