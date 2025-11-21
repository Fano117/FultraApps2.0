# Documentación Completa de Funciones del Sistema de Entregas

## Índice
1. [Servicios de Validación y Geocodificación](#servicios-de-validación-y-geocodificación)
2. [Servicios de Gestión de Rutas](#servicios-de-gestión-de-rutas)
3. [Servicios de Procesamiento de Entregas](#servicios-de-procesamiento-de-entregas)
4. [Servicios de API](#servicios-de-api)
5. [Servicios HERE Maps](#servicios-here-maps)
6. [Servicios de Simulación](#servicios-de-simulación)
7. [Servicios de Ubicación y Tracking](#servicios-de-ubicación-y-tracking)

---

## Servicios de Validación y Geocodificación

### AddressValidationService

**Archivo:** `src/apps/entregas/services/addressValidationService.ts`

#### `validarYGecocodificarDireccion(direccion: ApiDireccion): Promise<DireccionValidada>`

**Propósito:** Validar y geocodificar una dirección individual con flujo de fallback de 3 niveles.

**Parámetros:**
- `direccion: ApiDireccion` - Dirección a validar con campos opcionales

**Retorna:** `Promise<DireccionValidada>` - Resultado de la validación con coordenadas o error

**Flujo:**
1. **Nivel 1:** Extraer coordenadas de la API si existen
2. **Nivel 2:** Geocodificar usando campos desglosados (calle, colonia, cp, etc.)
3. **Nivel 3:** Geocodificar usando dirección completa
4. **Nivel 4:** Marcar como inválida si todos los niveles fallan

**Integración con nuevo formato JSON:** ✅ Directo  
**Maneja datos incompletos:** ✅ Sí  
**Maneja errores:** ✅ Sí, retorna DireccionValidada con esValida=false  

**Ejemplo:**
```typescript
const direccion = {
  direccion: 'Av. Reforma 250, Centro',
  cliente: 'CLIENTE SA',
  cp: '06000',
  calle: 'Av. Reforma',
  noExterior: '250',
};

const resultado = await addressValidationService.validarYGecocodificarDireccion(direccion);
if (resultado.esValida) {
  console.log(`Coordenadas: ${resultado.coordenadas.latitud}, ${resultado.coordenadas.longitud}`);
  console.log(`Fuente: ${resultado.coordenadas.fuente}`);
} else {
  console.error(`Error: ${resultado.mensajeError}`);
}
```

---

#### `validarDirecciones(direcciones: ApiDireccion[]): Promise<DireccionValidada[]>`

**Propósito:** Validar múltiples direcciones en lote.

**Parámetros:**
- `direcciones: ApiDireccion[]` - Array de direcciones a validar

**Retorna:** `Promise<DireccionValidada[]>` - Array de resultados de validación

**Características:**
- Procesa direcciones secuencialmente
- Genera logs detallados para cada dirección
- Retorna estadísticas al final

**Integración con nuevo formato JSON:** ✅ Directo  
**Maneja datos incompletos:** ✅ Sí  
**Maneja errores:** ✅ Continúa con las siguientes direcciones  

**Ejemplo:**
```typescript
const direcciones = [/* array de ApiDireccion */];
const validadas = await addressValidationService.validarDirecciones(direcciones);

const validas = validadas.filter(d => d.esValida).length;
console.log(`Validadas: ${validas}/${validadas.length}`);
```

---

#### `getEstadisticas(direcciones: DireccionValidada[]): EstadisticasValidacion`

**Propósito:** Generar estadísticas de un conjunto de direcciones validadas.

**Parámetros:**
- `direcciones: DireccionValidada[]` - Direcciones ya validadas

**Retorna:** Objeto con estadísticas:
- `total`: Número total de direcciones
- `validas`: Número de direcciones válidas
- `invalidas`: Número de direcciones inválidas
- `porFuente`: Distribución por fuente de coordenadas
- `confianzaPromedio`: Confianza promedio de geocodificación

**Integración con nuevo formato JSON:** ✅ Indirecto (procesa resultados)  
**Maneja datos incompletos:** ✅ Sí  
**Maneja errores:** ✅ N/A (solo procesa resultados)  

---

#### `configure(config: Partial<ValidationConfig>): void`

**Propósito:** Configurar parámetros del servicio de validación.

**Parámetros:**
- `config.geocodingTimeout`: Timeout para geocodificación (ms)
- `config.confianzaMinima`: Confianza mínima para aceptar resultado (0-1)
- `config.paisFiltro`: País para filtrar resultados (ej: 'MEX')
- `config.idioma`: Idioma para resultados (ej: 'es-MX')
- `config.verboseLogs`: Habilitar logs detallados

**Ejemplo:**
```typescript
addressValidationService.configure({
  confianzaMinima: 0.7,
  geocodingTimeout: 8000,
  verboseLogs: true,
});
```

---

## Servicios de Gestión de Rutas

### RouteManagementService

**Archivo:** `src/apps/entregas/services/routeManagementService.ts`

#### `generarORecuperarRuta(direcciones, idRutaHereMapsExistente, opciones): Promise<ResultadoGeneracionRuta>`

**Propósito:** Generar una nueva ruta o recuperar/recalcular una existente usando HERE Maps.

**Parámetros:**
- `direcciones: DireccionValidada[]` - Direcciones validadas para la ruta
- `idRutaHereMapsExistente: string | null` - ID de ruta existente (null para ruta nueva)
- `opciones: OpcionesProcesamiento` - Opciones de configuración

**Retorna:** `Promise<ResultadoGeneracionRuta>` con:
- `ruta`: Ruta optimizada de HERE Maps
- `metadata`: Metadata de la ruta
- `puntoInicio`: Punto de inicio usado
- `esRutaNueva`: Si es ruta nueva o recalculada
- `idRutaHereMaps`: ID de la ruta

**Flujo:**
1. Filtrar direcciones válidas
2. Determinar punto de inicio (almacén o GPS)
3. Verificar si existe ruta previa
4. Confirmar recálculo con usuario si aplica
5. Calcular ruta con HERE Maps
6. Generar ID de ruta si es necesario

**Integración con nuevo formato JSON:** ✅ Directo (usa idRutaHereMaps del JSON)  
**Maneja datos incompletos:** ✅ Filtra direcciones inválidas  
**Maneja errores:** ✅ Propaga excepciones con contexto  

**Ejemplo:**
```typescript
const resultado = await routeManagementService.generarORecuperarRuta(
  direccionesValidadas,
  'RUTA-EXISTENTE-123',
  {
    confirmarRecalculo: true,
    usarUbicacionActual: true,
    radioGeocerca: 100,
  }
);

console.log(`Ruta ${resultado.esRutaNueva ? 'nueva' : 'recalculada'}: ${resultado.idRutaHereMaps}`);
```

---

#### `determinarPuntoInicio(opciones): Promise<PuntoInicio>`

**Propósito:** Determinar punto de inicio de la ruta (almacén o GPS actual) basado en geocerca.

**Parámetros:**
- `opciones: OpcionesProcesamiento` - Configuración de almacén y geocerca

**Retorna:** `Promise<PuntoInicio>` con:
- `latitud`, `longitud`: Coordenadas del punto de inicio
- `tipo`: 'almacen' o 'gps-actual'
- `nombre`: Nombre descriptivo
- `dentroDeGeocerca`: Si está dentro de la geocerca del almacén

**Lógica:**
1. Obtener ubicación GPS actual
2. Calcular distancia al almacén
3. Si distancia ≤ radioGeocerca → Usar almacén
4. Si distancia > radioGeocerca → Usar GPS actual

**Integración con nuevo formato JSON:** ✅ Indirecto (prepara punto de inicio)  
**Maneja datos incompletos:** ✅ Fallback a almacén si GPS falla  
**Maneja errores:** ✅ Sí, con fallback  

---

#### `verificarIncidentesEnRuta(ruta): Promise<{tieneIncidentes, recomendarDesvio, razon}>`

**Propósito:** Verificar si hay incidentes de tráfico en la ruta calculada.

**Parámetros:**
- `ruta: RutaOptima` - Ruta a verificar

**Retorna:** Promise con:
- `tieneIncidentes: boolean` - Si hay algún incidente
- `recomendarDesvio: boolean` - Si se recomienda recalcular
- `razon?: string` - Razón del desvío

**Integración:** Usa `hereTrafficService` para obtener incidentes

**Integración con nuevo formato JSON:** ✅ Indirecto (verifica ruta generada)  
**Maneja datos incompletos:** ✅ Sí  
**Maneja errores:** ✅ Retorna sin incidentes en caso de error  

---

#### `guardarRutaEnBackend(folioEmbarque, idRutaHereMaps, metadata): Promise<boolean>`

**Propósito:** Guardar la ruta y su ID en el backend.

**Estado:** 🚧 TODO - Endpoint no implementado aún en backend

**Parámetros:**
- `folioEmbarque: string` - Folio del embarque
- `idRutaHereMaps: string` - ID de la ruta
- `metadata: RutaMetadata` - Metadata de la ruta

**Retorna:** `Promise<boolean>` - Éxito o fallo

**Integración con nuevo formato JSON:** ✅ Directo (guarda idRutaHereMaps)  
**Maneja datos incompletos:** ⚠️ Pendiente de implementación  
**Maneja errores:** ✅ Retorna false en caso de error  

---

## Servicios de Procesamiento de Entregas

### DeliveryProcessingService

**Archivo:** `src/apps/entregas/services/deliveryProcessingService.ts`

#### `procesarEntregasDesdeAPI(apiResponse, opciones): Promise<ResultadoProcesamiento>`

**Propósito:** Orquestar el procesamiento completo de entregas desde el JSON de la API.

**Parámetros:**
- `apiResponse: ApiDeliveryResponse` - Respuesta de la API en nuevo formato
- `opciones: OpcionesProcesamiento` - Opciones de procesamiento

**Retorna:** `Promise<ResultadoProcesamiento>` con:
- `entregas: EntregasProcesadas` - Datos procesados
- `ruta: ResultadoGeneracionRuta` - Ruta generada
- `direccionesInvalidas: DireccionValidada[]` - Direcciones que fallaron
- `tieneIncidentesCriticos: boolean` - Si hay incidentes en ruta
- `mensaje: string` - Mensaje resumen
- `exito: boolean` - Éxito del procesamiento

**Flujo (5 pasos):**
1. **Validación:** Valida y geocodifica todas las direcciones
2. **Generación de Ruta:** Genera o recupera ruta HERE Maps
3. **Verificación de Tráfico:** Verifica incidentes
4. **Guardado:** Guarda ruta en backend
5. **Notificación:** Notifica direcciones inválidas

**Integración con nuevo formato JSON:** ✅ Directo - Este es el servicio principal  
**Maneja datos incompletos:** ✅ Sí, filtra y notifica  
**Maneja errores:** ✅ Captura y registra todos los errores  

**Ejemplo:**
```typescript
const apiResponse = {
  folioEmbarque: 'M1234-567890',
  idRutaHereMaps: 'RUTA-EXISTENTE-123',
  direcciones: [/* ... */],
};

const resultado = await deliveryProcessingService.procesarEntregasDesdeAPI(apiResponse);

if (resultado.exito) {
  console.log(`✅ ${resultado.mensaje}`);
  console.log(`Ruta ID: ${resultado.ruta.idRutaHereMaps}`);
} else {
  console.error('❌ Procesamiento falló');
}
```

---

#### `procesarEntregasSimuladas(ejemploJSON, opciones): Promise<ResultadoProcesamiento>`

**Propósito:** Procesar entregas en modo simulación (sin diálogos de confirmación).

**Uso:** Testing y desarrollo

**Integración con nuevo formato JSON:** ✅ Directo  
**Maneja datos incompletos:** ✅ Sí  
**Maneja errores:** ✅ Sí  

---

#### `generarEjemploJSON(tipo): ApiDeliveryResponse`

**Propósito:** Generar datos de ejemplo para testing y simulación.

**Tipos disponibles:**
- `'con-coordenadas'`: Todas las direcciones tienen coordenadas
- `'sin-coordenadas'`: Ninguna tiene coordenadas
- `'mixto'`: Mezcla (caso más realista)
- `'direcciones-invalidas'`: Incluye direcciones que no pueden geocodificarse

**Integración con nuevo formato JSON:** ✅ Directo - Genera formato correcto  
**Maneja datos incompletos:** ✅ Genera diferentes escenarios  
**Maneja errores:** ✅ N/A (genera datos válidos)  

**Ejemplo:**
```typescript
const ejemploMixto = deliveryProcessingService.generarEjemploJSON('mixto');
const resultado = await deliveryProcessingService.procesarEntregasSimuladas(ejemploMixto);
```

---

#### `getEstadisticas(resultado): EstadisticasProcesamiento`

**Propósito:** Obtener estadísticas detalladas del procesamiento.

**Retorna:**
- `tiempoProcesamiento`: Tiempo total en ms
- `direccionesTotales`: Total de direcciones
- `direccionesValidas`: Número válidas
- `direccionesInvalidas`: Número inválidas
- `porcentajeExito`: Porcentaje de éxito
- `fuentesCoordenadas`: Distribución por fuente
- `confianzaPromedio`: Confianza promedio

**Integración con nuevo formato JSON:** ✅ Indirecto (estadísticas de procesamiento)  
**Maneja datos incompletos:** ✅ Sí  
**Maneja errores:** ✅ N/A  

---

## Servicios de API

### EntregasApiService

**Archivo:** `src/apps/entregas/services/entregasApiService.ts`

#### ⭐ `fetchEntregasConNuevoFormato(): Promise<ApiDeliveryResponse>` (NUEVO)

**Propósito:** Obtener entregas desde el backend en el nuevo formato JSON.

**Retorna:** `Promise<ApiDeliveryResponse>` con folioEmbarque, idRutaHereMaps y direcciones[]

**Endpoint:** `/Mobile/entregas-v2` (🚧 TODO: actualizar cuando backend esté listo)

**Modos:**
- **Mock:** Retorna datos de ejemplo generados
- **Backend Real:** Llama al endpoint (con fallback a mock si falla)

**Integración con nuevo formato JSON:** ✅ Directo - Este es el endpoint principal  
**Maneja datos incompletos:** ✅ Valida estructura de respuesta  
**Maneja errores:** ✅ Fallback a mock en desarrollo  

**Ejemplo:**
```typescript
const entregas = await entregasApiService.fetchEntregasConNuevoFormato();
console.log(`Folio: ${entregas.folioEmbarque}`);
console.log(`Direcciones: ${entregas.direcciones.length}`);
```

---

#### ⭐ `procesarEntregasCompletas(): Promise<EntregasProcesadas>` (NUEVO)

**Propósito:** Método conveniente que obtiene y procesa entregas en un solo paso.

**Flujo:**
1. Obtiene datos con `fetchEntregasConNuevoFormato()`
2. Procesa con `deliveryProcessingService.procesarEntregasDesdeAPI()`
3. Retorna entregas procesadas

**Integración con nuevo formato JSON:** ✅ Directo  
**Maneja datos incompletos:** ✅ Sí, delegado a servicios  
**Maneja errores:** ✅ Propaga errores con contexto  

**Ejemplo:**
```typescript
try {
  const entregas = await entregasApiService.procesarEntregasCompletas();
  console.log(`Procesadas: ${entregas.direccionesValidas} válidas`);
} catch (error) {
  console.error('Error procesando:', error);
}
```

---

#### `fetchEntregasMoviles(): Promise<ClienteEntregaDTO[]>` (LEGACY)

**Propósito:** Obtener entregas en formato legacy (compatibilidad hacia atrás).

**Endpoint:** `/Mobile/entregas`

**Estado:** ⚠️ Mantener para compatibilidad, migrar a nuevo formato

**Integración con nuevo formato JSON:** ❌ No (formato legacy)  
**Maneja datos incompletos:** ✅ Sí  
**Maneja errores:** ✅ Fallback a mock  

---

## Servicios HERE Maps

### HereGeocodingService

**Archivo:** `src/apps/entregas/services/hereGeocodingService.ts`

#### `geocode(address, options): Promise<GeocodingResult[]>`

**Propósito:** Geocodificar una dirección (dirección → coordenadas).

**API HERE Maps:** Geocoding & Search API v7

**Parámetros:**
- `address: string` - Dirección a geocodificar
- `options: SearchOptions` - Opciones de búsqueda (límite, país, idioma)

**Retorna:** Array de resultados con coordenadas y detalles

**Usado por:** `addressValidationService` (niveles 2 y 3)

**Integración con nuevo formato JSON:** ✅ Indirecto (usado por addressValidationService)  
**Maneja datos incompletos:** ✅ Retorna array vacío si no encuentra  
**Maneja errores:** ✅ Captura y retorna array vacío  

---

#### `reverseGeocode(latitude, longitude, options): Promise<GeocodingResult | null>`

**Propósito:** Reverse geocoding (coordenadas → dirección).

**API HERE Maps:** Geocoding & Search API v7

**Uso:** Validar coordenadas o obtener dirección formateada

**Integración con nuevo formato JSON:** ✅ Indirecto  
**Maneja datos incompletos:** ✅ Sí  
**Maneja errores:** ✅ Retorna null  

---

#### `validateAddress(address): Promise<{valid, suggestion, confidence}>`

**Propósito:** Validar una dirección y obtener confianza.

**Usado por:** `addressValidationService` para evaluar calidad

**Integración con nuevo formato JSON:** ✅ Indirecto  
**Maneja datos incompletos:** ✅ Sí  
**Maneja errores:** ✅ Retorna valid=false  

---

### RoutingService

**Archivo:** `src/apps/entregas/services/routingService.ts`

#### `obtenerRutaOptima(origen, destino): Promise<RutaOptima>`

**Propósito:** Calcular ruta optimizada entre dos puntos usando HERE Maps Routing API.

**API HERE Maps:** Routing API v8

**Parámetros:**
- `origen: Ubicacion` - Coordenadas de origen
- `destino: Ubicacion` - Coordenadas de destino

**Retorna:** `Promise<RutaOptima>` con:
- `distance`: Distancia en metros
- `duration`: Duración en segundos
- `coordinates`: Array de coordenadas de la ruta
- `instructions`: Instrucciones de navegación
- `estimatedArrival`: Tiempo estimado de llegada

**Características:**
- Considera tráfico en tiempo real
- Decodifica polylines HERE con flexpolyline
- Fallback a línea recta si falla API
- Modo mock disponible

**Usado por:** `routeManagementService`

**Integración con nuevo formato JSON:** ✅ Indirecto (usado para generar rutas)  
**Maneja datos incompletos:** ✅ Fallback a cálculo básico  
**Maneja errores:** ✅ Múltiples niveles de fallback  

---

#### `abrirNavegacionExterna(destino, origen): Promise<void>`

**Propósito:** Abrir navegación en app externa (HERE WeGo, Google Maps, Apple Maps).

**Integración con nuevo formato JSON:** ✅ Indirecto  
**Maneja datos incompletos:** ✅ Sí  
**Maneja errores:** ✅ Intenta múltiples apps  

---

### HereNavigationService

**Archivo:** `src/apps/entregas/services/hereNavigationService.ts`

#### `startNavigation(destination, options): Promise<void>`

**Propósito:** Iniciar navegación en tiempo real con indicaciones paso a paso.

**Características:**
- Navegación en tercera persona
- Indicaciones en tiempo real
- Recalculación automática al desviarse
- Integración con tráfico
- Alertas de desvíos

**Estado:** 📊 Implementación avanzada (usar para navegación activa)

**Integración con nuevo formato JSON:** ✅ Indirecto (usa rutas generadas)  
**Maneja datos incompletos:** ✅ Sí  
**Maneja errores:** ✅ Manejo de estados de error  

---

### HereTrafficService

**Archivo:** `src/apps/entregas/services/hereTrafficService.ts`

#### `getTrafficIncidents(lat, lng, radius): Promise<TrafficIncident[]>`

**Propósito:** Obtener incidentes de tráfico en un área.

**API HERE Maps:** Traffic API v7

**Usado por:** `routeManagementService.verificarIncidentesEnRuta()`

**Integración con nuevo formato JSON:** ✅ Indirecto  
**Maneja datos incompletos:** ✅ Retorna array vacío  
**Maneja errores:** ✅ Captura y retorna array vacío  

---

## Servicios de Simulación

### SimulationService

**Archivo:** `src/apps/entregas/services/simulationService.ts`

#### ⭐ `generarEjemploParaNuevoFormato(tipo): ApiDeliveryResponse` (NUEVO)

**Propósito:** Generar datos de ejemplo en el nuevo formato JSON para testing.

**Tipos:**
- `'con-coordenadas'`: Todas con coordenadas
- `'sin-coordenadas'`: Sin coordenadas (prueba geocodificación)
- `'mixto'`: Mezcla realista
- `'direcciones-invalidas'`: Incluye direcciones que fallarán

**Integración con nuevo formato JSON:** ✅ Directo - Genera formato correcto  
**Maneja datos incompletos:** ✅ Genera diferentes escenarios  
**Maneja errores:** ✅ N/A  

**Ejemplo:**
```typescript
const ejemplo = simulationService.generarEjemploParaNuevoFormato('mixto');
// Usar para testing
const resultado = await deliveryProcessingService.procesarEntregasDesdeAPI(ejemplo);
```

---

#### ⭐ `simularRespuestaAPI(tipo, delayMs): Promise<ApiDeliveryResponse>` (NUEVO)

**Propósito:** Simular respuesta de API con delay de red.

**Parámetros:**
- `tipo`: Tipo de ejemplo a generar
- `delayMs`: Delay en milisegundos (default: 1000)

**Uso:** Testing realista sin backend

**Integración con nuevo formato JSON:** ✅ Directo  
**Maneja datos incompletos:** ✅ Genera escenarios específicos  
**Maneja errores:** ✅ N/A  

---

## Resumen de Integración con Nuevo Formato JSON

### Funciones que trabajan directamente con nuevo formato:

✅ **addressValidationService.validarYGecocodificarDireccion()**  
✅ **addressValidationService.validarDirecciones()**  
✅ **routeManagementService.generarORecuperarRuta()**  
✅ **deliveryProcessingService.procesarEntregasDesdeAPI()** ⭐ Principal  
✅ **deliveryProcessingService.generarEjemploJSON()**  
✅ **entregasApiService.fetchEntregasConNuevoFormato()** ⭐ Endpoint  
✅ **entregasApiService.procesarEntregasCompletas()** ⭐ Conveniente  
✅ **simulationService.generarEjemploParaNuevoFormato()**  
✅ **simulationService.simularRespuestaAPI()**  

### Funciones que trabajan indirectamente (como parte del flujo):

⚡ **routeManagementService.determinarPuntoInicio()**  
⚡ **routeManagementService.verificarIncidentesEnRuta()**  
⚡ **routeManagementService.guardarRutaEnBackend()**  
⚡ **hereGeocodingService.geocode()**  
⚡ **hereGeocodingService.validateAddress()**  
⚡ **routingService.obtenerRutaOptima()**  
⚡ **hereTrafficService.getTrafficIncidents()**  

### Funciones legacy (mantener para compatibilidad):

⚠️ **entregasApiService.fetchEntregasMoviles()**  
⚠️ **entregasApiService.getEntregaById()**  

---

## Flujo Completo Recomendado

Para procesar entregas con el nuevo formato JSON:

```typescript
// Opción 1: Método todo-en-uno (RECOMENDADO)
const entregas = await entregasApiService.procesarEntregasCompletas();

// Opción 2: Paso a paso (mayor control)
const apiResponse = await entregasApiService.fetchEntregasConNuevoFormato();
const resultado = await deliveryProcessingService.procesarEntregasDesdeAPI(apiResponse, {
  confirmarRecalculo: true,
  usarUbicacionActual: true,
});

// Opción 3: Modo simulación (desarrollo)
const ejemploJSON = simulationService.generarEjemploParaNuevoFormato('mixto');
const resultado = await deliveryProcessingService.procesarEntregasSimuladas(ejemploJSON);
```

---

**Última actualización:** 2025-11-21  
**Total de funciones documentadas:** 30+  
**Cobertura:** Flujo completo de entregas con nuevo formato JSON
