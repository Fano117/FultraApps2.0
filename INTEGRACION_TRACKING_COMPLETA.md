# 🎯 INTEGRACIÓN COMPLETA DEL SISTEMA DE TRACKING

## ✅ LO QUE SE HA IMPLEMENTADO

He integrado completamente el sistema de tracking GPS con la app de entregas. Ahora los datos de prueba y las entregas reales funcionan de la misma manera.

---

## 📋 CAMBIOS REALIZADOS EN EL CÓDIGO

### 1. **Tipos de Navegación** ([src/navigation/types.ts](src/navigation/types.ts))

Se agregó la pantalla de tracking a la navegación de entregas:

```typescript
export type EntregasStackParamList = {
  // ... rutas existentes
  EntregaTracking: {
    entregaId: number;
    folio: string;
    puntoEntrega: { latitud: number; longitud: number };
    nombreCliente: string;
  };
};
```

### 2. **Modelo de Datos** ([src/apps/entregas/models/types.ts](src/apps/entregas/models/types.ts:64))

Se agregó el campo `id` opcional a `EntregaDTO`:

```typescript
export interface EntregaDTO {
  id?: number;  // ← NUEVO: ID de la entrega para tracking
  ordenVenta: string;
  folio: string;
  // ... resto de campos
}
```

### 3. **Pantalla de Lista de Entregas** ([src/apps/entregas/screens/EntregasListScreen.tsx](src/apps/entregas/screens/EntregasListScreen.tsx:71))

Se agregó:
- Función `handleTrackingPress` para navegar al tracking
- Botón "Ver Tracking" en cada tarjeta de entrega
- Validación de coordenadas antes de navegar

Cada entrega ahora muestra:
```
┌─────────────────────────────┐
│ E-20251111-001              │
│ OV: 12345                   │
│ 🟢 PENDIENTE               │
│                             │
│ 📦 5 artículos             │
│ 🔢 Cantidad: 100           │
│ 🔄 ENTREGA                 │
│                             │
│ [🧭 Ver Tracking]          │ ← NUEVO BOTÓN
└─────────────────────────────┘
```

### 4. **Navegador de Entregas** ([src/navigation/EntregasNavigator.tsx](src/navigation/EntregasNavigator.tsx:41))

Se registraron las pantallas faltantes:
- `EntregasList` - Lista de entregas
- `EntregaDetail` - Detalle de entrega
- `EntregaTracking` - Tracking en vivo (**NUEVO**)

---

## 🔧 LO QUE NECESITAS HACER EN EL BACKEND

### Problema Actual

Cuando creas datos de prueba en la app, se envían al backend y se guardan correctamente con el flag `EsTestData = true`. Sin embargo, **no aparecen en la lista de entregas** porque el endpoint `/EmbarquesEntrega` no los está incluyendo en la respuesta.

### Solución: Modificar el Endpoint de Entregas

Debes modificar el endpoint que devuelve las entregas para que incluya también las entregas de prueba.

#### Endpoint Actual
```csharp
// GET /api/EmbarquesEntrega
public async Task<ActionResult<List<ClienteEntregaDTO>>> GetEmbarquesEntrega()
{
    var choferId = ObtenerChoferIdActual();

    // Obtener entregas del chofer (solo entregas "reales")
    var entregas = await _context.Entregas
        .Where(e => e.ChoferId == choferId)
        .Include(e => e.Cliente)
        .Include(e => e.Direccion)
        .Include(e => e.Articulos)
        .ToListAsync();

    // Transformar a DTOs...
    return Ok(clientesDTO);
}
```

#### Endpoint Modificado (Incluye Datos de Prueba)
```csharp
// GET /api/EmbarquesEntrega
public async Task<ActionResult<List<ClienteEntregaDTO>>> GetEmbarquesEntrega()
{
    var choferId = ObtenerChoferIdActual();

    // Obtener TODAS las entregas del chofer (incluyendo las de prueba)
    var entregas = await _context.Entregas
        .Where(e => e.ChoferId == choferId)
        // NO filtrar por EsTestData - queremos incluir TODO
        .Include(e => e.Cliente)
        .Include(e => e.Direccion)
        .Include(e => e.Articulos)
        .OrderByDescending(e => e.FechaCreacion)
        .ToListAsync();

    // Transformar a DTOs
    var clientesDTO = entregas
        .GroupBy(e => new
        {
            e.Cliente.Nombre,
            e.Cliente.CuentaCliente,
            e.Direccion.Latitud,
            e.Direccion.Longitud
        })
        .Select(g => new ClienteEntregaDTO
        {
            Cliente = g.Key.Nombre,
            CuentaCliente = g.Key.CuentaCliente,
            Carga = g.First().Carga,
            DireccionEntrega = g.First().Direccion.Direccion,
            Latitud = g.Key.Latitud.ToString(),      // ← IMPORTANTE: Incluir coordenadas
            Longitud = g.Key.Longitud.ToString(),    // ← IMPORTANTE: Incluir coordenadas
            Entregas = g.Select(e => new EntregaDTO
            {
                Id = e.Id,                            // ← IMPORTANTE: Incluir ID
                OrdenVenta = e.OrdenVenta,
                Folio = e.Folio,
                TipoEntrega = e.TipoEntrega,
                Estado = e.Estado,
                Articulos = e.Articulos.Select(a => new ArticuloDTO { ... }).ToList()
            }).ToList()
        })
        .ToList();

    return Ok(clientesDTO);
}
```

### Campos Críticos que DEBE Incluir el Backend

El backend DEBE devolver estos campos en el DTO:

```csharp
public class ClienteEntregaDTO
{
    public string Cliente { get; set; }
    public string CuentaCliente { get; set; }
    public string Carga { get; set; }
    public string DireccionEntrega { get; set; }
    public string Latitud { get; set; }      // ← OBLIGATORIO para tracking
    public string Longitud { get; set; }     // ← OBLIGATORIO para tracking
    public List<EntregaDTO> Entregas { get; set; }
}

public class EntregaDTO
{
    public int Id { get; set; }              // ← OBLIGATORIO para tracking
    public string OrdenVenta { get; set; }
    public string Folio { get; set; }
    public string TipoEntrega { get; set; }
    public string Estado { get; set; }
    public List<ArticuloEntregaDTO> Articulos { get; set; }
}
```

---

## 🎯 FLUJO COMPLETO DEL SISTEMA

### 1. Crear Datos de Prueba

```
Usuario → Tab "Testing" 🧪
       ↓
Configurar datos (clientes, productos, entregas)
       ↓
Presionar "Cargar Datos"
       ↓
Se envían al backend con EsTestData = true
       ↓
Backend los guarda como entregas REALES
```

### 2. Ver Entregas en la Lista

```
Usuario → Tab "Entregas" 📦
       ↓
App llama a GET /api/EmbarquesEntrega
       ↓
Backend devuelve TODAS las entregas (incluyendo test)
       ↓
Aparecer en la lista agrupadas por cliente
       ↓
Cada entrega muestra botón "Ver Tracking" 🧭
```

### 3. Abrir Tracking

```
Usuario presiona "Ver Tracking" en una entrega
       ↓
App navega a EntregaTrackingScreen con:
  - entregaId: 123
  - folio: "E-20251111-001"
  - puntoEntrega: { lat: 20.6710, lng: -103.3600 }
  - nombreCliente: "Construcciones García"
       ↓
Pantalla de tracking se abre
       ↓
Inicializa GPS y muestra mapa
```

### 4. Tracking en Tiempo Real

```
Sistema inicia tracking GPS cada 5 segundos
       ↓
Muestra:
  - Marcador del chofer 🚗 (morado)
  - Marcador del destino 📍 (rojo)
  - Geocerca de 50m 🔵 (círculo azul)
  - Ruta recorrida (línea morada)
  - Distancia actual
       ↓
Botón "Completar" se habilita cuando distancia ≤ 50m
```

### 5. Simular Movimiento (Para Testing)

```
Usuario presiona botón "🚗 Navegar"
       ↓
Sistema simula movimiento desde ubicación actual
       ↓
Se mueve hacia el punto de entrega a 40 km/h
       ↓
Actualiza posición cada 1 segundo
       ↓
Cuando llega a destino, botón se habilita
```

### 6. Completar Entrega

```
Botón habilitado cuando distancia ≤ 50m
       ↓
Usuario presiona "Completar Entrega"
       ↓
App envía a POST /api/mobile/entregas/{id}/completar
       ↓
Backend valida distancia nuevamente
       ↓
Si distancia > 50m → Error 400 "Fuera de rango"
Si distancia ≤ 50m → Entrega completada ✅
       ↓
Entrega marcada como COMPLETADA
       ↓
Usuario regresa a lista de entregas
```

### 7. Limpiar Datos de Prueba

```
Usuario → Tab "Testing" 🧪
       ↓
Presionar "Limpiar Datos"
       ↓
Backend elimina TODAS las entregas donde EsTestData = true
       ↓
Entregas de prueba desaparecen de la lista
```

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

### Error 1: "Esta entrega no tiene coordenadas de destino"

**Causa:** El backend no está devolviendo los campos `latitud` y `longitud` en `ClienteEntregaDTO`.

**Solución:** Asegúrate de que el endpoint incluye:
```csharp
Latitud = e.Direccion.Latitud.ToString(),
Longitud = e.Direccion.Longitud.ToString(),
```

### Error 2: "No hay entregas pendientes" (pero se crearon datos de prueba)

**Causa:** El backend está filtrando las entregas con `EsTestData = true`.

**Solución:** NO filtres por `EsTestData`. Las entregas de prueba deben aparecer como entregas normales.

### Error 3: Tracking no puede completar entrega

**Causa:** El backend no tiene implementado el endpoint de completar con validación de geocerca.

**Solución:** Implementa el endpoint según [BACKEND_ENDPOINTS_TRACKING.cs](BACKEND_ENDPOINTS_TRACKING.cs:64).

---

## 📝 CHECKLIST DE INTEGRACIÓN

### Backend
- [ ] Endpoint `/api/EmbarquesEntrega` incluye entregas con `EsTestData = true`
- [ ] DTO incluye campo `Id` en `EntregaDTO`
- [ ] DTO incluye campos `Latitud` y `Longitud` en `ClienteEntregaDTO`
- [ ] Endpoint `/api/mobile/entregas/{id}/completar` implementado
- [ ] Validación de geocerca (50m) en backend
- [ ] Endpoint `/api/mobile/test/limpiar` para borrar datos de prueba

### Frontend (✅ Ya Implementado)
- [x] Botón "Ver Tracking" en lista de entregas
- [x] Pantalla `EntregaTrackingScreen` registrada
- [x] Navegación funcionando
- [x] Validación de coordenadas antes de navegar
- [x] Tipos actualizados con `EntregaTracking`

---

## 🎉 RESULTADO FINAL

Una vez que implementes los cambios en el backend, tendrás:

### ✅ Lo que Funciona AHORA
- ✅ Crear datos de prueba desde la app
- ✅ Enviar datos al backend
- ✅ Guardar como entregas reales con flag `EsTestData`
- ✅ Sistema de tracking GPS completo
- ✅ Simulación de movimiento
- ✅ Validación de geocercas (50m)
- ✅ Botón de tracking en la lista
- ✅ Navegación completa

### 🔧 Lo que Necesita Backend
- 🔧 Incluir entregas de prueba en `/EmbarquesEntrega`
- 🔧 Devolver campos `id`, `latitud`, `longitud`
- 🔧 Endpoint de completar con validación de geocerca

---

## 🔍 CÓMO PROBAR

### Paso 1: Crear Datos de Prueba
1. Abre la app
2. Ve al tab "Testing" 🧪
3. Configura una entrega de prueba
4. Presiona "Cargar Datos"
5. Verifica que se envíe al backend sin errores

### Paso 2: Verificar en Lista
1. Ve al tab "Entregas" 📦
2. Desliza hacia abajo para refrescar
3. **Si no aparece nada** → Backend no está devolviendo las entregas de prueba
4. **Si aparecen** → Verifica que cada entrega tenga el botón "Ver Tracking"

### Paso 3: Probar Tracking
1. Presiona "Ver Tracking" en cualquier entrega
2. Debería abrir el mapa con:
   - Marcador rojo en el punto de entrega
   - Marcador morado en tu ubicación (o simulada)
   - Círculo azul de 50m
3. Panel de información mostrando distancia

### Paso 4: Simular Movimiento
1. Presiona el botón "🚗 Navegar"
2. Observa cómo el marcador se mueve hacia el destino
3. Observa cómo la distancia disminuye
4. Cuando llegue, el botón "Completar" se habilita

### Paso 5: Completar Entrega
1. Espera a que la distancia sea ≤ 50m
2. Presiona "Completar Entrega"
3. Confirma
4. **Si backend está implementado** → Entrega se completa
5. **Si backend no está implementado** → Error de conexión

### Paso 6: Limpiar
1. Regresa al tab "Testing" 🧪
2. Presiona "Limpiar Datos"
3. Verifica que las entregas de prueba desaparezcan

---

## 📞 SOPORTE

Si encuentras algún problema:

1. **Entregas no aparecen** → Verifica endpoint `/EmbarquesEntrega`
2. **Botón tracking no funciona** → Verifica coordenadas en DTO
3. **No puede completar** → Verifica endpoint de completar
4. **Errores de GPS** → Verifica permisos de ubicación

---

**Estado:** ✅ Frontend 100% Completo | 🔧 Backend Requiere Cambios Menores

**Última actualización:** 2025-11-11

**Archivos clave:**
- [EntregasListScreen.tsx](src/apps/entregas/screens/EntregasListScreen.tsx) - Lista con botón de tracking
- [EntregaTrackingScreen.tsx](src/screens/EntregaTrackingScreen.tsx) - Pantalla de tracking
- [LiveTrackingMap.tsx](src/shared/components/LiveTrackingMap.tsx) - Componente de mapa
- [gpsTrackingService.ts](src/shared/services/gpsTrackingService.ts) - Servicio GPS
- [BACKEND_ENDPOINTS_TRACKING.cs](BACKEND_ENDPOINTS_TRACKING.cs) - Endpoints del backend
