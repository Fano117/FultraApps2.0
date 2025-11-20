# CATALOGO COMPLETO DE SERVICIOS HERE MAPS 2025

**Fecha de investigacion**: 2025-11-15
**Fuente**: Documentacion oficial HERE Developer Portal (developer.here.com)
**Enfoque**: Servicios para logistica, entregas y fleet management

---

## TABLA DE CONTENIDOS

1. [Servicios de Localizacion y Posicionamiento](#1-servicios-de-localizacion-y-posicionamiento)
2. [Servicios de Navegacion y Rutas](#2-servicios-de-navegacion-y-rutas)
3. [Servicios de Mapas y Visualizacion](#3-servicios-de-mapas-y-visualizacion)
4. [Servicios de Trafico y Datos en Tiempo Real](#4-servicios-de-trafico-y-datos-en-tiempo-real)
5. [Servicios de Geocodificacion y Busqueda](#5-servicios-de-geocodificacion-y-busqueda)
6. [Servicios de Fleet Management y Logistica](#6-servicios-de-fleet-management-y-logistica)
7. [Servicios de Analisis y Optimizacion](#7-servicios-de-analisis-y-optimizacion)
8. [Servicios Especializados](#8-servicios-especializados)
9. [SDKs y Plataformas](#9-sdks-y-plataformas)
10. [Resumen de Pricing 2025](#10-resumen-de-pricing-2025)

---

## 1. SERVICIOS DE LOCALIZACION Y POSICIONAMIENTO

### 1.1 HERE Network Positioning API

**URL Documentacion**: https://developer.here.com/documentation/positioning-api/dev_guide/index.html

**Descripcion**: Servicio basado en la nube que proporciona posicionamiento cuando GPS no esta disponible, utilizando senales de redes celulares y Wi-Fi.

**Funcionalidades principales**:
- Posicionamiento sin GPS usando Cell IDs (GSM, WCDMA, TD-SCDMA, CDMA, LTE, LTE-M, NB-IoT)
- Base de datos global de Wi-Fi access points
- 4 mil millones de puntos de datos actualizados mensualmente
- Soporte para NB-IoT y LTE-M

**Niveles de precision**:
- Cell ID: 500m - 1500m
- Neighbor cell: 300m - 700m
- Wi-Fi: 30m - 50m
- HD Wi-Fi: 10-20m horizontal, 2-5m vertical

**Casos de uso para logistica**:
- Tracking de activos IoT sin GPS
- Posicionamiento de dispositivos en interiores
- Reduccion de costos eliminando chips GPS
- Tracking de paquetes en almacenes

**Tipo de plan**: Servicio premium (requiere contacto con ventas)

---

### 1.2 HERE HD GNSS Positioning API

**URL Documentacion**: https://developer.here.com/documentation/gnss-positioning/dev_guide/index.html

**Descripcion**: Solucion de posicionamiento de alta precision basada en PPP (Precise Point Positioning) y RTK (Real-Time Kinematic).

**Funcionalidades principales**:
- Precision sub-metrica (hasta 0.2 metros)
- Cobertura global incluyendo China y Japon
- Compatible con chipsets dual-frequency (Broadcom BCM47765, BCM47755)
- Deteccion de spoofing GPS
- Integracion con sensores del telefono
- Sin hardware adicional requerido

**Casos de uso para logistica**:
- Navegacion a nivel de carril
- Tracking preciso de flotas
- Mejora de precision 3-4x vs GNSS regular
- Aplicaciones de realidad aumentada para entregas

**Tipo de plan**: Servicio premium

---

### 1.3 HERE Positioning API (5G)

**Descripcion**: Posicionamiento de alta precision usando senales de red celular 5G Standalone (SA).

**Funcionalidades principales**:
- Posicionamiento basado en 5G nativo
- Lanzado oficialmente en 2025
- Mayor precision que posicionamiento celular 4G

**Casos de uso para logistica**:
- Tracking en tiempo real de vehiculos en zonas urbanas
- Complemento a GPS en areas con mala recepcion satelital

**Tipo de plan**: Servicio premium (nuevo en 2025)

---

## 2. SERVICIOS DE NAVEGACION Y RUTAS

### 2.1 HERE Routing API v8

**URL Documentacion**: https://developer.here.com/documentation/routing-api/dev_guide/index.html
**API Reference**: https://developer.here.com/documentation/routing-api/api-reference.html

**Descripcion**: API RESTful para calcular rutas optimizadas entre origenes y destinos, con soporte para multiples modos de transporte.

**Funcionalidades principales**:
- Multiples modos de transporte: car, truck, pedestrian, bicycle, scooter, taxi, bus
- Calculo de rutas con trafico en tiempo real
- Optimizacion por tiempo, distancia o costo
- Instrucciones turn-by-turn
- Decodificacion de polylines (formato flexible polyline)
- Atributos de ruta: speed limits, traffic lights, curvature, slope

**Casos de uso para logistica**:
- Calculo de rutas de entrega optimas
- Planificacion de rutas con multiples paradas
- Estimacion de ETAs precisos
- Navegacion con actualizaciones en tiempo real

**Pricing (2025)**:
- Primeras 30,000 transacciones: GRATIS
- Despues: $0.75 por 1,000 transacciones

---

### 2.2 HERE Matrix Routing API v8

**URL Documentacion**: https://developer.here.com/documentation/matrix-routing-api/dev_guide/index.html

**Descripcion**: Calcula matrices de rutas, tiempos y/o distancias entre multiples origenes y destinos.

**Funcionalidades principales**:
- Hasta 10,000 origenes x 10,000 destinos
- Calculo de tiempo de viaje y distancia
- Soporte para car, truck, pedestrian, bicycle, taxi, scooter
- Matrix asincronas para grandes volumenes
- Consideracion de trafico historico y en tiempo real

**Casos de uso para logistica**:
- Optimizacion de asignacion conductor-entrega
- Calculo de matrices de distancia para planificacion
- Analisis de tiempos de viaje entre almacenes y clientes
- Optimizacion de rutas de distribucion

**Pricing (2025)**: Servicio avanzado - primeras 5,000 transacciones gratis, luego $2.50 por 1,000

---

### 2.3 HERE Waypoints Sequence API

**URL Documentacion**: https://developer.here.com/documentation/routing-waypoints/dev_guide/topics/examples.html
**API Reference**: https://developer.here.com/documentation/routing-waypoints/api-reference.html

**Descripcion**: Encuentra la secuencia optima de waypoints a lo largo de una ruta.

**Funcionalidades principales**:
- Optimizacion basada en tiempo, distancia o valor comercial
- Reordenamiento inteligente de paradas
- Integracion con Routing API v8
- Consideracion de restricciones de tiempo

**Casos de uso para logistica**:
- Optimizacion del orden de entregas
- Reduccion de kilometraje total
- Maximizacion de entregas por ruta
- Planificacion de recogidas y entregas

**Tipo de plan**: Incluido en servicios de routing avanzado

---

### 2.4 HERE Tour Planning API

**URL Documentacion**: https://developer.here.com/documentation/tour-planning/dev_guide/index.html

**Descripcion**: Resuelve problemas complejos de Multi-Vehicle Routing Problem (MVRP) para planificacion y despacho de flotas.

**Funcionalidades principales**:
- Planificacion multi-vehiculo
- Gestion de turnos de 8 horas
- Optimizacion de rutas completas
- Identificacion de trabajos no asignables
- Consideracion de restricciones de vehiculo
- Integracion con trafico en tiempo real

**Casos de uso para logistica**:
- Planificacion diaria de rutas de flota completa
- Despacho optimizado de conductores
- Reduccion del 20% en costos de gestion de flota
- Reduccion del 90% en tiempos de re-ruteo
- Aumento del 20% en productividad del conductor

**Tipo de plan**: Servicio premium de Fleet Optimization Package

---

### 2.5 HERE Isoline Routing API v8

**URL Documentacion**: https://developer.here.com/documentation/isoline-routing-api/dev_guide/index.html

**Descripcion**: Calcula areas alcanzables (isolinas) desde un punto dentro de un tiempo o distancia especifica.

**Funcionalidades principales**:
- Isolinas por tiempo o distancia
- Consideracion de trafico en tiempo real
- Multiples modos de transporte
- Formato polygon o polyline
- Isolinas a lo largo de una ruta

**Casos de uso para logistica**:
- Determinacion de areas de cobertura de entrega
- Identificacion de vehiculos dentro del alcance de un destino
- Planificacion de zonas de servicio
- Analisis de accesibilidad de almacenes

**Pricing (2025)**: Servicio avanzado - primeras 5,000 transacciones gratis, luego $2.50 por 1,000

---

### 2.6 HERE Intermodal Routing API v8

**URL Documentacion**: https://developer.here.com/documentation/intermodal-routing/dev_guide/index.html

**Descripcion**: Combina cuatro tipos de transporte (vehiculo, transito publico, taxi, rentados) para crear servicios intermodales.

**Funcionalidades principales**:
- 13 modos de viaje diferentes
- Ruteo con transito publico en tiempo real
- Informacion de demoras y disrupciones
- Amenidades en estaciones de transito
- Park and ride
- Servicios de car sharing, bike sharing

**Casos de uso para logistica**:
- Ruteo de ultima milla con transporte publico
- Planificacion de entregas eco-amigables
- Combinacion de transporte para entregas urbanas
- Analisis de opciones de transporte multimodal

**Tipo de plan**: Servicio avanzado

---

### 2.7 HERE Truck Routing (parte de Routing API v8)

**URL Documentacion**: https://developer.here.com/documentation/routing-api/dev_guide/topics/truck-routing/truck-routing.html

**Descripcion**: Ruteo especializado para camiones con consideracion de restricciones vehiculares y de carga.

**Funcionalidades principales**:
- Restricciones por peso, altura, ancho, largo
- Restricciones de materiales peligrosos (HazMat)
- Restricciones de tuneles por categoria
- Evitar carreteras prohibidas para camiones
- Calculo de costos de peajes para camiones
- Restricciones de ejes y trailer

**Tipos de HazMat soportados**:
- Explosivos
- Materiales inflamables
- Materiales daninos para el agua
- Gases toxicos
- Materiales combustibles

**Casos de uso para logistica**:
- Ruteo de camiones de carga pesada
- Transporte de materiales peligrosos
- Cumplimiento de regulaciones de transporte
- Evitar multas por violacion de restricciones

**Tipo de plan**: Incluido en Routing API v8

---

### 2.8 HERE EV Routing (parte de Routing API v8)

**URL Documentacion**: https://developer.here.com/documentation/routing-api/dev_guide/topics/use-cases/ev-routing.html

**Descripcion**: Ruteo especializado para vehiculos electricos con consideracion de consumo de energia y estaciones de carga.

**Funcionalidades principales**:
- Calculo de consumo de energia
- Adicion automatica de estaciones de carga a la ruta
- Consideracion de topografia (pendientes)
- Optimizacion por costo de energia
- Deteccion de alcance de bateria

**Casos de uso para logistica**:
- Planificacion de rutas para flotas electricas
- Optimizacion de paradas de carga
- Prediccion de autonomia
- Transicion a flotas sostenibles

**Tipo de plan**: Incluido en Routing API v8

---

### 2.9 HERE Route Matching API v8

**URL Documentacion**: https://developer.here.com/documentation/route-matching/dev_guide/index.html
**API Reference**: https://www.here.com/docs/bundle/route-matching-api-v8-api-reference/page/index.html

**Descripcion**: API RESTful que permite hacer map matching de trazas GPS a carreteras y obtener atributos del mapa.

**Funcionalidades principales**:
- Matching de GPS traces a carreteras
- Recuperacion de atributos de mapa (speed limit, slope, etc.)
- Analisis de riesgo y conduccion
- Soporte para carreteras privadas/customizadas
- Calculo de costos de peajes en rutas conducidas
- Ignorar restricciones de acceso

**Casos de uso para logistica**:
- Analisis de rutas realmente conducidas
- Evaluacion de riesgo de conduccion
- Auditoria de cumplimiento de rutas
- Reportes de kilometraje preciso
- Analisis de comportamiento del conductor

**Tipo de plan**: Servicio avanzado

---

### 2.10 HERE Map Matching API

**Descripcion**: Servicio de map matching para ajustar puntos GPS difusos a carreteras.

**Funcionalidades principales**:
- Snap de coordenadas GPS a la red vial
- Correccion de imprecisiones de GPS
- Reconstruccion de rutas desde trazas

**Casos de uso para logistica**:
- Tracking preciso de vehiculos
- Correccion de datos de telematica
- Visualizacion de rutas historicas

**Tipo de plan**: Incluido en Route Matching API

---

## 3. SERVICIOS DE MAPAS Y VISUALIZACION

### 3.1 HERE Vector Tile API

**URL Documentacion**: https://developer.here.com/documentation/vector-tiles-api/dev_guide/index.html

**Descripcion**: Servicio web para acceder a tiles vectoriales con contenido de mapas HERE, incluyendo carreteras, edificios, agua y POIs.

**Funcionalidades principales**:
- Tiles vectoriales compactos
- Personalizacion de estilos de mapa
- Renderizado del lado del cliente
- Zoom y rotacion fluida
- Multiples capas de informacion

**Casos de uso para logistica**:
- Visualizacion de mapas personalizados
- Mapas interactivos en aplicaciones web/mobile
- Overlay de datos de entregas sobre mapas
- Visualizacion de zonas de cobertura

**Pricing (2025)**:
- Primeras 30,000 transacciones: GRATIS
- Despues: $0.75 por 1,000 transacciones

---

### 3.2 HERE Raster Tile API v3

**URL Documentacion**: https://developer.here.com/documentation/raster-tile-api/dev_guide/index.html
**API Reference**: https://www.here.com/docs/bundle/raster-tile-api-v3-api-reference/page/index.html

**Descripcion**: API REST para solicitar imagenes de tiles de mapa para todas las regiones del mundo.

**Estilos de mapa disponibles**:
- explore.day - Mapa base diurno
- lite.day - Mapa simplificado diurno
- explore.night - Mapa nocturno
- satellite.day - Imagenes satelitales
- explore.satellite.day - Hibrido satelite + etiquetas

**Funcionalidades principales**:
- Vistas base, satelite e hibrida
- Esquemas dia/noche
- Soporte de multiples idiomas
- Visualizacion de restricciones para camiones
- Zonas ambientales

**Casos de uso para logistica**:
- Mapas estaticos para reportes
- Visualizacion de rutas planificadas
- Impresion de mapas de entregas
- Imagenes satelitales para ubicaciones

**Tipo de plan**: Freemium

---

### 3.3 HERE Map Image API v3

**URL Documentacion**: https://developer.here.com/documentation/map-image/dev_guide/index.html

**Descripcion**: Genera imagenes de mapas estaticos personalizables con diseno responsivo para varios dispositivos.

**Funcionalidades principales**:
- Mapas estaticos personalizables
- Overlays custom via GeoJSON
- Marcadores de lugar personalizados
- Imagenes ligeras para web/mobile
- Diseno responsivo

**Casos de uso para logistica**:
- Mapas en correos de confirmacion de entrega
- Imagenes de ubicacion en notificaciones
- Mapas para documentos e informes
- Previsualizacion de rutas

**Tipo de plan**: Freemium

---

### 3.4 HERE Maps API for JavaScript v3

**URL Documentacion**: https://www.here.com/docs/bundle/maps-api-for-javascript-developer-guide/page/README.html

**Descripcion**: API JavaScript para crear mapas interactivos ricos en funcionalidades para aplicaciones web.

**Funcionalidades principales**:
- Mapas interactivos en navegador
- Marcadores y overlays personalizados
- Integracion con servicios HERE (routing, geocoding, etc.)
- Eventos de usuario (click, drag, zoom)
- Renderizado de rutas y polylines
- Visualizacion de trafico

**Casos de uso para logistica**:
- Dashboard web de control de flota
- Visualizacion en tiempo real de entregas
- Planificacion interactiva de rutas
- Monitoring de vehiculos en mapa

**Tipo de plan**: Freemium

---

### 3.5 HERE Indoor Maps / Venue Maps API

**URL Documentacion**: https://developer.here.com/documentation/venue-maps/dev_guide/topics/what-is.html

**Descripcion**: API que retorna informacion detallada sobre geometria, metadata, POIs y ruteo interior de edificios.

**Funcionalidades principales**:
- Mapas de interiores de edificios
- Informacion de plantas/pisos
- POIs interiores
- Ruteo indoor
- Posicionamiento interior via Wi-Fi

**Casos de uso para logistica**:
- Navegacion en almacenes grandes
- Ruteo en centros comerciales para entregas
- Tracking de paquetes en instalaciones
- Optimizacion de picking en bodegas

**Tipo de plan**: Servicio premium (requiere contacto)

---

## 4. SERVICIOS DE TRAFICO Y DATOS EN TIEMPO REAL

### 4.1 HERE Traffic API v7

**URL Documentacion**: https://developer.here.com/documentation/traffic-api/dev_guide/index.html
**API Reference**: https://www.here.com/docs/bundle/traffic-api-v7-api-reference/page/index.html

**Descripcion**: API REST que proporciona informacion de flujo de trafico e incidentes en tiempo real.

**Endpoints principales**:
- `/v7/flow` - Flujo de trafico
- `/v7/incidents` - Incidentes de trafico

**Funcionalidades de Flow**:
- Velocidad de flujo libre (freeFlow)
- Velocidad esperada actual
- Factor de congestion (jam factor)
- Tendencia de congestion
- Informacion a nivel de carril
- Actualizacion cada minuto

**Funcionalidades de Incidents**:
- Tipo de incidente (accidente, construccion, cierre, etc.)
- Ubicacion geografica
- Nivel de criticidad
- Tiempo de inicio/fin
- Estado del incidente
- Descripcion detallada

**Parametros requeridos**:
- `in` - Filtro geoespacial (circle, bbox, corridor)
- `locationReferencing` - TMC, OLR o Shape Points

**Casos de uso para logistica**:
- Deteccion de retrasos en rutas activas
- Re-ruteo automatico ante incidentes
- Estimacion precisa de ETAs
- Alertas proactivas a conductores
- Analisis de patrones de trafico

**Pricing (2025)**:
- Primeras 5,000 transacciones: GRATIS
- Despues: $2.50 por 1,000 transacciones

---

### 4.2 HERE Destination Weather API v3

**URL Documentacion**: https://developer.here.com/documentation/destination-weather/dev_guide/topics/guide.html
**API Reference**: https://www.here.com/docs/bundle/destination-weather-api-v3-api-reference/page/index.html

**Descripcion**: API RESTful que proporciona pronosticos del tiempo, condiciones actuales y alertas meteorologicas severas.

**Tipos de informacion**:
- Observaciones actuales del clima
- Pronosticos horarios y diarios
- Alertas meteorologicas severas
- Clima en destinos especificos

**Funcionalidades principales**:
- Temperatura, humedad, velocidad del viento
- Condiciones de precipitacion
- Visibilidad
- Indice UV
- Alertas de clima severo
- Pronostico hasta 7 dias

**Casos de uso para logistica**:
- Planificacion de rutas considerando clima
- Alertas de condiciones peligrosas para conductores
- Optimizacion de horarios de entrega
- Prevision de retrasos por clima
- Seguridad de flota en condiciones adversas

**Tipo de plan**: Servicio popular incluido en planes base

---

### 4.3 HERE EV Charge Points API v2

**URL Documentacion**: https://developer.here.com/documentation/charging-stations/dev_guide/topics/overview.html
**Developer Guide**: https://www.here.com/docs/bundle/ev-charge-points-api-developer-guide/page/topics/overview.html

**Descripcion**: API RESTful que proporciona listas de estaciones de carga dentro de un area especificada.

**Informacion disponible**:
- Ubicacion de estaciones de carga
- Tipos de conectores disponibles
- Horarios de apertura
- Informacion estatica y dinamica
- Disponibilidad en tiempo real
- IDs de estaciones

**Casos de uso para logistica**:
- Planificacion de rutas para flotas electricas
- Localizacion de puntos de carga cercanos
- Optimizacion de paradas de recarga
- Integracion en apps de gestion de flota EV

**Tipo de plan**: Solo disponible con contrato pagado (no freemium)

**Alternativa Freemium**: Usar Geocoding & Search API con el endpoint `/browse` filtrando por categoria EV charging stations (hasta 250km de radio)

---

## 5. SERVICIOS DE GEOCODIFICACION Y BUSQUEDA

### 5.1 HERE Geocoding & Search API v7

**URL Documentacion**: https://developer.here.com/documentation/geocoding-search-api/dev_guide/index.html

**Descripcion**: API para conversion precisa de direcciones a coordenadas y viceversa, mas busqueda de lugares.

**Endpoints principales**:

#### A. Forward Geocoding
- Convertir direcciones a coordenadas
- Busqueda de lugares por nombre
- Geocodificacion de direcciones parciales/incorrectas

#### B. Reverse Geocoding
- Convertir coordenadas a direcciones
- Informacion de area para coordenadas dadas
- Recuperacion de direccion mas cercana

#### C. Autosuggest
- Sugerencias de terminos mientras el usuario escribe
- Correccion ortografica
- Respuesta rapida desde primer keystroke

#### D. Discover
- Busqueda de lugares conocidos o desconocidos
- Entrada de texto libre
- Resultados ordenados por relevancia
- Soporte para queries parciales

#### E. Browse
- Busqueda estructurada por categoria
- Filtrado por nombre en geo-posicion
- Radio hasta 250km
- Resultados ordenados por distancia

**Base de datos**:
- 120+ millones de lugares
- 400+ millones de direcciones
- Integracion con datasets terceros (Tripadvisor, etc.)
- Cobertura en 100+ paises

**Casos de uso para logistica**:
- Validacion de direcciones de entrega
- Autocompletado en formularios de direccion
- Busqueda de POIs cercanos (gasolineras, restaurantes)
- Geocodificacion de ordenes de clientes
- Busqueda de almacenes y sucursales

**Pricing (2025)**:
- 250,000 queries gratis/mes (25x mas que Google Maps)
- Despues: $1 por 1,000 queries
- Primeras 30,000 transacciones: GRATIS
- Despues: $0.75 por 1,000 transacciones

---

### 5.2 HERE Batch Geocoder API

**URL Documentacion**: https://developer.here.com/documentation/batch-geocoder/dev_guide/topics/introduction.html

**Descripcion**: API REST para geocodificar y reverse geocoding de grandes volumenes de datos.

**Funcionalidades principales**:
- Procesamiento optimizado para lotes grandes
- Forward y reverse geocoding
- Procesamiento asincrono
- Penalidad por trabajos pequenos (<10 direcciones)

**Casos de uso para logistica**:
- Geocodificacion masiva de base de datos de clientes
- Procesamiento nocturno de direcciones
- Importacion de ordenes en bloque
- Validacion de miles de direcciones

**Tipo de plan**: Servicio especializado

---

### 5.3 HERE Places / POI Search

**Documentacion**: Integrado en Geocoding & Search API v7

**Descripcion**: Busqueda de puntos de interes (POI) por categoria, nombre o proximidad.

**Categorias de POI disponibles** (cientos):
- Restaurantes y comida
- Gasolineras
- Hoteles
- Tiendas y shopping
- Servicios medicos
- Estacionamientos
- Cajeros automaticos
- Oficinas de correos
- Almacenes y bodegas
- Centros de distribucion

**Parametros de busqueda**:
- `categories` - Filtra por categoria de POI
- `foodTypes` - Filtra por tipo de comida
- `at` - Centro de busqueda (lat,lng)
- `in` - Area de busqueda (circle, bbox, country)

**Casos de uso para logistica**:
- Buscar gasolineras en ruta
- Localizar restaurantes para descansos de conductores
- Encontrar estacionamientos cercanos a destinos
- Identificar puntos de referencia para entregas
- Busqueda de competidores o clientes potenciales

**Tipo de plan**: Incluido en Geocoding & Search API

---

## 6. SERVICIOS DE FLEET MANAGEMENT Y LOGISTICA

### 6.1 HERE Fleet Optimization Package

**Descripcion**: Paquete de software diseado para mejorar eficiencia y escalabilidad de operaciones de gestion de flotas.

**Componentes principales**:
- Tour Planning API
- Matrix Routing API
- Routing API v8 avanzado
- Traffic API integration

**Beneficios demostrados**:
- Reduccion potencial del 20% en costos de gestion de flota
- Reduccion del 90% en tiempos de re-ruteo
- Aumento del 20% en productividad del conductor

**Capacidades de AI/ML**:
- IA para resolver operaciones de ruteo complejas
- Optimizacion considerando trafico historico y en tiempo real
- Restricciones de vehiculos y carreteras
- Ventanas de tiempo de entrega

**Casos de uso**:
- Utilizacion de flota
- Optimizacion de cadena de suministro
- Movimiento urbano
- Logistica last-mile

**Tipo de plan**: Paquete premium empresarial

---

### 6.2 HERE Fleet Telematics API

**URL Documentacion**: https://developer.here.com/documentation/fleet-telematics/dev_guide/index.html

**Descripcion**: Suite de APIs para gestion integral de flotas comerciales.

**Servicios incluidos**:

#### A. Geofencing
**Documentacion**: https://developer.here.com/documentation/geofencing/dev_guide/topics/what-is.html

**Funcionalidades**:
- Tracking de activos moviles en areas geograficas especificadas
- Geocercas poligonales
- Distancia a geometria de geocerca
- Deteccion de entrada/salida

#### B. Route Matching
- Map matching de GPS traces
- Atributos de mapa en rutas conducidas
- Analisis de riesgo y driving analytics

#### C. Advanced Data Sets
- Acceso a datos core del mapa no disponibles en otras APIs
- Tiles, registros y atributos
- Limites de velocidad condicionales
- Restricciones de camiones

#### D. Custom Routes
- Overlay de carreteras privadas
- Modificacion de atributos de carretera
- Restricciones de giro personalizadas
- Bloqueo de carreteras

**Casos de uso para logistica**:
- Monitoring de flotas en geocercas
- Validacion de cumplimiento de rutas
- Analisis de comportamiento de conduccion
- Gestion de zonas de entrega

**Tipo de plan**: Servicio empresarial

---

### 6.3 HERE Public Transit API v8

**URL Documentacion**: https://developer.here.com/documentation/public-transit/dev_guide/index.html

**Descripcion**: Tres APIs REST para descubrir opciones de transito publico y calcular rutas multimodales.

**APIs incluidas**:
1. Public Transit Routing API v8
2. Public Transit Next Departures API v8
3. Public Transit Station Search API v8

**Funcionalidades principales**:
- Descubrimiento de opciones de transito publico
- Rutas multimodales
- Busqueda de estaciones cercanas
- Proximas salidas
- Informacion de lineas de transito
- Demoras y disrupciones en tiempo real

**Casos de uso para logistica**:
- Ruteo de ultima milla usando transporte publico
- Planificacion de entregas urbanas sostenibles
- Integracion con soluciones intermodales
- Analisis de accesibilidad por transporte publico

**Tipo de plan**: Servicio avanzado

---

### 6.4 HERE Toll Cost API

**Documentacion**: https://developer.here.com/documentation/routing-api/dev_guide/topics/use-cases/tolls-tunnel.html

**Descripcion**: Servicio integrado en Routing API v8 para calcular costos de peaje en rutas.

**Funcionalidades principales**:
- Calculo de costos de peajes
- Informacion por seccion de ruta
- Nombres de peajes
- Metodos de pago
- Precios en moneda local
- Conversion a moneda solicitada
- Granularidad: desde ruta completa hasta segmentos individuales

**Tipos de vehiculos soportados**:
- car
- truck
- taxi
- bus

**Parametros de vehiculo considerados**:
- tollVehicleType
- weight (peso)
- width (ancho)
- length (largo)
- height (altura)
- trailer height (altura trailer)
- fuel type (tipo de combustible)

**Optimizacion de costos**:
- driver_cost - Costo de conducir por hora
- vehicle_cost - Costo de usar vehiculo por km
- customConsumptionDetails - Costo de combustible/energia

**Casos de uso para logistica**:
- Estimacion precisa de costos de entrega
- Optimizacion de rutas por costo total
- Presupuestacion de operaciones
- Comparacion de rutas alternativas
- Reportes de gastos operativos

**Tipo de plan**: Incluido en Routing API v8

---

### 6.5 HERE Parking API

**Descripcion**: Dos APIs especializadas para encontrar estacionamiento.

#### A. HERE On-Street Parking API
**URL Documentacion**: https://developer.here.com/documentation/on-street-parking/dev_guide/index.html

**Funcionalidades**:
- Estacionamiento en calle (no vigilado, junto al cordon)
- Disponibilidad en tiempo real
- Numero de espacios libres
- Nivel de ocupacion
- Probabilidad de encontrar espacio
- Tendencias de estacionamiento
- Precios/tarifas
- Restricciones

#### B. HERE Off-Street Parking API
**URL Documentacion**: https://developer.here.com/documentation/off-street-parking/dev_guide/topics/overview.html

**Funcionalidades**:
- Instalaciones de estacionamiento (estacionamientos, garages)
- Horarios de apertura
- Restricciones de altura
- Informacion de precios
- Disponibilidad en tiempo real
- Navegacion a entradas de instalacion

**Casos de uso para logistica**:
- Encontrar estacionamiento para vehiculos de entrega
- Planificacion de paradas en zonas urbanas
- Informacion para conductores sobre donde estacionar
- Optimizacion de tiempos de entrega

**Tipo de plan**: Servicio especializado

---

## 7. SERVICIOS DE ANALISIS Y OPTIMIZACION

### 7.1 HERE Optimized Map for Analytics (OMA)

**URL Documentacion**: https://developer.here.com/documentation/optimized-map-for-analytics/dev_guide/topics/example.html

**Descripcion**: Representacion alternativa de HERE Map Content para facilitar analisis de datos.

**Caracteristicas**:
- Version tabular desnormalizada de HERE Map Content
- Capas y atributos simplificados
- Relaciones simples (foreign keys y primary keys globales)
- Interoperabilidad con Optimized Map for Location Library

**Atributos disponibles**:
- Speed limits (SPEED_LIMITS_FCn)
- Slope attributes
- Curvature heading attributes
- Topology attributes
- Road attributes

**Casos de uso para logistica**:
- Analisis de redes de carreteras
- Estudios de optimizacion de rutas
- Analisis de datos historicos de viaje
- Business intelligence sobre operaciones
- Investigacion y desarrollo de algoritmos

**Tipo de plan**: Servicio de plataforma (Platform API)

---

### 7.2 HERE Location Library (Optimized Map for Location Library)

**URL Documentacion**: https://developer.here.com/documentation/location-library/dev_guide/index.html

**Descripcion**: Biblioteca optimizada para operaciones de map matching, proximity search y clustering.

**Funcionalidades principales**:
- Map matching eficiente
- Busqueda de proximidad
- Clustering de ubicaciones
- Integracion con OMA para recuperar atributos

**Casos de uso para logistica**:
- Clustering de puntos de entrega
- Matching de ubicaciones a red vial
- Optimizacion de zonas de entrega
- Analisis de densidad de entregas

**Tipo de plan**: Biblioteca de plataforma

---

### 7.3 HERE Map Attributes API

**URL Documentacion**: https://developer.here.com/documentation/content-map-attributes/dev_guide/topics/tutorials/map-content-for-speed-limits.html

**Descripcion**: API para acceder a atributos premium del mapa no disponibles en otras APIs.

**Atributos disponibles**:
- Speed limits (limites de velocidad)
- Traffic lights (semaforos)
- Dynamic EV POI data (datos dinamicos de POIs EV)
- Road curvature (curvatura de carretera)
- Slope (pendiente)
- Lane information (informacion de carriles)

**Capas disponibles**:
- SPEED_LIMITS_FCn (n=1-5 segun functional class)
- DEPENDENT_SPEED_TYPE (velocidad condicional por clima, hora, zonas)

**Casos de uso para logistica**:
- Analisis de seguridad de rutas
- Estimacion precisa de tiempos de viaje
- Planificacion considerando semaforos
- Optimizacion para vehiculos especificos
- Compliance con limites de velocidad

**Tipo de plan**: Servicio avanzado

---

## 8. SERVICIOS ESPECIALIZADOS

### 8.1 HERE Live Sense SDK

**URL Documentacion**: https://developer.here.com/products/live-sense-sdk
**Plataforma**: https://www.here.com/platform/live-sense-sdk

**Descripcion**: SDK que convierte dispositivos con camara frontal en sensores inteligentes usando AI/ML.

**Plataformas disponibles**:
- Android
- iOS
- Linux (beta)

**Modelos de deteccion AI/ML**:

#### Road Basics
- Deteccion y clasificacion de objetos en carretera
- Vehiculos
- Peatones
- Ciclistas

#### Road Alerts
- Reconocimiento de vehiculos frenando
- Deteccion de peatones
- Deteccion de bicicletas

#### Road Hazards
- Cierres de carretera no detectados en mapa
- Zonas de construccion
- Trabajos viales
- Baches

#### Road Signs
- Deteccion de limites de velocidad
- Clasificacion de senales de transito

**Caracteristicas tecnicas**:
- Procesamiento en tiempo real en el dispositivo
- Sin necesidad de conectividad
- Sin procesamiento en la nube
- Cumplimiento de regulaciones de privacidad

**Casos de uso para logistica**:
- Deteccion proactiva de peligros para conductores
- Recoleccion de datos de condiciones viales
- Alertas de seguridad en tiempo real
- Mejora continua de mapas con crowdsourcing
- Validacion de condiciones de ruta

**Tipo de plan**: SDK standalone o complementario a HERE SDK

---

### 8.2 HERE Custom Location Extensions (CLE2)

**URL Documentacion**: https://developer.here.com/documentation/android-premium/dev_guide/topics/custom-location-extensions-2.html

**Descripcion**: Permite distribuir informacion geoespacial personalizada en aplicaciones moviles.

**Funcionalidades principales**:
- Insercion programatica de contenido espacial a base de datos local
- Upload a servidor para compartir datos
- Carreteras privadas
- Overlay de mapas personalizados

**Capacidades de Overlay**:
- Adicion de nuevos links viales
- Modificacion de atributos de carreteras existentes
- Restricciones de giro personalizadas
- Bloqueo/depreciacion/preferencia de carreteras
- Dimensiones de camiones customizadas
- Atributos de mapa propios
- Hasta 500 links por operacion

**Casos de uso para logistica**:
- Mapeo de instalaciones privadas (patios, almacenes)
- Rutas internas de complejos industriales
- Carreteras de acceso restringido
- Mapas de sitios especificos
- Integracion de infraestructura propietaria

**Tipo de plan**: SDK Premium Edition

---

### 8.3 HERE Marketplace API

**URL Documentacion**: https://developer.here.com/documentation/marketplace-consumer/user_guide/topics/get_external-service_data.html

**Descripcion**: Servicio de proxy para acceder a servicios externos (REST APIs, AWS S3) con autenticacion y billing integrados.

**Funcionalidades principales**:
- Proxy de autenticacion a servicios externos
- Validacion de dominios provisionados
- Control de acceso a recursos
- Billing automatico
- Respuestas en formato original

**Uso**:
- Prefijo: `p.hereapi.com/tunnel/` antes del endpoint externo
- Metodos soportados: GET, POST, PUT, DELETE
- Autenticacion transparente
- Metering de uso

**Casos de uso para logistica**:
- Integracion con APIs de terceros
- Acceso a datasets especializados
- Servicios complementarios de proveedores
- Intercambio de datos B2B

**Tipo de plan**: Servicio de plataforma

---

### 8.4 HERE Map Creator

**URL**: https://mapcreator.here.com/

**Descripcion**: Herramienta web para editar y contribuir a los mapas HERE.

**Funcionalidades principales**:
- Edicion colaborativa de mapas
- Adicion de nuevas carreteras
- Correccion de errores de mapas
- Actualizacion de POIs
- Validacion comunitaria

**Casos de uso para logistica**:
- Reportar carreteras nuevas en areas de operacion
- Corregir errores que afectan rutas
- Actualizar informacion de accesos
- Mejorar precision de mapas locales

**Tipo de plan**: Gratuito (herramienta web)

---

## 9. SDKs Y PLATAFORMAS

### 9.1 HERE SDK for Android & iOS

**URL Documentacion**:
- iOS Navigate: https://www.here.com/docs/bundle/sdk-for-ios-navigate-developer-guide/page/README.html
- Android: https://developer.here.com/documentation/android-sdk-navigate/dev_guide/index.html
- GitHub Examples: https://github.com/heremaps/here-sdk-examples

**Ediciones disponibles**:
1. **Lite Edition** - Basico
2. **Explore Edition** - Intermedio
3. **Navigate Edition** - Premium con navegacion turn-by-turn

**Funcionalidades principales**:

#### Routing y Navegacion
- Ruteo dinamico con trafico en tiempo real
- Navegacion turn-by-turn con guia de voz
- Ruteo multi-modal (auto, transito, peatonal, bicicleta)
- Ruteo especifico para camiones
- Mapas online y offline (190+ paises)

#### Busqueda
- Busqueda de destinos
- Geocoding y reverse geocoding
- Autosuggest

#### Mapas
- Renderizado de mapas vectoriales
- Soporte 3D
- Personalizacion de estilos
- Marcadores y overlays

#### Caracteristicas 2025 (Febrero)
- `extrapolationEnabled` - Ahora estable (removido beta)
- `SpeedBasedCameraBehavior` - Ahora estable
- `optimizeWaypointsOrder` en RouteOptions - Ahora estable

**Casos de uso para logistica**:
- Apps nativas de navegacion para conductores
- Aplicaciones de gestion de flota mobile
- Tracking en tiempo real
- Navegacion offline en areas sin cobertura

**Tipo de plan**: Requiere licencia segun edicion

---

### 9.2 HERE Maps API for JavaScript v3

**URL Documentacion**: https://www.here.com/docs/bundle/maps-api-for-javascript-developer-guide/page/README.html

**Descripcion**: API JavaScript para mapas interactivos en aplicaciones web.

**Funcionalidades principales**:
- Mapas interactivos HTML5
- Integracion con servicios HERE
- Personalizacion completa
- Eventos de usuario
- Marcadores y overlays
- Renderizado de rutas

**Tipos de mapa**:
- Base map layers
- Vector tiles
- Raster tiles
- Satellite imagery
- Terrain
- Traffic overlays

**Casos de uso para logistica**:
- Dashboards web de operaciones
- Portales de clientes para tracking
- Herramientas de planificacion de rutas
- Visualizacion de analytics

**Tipo de plan**: Freemium

---

### 9.3 HERE SDK for React Native

**Descripcion**: Integracion del HERE SDK con React Native para apps hibridas.

**Funcionalidades**:
- Navegacion en tiempo real
- Mapas offline
- Optimizacion de rutas
- Integracion con servicios HERE

**Casos de uso para logistica**:
- Apps de entrega multiplataforma
- Reduccion de costos de desarrollo
- Reutilizacion de codigo web

**Tipo de plan**: Requiere integracion custom

---

### 9.4 HERE Platform Data SDK (Python, Java, Scala)

**URL Documentacion**:
- Python: https://developer.here.com/documentation/sdk-python-v2/dev_guide/topics/usage/here-platform-catalogs.html

**Descripcion**: SDKs para acceder y procesar datos de HERE Platform.

**Funcionalidades principales**:
- Acceso a catalogs y layers
- Procesamiento de datos geoespaciales
- Pipeline de datos
- Analisis batch

**Casos de uso para logistica**:
- Procesamiento de datos historicos
- Analisis de patrones de trafico
- Data science sobre operaciones
- Integracion con sistemas backend

**Tipo de plan**: Platform API

---

## 10. RESUMEN DE PRICING 2025

### Plan Freemium (Base Plan)

**Incluye 40 servicios** con los siguientes limites gratuitos:

#### Nivel 1: Alta generosidad
- **Geocoding & Search**: 250,000 queries/mes gratis
- Despues: $1 por 1,000 queries

#### Nivel 2: Estandar
- **Routing API** (car, bicycle, pedestrian): 30,000 transacciones gratis/mes
- **Geocoding, Auto Complete**: 30,000 transacciones gratis/mes
- Despues: $0.75 por 1,000 transacciones

#### Nivel 3: Avanzado
- **Search API, Autosuggest**: 5,000 transacciones gratis/mes
- **Traffic API**: 5,000 transacciones gratis/mes
- **Positioning API**: 5,000 transacciones gratis/mes
- **Advanced Routing** (Taxi, Truck, Time Aware): 5,000 transacciones gratis/mes
- **Public Transit, Intermodal**: 5,000 transacciones gratis/mes
- **Matrix Routing, Isoline**: 5,000 transacciones gratis/mes
- Despues: $2.50 por 1,000 transacciones

### Servicios Premium (Requieren Contrato)

**Solo con contacto a ventas**:
- EV Charge Points API
- Fleet Optimization Package
- Tour Planning API
- Fleet Telematics API completo
- HD GNSS Positioning
- Indoor Maps / Venue Maps
- Live Sense SDK (licencia)
- Custom Location Extensions
- HERE SDK Premium Editions

### Comparacion con Competencia

**Google Maps vs HERE Maps (Freemium)**:
- Google: 10,000 queries gratis
- HERE: 250,000 queries gratis (Geocoding)
- **HERE ofrece 25x mas queries gratis que Google**

---

## RESUMEN EJECUTIVO PARA LOGISTICA

### Servicios Criticos para Apps de Entregas (RECOMENDADOS)

#### Tier 1 - Esenciales (Freemium)
1. **Routing API v8** - Calculo de rutas
2. **Geocoding & Search API** - Validacion de direcciones
3. **Traffic API v7** - Trafico en tiempo real
4. **Matrix Routing API** - Optimizacion de asignaciones
5. **Maps APIs** - Visualizacion

**Costo estimado**: $0 hasta 5,000-30,000 transacciones/mes dependiendo del servicio

#### Tier 2 - Optimizacion (Premium)
1. **Tour Planning API** - Optimizacion multi-vehiculo
2. **Waypoints Sequence API** - Orden optimo de paradas
3. **Fleet Telematics Geofencing** - Zonas de entrega
4. **Toll Cost API** - Costos precisos

**Beneficios**: Reduccion 20% costos, 90% menos re-ruteos, 20% mas productividad

#### Tier 3 - Avanzados (Especializados)
1. **Route Matching API** - Analisis de rutas conducidas
2. **Live Sense SDK** - Deteccion de peligros
3. **Destination Weather API** - Planificacion con clima
4. **Truck Routing** - Para flotas pesadas
5. **EV Routing & Charge Points** - Para flotas electricas

### Casos de Uso Especificos

#### Last-Mile Delivery
- Routing API v8 + Traffic API
- Geocoding para validar direcciones
- Waypoints Sequence para optimizar paradas
- Geofencing para zonas de entrega
- Weather API para alertas

#### Fleet Management
- Tour Planning para despacho diario
- Matrix Routing para asignacion
- Route Matching para compliance
- Toll Cost para presupuestos
- Live Sense para seguridad

#### Heavy Truck Logistics
- Truck Routing con restricciones
- HazMat routing
- Toll Cost calculation
- Map Attributes (weight limits, height restrictions)
- Custom Location Extensions (private roads)

#### Electric Fleet
- EV Routing con consumo
- EV Charge Points locator
- Tour Planning optimizado para recarga
- Weather API (clima afecta autonomia)

#### Urban Logistics
- Intermodal Routing
- Public Transit integration
- Parking API (on/off street)
- Traffic API para evitar congestion
- Isoline para areas de cobertura

---

## SERVICIOS NO MENCIONADOS / FUERA DE SCOPE

Basado en la investigacion, los siguientes servicios NO fueron encontrados en la documentacion oficial de HERE Maps:

1. **"HERE Parking API"** - EXISTE (On-Street y Off-Street)
2. **"HERE EV Charging Stations API"** - EXISTE como "EV Charge Points API v2"
3. **"HERE Weather API"** - EXISTE como "Destination Weather API v3"
4. **"HERE Matrix Routing API"** - EXISTE (Matrix Routing API v8)
5. **"HERE Tour Planning API"** - EXISTE (parte de Fleet Optimization)
6. **"HERE Waypoints Sequence API"** - EXISTE (Waypoints Sequence)
7. **"HERE Map Matching API"** - EXISTE (parte de Route Matching API)
8. **"HERE Route Matching API"** - EXISTE (Route Matching API v8)
9. **"HERE Public Transit API"** - EXISTE (Public Transit API v8)

**Todos los servicios solicitados EXISTEN y han sido documentados.**

---

## ENLACES IMPORTANTES

### Documentacion Principal
- **Developer Portal**: https://developer.here.com/
- **Documentation Hub**: https://developer.here.com/documentation
- **API Explorer**: https://developer.here.com/api-explorer/rest
- **Platform Dashboard**: https://platform.here.com/

### Recursos Adicionales
- **Pricing**: https://developer.here.com/pricing
- **Support**: https://developer.here.com/support
- **GitHub**: https://github.com/heremaps
- **Blog**: https://www.here.com/learn/blog
- **Map Creator**: https://mapcreator.here.com/

### Notas de Version 2025
- **Enero 2025**: https://www.here.com/learn/blog/january-2025-platform-release-notes
- **Febrero 2025**: https://www.here.com/learn/blog/february-2025-platform-release-notes
- **Abril 2025**: https://www.here.com/learn/blog/april-2025-platform-release-notes
- **Mayo 2025**: https://www.here.com/learn/blog/may-2025-platform-release-notes
- **Junio 2025**: https://www.here.com/learn/blog/june-2025-platform-release-notes
- **Julio 2025**: https://www.here.com/learn/blog/july-2025-platform-release-notes

---

## CONCLUSIONES Y RECOMENDACIONES

### Para Aplicaciones de Entregas/Logistica

HERE Maps ofrece una suite **completa y robusta** para aplicaciones de logistica con:

1. **Cobertura Completa**: Todos los servicios necesarios estan disponibles
2. **Pricing Competitivo**: Freemium muy generoso (25x Google en geocoding)
3. **Especializacion**: Servicios especificos para logistica (Tour Planning, Fleet Telematics)
4. **Escalabilidad**: Desde startup (freemium) hasta empresa (premium)
5. **Innovation**: Servicios avanzados (AI/ML, 5G positioning, EV support)

### Servicios Destacados 2025

**Nuevos/Mejorados en 2025**:
- Posicionamiento 5G nativo
- Digital Elevation Model (DEM) tiles
- SDK optimizations (waypoints, camera behavior)
- Topology Attributes layer consolidado
- EV Charging Locations actualizados

### Proximo Paso Recomendado

Para implementar en una app de entregas:

1. **Fase 1 (Freemium)**: Routing + Geocoding + Traffic + Maps
2. **Fase 2 (Growth)**: Agregar Matrix + Waypoints Sequence
3. **Fase 3 (Scale)**: Tour Planning + Fleet Telematics
4. **Fase 4 (Advanced)**: Live Sense + Route Matching + Analytics

---

**Documento generado**: 2025-11-15
**Version**: 1.0
**Investigador**: Claude Code
**Fuentes**: 30+ URLs de documentacion oficial HERE Maps

---

**TOTAL DE SERVICIOS DOCUMENTADOS**: 40+ APIs y servicios
**TOTAL DE CATEGORIAS**: 9 categorias principales
**COBERTURA**: 100% de servicios solicitados encontrados y documentados
