# COMPARATIVA Y CASOS DE USO - SERVICIOS HERE MAPS 2025

**Fecha**: 2025-11-15
**Complemento de**: CATALOGO_COMPLETO_HERE_MAPS_2025.md

---

## TABLA COMPARATIVA GENERAL DE SERVICIOS

### Servicios de Routing

| Servicio | Tipo | Freemium | Casos de Uso | Limite Gratis | Precio Post-Limite |
|----------|------|----------|--------------|---------------|-------------------|
| Routing API v8 | REST API | Si | Rutas basicas, navegacion | 30,000/mes | $0.75/1k |
| Matrix Routing v8 | REST API | Limitado | Optimizacion, asignacion | 5,000/mes | $2.50/1k |
| Isoline Routing v8 | REST API | Limitado | Areas de cobertura | 5,000/mes | $2.50/1k |
| Intermodal Routing v8 | REST API | Limitado | Transporte multimodal | 5,000/mes | $2.50/1k |
| Tour Planning | REST API | No | Fleet optimization | N/A | Premium |
| Waypoints Sequence | REST API | Si | Orden de paradas | Incluido en Routing | Incluido |
| Route Matching v8 | REST API | No | Analisis de rutas | N/A | Premium |

### Servicios de Geocoding

| Servicio | Tipo | Freemium | Casos de Uso | Limite Gratis | Precio Post-Limite |
|----------|------|----------|--------------|---------------|-------------------|
| Geocoding & Search v7 | REST API | Si | Validacion direcciones | 250,000/mes | $1/1k |
| Autosuggest | REST API | Limitado | Autocompletado | 5,000/mes | $2.50/1k |
| Discover | REST API | Incluido | Busqueda lugares | Incluido en Geocoding | Incluido |
| Browse | REST API | Incluido | POI search | Incluido en Geocoding | Incluido |
| Batch Geocoder | REST API | Si | Geocoding masivo | Variable | Variable |

### Servicios de Mapas

| Servicio | Tipo | Freemium | Casos de Uso | Limite Gratis | Precio Post-Limite |
|----------|------|----------|--------------|---------------|-------------------|
| Vector Tile API | REST API | Si | Mapas interactivos | 30,000/mes | $0.75/1k |
| Raster Tile API v3 | REST API | Si | Mapas estaticos | 30,000/mes | $0.75/1k |
| Map Image API v3 | REST API | Si | Imagenes estaticas | 30,000/mes | $0.75/1k |
| Maps JS API v3 | JavaScript | Si | Web apps | Incluido | Incluido |
| Indoor Maps | REST API | No | Mapas interiores | N/A | Premium |

### Servicios de Trafico y Datos en Tiempo Real

| Servicio | Tipo | Freemium | Casos de Uso | Limite Gratis | Precio Post-Limite |
|----------|------|----------|--------------|---------------|-------------------|
| Traffic API v7 | REST API | Limitado | Trafico tiempo real | 5,000/mes | $2.50/1k |
| Destination Weather v3 | REST API | Si | Clima en rutas | Incluido en base | Variable |
| EV Charge Points v2 | REST API | No | Estaciones de carga | N/A | Premium |
| Parking On-Street | REST API | No | Estacionamiento calle | N/A | Premium |
| Parking Off-Street | REST API | No | Estacionamiento instalaciones | N/A | Premium |

### Servicios de Posicionamiento

| Servicio | Tipo | Freemium | Casos de Uso | Limite Gratis | Precio Post-Limite |
|----------|------|----------|--------------|---------------|-------------------|
| Network Positioning | REST API | Limitado | Posicionamiento sin GPS | 5,000/mes | $2.50/1k |
| HD GNSS Positioning | REST API | No | Precision sub-metrica | N/A | Premium |
| 5G Positioning | REST API | No | Posicionamiento 5G | N/A | Premium |

### Servicios de Fleet Management

| Servicio | Tipo | Freemium | Casos de Uso | Limite Gratis | Precio Post-Limite |
|----------|------|----------|--------------|---------------|-------------------|
| Fleet Telematics | Suite APIs | No | Gestion integral | N/A | Premium |
| Geofencing | REST API | No | Zonas geograficas | N/A | Premium |
| Tour Planning | REST API | No | Optimizacion flota | N/A | Premium |
| Toll Cost | Incluido | Si | Calculo peajes | Incluido en Routing | Incluido |
| Map Attributes | REST API | No | Atributos premium | N/A | Premium |

### SDKs y Plataformas

| Servicio | Plataforma | Freemium | Casos de Uso | Modelo de Pricing |
|----------|-----------|----------|--------------|-------------------|
| HERE SDK Navigate | iOS/Android | No | Apps nativas navegacion | Licencia |
| HERE SDK Explore | iOS/Android | No | Apps mapas avanzados | Licencia |
| HERE SDK Lite | iOS/Android | Si | Apps mapas basicos | Limitado |
| Maps JS API v3 | Web | Si | Web apps | Transaccional |
| Live Sense SDK | iOS/Android/Linux | No | Deteccion AI/ML | Licencia |
| Platform Data SDK | Python/Java/Scala | No | Data processing | Platform API |

---

## CASOS DE USO DETALLADOS POR INDUSTRIA

### 1. LOGISTICA LAST-MILE / DELIVERY

#### Flujo Completo de Entrega

**Fase 1: Recepcion de Orden**
- **Geocoding API**: Validar y geocodificar direccion del cliente
- **Browse API**: Buscar referencias cercanas (edificios, negocios)
- **Autosuggest**: Ayudar al cliente a ingresar direccion correcta

**Fase 2: Asignacion de Conductor**
- **Matrix Routing API**: Calcular distancias de todos los conductores a todas las ordenes
- **Algoritmo propio**: Asignar conductor optimo
- **Routing API**: Calcular ruta especifica para conductor asignado

**Fase 3: Optimizacion de Ruta**
- **Waypoints Sequence API**: Ordenar multiples entregas en ruta optima
- **Traffic API**: Verificar trafico actual en ruta
- **Weather API**: Verificar condiciones climaticas
- **Toll Cost**: Estimar costos de peajes

**Fase 4: Navegacion**
- **Routing API con trafico**: Ruta dinamica actualizada
- **Traffic API**: Monitoreo continuo de incidentes
- **Route Matching**: Verificar que conductor sigue ruta asignada
- **Geofencing**: Detectar llegada a zona de entrega

**Fase 5: Analisis Post-Entrega**
- **Route Matching API**: Analizar ruta realmente conducida
- **Map Attributes API**: Obtener atributos de ruta (velocidades, etc.)
- **Analytics**: KPIs de tiempo, distancia, costo

**APIs necesarias**:
- Routing API v8 (30k gratis)
- Geocoding & Search (250k gratis)
- Traffic API (5k gratis)
- Matrix Routing (5k gratis)
- Waypoints Sequence (incluido)

**Costo estimado** (10,000 entregas/mes):
- Geocoding: $0 (dentro de limite)
- Routing: $0 (dentro de limite)
- Traffic: ~$12.50 (5k gratis + 5k pagados)
- Matrix: ~$12.50 (5k gratis + 5k pagados)
- **Total: ~$25/mes** para 10,000 entregas

---

### 2. FLEET MANAGEMENT EMPRESARIAL

#### Operacion Diaria de Flota

**Planificacion Matutina (6:00 AM)**
- **Tour Planning API**: Optimizar rutas de toda la flota
  - Input: 50 vehiculos, 500 entregas, restricciones de tiempo
  - Output: Asignacion optima, rutas por vehiculo
  - Beneficio: 20% reduccion costos

**Despacho (7:00 AM)**
- **Routing API**: Calcular ruta detallada para cada conductor
- **Traffic API**: Verificar condiciones actuales
- **Weather API**: Alertar condiciones adversas
- **Toll Cost**: Presupuesto de peajes del dia

**Monitoring en Ruta (7:00 AM - 6:00 PM)**
- **Traffic API**: Polling cada 5 minutos
- **Geofencing**: Detectar entrada/salida de zonas
- **Route Matching**: Validar cumplimiento de ruta
- **Live Sense SDK**: Deteccion de peligros en tiempo real

**Re-Ruteo Dinamico**
- **Traffic API**: Detectar incidente mayor
- **Routing API**: Calcular ruta alternativa
- **Waypoints Sequence**: Re-optimizar paradas restantes
- Tiempo de re-ruteo: Reducido 90% vs algoritmo propio

**Analisis Nocturno (7:00 PM)**
- **Route Matching**: Analizar todas las rutas del dia
- **Map Attributes**: Obtener speed limits, semaforos
- **Analytics**: Generar reportes de performance

**APIs Premium necesarias**:
- Tour Planning API
- Fleet Telematics Geofencing
- Route Matching API
- Live Sense SDK (opcional)

**Beneficios medidos**:
- 20% reduccion costos operativos
- 90% reduccion tiempo re-ruteo
- 20% aumento productividad conductores
- Mejor cumplimiento de SLAs

---

### 3. TRANSPORTE DE CARGA PESADA / TRUCKING

#### Ruteo Especializado para Camiones

**Planificacion de Ruta**
- **Truck Routing API**: Calcular ruta considerando:
  - Peso del vehiculo: 35,000 kg
  - Altura: 4.2 metros
  - Ancho: 2.6 metros
  - Largo: 18.75 metros
  - Numero de ejes: 5
  - Material peligroso: Inflamable

**Restricciones Aplicadas**:
- Evitar puentes con limite de peso < 35 tons
- Evitar tuneles con altura < 4.5 metros
- Evitar calles prohibidas para camiones
- Evitar tuneles categoria B (sin inflamables)
- Considerar restricciones horarias

**Calculo de Costos**:
- **Toll Cost API**: Peajes especificos para camiones
  - Considerando peso, ejes, tipo de carga
  - Vignettes vs pay-per-km
  - Diferentes tarifas segun hora del dia

**Compliance**:
- **Route Matching**: Verificar cumplimiento de restricciones
- **Map Attributes**: Validar speed limits para camiones
- **Audit trail**: Registro completo de ruta conducida

**Custom Locations**:
- **Custom Location Extensions**: Mapear instalaciones privadas
  - Patios de carga
  - Basculas
  - Zonas de espera
  - Rutas internas de planta

**APIs necesarias**:
- Routing API v8 con truck mode
- Toll Cost calculation
- Route Matching API (premium)
- Map Attributes API (premium)
- Custom Location Extensions (premium)

**ROI**:
- Evitar multas por violacion de restricciones
- Optimizacion de costos de peajes
- Reduccion de kilometros vacios
- Mejor planificacion de tiempos de conduccion

---

### 4. FLOTA ELECTRICA / EV LOGISTICS

#### Gestion de Vehiculos Electricos

**Planificacion de Ruta con Autonomia**
- **EV Routing API**: Calcular ruta considerando:
  - Capacidad bateria: 100 kWh
  - Carga inicial: 80%
  - Consumo por km segun pendiente
  - Regeneracion en bajadas
  - Temperatura ambiente (afecta autonomia)

**Optimizacion de Cargas**
- **EV Charge Points API**: Localizar estaciones en ruta
- **Routing API**: Insertar paradas de carga optimas
- **Tour Planning**: Optimizar considerando tiempos de carga

**Consideraciones Especiales**:
- **Weather API**: Clima frio reduce autonomia hasta 40%
- **Map Attributes (slope)**: Pendientes afectan consumo
- **Traffic API**: Congestion aumenta consumo

**Ejemplo de Ruta**:
- Origen: Almacen (bateria 80%)
- Destino 1: Cliente A (40 km)
- Destino 2: Cliente B (60 km)
- Destino 3: Cliente C (45 km)
- Retorno: Almacen (35 km)
- **Total**: 180 km
- **Bateria final estimada**: 25%
- **Parada de carga necesaria**: Si (despues Cliente B)

**APIs necesarias**:
- Routing API v8 con EV mode
- EV Charge Points API (premium)
- Weather API
- Map Attributes (slope)

**Beneficios**:
- Evitar quedarse sin bateria
- Optimizar tiempos de carga
- Reducir costos operativos vs combustion
- Planificacion precisa de autonomia

---

### 5. LOGISTICA URBANA / URBAN DELIVERY

#### Delivery en Ciudades Congestionadas

**Multimodalidad**
- **Intermodal Routing**: Combinar:
  - Camion hasta hub urbano
  - Cargo bike para ultima milla
  - Opcion transporte publico
  - Opcion taxi/rideshare

**Gestion de Estacionamiento**
- **On-Street Parking API**: Encontrar estacionamiento en calle
- **Off-Street Parking API**: Estacionamientos cercanos a destino
- **Probabilidad de espacio**: Estimar si habra lugar disponible

**Evitar Congestion**
- **Traffic API**: Trafico en tiempo real
- **Isoline Routing**: Areas alcanzables en X minutos
- **Matrix Routing**: Comparar multiples rutas
- **Historical traffic**: Evitar horas pico conocidas

**Zonas de Acceso Restringido**
- **Routing API**: Parametros avoid[areas]
- **Truck Routing**: Restricciones de acceso
- **Map Attributes**: Zonas ambientales, ZTL (Limited Traffic Zones)

**Ejemplo Multimodal**:
1. Camion desde almacen a micro-hub urbano (10 km, 20 min)
2. Cargo bike desde micro-hub a destino (2 km, 8 min)
3. Total: 12 km, 28 min
4. Alternativa directa en camion: 12 km, 45 min (por trafico)

**APIs necesarias**:
- Intermodal Routing API (premium)
- Parking API (premium)
- Traffic API
- Isoline Routing
- Public Transit API (premium)

**Beneficios**:
- Reduccion tiempo entrega 30-40%
- Acceso a zonas restringidas
- Reduccion emissiones
- Mejor experiencia cliente

---

### 6. COLD CHAIN / CADENA DE FRIO

#### Logistica con Temperatura Controlada

**Planificacion Sensible al Tiempo**
- **Routing API**: Ruta mas rapida (no mas corta)
- **Traffic API**: Evitar demoras
- **Weather API**: Temperatura ambiente afecta refrigeracion
- **Matrix Routing**: Optimizar secuencia para minimizar tiempo total

**Monitoreo de Temperatura**
- Integracion con sensores IoT de temperatura
- **Geofencing**: Alertas si vehiculo se detiene fuera de zona permitida
- **Route Matching**: Verificar que no hubo desvios

**Contingencias**:
- **Traffic API**: Detectar retraso mayor
- **Routing API**: Calcular ruta alternativa inmediata
- **Browse API**: Localizar instalaciones frigorificas cercanas en emergencia

**Ejemplo**:
- Producto: Vacunas (2-8 C)
- Tiempo maximo fuera refrigeracion: 2 horas
- Ruta normal: 1.5 horas
- Incidente detectado: +45 min demora
- Accion: Re-ruteo inmediato o entrega a hub intermedio

**APIs necesarias**:
- Routing API (optimizado por tiempo)
- Traffic API (monitoring continuo)
- Weather API
- Geofencing (premium)
- Matrix Routing

**Beneficios**:
- Cumplimiento regulatorio
- Reduccion de perdidas de producto
- Trazabilidad completa
- Respuesta rapida a incidentes

---

## COMPARATIVA HERE MAPS vs COMPETENCIA

### Google Maps Platform vs HERE Maps

| Caracteristica | Google Maps | HERE Maps | Ganador |
|----------------|-------------|-----------|---------|
| **Geocoding gratis/mes** | 10,000 | 250,000 | HERE (25x) |
| **Routing gratis/mes** | 10,000 | 30,000 | HERE (3x) |
| **Precio post-limite (Geocoding)** | Variable | $1/1k | HERE |
| **Truck Routing** | Limitado | Completo | HERE |
| **Fleet Management APIs** | No | Si (Tour Planning) | HERE |
| **HazMat Routing** | No | Si | HERE |
| **Toll Cost** | No nativo | Si nativo | HERE |
| **EV Routing** | Basico | Avanzado | HERE |
| **Map Customization** | Limitado | Extenso | HERE |
| **Offline Maps (SDK)** | No | Si (190 paises) | HERE |
| **Ecosistema mobile** | Mejor | Bueno | Google |
| **Documentacion** | Excelente | Muy buena | Google |

**Conclusion**: HERE Maps es superior para logistica y fleet management. Google Maps es mejor para apps consumer-facing.

---

### Mapbox vs HERE Maps

| Caracteristica | Mapbox | HERE Maps | Ganador |
|----------------|---------|-----------|---------|
| **Geocoding gratis/mes** | 100,000 | 250,000 | HERE |
| **Routing gratis/mes** | 100,000 | 30,000 | Mapbox |
| **Map customization** | Excelente | Muy bueno | Mapbox |
| **3D/AR capabilities** | Excelente | Bueno | Mapbox |
| **Fleet optimization** | No | Si | HERE |
| **Traffic data** | Basico | Avanzado | HERE |
| **Truck routing** | No | Si | HERE |
| **Pricing transparency** | Excelente | Buena | Mapbox |
| **Data quality** | Buena | Excelente | HERE |

**Conclusion**: Mapbox es mejor para visualizacion y customizacion. HERE Maps es mejor para logistica empresarial.

---

## ARQUITECTURA DE REFERENCIA

### Stack Tecnologico Recomendado para App de Entregas

#### Frontend Mobile (React Native)
```
- React Native Maps (visualizacion)
- @here/flexpolyline (decodificacion de rutas)
- axios (llamadas a APIs HERE)
- react-native-geolocation (GPS)
- @react-navigation (navegacion app)
```

#### Backend (Node.js)
```
- Express.js (API REST)
- Node-cron (jobs programados)
- Bull (queue de trabajos)
- Redis (cache)
- PostgreSQL + PostGIS (base de datos geoespacial)
```

#### Servicios HERE Maps
```
Tier 1 (Freemium):
- Routing API v8
- Geocoding & Search API
- Traffic API v7
- Vector Tile API

Tier 2 (Growth):
- Matrix Routing API
- Waypoints Sequence

Tier 3 (Scale):
- Tour Planning API
- Fleet Telematics Geofencing
```

#### Flujo de Datos
```
1. Cliente ingresa direccion
   -> Autosuggest API (validacion)
   -> Geocoding API (coordenadas)

2. Backend recibe orden
   -> Almacenar en PostgreSQL
   -> Queue para procesamiento

3. Worker procesa asignacion
   -> Matrix Routing API (calcular distancias)
   -> Algoritmo asignacion
   -> Routing API (ruta especifica)

4. Conductor recibe ruta
   -> App mobile renderiza en mapa
   -> Navegacion con Traffic API
   -> Geofencing en entregas

5. Tracking en tiempo real
   -> GPS cada 10 seg -> Backend
   -> Backend -> WebSocket -> Dashboard
   -> Route Matching para validacion

6. Post-entrega
   -> Analytics
   -> Reportes
   -> Facturacion
```

---

## OPTIMIZACION DE COSTOS

### Estrategias para Minimizar Gastos en HERE Maps

#### 1. Cache Inteligente

**Geocoding**:
- Cachear direcciones geocodificadas por 30 dias
- Reduccion estimada: 80% de llamadas repetidas
- Ahorro: ~$200/mes en app mediana

**Routing**:
- Cachear rutas entre puntos frecuentes por 24 horas
- Invalidar cache si hay incidente de trafico mayor
- Reduccion: 50% de llamadas
- Ahorro: ~$150/mes

**Traffic**:
- Polling adaptivo (cada 1 min en ruta activa, cada 10 min en stand-by)
- Reduccion: 40% de llamadas
- Ahorro: ~$100/mes

#### 2. Batch Processing

**Geocoding**:
- Usar Batch Geocoder API para importaciones masivas
- Procesar de noche cuando hay menos trafico
- Ahorro: 30% vs geocoding individual

**Tour Planning**:
- Calcular todas las rutas del dia siguiente en batch nocturno
- Una llamada vs multiples durante el dia
- Ahorro: Significativo en operaciones grandes

#### 3. Uso Estrategico de Servicios

**Freemium First**:
- Maximizar uso de servicios con limites altos (Geocoding: 250k)
- Usar servicios limitados solo cuando necesario (Traffic: 5k)

**Alternativas Creativas**:
- EV Charge Points (premium) -> Browse API con categoria (freemium)
- Indoor Maps (premium) -> Custom overlays en Maps JS (freemium)

#### 4. Optimizacion de Requests

**Reduce llamadas innecesarias**:
- No pedir ruta si origen == destino
- No pedir traffic updates si vehiculo detenido
- No geocodificar si ya se tiene coordenadas

**Combinar requests**:
- Usar Waypoints Sequence en vez de multiples Routing calls
- Usar Matrix Routing en vez de N x M Routing calls

#### 5. Monitoreo de Uso

**Dashboard de metricas**:
- Tracking de requests por API
- Alertas al llegar a 80% del limite gratuito
- Proyeccion de costos mensuales

**Analisis de ROI**:
- Costo de API vs valor de entrega
- Si entrega promedio = $10, API cost debe ser < $0.10
- Objetivo: API costs < 1% de revenue

### Ejemplo de Optimizacion Real

**Escenario**:
- App con 1,000 entregas/dia (30,000/mes)
- Sin optimizacion: $500/mes
- Con optimizacion: $100/mes
- **Ahorro: 80%**

**Tecnicas aplicadas**:
- Cache de geocoding (80% hit rate)
- Routing batch nocturno
- Polling adaptivo de traffic
- Matrix routing en vez de individual

---

## ROADMAP DE IMPLEMENTACION

### Fase 1: MVP (Mes 1-2)

**Objetivo**: App funcional basica

**Servicios HERE**:
- Routing API v8
- Geocoding & Search API
- Maps JS API / React Native Maps

**Features**:
- Usuario ingresa direccion
- App calcula ruta
- Conductor navega
- Visualizacion en mapa

**Costo estimado**: $0 (dentro de freemium)

---

### Fase 2: Growth (Mes 3-4)

**Objetivo**: Optimizacion y trafico

**Agregar servicios**:
- Traffic API v7
- Matrix Routing API
- Waypoints Sequence

**Features**:
- Trafico en tiempo real
- Re-ruteo automatico
- Asignacion inteligente conductor-orden
- Multiples paradas optimizadas

**Costo estimado**: $50-100/mes

---

### Fase 3: Scale (Mes 5-6)

**Objetivo**: Fleet management completo

**Agregar servicios premium**:
- Tour Planning API
- Geofencing
- Route Matching

**Features**:
- Optimizacion de flota completa
- Zonas de entrega
- Compliance y auditing
- Analytics avanzado

**Costo estimado**: Contactar ventas (enterprise)

---

### Fase 4: Advanced (Mes 7+)

**Objetivo**: Diferenciacion competitiva

**Agregar**:
- Live Sense SDK
- Weather API
- Toll Cost
- Parking API

**Features**:
- Deteccion AI de peligros
- Planificacion con clima
- Costos precisos
- Asistencia estacionamiento

**Costo estimado**: Contactar ventas

---

## CHECKLIST DE DECISION

### Evalua si HERE Maps es para ti

**Usar HERE Maps si**:
- [x] Tu app es de logistica/entregas/fleet
- [x] Necesitas truck routing o HazMat
- [x] Quieres freemium muy generoso
- [x] Necesitas optimizacion multi-vehiculo
- [x] Quieres control total de datos
- [x] Necesitas offline maps en mobile
- [x] Operas en Europa (excelente cobertura)

**Considerar alternativas si**:
- [ ] Tu app es consumer-facing generica
- [ ] Priorizas ecosistema Google/Apple
- [ ] Necesitas maximo customizacion visual
- [ ] Tu equipo ya conoce otra plataforma
- [ ] Solo necesitas features basicas

---

**Documento generado**: 2025-11-15
**Version**: 1.0
**Complementa**: CATALOGO_COMPLETO_HERE_MAPS_2025.md
