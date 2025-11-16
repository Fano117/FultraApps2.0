/**
 * 🎯 Demostración de Integración de Servicios HERE Maps Simulados
 * 
 * Este archivo demuestra cómo los servicios simulados de HERE Maps se integran
 * con la simulación de entregas existente, mostrando el funcionamiento completo
 * del sistema sin necesidad de llamadas reales a APIs externas.
 * 
 * SERVICIOS IMPLEMENTADOS (Simulados):
 * 1. ✅ Truck Routing - Rutas para camiones con restricciones
 * 2. ✅ Matrix Routing - Matrices de distancia/tiempo
 * 3. ✅ Destination Weather - Clima en destinos
 * 4. ✅ Fleet Telematics & Tour Planning - Optimización multi-vehículo
 * 5. ✅ Advanced Geofencing - Geocercas avanzadas
 * 
 * Además de los servicios ya existentes:
 * - Routing Service (básico)
 * - Geocoding Service
 * - Traffic Service
 * - Navigation Service
 * - Multi-Stop Optimizer
 */

import { hereTruckRoutingService, TruckSpecs } from './hereTruckRoutingService';
import { hereMatrixRoutingService, MatrixPoint } from './hereMatrixRoutingService';
import { hereDestinationWeatherService } from './hereDestinationWeatherService';
import {
  hereFleetTelematicsService,
  FleetVehicle,
  DeliveryJob,
} from './hereFleetTelematicsService';
import {
  hereAdvancedGeofencingService,
  CircularGeofence,
  GeofenceType,
  GeofenceEventType,
} from './hereAdvancedGeofencingService';

/**
 * DEMO 1: Planificación de Entrega con Camión
 * 
 * Demuestra cómo calcular una ruta optimizada para un camión considerando
 * restricciones de peso, altura y materiales peligrosos.
 */
export async function demoTruckRouting() {
  console.log('\n🚛 === DEMO: TRUCK ROUTING ===\n');

  const origin = { latitude: 19.4326, longitude: -99.1332 }; // CDMX
  const destination = { latitude: 25.6866, longitude: -100.3161 }; // Monterrey

  // Especificaciones del camión
  const truckSpecs: TruckSpecs = {
    grossWeight: 18, // 18 toneladas
    height: 4.2, // 4.2 metros
    width: 2.5,
    length: 12,
    axleCount: 3,
    shippedHazardousGoods: ['flammable'], // Transporta materiales inflamables
  };

  try {
    // Calcular ruta para camión
    const route = await hereTruckRoutingService.calculateTruckRoute(
      origin,
      destination,
      { truckSpecs }
    );

    console.log('📊 Resultados de Ruta para Camión:');
    console.log(`   Distancia: ${(route.distance / 1000).toFixed(1)} km`);
    console.log(`   Duración: ${Math.round(route.duration / 60)} minutos`);
    console.log(`   Consumo estimado: ${route.fuelConsumption} litros`);
    console.log(`   Peajes estimados: $${route.tollCosts} MXN`);
    console.log(`   Restricciones encontradas: ${route.restrictions.length}`);

    route.restrictions.forEach((restriction, index) => {
      console.log(
        `   ${index + 1}. [${restriction.severity.toUpperCase()}] ${restriction.description}`
      );
    });

    // Analizar alternativas
    const alternatives = await hereTruckRoutingService.analyzeRouteAlternatives(
      origin,
      destination,
      { truckSpecs }
    );

    console.log(`\n💡 Recomendación: ${alternatives.recommendation}`);
    console.log(
      `   Rutas alternativas disponibles: ${alternatives.alternatives.length}`
    );

    return route;
  } catch (error) {
    console.error('❌ Error en truck routing:', error);
    throw error;
  }
}

/**
 * DEMO 2: Optimización de Asignación de Vehículos
 * 
 * Demuestra cómo usar Matrix Routing para optimizar la asignación de
 * vehículos a destinos minimizando distancia total.
 */
export async function demoMatrixRouting() {
  console.log('\n📊 === DEMO: MATRIX ROUTING ===\n');

  // Vehículos disponibles (depots)
  const vehicles: MatrixPoint[] = [
    { id: 'V1', latitude: 19.4326, longitude: -99.1332, nombre: 'Vehículo 1 (CDMX)' },
    { id: 'V2', latitude: 20.6597, longitude: -103.3496, nombre: 'Vehículo 2 (GDL)' },
    { id: 'V3', latitude: 25.6866, longitude: -100.3161, nombre: 'Vehículo 3 (MTY)' },
  ];

  // Destinos de entrega
  const destinations: MatrixPoint[] = [
    {
      id: 'D1',
      latitude: 19.3, longitude: -99.2,
      nombre: 'Cliente A',
    },
    {
      id: 'D2',
      latitude: 20.7,
      longitude: -103.4,
      nombre: 'Cliente B',
    },
    {
      id: 'D3',
      latitude: 25.5,
      longitude: -100.2,
      nombre: 'Cliente C',
    },
    {
      id: 'D4',
      latitude: 19.5,
      longitude: -99.0,
      nombre: 'Cliente D',
    },
  ];

  try {
    // Calcular matriz completa
    const matrix = await hereMatrixRoutingService.calculateMatrix(
      vehicles,
      destinations,
      { considerTraffic: true }
    );

    console.log('📊 Matriz de Distancias Calculada:');
    console.log(`   Cálculos realizados: ${matrix.summary.totalCalculations}`);
    console.log(
      `   Distancia promedio: ${(matrix.summary.averageDistance / 1000).toFixed(1)} km`
    );
    console.log(
      `   Tiempo promedio: ${Math.round(matrix.summary.averageDuration / 60)} min`
    );

    // Optimizar asignaciones
    const optimization = await hereMatrixRoutingService.optimizeAssignments(
      vehicles,
      destinations,
      { optimizeFor: 'distance' }
    );

    console.log('\n🎯 Asignaciones Óptimas:');
    optimization.optimalAssignments.forEach((assignment, index) => {
      console.log(
        `   ${index + 1}. ${assignment.reason} - ${(assignment.distance / 1000).toFixed(1)} km`
      );
    });

    console.log('\n💰 Ahorro vs Asignación Aleatoria:');
    console.log(
      `   Distancia ahorrada: ${(optimization.savings.distanceSaved / 1000).toFixed(1)} km`
    );
    console.log(
      `   Mejora: ${optimization.savings.percentageImprovement.toFixed(1)}%`
    );

    return optimization;
  } catch (error) {
    console.error('❌ Error en matrix routing:', error);
    throw error;
  }
}

/**
 * DEMO 3: Análisis de Clima en Ruta
 * 
 * Demuestra cómo analizar el clima en múltiples puntos de una ruta
 * para detectar condiciones adversas.
 */
export async function demoDestinationWeather() {
  console.log('\n🌤️ === DEMO: DESTINATION WEATHER ===\n');

  const waypoints = [
    { latitude: 19.4326, longitude: -99.1332, nombre: 'CDMX' },
    { latitude: 21.1619, longitude: -101.6872, nombre: 'Querétaro' },
    { latitude: 25.6866, longitude: -100.3161, nombre: 'Monterrey' },
  ];

  try {
    // Analizar clima en toda la ruta
    const routeWeather = await hereDestinationWeatherService.analyzeRouteWeather(
      waypoints
    );

    console.log(`🌍 Análisis de Clima en Ruta:`);
    console.log(`   Riesgo general: ${routeWeather.overallRisk.toUpperCase()}`);
    console.log(`   Advertencias: ${routeWeather.warnings.length}`);

    console.log('\n📍 Clima por Punto:');
    routeWeather.weatherByWaypoint.forEach((wp, index) => {
      console.log(`\n   ${index + 1}. ${wp.waypoint.nombre}`);
      console.log(`      Temperatura: ${Math.round(wp.weather.temperature)}°C`);
      console.log(`      Condición: ${wp.weather.description}`);
      console.log(`      Viento: ${Math.round(wp.weather.windSpeed)} km/h`);
      console.log(`      Visibilidad: ${Math.round(wp.weather.visibility)} m`);
      console.log(`      Alertas activas: ${wp.alerts.length}`);

      if (wp.alerts.length > 0) {
        wp.alerts.forEach(alert => {
          console.log(`         ⚠️ ${alert.title}: ${alert.description}`);
        });
      }
    });

    console.log('\n💡 Recomendación:');
    console.log(`   Proceder: ${routeWeather.recommendation.shouldProceed ? 'SÍ' : 'NO'}`);
    console.log(`   Riesgo: ${routeWeather.recommendation.risk.toUpperCase()}`);
    
    if (routeWeather.recommendation.suggestions.length > 0) {
      console.log('   Sugerencias:');
      routeWeather.recommendation.suggestions.forEach(suggestion => {
        console.log(`      • ${suggestion}`);
      });
    }

    return routeWeather;
  } catch (error) {
    console.error('❌ Error en destination weather:', error);
    throw error;
  }
}

/**
 * DEMO 4: Planificación de Tours para Flota
 * 
 * Demuestra cómo planificar rutas para múltiples vehículos considerando
 * capacidades, ventanas de tiempo y restricciones.
 */
export async function demoFleetTelematics() {
  console.log('\n🚚 === DEMO: FLEET TELEMATICS & TOUR PLANNING ===\n');

  // Definir flota de vehículos
  const vehicles: FleetVehicle[] = [
    {
      id: 'VAN-001',
      type: 'van',
      capacity: { weight: 1000, count: 20 },
      costs: { fixed: 500, perKm: 8, perHour: 100 },
      shift: {
        start: new Date(2025, 0, 1, 8, 0),
        end: new Date(2025, 0, 1, 18, 0),
      },
      startLocation: { latitude: 19.4326, longitude: -99.1332, name: 'Depot CDMX' },
      skills: ['refrigerated'],
    },
    {
      id: 'TRUCK-001',
      type: 'truck',
      capacity: { weight: 5000, count: 100 },
      costs: { fixed: 800, perKm: 12, perHour: 150 },
      shift: {
        start: new Date(2025, 0, 1, 7, 0),
        end: new Date(2025, 0, 1, 19, 0),
      },
      startLocation: { latitude: 19.4326, longitude: -99.1332, name: 'Depot CDMX' },
      skills: ['heavy'],
    },
  ];

  // Definir trabajos de entrega
  const jobs: DeliveryJob[] = [
    {
      id: 'JOB-001',
      location: { latitude: 19.3, longitude: -99.2, name: 'Cliente A' },
      demand: { weight: 200, count: 5 },
      serviceTime: 15,
      priority: 8,
      skillsRequired: ['refrigerated'],
    },
    {
      id: 'JOB-002',
      location: { latitude: 19.5, longitude: -99.1, name: 'Cliente B' },
      demand: { weight: 800, count: 20 },
      serviceTime: 20,
      priority: 5,
    },
    {
      id: 'JOB-003',
      location: { latitude: 19.4, longitude: -99.3, name: 'Cliente C' },
      demand: { weight: 300, count: 8 },
      serviceTime: 10,
      timeWindow: {
        earliest: new Date(2025, 0, 1, 10, 0),
        latest: new Date(2025, 0, 1, 12, 0),
      },
    },
    {
      id: 'JOB-004',
      location: { latitude: 19.35, longitude: -99.15, name: 'Cliente D' },
      demand: { weight: 2000, count: 40 },
      serviceTime: 30,
      skillsRequired: ['heavy'],
    },
  ];

  try {
    // Planificar tours
    const solution = await hereFleetTelematicsService.planTours(vehicles, jobs, {
      optimizeFor: 'cost',
    });

    console.log('🎯 Solución de Tour Planning:');
    console.log(`   Vehículos utilizados: ${solution.summary.vehiclesUsed}/${vehicles.length}`);
    console.log(`   Trabajos asignados: ${solution.summary.jobsAssigned}/${jobs.length}`);
    console.log(`   Trabajos no asignados: ${solution.summary.jobsUnassigned}`);
    console.log(
      `   Distancia total: ${(solution.summary.totalDistance / 1000).toFixed(1)} km`
    );
    console.log(
      `   Duración total: ${Math.round(solution.summary.totalDuration / 3600)} horas`
    );
    console.log(`   Costo total: $${Math.round(solution.summary.totalCost)} MXN`);
    console.log(
      `   Utilización promedio: ${solution.summary.averageUtilization.toFixed(1)}%`
    );

    console.log('\n📋 Rutas por Vehículo:');
    solution.routes.forEach((route, index) => {
      if (route.stops.length === 0) return;

      console.log(`\n   ${index + 1}. ${route.vehicleId}:`);
      console.log(
        `      Paradas: ${route.stops.length} | Distancia: ${(route.statistics.totalDistance / 1000).toFixed(1)} km | Costo: $${Math.round(route.statistics.totalCost)} MXN`
      );
      console.log(
        `      Utilización: ${route.statistics.utilizationPercentage.toFixed(1)}%`
      );
      console.log(`      Violaciones: ${route.violations.length}`);

      route.stops.forEach((stop, stopIndex) => {
        console.log(
          `         ${stopIndex + 1}. ${stop.jobId} - Llegada: ${stop.arrivalTime.toLocaleTimeString()}`
        );
      });

      if (route.violations.length > 0) {
        console.log('      ⚠️ Violaciones:');
        route.violations.forEach(v => {
          console.log(`         • ${v.type}: ${v.description}`);
        });
      }
    });

    if (solution.unassignedJobs.length > 0) {
      console.log('\n❌ Trabajos No Asignados:');
      solution.unassignedJobs.forEach((unassigned, index) => {
        console.log(`   ${index + 1}. ${unassigned.job.id}: ${unassigned.reason}`);
      });
    }

    return solution;
  } catch (error) {
    console.error('❌ Error en fleet telematics:', error);
    throw error;
  }
}

/**
 * DEMO 5: Geofencing Avanzado
 * 
 * Demuestra cómo crear y monitorear geocercas, registrar eventos
 * y analizar visitas.
 */
export async function demoAdvancedGeofencing() {
  console.log('\n🎯 === DEMO: ADVANCED GEOFENCING ===\n');

  // Crear geocercas alrededor de puntos de interés
  const deliveryPoints = [
    { latitude: 19.4326, longitude: -99.1332, name: 'Almacén Central' },
    { latitude: 19.3, longitude: -99.2, name: 'Zona de Entregas Norte' },
    { latitude: 19.5, longitude: -99.1, name: 'Zona de Entregas Sur' },
  ];

  try {
    // Generar geocercas dinámicas
    const geofences = await hereAdvancedGeofencingService.generateDynamicGeofences(
      deliveryPoints,
      500 // 500m de radio
    );

    console.log('🎯 Geocercas Generadas:');
    geofences.forEach((geofence, index) => {
      console.log(
        `   ${index + 1}. ${geofence.name} (${geofence.radius}m de radio)`
      );
    });

    // Crear capa de geocercas
    const layer = await hereAdvancedGeofencingService.createGeofenceLayer(
      'Zonas de Entrega CDMX',
      geofences
    );

    console.log(`\n📁 Capa creada: ${layer.name} (${layer.id})`);

    // Simular verificación de vehículo en geocercas
    const vehicleLocation = { latitude: 19.43, longitude: -99.13 };

    const checkResult = await hereAdvancedGeofencingService.checkMultipleGeofences(
      vehicleLocation,
      geofences
    );

    console.log('\n📍 Verificación de Ubicación de Vehículo:');
    console.log(`   Dentro de ${checkResult.inside.length} geocerca(s)`);
    console.log(`   Fuera de ${checkResult.outside.length} geocerca(s)`);

    if (checkResult.inside.length > 0) {
      console.log('   Geocercas activas:');
      checkResult.inside.forEach(gf => {
        console.log(`      ✅ ${gf.name}`);
      });
    }

    if (checkResult.nearest) {
      console.log(
        `\n   Más cercana: ${checkResult.nearest.geofence.name} (${Math.round(checkResult.nearest.distance)}m)`
      );
    }

    // Simular eventos de entrada/salida
    console.log('\n📝 Simulando Eventos de Geocerca:');

    for (const geofence of checkResult.inside) {
      const event = await hereAdvancedGeofencingService.recordGeofenceEvent(
        geofence,
        GeofenceEventType.ENTER,
        vehicleLocation,
        'VEH-001',
        'Camión de Reparto'
      );

      console.log(`   ✅ Evento registrado: ${event.id}`);
      console.log(
        `      ${event.entityName} → ${event.eventType} → ${event.geofenceName}`
      );
    }

    // Obtener eventos recientes
    const events = await hereAdvancedGeofencingService.getEntityEvents('VEH-001', {
      limit: 5,
    });

    console.log(`\n📜 Eventos Recientes (${events.length}):');
    events.forEach((event, index) => {
      console.log(
        `   ${index + 1}. ${event.timestamp.toLocaleTimeString()} - ${event.eventType} ${event.geofenceName}`
      );
    });

    // Análisis de visitas
    const analysis = await hereAdvancedGeofencingService.analyzeGeofenceVisits(
      'VEH-001',
      {
        start: new Date(Date.now() - 24 * 3600000), // últimas 24h
        end: new Date(),
      }
    );

    console.log('\n📊 Análisis de Visitas:');
    console.log(`   Total de visitas: ${analysis.totalVisits}`);
    console.log(`   Geocercas únicas visitadas: ${analysis.uniqueGeofences}`);
    console.log(
      `   Tiempo total en geocercas: ${Math.round(analysis.totalTimeInGeofences / 60)} min`
    );

    if (analysis.mostVisited.length > 0) {
      console.log('\n   Geocercas Más Visitadas:');
      analysis.mostVisited.slice(0, 3).forEach((visit, index) => {
        console.log(
          `      ${index + 1}. ${visit.geofence} - ${visit.visits} visita(s), ${Math.round(visit.totalTime / 60)} min total`
        );
      });
    }

    return { layer, geofences, events, analysis };
  } catch (error) {
    console.error('❌ Error en advanced geofencing:', error);
    throw error;
  }
}

/**
 * DEMO COMPLETO: Flujo Integrado de Entrega
 * 
 * Demuestra cómo todos los servicios trabajan juntos en un flujo
 * completo de planificación y ejecución de entregas.
 */
export async function demoCompleteDeliveryFlow() {
  console.log('\n🎉 === DEMO COMPLETO: FLUJO INTEGRADO DE ENTREGA ===\n');

  try {
    console.log('Paso 1: Verificando clima en destinos...');
    const weather = await demoDestinationWeather();

    if (weather.overallRisk === 'high') {
      console.log('\n⚠️ ADVERTENCIA: Condiciones climáticas adversas detectadas');
      console.log('Se recomienda posponer entregas o tomar precauciones extremas');
    }

    console.log('\n\nPaso 2: Optimizando asignación de vehículos...');
    const matrix = await demoMatrixRouting();

    console.log('\n\nPaso 3: Planificando tours para flota...');
    const tours = await demoFleetTelematics();

    console.log('\n\nPaso 4: Calculando rutas para camiones...');
    const truckRoute = await demoTruckRouting();

    console.log('\n\nPaso 5: Configurando geocercas de monitoreo...');
    const geofencing = await demoAdvancedGeofencing();

    console.log('\n\n✅ === FLUJO COMPLETO FINALIZADO ===');
    console.log('\n📊 Resumen:');
    console.log(`   • Clima analizado en ${weather.weatherByWaypoint.length} puntos`);
    console.log(
      `   • ${matrix.optimalAssignments.length} vehículos asignados óptimamente`
    );
    console.log(
      `   • ${tours.summary.jobsAssigned} entregas planificadas en ${tours.summary.vehiclesUsed} vehículos`
    );
    console.log(
      `   • Ruta de camión calculada: ${(truckRoute.distance / 1000).toFixed(1)} km con ${truckRoute.restrictions.length} restricciones`
    );
    console.log(`   • ${geofencing.geofences.length} geocercas activas monitoreando`);

    return {
      weather,
      matrix,
      tours,
      truckRoute,
      geofencing,
    };
  } catch (error) {
    console.error('❌ Error en flujo completo:', error);
    throw error;
  }
}

/**
 * Ejecutar todas las demos
 */
export async function runAllDemos() {
  try {
    await demoTruckRouting();
    await demoMatrixRouting();
    await demoDestinationWeather();
    await demoFleetTelematics();
    await demoAdvancedGeofencing();
    await demoCompleteDeliveryFlow();

    console.log('\n\n🎉 ¡TODAS LAS DEMOS COMPLETADAS EXITOSAMENTE! 🎉\n');
  } catch (error) {
    console.error('\n❌ Error ejecutando demos:', error);
  }
}
