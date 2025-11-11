# 🧪 Sistema de Testing con Datos Reales

## 📋 Descripción

Sistema completo para generar, cargar y simular datos realistas en la aplicación FultraTrack Mobile, con sincronización al backend y almacenamiento en base de datos.

---

## ✨ Características

### ✅ Generación de Datos Realistas

- **Clientes**: Empresas mexicanas con direcciones en Guadalajara
- **Productos**: Material de construcción con pesos y unidades reales
- **Entregas**: Ordenes de venta con folios, fechas y horarios
- **Coordenadas GPS**: Ubicaciones reales en zona metropolitana de Guadalajara
- **Estados**: Simulación de estados (PENDIENTE, EN_RUTA, ENTREGADO, etc.)

### ✅ Sincronización con Backend

- **POST** `/mobile/test/clientes` - Crear clientes
- **POST** `/mobile/test/entregas` - Crear entregas
- **POST** `/mobile/test/rutas-gps` - Crear rutas GPS
- **DELETE** `/mobile/test/all` - Limpiar todos los datos

### ✅ Simulación de Funcionalidades

- **Tracking GPS**: Simulación de movimiento en tiempo real
- **Confirmación de Entregas**: Confirmación automática con datos ficticios
- **Rutas Optimizadas**: Generación de rutas con múltiples paradas

---

## 🏗️ Arquitectura

```
src/
├── shared/
│   ├── models/
│   │   └── testData.models.ts          # Interfaces de datos de prueba
│   └── services/
│       ├── testDataGenerator.ts        # Generador de datos
│       └── testDataService.ts          # Servicio de carga al backend
└── screens/
    └── TestDataAdminScreen.tsx         # Pantalla de administración
```

---

## 📦 Modelos de Datos

### ClienteTest

```typescript
interface ClienteTest {
  nombre: string;           // "Abarrotes La Guadalupana 1"
  rfc: string;              // "ABCD701210ABC"
  telefono: string;         // "3312345678"
  email: string;            // "contacto@abarrotes.com"
  direccion: DireccionTest;
}
```

### EntregaTest

```typescript
interface EntregaTest {
  ordenVenta: string;       // "OV-202511-00001"
  folio: string;            // "F-12345678"
  fecha: string;            // "2025-11-11"
  tipoEntrega: 'ENTREGA' | 'RECOLECCION';
  estado: 'PENDIENTE' | 'EN_RUTA' | 'ENTREGADO' | 'PARCIAL' | 'NO_ENTREGADO';
  cliente: ClienteTest;
  productos: ProductoTest[];
  prioridad: number;        // 1-3
  horarioInicio: string;    // "08:00"
  horarioFin: string;       // "10:00"
  observaciones?: string;
}
```

### ProductoTest

```typescript
interface ProductoTest {
  sku: string;              // "PROD-000001"
  nombre: string;           // "Cemento Portland"
  descripcion: string;      // "Cemento Portland de alta calidad"
  cantidad: number;         // 50
  unidad: string;           // "bulto"
  peso: number;             // 2500 (kg)
}
```

---

## 🚀 Uso

### 1. Acceder a la Pantalla de Administración

```typescript
import TestDataAdminScreen from './screens/TestDataAdminScreen';

// En tu navegación
<Stack.Screen name="TestDataAdmin" component={TestDataAdminScreen} />
```

### 2. Configurar Parámetros

- **Número de Clientes**: 1-20 (por defecto: 5)
- **Entregas por Cliente**: 1-10 (por defecto: 3)
- **Generar Rutas GPS**: Sí/No (por defecto: Sí)
- **Simular Estados**: Sí/No (por defecto: Sí)

**Total Generado**: `Clientes × Entregas por Cliente`

Ejemplo: 5 clientes × 3 entregas = **15 entregas**

### 3. Cargar Datos

```typescript
// Click en "Cargar Datos"
// O programáticamente:
import { testDataService } from '@/shared/services';

const config = {
  numClientes: 5,
  numEntregasPorCliente: 3,
  fechaInicio: new Date(),
  generarRutaGPS: true,
  simularEstados: true,
};

const result = await testDataService.loadTestData(config);

console.log(`Clientes: ${result.data.clientesCreados}`);
console.log(`Entregas: ${result.data.entregasCreadas}`);
console.log(`Rutas: ${result.data.rutasGeneradas}`);
```

### 4. Simular GPS (Opcional)

```typescript
// Click en "Simular GPS"
// O programáticamente:
const ruta = {
  puntos: [
    { latitud: 20.6597, longitud: -103.3496, velocidad: 40 },
    // ... más puntos
  ],
};

await testDataService.simulateGPSTracking(
  ruta,
  (punto, index, total) => {
    console.log(`GPS: ${index}/${total} - ${punto.latitud}, ${punto.longitud}`);
  }
);
```

### 5. Limpiar Datos

```typescript
// Click en "Limpiar Datos"
// O programáticamente:
await testDataService.clearTestData();
```

---

## 🗂️ Datos Generados

### Ejemplo de Cliente

```json
{
  "nombre": "Abarrotes La Guadalupana 1",
  "rfc": "AGDL850315ABC",
  "telefono": "3345678901",
  "email": "contacto@abarroteslaguadalupana.com",
  "direccion": {
    "calle": "Av. Chapultepec",
    "numero": "2456",
    "colonia": "Americana",
    "ciudad": "Guadalajara",
    "estado": "Jalisco",
    "codigoPostal": "44160",
    "coordenadas": {
      "latitud": 20.6753,
      "longitud": -103.3612
    }
  }
}
```

### Ejemplo de Entrega

```json
{
  "ordenVenta": "OV-202511-00001",
  "folio": "F-87654321",
  "fecha": "2025-11-11",
  "tipoEntrega": "ENTREGA",
  "estado": "PENDIENTE",
  "prioridad": 2,
  "horarioInicio": "09:00",
  "horarioFin": "11:00",
  "productos": [
    {
      "sku": "PROD-000001",
      "nombre": "Cemento Portland",
      "cantidad": 50,
      "unidad": "bulto",
      "peso": 2500
    },
    {
      "sku": "PROD-000002",
      "nombre": "Varilla 3/8\"",
      "cantidad": 100,
      "unidad": "pieza",
      "peso": 530
    }
  ]
}
```

### Ejemplo de Ruta GPS

```json
{
  "puntos": [
    {
      "latitud": 20.6597,
      "longitud": -103.3496,
      "timestamp": "2025-11-11T08:00:00Z",
      "velocidad": 0
    },
    {
      "latitud": 20.6612,
      "longitud": -103.3503,
      "timestamp": "2025-11-11T08:00:30Z",
      "velocidad": 35
    },
    // ... 100+ puntos más
  ],
  "distanciaTotal": 15.5,
  "duracionEstimada": 45
}
```

---

## 🎯 Casos de Uso

### Caso 1: Testing de Lista de Entregas

```typescript
// 1. Cargar 10 clientes con 5 entregas cada uno
const config = {
  numClientes: 10,
  numEntregasPorCliente: 5,
  fechaInicio: new Date(),
  generarRutaGPS: false,
  simularEstados: true,
};

await testDataService.loadTestData(config);

// 2. Navegar a lista de entregas
// 3. Verificar que se muestran 50 entregas
// 4. Filtrar por estado, fecha, etc.
```

### Caso 2: Testing de Tracking GPS

```typescript
// 1. Cargar 3 clientes con rutas GPS
const config = {
  numClientes: 3,
  numEntregasPorCliente: 2,
  fechaInicio: new Date(),
  generarRutaGPS: true, // ✅ Importante
  simularEstados: false,
};

await testDataService.loadTestData(config);

// 2. Simular movimiento GPS
// 3. Ver tracking en mapa en tiempo real
```

### Caso 3: Testing de Confirmación de Entregas

```typescript
// 1. Cargar datos básicos
await testDataService.loadTestData({
  numClientes: 5,
  numEntregasPorCliente: 2,
  fechaInicio: new Date(),
  generarRutaGPS: false,
  simularEstados: false,
});

// 2. Para cada entrega, simular confirmación
const entregas = await getEntregas(); // Tu método
for (const entrega of entregas) {
  await testDataService.simulateEntregaConfirmation(entrega.id);
}

// 3. Verificar que los estados cambiaron a ENTREGADO
```

### Caso 4: Testing de Modo Offline

```typescript
// 1. Cargar datos
await testDataService.loadTestData(config);

// 2. Desactivar red
// 3. Intentar confirmar entrega
// 4. Verificar que se guarda en queue offline
// 5. Reactivar red
// 6. Verificar sincronización automática
```

---

## 🛠️ Endpoints del Backend Requeridos

Para que el sistema funcione completamente, el backend debe implementar estos endpoints:

### POST `/mobile/test/clientes`

```json
{
  "nombre": "string",
  "rfc": "string",
  "telefono": "string",
  "email": "string",
  "direccion": {
    "calle": "string",
    "numero": "string",
    "colonia": "string",
    "ciudad": "string",
    "estado": "string",
    "codigoPostal": "string",
    "coordenadas": {
      "latitud": number,
      "longitud": number
    }
  }
}
```

### POST `/mobile/test/entregas`

```json
{
  "ordenVenta": "string",
  "folio": "string",
  "fecha": "string",
  "tipoEntrega": "ENTREGA | RECOLECCION",
  "estado": "PENDIENTE | EN_RUTA | ...",
  "cliente": { ... },
  "direccionEntrega": { ... },
  "productos": [ ... ],
  "prioridad": number,
  "horarioEntregaInicio": "string",
  "horarioEntregaFin": "string",
  "observaciones": "string?"
}
```

### POST `/mobile/test/rutas-gps`

```json
{
  "puntos": [
    {
      "latitud": number,
      "longitud": number,
      "timestamp": "string",
      "velocidad": number
    }
  ],
  "distanciaTotal": number,
  "duracionEstimada": number
}
```

### DELETE `/mobile/test/all`

Elimina todos los datos de prueba de la base de datos.

---

## 📊 Validación de Datos en BD

### Consultas SQL de Ejemplo

```sql
-- Ver clientes de prueba
SELECT * FROM Clientes
WHERE Email LIKE '%@%'
  AND Nombre LIKE '%Abarrotes%'
ORDER BY FechaCreacion DESC;

-- Ver entregas de prueba
SELECT * FROM Entregas
WHERE OrdenVenta LIKE 'OV-2025%'
ORDER BY FechaCreacion DESC;

-- Ver productos en entregas
SELECT e.OrdenVenta, p.Nombre, ep.Cantidad
FROM EntregasProductos ep
JOIN Entregas e ON ep.EntregaId = e.Id
JOIN Productos p ON ep.ProductoId = p.Id
WHERE e.OrdenVenta LIKE 'OV-2025%';

-- Ver puntos GPS
SELECT * FROM RutasGPS
WHERE Timestamp >= DATEADD(day, -1, GETDATE())
ORDER BY Timestamp ASC;

-- Contar registros de prueba
SELECT
  (SELECT COUNT(*) FROM Clientes WHERE Email LIKE '%@abarrotes%') as Clientes,
  (SELECT COUNT(*) FROM Entregas WHERE OrdenVenta LIKE 'OV-2025%') as Entregas,
  (SELECT COUNT(*) FROM RutasGPS WHERE Timestamp >= DATEADD(day, -1, GETDATE())) as PuntosGPS;
```

---

## ⚠️ Consideraciones

### Rendimiento

- **Clientes recomendados**: 5-20
- **Entregas por cliente**: 2-10
- **Total máximo recomendado**: 200 entregas

Si generas demasiados datos, la carga puede tardar varios minutos.

### Limpieza

**IMPORTANTE**: Usa "Limpiar Datos" antes de generar nuevos datos para evitar duplicados.

### Datos Realistas

Los datos generados son lo más realistas posible:
- Direcciones reales en Guadalajara
- Empresas con nombres mexicanos típicos
- Productos de construcción reales
- RFCs con formato válido
- Coordenadas GPS dentro de zona metropolitana

### Modo Desarrollo

En desarrollo (config.authDisabled = true), los datos se pueden cargar sin autenticación para facilitar el testing.

---

## 🔍 Debugging

### Ver Datos en Consola

```typescript
// Ver clientes generados
const { clientes, entregas } = testDataGenerator.generateTestDataSet(config);
console.log('Clientes:', JSON.stringify(clientes, null, 2));
console.log('Entregas:', JSON.stringify(entregas, null, 2));
```

### Ver Resultado de Carga

```typescript
const result = await testDataService.loadTestData(config);
console.log('Resultado:', result);
console.log('Errores:', result.errores);
```

### Verificar Estado

```typescript
const hasData = await testDataService.hasTestDataLoaded();
console.log('¿Tiene datos?:', hasData);

const info = await testDataService.getTestDataInfo();
console.log('Info:', info);
```

---

## 📱 Capturas de Pantalla Esperadas

### Pantalla de Administración

```
┌─────────────────────────────┐
│  🧪 Datos de Prueba         │
│  Administración y Simulación│
├─────────────────────────────┤
│ Estado Actual               │
│ Clientes:    5              │
│ Entregas:    15             │
│ Rutas GPS:   1              │
│ ✅ Datos Cargados           │
├─────────────────────────────┤
│ Configuración               │
│ Clientes:     [−] 5 [+]    │
│ Entregas:     [−] 3 [+]    │
│ Rutas GPS:    ✓            │
│ Simular:      ✓            │
│ Total: 15 entregas          │
├─────────────────────────────┤
│ [📥 Cargar Datos]          │
│ [🚗 Simular GPS]           │
│ [🗑️ Limpiar Datos]         │
└─────────────────────────────┘
```

---

## ✅ Checklist de Testing

- [ ] Cargar 5 clientes con 3 entregas cada uno
- [ ] Verificar que se crean 15 entregas en BD
- [ ] Navegar a lista de entregas y ver los datos
- [ ] Ver detalle de una entrega
- [ ] Simular tracking GPS
- [ ] Ver movimiento en mapa
- [ ] Confirmar una entrega manualmente
- [ ] Simular confirmación automática
- [ ] Probar modo offline
- [ ] Verificar sincronización
- [ ] Limpiar todos los datos
- [ ] Verificar que la BD queda limpia

---

## 🚀 Próximas Mejoras

- [ ] Simulación de fotos de entrega
- [ ] Simulación de firmas digitales
- [ ] Generación de reportes de testing
- [ ] Export de datos a JSON/CSV
- [ ] Importación de datos desde archivo
- [ ] Simulación de múltiples choferes
- [ ] Simulación de incidencias
- [ ] Generación de datos históricos

---

**Versión**: 1.0.0
**Fecha**: 2025-11-11
**Estado**: ✅ LISTO PARA USAR
