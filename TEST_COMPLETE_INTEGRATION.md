# 🧪 Test de Integración Completa - FultraTrack Mobile

## 🎯 Objetivo

Verificar que TODA la implementación funciona correctamente:
- ✅ Autenticación OAuth2 con el backend
- ✅ Generación de datos de prueba realistas
- ✅ Carga de datos al backend y base de datos
- ✅ Tracking GPS simulado
- ✅ Confirmación de entregas
- ✅ Modo offline
- ✅ Notificaciones push

---

## 📋 Pre-requisitos

### 1. Backend en Funcionamiento

Asegúrate que el backend está corriendo:

```bash
# Verifica que responda
curl https://api.fultra.net/health
# O en desarrollo
curl http://192.168.100.99:5104/health
```

### 2. Endpoints Implementados

El backend DEBE tener estos endpoints:

**Autenticación:**
- `POST /connect/token` - OAuth2 login

**Datos de Prueba:**
- `POST /api/mobile/test/clientes` - Crear clientes de prueba
- `POST /api/mobile/test/entregas` - Crear entregas de prueba
- `POST /api/mobile/test/rutas-gps` - Crear rutas GPS de prueba
- `DELETE /api/mobile/test/all` - Limpiar todos los datos de prueba
- `GET /api/mobile/test/stats` - Estadísticas (opcional)

**Entregas (endpoints reales):**
- `GET /api/mobile/chofer/entregas` - Listar entregas
- `GET /api/mobile/chofer/entregas/:id` - Detalle de entrega
- `POST /api/mobile/entregas/:id/confirmar` - Confirmar entrega
- `GET /api/mobile/chofer/ruta` - Ruta del día

**Ubicación:**
- `POST /api/mobile/chofer/ubicacion` - Enviar ubicación GPS

**Notificaciones:**
- `POST /api/mobile/chofer/notificaciones/suscribir` - Suscribir a push

### 3. Base de Datos Actualizada

Las entidades deben tener el campo `EsTestData`:

```sql
-- Verificar en SQL Server
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('Clientes', 'Entregas', 'RutasGPS')
  AND COLUMN_NAME = 'EsTestData';
```

Si NO existe, ejecuta la migración:

```bash
cd backend
dotnet ef migrations add AddTestDataFlags
dotnet ef database update
```

---

## 🚀 Plan de Testing

### Test 1: Autenticación OAuth2

**Objetivo:** Verificar que la app se conecta y autentica correctamente.

1. **Abrir la app**
2. **Ir a LoginScreen**
3. **Ingresar credenciales:**
   - Usuario: `chofer1` (o el que tengas configurado)
   - Password: `chofer123`

4. **Verificar:**
   - ✅ Login exitoso
   - ✅ Token JWT guardado
   - ✅ Navegación a pantalla principal
   - ✅ Datos del usuario cargados (nombre, chofer ID)

**Debug:**
```typescript
// En LoginScreen después del login
const token = await storageService.getAccessToken();
console.log('Token:', token?.substring(0, 50) + '...');

const userData = await enhancedAuthService.getUserData();
console.log('User data:', userData);
```

---

### Test 2: Generación de Datos de Prueba

**Objetivo:** Verificar que se generan datos realistas.

1. **Navegar a TestDataAdminScreen**
2. **Configurar parámetros:**
   - Clientes: 3
   - Entregas por cliente: 2
   - Generar rutas GPS: ✓
   - Simular estados: ✓

3. **Verificar en consola:**
```typescript
import { testDataGenerator } from '@/shared/services';

const config = {
  numClientes: 3,
  numEntregasPorCliente: 2,
  fechaInicio: new Date(),
  generarRutaGPS: true,
  simularEstados: true,
};

const { clientes, entregas, rutas } = testDataGenerator.generateTestDataSet(config);

console.log('Clientes generados:', clientes);
console.log('Entregas generadas:', entregas);
console.log('Rutas generadas:', rutas);
```

**Verificar:**
- ✅ 3 clientes con nombres mexicanos
- ✅ RFCs válidos (formato ABCD701210ABC)
- ✅ Teléfonos con lada 33 (Guadalajara)
- ✅ Direcciones en Guadalajara
- ✅ Coordenadas GPS realistas (cerca de 20.6597, -103.3496)
- ✅ 6 entregas total (3 × 2)
- ✅ Productos de construcción realistas
- ✅ Estados variados (PENDIENTE, EN_RUTA, etc.)
- ✅ 1 ruta GPS con 100+ puntos

---

### Test 3: Carga de Datos al Backend

**Objetivo:** Enviar datos al backend y guardar en BD.

1. **En TestDataAdminScreen, hacer click en "Cargar Datos"**
2. **Confirmar en el diálogo**
3. **Esperar a que complete (puede tardar 10-30 segundos)**

4. **Verificar resultado:**
   - ✅ Alert de éxito
   - ✅ "Clientes: 3"
   - ✅ "Entregas: 6"
   - ✅ "Rutas: 1"
   - ✅ Tiempo de ejecución en ms

5. **Verificar en base de datos:**

```sql
-- Clientes de prueba
SELECT * FROM Clientes WHERE EsTestData = 1;

-- Entregas de prueba
SELECT * FROM Entregas WHERE EsTestData = 1;

-- Productos en entregas
SELECT e.OrdenVenta, p.Nombre, ep.Cantidad
FROM EntregasProductos ep
JOIN Entregas e ON ep.EntregaId = e.Id
JOIN Productos p ON ep.ProductoId = p.Id
WHERE e.EsTestData = 1;

-- Rutas GPS
SELECT COUNT(*) as TotalPuntos
FROM PuntosGPS pg
JOIN RutasGPS r ON pg.RutaGPSId = r.Id
WHERE r.EsTestData = 1;

-- Contar registros
SELECT
  (SELECT COUNT(*) FROM Clientes WHERE EsTestData = 1) as Clientes,
  (SELECT COUNT(*) FROM Entregas WHERE EsTestData = 1) as Entregas,
  (SELECT COUNT(*) FROM RutasGPS WHERE EsTestData = 1) as Rutas;
```

**Resultado esperado:**
- 3 clientes
- 6 entregas
- 100+ puntos GPS

---

### Test 4: Obtener Entregas del Día

**Objetivo:** Verificar que la app puede leer las entregas creadas.

1. **Ir a la pantalla de "Mis Entregas" o similar**
2. **Ejecutar:**

```typescript
import { entregasService } from '@/shared/services';

// Obtener entregas
const response = await entregasService.getEntregas({
  fecha: new Date().toISOString().split('T')[0],
  pageNumber: 1,
  pageSize: 20,
});

console.log('Entregas del día:', response);
console.log('Total:', response.totalCount);
console.log('Primera entrega:', response.data[0]);
```

**Verificar:**
- ✅ Se obtienen las 6 entregas
- ✅ Datos completos (folio, cliente, productos, estado)
- ✅ Coordenadas GPS presentes
- ✅ Paginación funciona

---

### Test 5: Ver Detalle de Entrega

**Objetivo:** Verificar que se puede ver el detalle completo.

```typescript
const entregaId = 1; // O el ID de una entrega de prueba
const detalle = await entregasService.getEntregaById(entregaId);

console.log('Detalle completo:', detalle);
console.log('Cliente:', detalle.cliente);
console.log('Productos:', detalle.productos);
console.log('Dirección:', detalle.direccionEntrega);
```

**Verificar:**
- ✅ Cliente con nombre y RFC
- ✅ Dirección completa con coordenadas
- ✅ Lista de productos con cantidades
- ✅ Estado de la entrega
- ✅ Horario de entrega

---

### Test 6: Simular Tracking GPS

**Objetivo:** Enviar ubicaciones GPS en tiempo real.

1. **En TestDataAdminScreen, click en "Simular GPS"**
2. **O programáticamente:**

```typescript
const ruta = {
  puntos: [
    { latitud: 20.6597, longitud: -103.3496, timestamp: new Date().toISOString(), velocidad: 0 },
    { latitud: 20.6610, longitud: -103.3500, timestamp: new Date().toISOString(), velocidad: 35 },
    { latitud: 20.6625, longitud: -103.3510, timestamp: new Date().toISOString(), velocidad: 40 },
  ],
};

await testDataService.simulateGPSTracking(ruta, (punto, index, total) => {
  console.log(`GPS ${index}/${total}: ${punto.latitud}, ${punto.longitud}`);
});
```

3. **Verificar en backend/BD:**

```sql
-- Últimas ubicaciones recibidas
SELECT TOP 10 * FROM UbicacionesChofer
ORDER BY FechaHora DESC;
```

**Verificar:**
- ✅ Se envían ubicaciones cada 1 segundo (simulado)
- ✅ Backend recibe y guarda las ubicaciones
- ✅ Coordenadas correctas
- ✅ Velocidad registrada

---

### Test 7: Confirmar Entrega

**Objetivo:** Simular la confirmación de una entrega.

```typescript
// Obtener una entrega pendiente
const entregas = await entregasService.getEntregas({
  estado: 'PENDIENTE',
  pageNumber: 1,
  pageSize: 1,
});

const entrega = entregas.data[0];

// Confirmar entrega
const confirmacion = {
  entregaId: entrega.id,
  estado: 'ENTREGADO',
  nombreRecibe: 'Juan Pérez',
  coordenadas: {
    latitud: entrega.direccionEntrega.coordenadas.latitud,
    longitud: entrega.direccionEntrega.coordenadas.longitud,
  },
  productos: entrega.productos.map(p => ({
    productoId: p.id,
    cantidadEntregada: p.cantidad,
  })),
  observaciones: 'Entrega completada sin novedad',
  fotosEvidencia: [],
  fechaHora: new Date().toISOString(),
};

await entregasService.confirmarEntrega(confirmacion);
```

**Verificar:**
- ✅ Entrega marcada como ENTREGADO en BD
- ✅ Fecha y hora de confirmación guardada
- ✅ Nombre de quien recibe guardado
- ✅ Coordenadas de entrega guardadas

```sql
SELECT * FROM Entregas WHERE Id = 1; -- Verificar estado
SELECT * FROM EntregasProductos WHERE EntregaId = 1; -- Ver cantidades entregadas
```

---

### Test 8: Modo Offline

**Objetivo:** Verificar que funciona sin conexión.

1. **Desactivar red (Airplane mode)**
2. **Intentar confirmar una entrega**
3. **Verificar:**
   - ✅ Se guarda en cola offline
   - ✅ Alert de "Operación guardada, se sincronizará cuando haya conexión"

```typescript
import { offlineService } from '@/shared/services';

// Ver cola offline
const pendientes = await offlineService['obtenerOperacionesPendientes']();
console.log('Operaciones pendientes:', pendientes);
```

4. **Reactivar red**
5. **Verificar:**
   - ✅ Sincronización automática
   - ✅ Operación enviada al backend
   - ✅ Cola vaciada

```typescript
offlineService.addNetworkListener((isOnline) => {
  console.log('Red:', isOnline ? 'Conectada' : 'Desconectada');
});
```

---

### Test 9: Limpieza de Datos

**Objetivo:** Eliminar todos los datos de prueba.

1. **En TestDataAdminScreen, click en "Limpiar Datos"**
2. **Confirmar en el diálogo destructivo**
3. **Esperar confirmación**

4. **Verificar en BD:**

```sql
-- Debe devolver 0 registros
SELECT COUNT(*) FROM Clientes WHERE EsTestData = 1;
SELECT COUNT(*) FROM Entregas WHERE EsTestData = 1;
SELECT COUNT(*) FROM RutasGPS WHERE EsTestData = 1;
```

**Verificar:**
- ✅ Todos los clientes de prueba eliminados
- ✅ Todas las entregas de prueba eliminadas
- ✅ Todas las rutas GPS eliminadas
- ✅ Productos huérfanos eliminados (cascade)

---

### Test 10: Notificaciones Push

**Objetivo:** Recibir notificaciones del backend.

```typescript
import { notificacionesService } from '@/shared/services';

// Inicializar
await notificacionesService.initialize();

// Suscribir
await notificacionesService.suscribirse();

// Escuchar notificaciones
notificacionesService.addNotificationListener((notification) => {
  console.log('Notificación recibida:', notification);
});

// Enviar notificación local de prueba
await notificacionesService.sendLocalNotification(
  'Entrega Asignada',
  'Tienes 3 nuevas entregas para hoy',
  { tipo: 'NUEVA_ENTREGA' }
);
```

**Verificar:**
- ✅ Permisos de notificaciones solicitados
- ✅ Token push obtenido
- ✅ Suscripción registrada en backend
- ✅ Notificación local mostrada
- ✅ Listener recibe notificaciones

---

## 🔧 Troubleshooting

### Error: "Endpoint no existe (404)"

**Problema:** El backend no tiene los endpoints implementados.

**Solución:**
1. Implementar los endpoints del archivo `BACKEND_ENDPOINTS_TESTING.cs`
2. Agregar el controlador `TestDataController.cs` al proyecto backend
3. Recompilar y reiniciar el backend

### Error: "Network request failed"

**Problema:** No puede conectar con el backend.

**Solución:**
1. Verificar que el backend está corriendo
2. Verificar la IP/URL en `environments.ts`
3. En Android, verificar permisos de internet en `AndroidManifest.xml`
4. En iOS, verificar `Info.plist` permite HTTP (si no es HTTPS)

### Error: "Unauthorized (401)"

**Problema:** Token expirado o inválido.

**Solución:**
1. Hacer logout y login nuevamente
2. Verificar que las credenciales son correctas
3. Verificar que el clientId y clientSecret son correctos en `environments.ts`

### Error: "Column 'EsTestData' does not exist"

**Problema:** Migración de BD no aplicada.

**Solución:**
```bash
cd backend
dotnet ef migrations add AddTestDataFlags
dotnet ef database update
```

### Los datos se generan pero NO aparecen en la lista

**Problema:** Filtros de fecha o chofer.

**Solución:**
1. Verificar que las fechas generadas coinciden con la fecha de hoy
2. Verificar que las entregas están asignadas al chofer correcto
3. Revisar parámetros de consulta en `getEntregas()`

---

## ✅ Checklist Completo

Marca cada test completado:

- [ ] **Test 1:** Login OAuth2 funciona
- [ ] **Test 2:** Datos de prueba se generan correctamente
- [ ] **Test 3:** Datos se cargan al backend y BD
- [ ] **Test 4:** Entregas se obtienen de la API
- [ ] **Test 5:** Detalle de entrega se muestra completo
- [ ] **Test 6:** Tracking GPS se envía correctamente
- [ ] **Test 7:** Confirmación de entrega funciona
- [ ] **Test 8:** Modo offline guarda y sincroniza
- [ ] **Test 9:** Limpieza de datos funciona
- [ ] **Test 10:** Notificaciones push funcionan

---

## 📊 Resultados Esperados

Al completar TODOS los tests:

### Backend debe tener:
- 3+ clientes en tabla `Clientes` con `EsTestData = 1`
- 6+ entregas en tabla `Entregas` con `EsTestData = 1`
- 10+ productos en tabla `Productos`
- 100+ puntos GPS en tabla `PuntosGPS`
- Registros de ubicaciones en `UbicacionesChofer`
- Tokens push en `NotificacionesSuscripciones`

### App debe mostrar:
- ✅ Lista de entregas del día
- ✅ Detalle completo de cada entrega
- ✅ Mapa con ubicaciones
- ✅ Estados actualizados
- ✅ Notificaciones recibidas

### Logs deben mostrar:
```
🚀 Iniciando carga de datos de prueba...
📝 Generando datos...
✅ Generados: 3 clientes, 6 entregas
📤 Enviando clientes...
📤 Enviando entregas...
📍 Enviando rutas GPS...
✅ Carga completada exitosamente
⏱️ Tiempo: 5243ms
```

---

## 🎉 Éxito Total

Si TODOS los tests pasan, tu integración está **100% funcional** y lista para:

1. **Desarrollo de funcionalidades** - Tienes datos reales para trabajar
2. **Testing de UI/UX** - Puedes probar todas las pantallas
3. **Demo a clientes** - Datos realistas mexicanos
4. **QA completo** - Flujos end-to-end verificables
5. **Performance testing** - Cargar 100+ entregas y medir

---

## 📝 Notas Finales

- **Datos de prueba:** Siempre usa `EsTestData = true` para poder limpiarlos fácilmente
- **Producción:** NUNCA subir datos de prueba a producción
- **Desarrollo:** Usa `devCredentials.authDisabled = true` para desarrollo más rápido
- **Testing:** Limpia datos antes de cada ciclo de testing

---

**Versión:** 1.0.0
**Fecha:** 2025-11-11
**Estado:** ✅ LISTO PARA TESTING COMPLETO
