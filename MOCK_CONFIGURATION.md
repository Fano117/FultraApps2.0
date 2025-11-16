# Configuración de Datos Mock - Sistema de Entregas

## Descripción General

El sistema de entregas ahora incluye soporte completo para datos mock que permite ejecutar la aplicación sin conexión al backend de entregas. Los demás servicios (autenticación, ubicación, notificaciones) siguen funcionando normalmente.

## Estado Actual

✅ **MODO MOCK ACTIVADO** para el servicio de entregas
✅ Ubicación GPS funciona normalmente
✅ Notificaciones funcionan normalmente
✅ Autenticación funciona normalmente
✅ Todos los demás servicios funcionan normalmente

## Configuración

### Activar/Desactivar Modo Mock

Editar el archivo: `src/apps/entregas/services/entregasApiService.ts`

```typescript
// MODO MOCK GLOBAL - Cambiar a false para usar backend real
const USE_MOCK_DATA = true;  // ← Cambiar aquí
```

- **`true`**: Usa datos mock locales (sin conexión al backend de entregas)
- **`false`**: Usa el backend real de entregas

## Datos Mock Disponibles

### Archivo de Datos
`src/apps/entregas/mocks/mockData.ts`

### Clientes Mock (5 ejemplos)

1. **Restaurante El Buen Sabor**
   - Cuenta: CLI-001
   - Productos: Harina de Trigo Premium, Aceite Vegetal
   - Ubicación: Insurgentes Sur, CDMX

2. **Supermercado La Esquina**
   - Cuenta: CLI-002
   - Productos: Arroz Blanco, Frijol Negro
   - Ubicación: Av. Revolución, CDMX

3. **Farmacia San José**
   - Cuenta: CLI-003
   - Productos: Paracetamol 500mg, Ibuprofeno 400mg
   - Ubicación: Calle Madero, Centro CDMX

4. **Panadería Dulce Aroma**
   - Cuenta: CLI-004
   - Productos: Pan Integral
   - Ubicación: Av. Chapultepec, Roma Norte

5. **Ferretería El Tornillo**
   - Cuenta: CLI-005
   - Productos: Tornillos, Pintura Blanca
   - Ubicación: Calle Amsterdam, Condesa

## Funciones con Mock

Todas las siguientes funciones del servicio de entregas funcionan con datos mock:

### ✅ `fetchEntregasMoviles()`
- **Mock**: Retorna 5 clientes con sus entregas
- **Delay**: 800ms
- **Fallback**: Si backend falla, usa mock automáticamente

### ✅ `fetchEmbarquesEntrega()` (deprecated)
- **Mock**: Llama a fetchEntregasMoviles()
- **Status**: Deprecated, usar fetchEntregasMoviles()

### ✅ `getEntregaById(id)`
- **Mock**: Busca entrega por ID en datos mock
- **Delay**: 300ms
- **Busca por**: ordenVenta, folio o id

### ✅ `actualizarEstadoEntrega(id, estado)`
- **Mock**: Simula actualización exitosa
- **Delay**: 500ms
- **Log**: Muestra estado actualizado en consola

### ✅ `confirmarEntrega(confirmacion)`
- **Mock**: Simula confirmación exitosa con GPS
- **Delay**: 1000ms
- **Log**: Muestra detalles de confirmación

### ✅ `getRutaChofer()`
- **Mock**: Genera ruta con todos los puntos de entrega
- **Delay**: 600ms
- **Incluye**: distanciaTotal, tiempoEstimado, puntos GPS

### ✅ `enviarEmbarqueEntrega(embarque)` (deprecated)
- **Mock**: Simula envío exitoso
- **Delay**: 1000ms

### ✅ `subirImagenEvidencia(archivo, nombre, onProgress)`
- **Mock**: Simula subida con progreso (25%, 50%, 75%, 100%)
- **Delay**: 800ms total (200ms por paso)
- **Progreso**: Callback con porcentaje

## Logs de Consola

El sistema usa emojis para identificar fácilmente el modo:

- 🔧 **MODO MOCK**: Operación usando datos mock
- ✅ **Mock**: Operación exitosa en modo mock
- ⚠️ **Advertencia**: Error en backend, usando fallback a mock
- 🚀 **Backend**: Llamada al backend real
- ❌ **Error**: Error en operación

### Ejemplos de Logs

```
[ENTREGAS API] 🔧 MODO MOCK: Usando datos locales
[ENTREGAS API] ✅ Mock: Retornando 5 clientes con entregas

[ENTREGAS API] 🔧 MODO MOCK: Buscando entrega ID: OV-2025-001
[ENTREGAS API] ✅ Mock: Entrega encontrada: OV-2025-001

[ENTREGAS API] 🔧 MODO MOCK: Confirmando entrega OV-2025-001
[ENTREGAS API] ✅ Mock: Entrega confirmada exitosamente
```

## Fallback Automático

Si el modo mock está **desactivado** pero el backend **falla**, el sistema automáticamente usa datos mock como fallback:

```
[ENTREGAS API] ❌ Error fetching entregas móviles: Network Error
[ENTREGAS API] ⚠️ Error en backend, usando datos mock como fallback
```

Esto asegura que la aplicación siempre funcione, incluso sin conexión.

## Servicios NO Afectados

Los siguientes servicios **NO** usan datos mock y funcionan normalmente:

- ✅ **Autenticación** (`authService.ts`)
- ✅ **API Base** (`apiService.ts`)
- ✅ **Ubicación GPS** (Expo Location)
- ✅ **Notificaciones** (Expo Notifications)
- ✅ **Almacenamiento Local** (AsyncStorage)
- ✅ **Cámara y Galería** (Expo Image Picker)

## Características del Sistema Mock

### 1. Delays Realistas
Simula tiempos de respuesta de red realistas:
- Consultas rápidas: 300ms
- Consultas normales: 500-800ms
- Operaciones de escritura: 1000ms

### 2. Datos Variados
5 tipos diferentes de clientes con productos diversos para testing completo.

### 3. IDs Únicos
Todos los artículos tienen IDs únicos (1-9) para evitar errores de claves duplicadas.

### 4. Coordenadas GPS Reales
Ubicaciones reales en Ciudad de México para testing de mapas y geolocalización.

### 5. Progreso de Subida
Simulación realista de progreso de subida de imágenes con callbacks.

## Testing

Para probar todas las funcionalidades con datos mock:

1. ✅ Ver lista de clientes → `ClientesEntregasScreen`
2. ✅ Ver órdenes de venta → `OrdenesVentaScreen`
3. ✅ Ver detalle de orden → `DetalleOrdenScreen`
4. ✅ Realizar entrega → `FormularioEntregaScreen`
5. ✅ Subir imágenes → Simulación con progreso
6. ✅ Confirmar entrega → Simulación con GPS

## Migración a Backend Real

Cuando el backend esté disponible:

1. Cambiar `USE_MOCK_DATA = false` en `entregasApiService.ts`
2. Verificar que todos los endpoints estén configurados correctamente
3. El sistema seguirá usando fallback a mock en caso de errores

## Estructura de Datos Mock

### ClienteEntregaDTO
```typescript
{
  cliente: string;
  cuentaCliente: string;
  carga: string;
  direccionEntrega: string;
  latitud: string;
  longitud: string;
  entregas: EntregaDTO[];
}
```

### EntregaDTO
```typescript
{
  id?: number;
  ordenVenta: string;
  folio: string;
  tipoEntrega: string;
  estado: string;
  articulos: ArticuloEntregaDTO[];
  cargaCuentaCliente?: string;
}
```

### ArticuloEntregaDTO
```typescript
{
  id: number;
  nombreCarga?: string;
  nombreOrdenVenta: string;
  producto: string;
  cantidadProgramada: number;
  cantidadEntregada: number;
  restante: number;
  peso: number;
  unidadMedida: string;
  descripcion: string;
}
```

## Notas Importantes

- ⚠️ El modo mock solo afecta al servicio de entregas
- ✅ La ubicación GPS sigue funcionando con el dispositivo real
- ✅ Las notificaciones siguen funcionando normalmente
- ✅ La autenticación sigue funcionando normalmente
- ✅ El almacenamiento local funciona normalmente

## Soporte

Para cambiar la configuración o agregar más datos mock, editar:
- `src/apps/entregas/mocks/mockData.ts`
- `src/apps/entregas/services/entregasApiService.ts`
