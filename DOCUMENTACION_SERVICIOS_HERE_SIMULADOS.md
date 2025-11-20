# 📚 Servicios HERE Maps Simulados - Documentación Completa

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Servicios Implementados](#servicios-implementados)
3. [Guía de Uso](#guía-de-uso)
4. [Integración con Simulación de Entregas](#integración-con-simulación-de-entregas)
5. [Ejemplos de Código](#ejemplos-de-código)
6. [Referencias a Documentación Oficial](#referencias-a-documentación-oficial)

---

## 🎯 Introducción

Este documento describe los servicios simulados de HERE Maps implementados para el proyecto FultraApps 2.0. Estos servicios permiten el desarrollo y testing completo de funcionalidades de ruteo, optimización de flotas, geocercas y clima **sin realizar llamadas reales a APIs externas**.

### ¿Por Qué Servicios Simulados?

- ✅ **Desarrollo sin dependencias**: No requieren API Keys activas ni conexión a internet
- ✅ **Testing predecible**: Datos consistentes y controlados
- ✅ **Desarrollo rápido**: Sin latencias de red ni límites de API
- ✅ **Cero costos**: No consumen cuota de APIs de pago
- ✅ **Fácil migración**: Mismo interfaz que APIs reales, solo cambiar implementación

---

## 📦 Servicios Implementados

### 1. 🚛 Truck Routing Service

**Archivo**: `hereTruckRoutingService.ts`

**Propósito**: Calcular rutas optimizadas para camiones considerando restricciones específicas como peso, altura, materiales peligrosos, peajes, etc.

**Funcionalidades**:
- ✅ Cálculo de rutas con restricciones de vehículo (peso, altura, ancho, longitud)
- ✅ Detección de restricciones en la ruta (puentes bajos, túneles, zonas de bajas emisiones)
- ✅ Manejo de materiales peligrosos (HazMat)
- ✅ Estimación de consumo de combustible
- ✅ Cálculo de costos de peaje
- ✅ Análisis de rutas alternativas
- ✅ Validación de ruta para especificaciones del camión

**Datos Simulados**:
- Distancias calculadas con Haversine + factores de ajuste según restricciones
- Restricciones generadas según especificaciones del camión
- Consumo de combustible: ~32 litros/100km
- Peajes: ~$1.50 MXN por km en autopistas

**Documentación Oficial HERE**:
- [Truck Routing API](https://developer.here.com/documentation/routing-api/dev_guide/topics/truck-routing.html)

---

### 2. 📊 Matrix Routing Service

**Archivo**: `hereMatrixRoutingService.ts`

**Propósito**: Calcular matrices de distancia y tiempo entre múltiples puntos para optimización masiva de rutas.

**Funcionalidades**:
- ✅ Cálculo de matriz N×M (distancia/tiempo entre todos los puntos)
- ✅ Optimización de asignación de vehículos a destinos
- ✅ Búsqueda de puntos más cercanos
- ✅ Análisis de cobertura geográfica de flota
- ✅ Consideración de tráfico en tiempo real (simulado)

**Datos Simulados**:
- Distancias calculadas con Haversine
- Velocidad promedio según modo de transporte (car: 45km/h, truck: 40km/h, pedestrian: 5km/h)
- Factor de tráfico aleatorio: 5-25% más lento en horas pico
- Algoritmo greedy para optimización de asignaciones

**Documentación Oficial HERE**:
- [Matrix Routing API](https://developer.here.com/documentation/matrix-routing-api/dev_guide/index.html)

---

### 3. 🌤️ Destination Weather Service

**Archivo**: `hereDestinationWeatherService.ts`

**Propósito**: Obtener información del clima en destinos de entrega para planificar rutas considerando condiciones climáticas.

**Funcionalidades**:
- ✅ Clima actual en ubicación
- ✅ Pronóstico por hora (24 horas)
- ✅ Pronóstico diario (7 días)
- ✅ Alertas climáticas (lluvia intensa, tormenta, niebla, vientos fuertes)
- ✅ Análisis de clima en ruta completa
- ✅ Recomendaciones basadas en clima

**Datos Simulados**:
- Temperatura según latitud y hora del día (más calor cerca del ecuador)
- Condiciones climáticas aleatorias pero realistas
- Alertas generadas según condiciones severas
- Visibilidad reducida en niebla
- Recomendaciones de seguridad automáticas

**Documentación Oficial HERE**:
- [Destination Weather API](https://developer.here.com/documentation/destination-weather/dev_guide/index.html)

---

### 4. 🚚 Fleet Telematics & Tour Planning Service

**Archivo**: `hereFleetTelematicsService.ts`

**Propósito**: Gestión de flotas y planificación de rutas multi-vehículo (VRP - Vehicle Routing Problem).

**Funcionalidades**:
- ✅ Planificación de tours para múltiples vehículos
- ✅ Asignación óptima de trabajos considerando:
  - Capacidad de vehículos (peso, volumen, cantidad)
  - Ventanas de tiempo de entrega
  - Turnos de conductores
  - Skills/habilidades requeridas
  - Costos (fijo, por km, por hora)
- ✅ Reoptimización de rutas en tiempo real
- ✅ Telemetría de vehículos (ubicación, velocidad, combustible, motor)
- ✅ Análisis de comportamiento de conductor

**Datos Simulados**:
- Algoritmo greedy para asignación de trabajos a vehículos
- Validación de capacidades y restricciones
- Cálculo de costos según configuración del vehículo
- Telemetría aleatoria pero realista
- Score de conductor basado en métricas simuladas

**Documentación Oficial HERE**:
- [Tour Planning API](https://developer.here.com/documentation/tour-planning/dev_guide/index.html)
- [Fleet Telematics API](https://developer.here.com/documentation/fleet-telematics/dev_guide/index.html)

---

### 5. 🎯 Advanced Geofencing Service

**Archivo**: `hereAdvancedGeofencingService.ts`

**Propósito**: Geofencing avanzado con soporte para múltiples tipos de geocercas y análisis de tiempo en zonas.

**Funcionalidades**:
- ✅ Geocercas circulares, poligonales y de corredor
- ✅ Capas de geocercas para organización
- ✅ Verificación de ubicación en geocercas
- ✅ Registro de eventos (entrada, salida, permanencia)
- ✅ Estadísticas de tiempo en geocercas
- ✅ Análisis de visitas (por hora, geocercas más visitadas)
- ✅ Generación dinámica de geocercas

**Datos Simulados**:
- Verificación usando algoritmos geométricos (Haversine para circular, ray-casting para polígonos)
- Historial de eventos almacenado en memoria
- Estadísticas calculadas en tiempo real
- Análisis agregado por entidad y geocerca

**Documentación Oficial HERE**:
- [Geofencing API](https://developer.here.com/documentation/geofencing/dev_guide/index.html)

---

## 📖 Guía de Uso

### Importación de Servicios

```typescript
import {
  hereTruckRoutingService,
  hereMatrixRoutingService,
  hereDestinationWeatherService,
  hereFleetTelematicsService,
  hereAdvancedGeofencingService,
} from '@/apps/entregas/services';
```

### Uso Básico

#### 1. Truck Routing

```typescript
const truckSpecs = {
  grossWeight: 18, // toneladas
  height: 4.2, // metros
  width: 2.5,
  length: 12,
  shippedHazardousGoods: ['flammable'],
};

const route = await hereTruckRoutingService.calculateTruckRoute(
  { latitude: 19.4326, longitude: -99.1332 }, // origen
  { latitude: 25.6866, longitude: -100.3161 }, // destino
  { truckSpecs }
);

console.log(`Distancia: ${(route.distance / 1000).toFixed(1)} km`);
console.log(`Restricciones: ${route.restrictions.length}`);
console.log(`Peajes: $${route.tollCosts} MXN`);
```

#### 2. Matrix Routing

```typescript
const vehicles = [
  { id: 'V1', latitude: 19.43, longitude: -99.13, nombre: 'Vehículo 1' },
  { id: 'V2', latitude: 20.66, longitude: -103.35, nombre: 'Vehículo 2' },
];

const destinations = [
  { id: 'D1', latitude: 19.3, longitude: -99.2, nombre: 'Cliente A' },
  { id: 'D2', latitude: 20.7, longitude: -103.4, nombre: 'Cliente B' },
];

const optimization = await hereMatrixRoutingService.optimizeAssignments(
  vehicles,
  destinations,
  { optimizeFor: 'distance' }
);

console.log(`Ahorro: ${optimization.savings.percentageImprovement.toFixed(1)}%`);
```

#### 3. Destination Weather

```typescript
const weather = await hereDestinationWeatherService.getCurrentWeather(
  19.4326,
  -99.1332
);

console.log(`Temperatura: ${Math.round(weather.temperature)}°C`);
console.log(`Condición: ${weather.description}`);

// Analizar ruta completa
const waypoints = [
  { latitude: 19.43, longitude: -99.13, nombre: 'CDMX' },
  { latitude: 25.69, longitude: -100.31, nombre: 'Monterrey' },
];

const routeWeather = await hereDestinationWeatherService.analyzeRouteWeather(waypoints);

console.log(`Riesgo: ${routeWeather.overallRisk}`);
console.log(`Proceder: ${routeWeather.recommendation.shouldProceed}`);
```

#### 4. Fleet Telematics

```typescript
const vehicles = [
  {
    id: 'VAN-001',
    type: 'van',
    capacity: { weight: 1000, count: 20 },
    costs: { fixed: 500, perKm: 8, perHour: 100 },
    shift: { start: new Date(), end: new Date() },
    startLocation: { latitude: 19.43, longitude: -99.13 },
  },
];

const jobs = [
  {
    id: 'JOB-001',
    location: { latitude: 19.3, longitude: -99.2 },
    demand: { weight: 200, count: 5 },
    serviceTime: 15,
  },
];

const solution = await hereFleetTelematicsService.planTours(vehicles, jobs);

console.log(`Vehículos usados: ${solution.summary.vehiclesUsed}`);
console.log(`Costo total: $${Math.round(solution.summary.totalCost)} MXN`);
```

#### 5. Advanced Geofencing

```typescript
const geofences = await hereAdvancedGeofencingService.generateDynamicGeofences(
  [
    { latitude: 19.43, longitude: -99.13, name: 'Almacén' },
    { latitude: 19.3, longitude: -99.2, name: 'Zona Norte' },
  ],
  500 // radio en metros
);

const checkResult = await hereAdvancedGeofencingService.checkMultipleGeofences(
  { latitude: 19.43, longitude: -99.13 },
  geofences
);

console.log(`Dentro de ${checkResult.inside.length} geocerca(s)`);

// Registrar evento
await hereAdvancedGeofencingService.recordGeofenceEvent(
  geofences[0],
  GeofenceEventType.ENTER,
  { latitude: 19.43, longitude: -99.13 },
  'VEH-001'
);
```

---

## 🔗 Integración con Simulación de Entregas

Los servicios simulados se integran perfectamente con el sistema de simulación de entregas existente:

### 1. En Simulación de Entrega

```typescript
import { simulationService } from './simulationService';
import { hereDestinationWeatherService } from './hereDestinationWeatherService';
import { hereTruckRoutingService } from './hereTruckRoutingService';

async function planDeliveryWithWeather(delivery) {
  // Verificar clima en destino
  const weather = await hereDestinationWeatherService.getCurrentWeather(
    delivery.latitude,
    delivery.longitude
  );

  if (weather.condition === 'heavy_rain' || weather.condition === 'thunderstorm') {
    console.log('⚠️ Condiciones climáticas adversas, ajustando ruta...');
    
    // Calcular ruta de camión con precauciones
    const route = await hereTruckRoutingService.calculateTruckRoute(
      currentLocation,
      { latitude: delivery.latitude, longitude: delivery.longitude },
      {
        truckSpecs: { grossWeight: 12 },
        routingMode: 'balanced', // Priorizar seguridad sobre velocidad
      }
    );
    
    return route;
  }

  // Usar ruteo normal
  return await routingService.obtenerRutaOptima(currentLocation, delivery);
}
```

### 2. En Optimización Multi-Stop

```typescript
import { hereMatrixRoutingService } from './hereMatrixRoutingService';
import { hereMultiStopOptimizerService } from './hereMultiStopOptimizerService';

async function optimizeDeliveryRoute(depot, deliveries) {
  // Usar matrix routing para encontrar asignación óptima
  const vehicleLocation = [depot];
  const deliveryLocations = deliveries.map(d => ({
    id: d.id,
    latitude: d.latitude,
    longitude: d.longitude,
    nombre: d.cliente,
  }));

  const optimization = await hereMatrixRoutingService.optimizeAssignments(
    vehicleLocation,
    deliveryLocations,
    { optimizeFor: 'time', considerTraffic: true }
  );

  // Usar el orden optimizado en multi-stop optimizer
  const waypoints = optimization.optimalAssignments.map(a =>
    deliveries.find(d => d.id === a.destinationId)
  );

  return await hereMultiStopOptimizerService.optimizeMultiStopRoute(
    depot,
    waypoints,
    { considerTraffic: true }
  );
}
```

### 3. Con Geocercas

```typescript
import { hereAdvancedGeofencingService } from './hereAdvancedGeofencingService';

async function setupDeliveryZones(deliveries) {
  // Crear geocercas alrededor de zonas de entrega
  const geofences = await hereAdvancedGeofencingService.generateDynamicGeofences(
    deliveries.map(d => ({
      latitude: d.latitude,
      longitude: d.longitude,
      name: d.cliente,
    })),
    200 // 200m de radio
  );

  // Crear capa de geocercas
  const layer = await hereAdvancedGeofencingService.createGeofenceLayer(
    'Zonas de Entrega del Día',
    geofences
  );

  return { geofences, layer };
}

async function trackVehicleInZones(vehicleLocation, geofences) {
  const result = await hereAdvancedGeofencingService.checkMultipleGeofences(
    vehicleLocation,
    geofences
  );

  // Registrar entrada en zona
  for (const geofence of result.inside) {
    await hereAdvancedGeofencingService.recordGeofenceEvent(
      geofence,
      GeofenceEventType.ENTER,
      vehicleLocation,
      'VEHICLE-ID'
    );
    
    console.log(`🎯 Vehículo entró en zona: ${geofence.name}`);
  }
}
```

---

## 💡 Ejemplos de Código

Ver el archivo `hereServicesDemo.ts` para ejemplos completos de uso de todos los servicios.

Para ejecutar todas las demos:

```typescript
import { runAllDemos } from '@/apps/entregas/services/hereServicesDemo';

// Ejecutar todas las demostraciones
await runAllDemos();
```

---

## 📚 Referencias a Documentación Oficial

### APIs de HERE Maps

1. **Routing API v8**
   - https://developer.here.com/documentation/routing-api/dev_guide/index.html
   - Incluye: Car, Truck, Pedestrian, Bicycle routing

2. **Truck Routing**
   - https://developer.here.com/documentation/routing-api/dev_guide/topics/truck-routing.html
   - Restricciones de vehículo, HazMat, túneles

3. **Matrix Routing API v8**
   - https://developer.here.com/documentation/matrix-routing-api/dev_guide/index.html
   - Cálculos masivos de distancia/tiempo

4. **Destination Weather API v3**
   - https://developer.here.com/documentation/destination-weather/dev_guide/index.html
   - Clima actual, pronósticos, alertas

5. **Tour Planning API**
   - https://developer.here.com/documentation/tour-planning/dev_guide/index.html
   - VRP, TSP, multi-depot, capacidades

6. **Fleet Telematics API**
   - https://developer.here.com/documentation/fleet-telematics/dev_guide/index.html
   - Seguimiento, telemetría, análisis

7. **Geofencing API v2**
   - https://developer.here.com/documentation/geofencing/dev_guide/index.html
   - Geocercas, eventos, notificaciones

### Recursos Adicionales

- **API Explorer**: https://developer.here.com/api-explorer/rest
- **Tutoriales**: https://developer.here.com/tutorials
- **GitHub Samples**: https://github.com/heremaps

---

## 🔧 Notas de Implementación

### Migración a APIs Reales

Cuando esté listo para migrar a las APIs reales de HERE Maps:

1. **Obtener API Key**: Registrarse en https://developer.here.com/
2. **Configurar en `.env`**: `HERE_MAPS_API_KEY=tu-key-aqui`
3. **Actualizar servicios**: Cambiar de simulación a llamadas HTTP reales
4. **Mantener mismos interfaces**: Los tipos y métodos son compatibles

### Limitaciones de la Simulación

- ⚠️ Rutas calculadas con Haversine (línea recta), no consideran red vial real
- ⚠️ Tráfico simulado con factores aleatorios, no datos reales
- ⚠️ Clima generado aleatoriamente, no datos meteorológicos reales
- ⚠️ Optimización usa algoritmos simples (greedy), no optimización exacta
- ⚠️ Sin persistencia real, datos en memoria

### Ventajas de la Simulación

- ✅ Desarrollo completamente offline
- ✅ Testing predecible y repetible
- ✅ Sin costos de API
- ✅ Delays controlados (300-2000ms)
- ✅ Fácil modificación de datos de prueba

---

## 🎯 Próximos Pasos

1. **Probar servicios individualmente**: Usar cada servicio por separado
2. **Ejecutar demos**: Correr `runAllDemos()` para ver funcionamiento completo
3. **Integrar con simulación**: Añadir servicios a flujos de entrega existentes
4. **Personalizar datos**: Ajustar datos simulados según necesidades
5. **Documentar casos de uso**: Agregar ejemplos específicos de su aplicación

---

**Última actualización**: 16 de Noviembre 2025  
**Versión**: 1.0  
**Autor**: Sistema de Simulación FultraApps 2.0
