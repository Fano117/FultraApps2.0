# 🔴 PROBLEMA: Datos de Prueba No Aparecen en Panel de Entregas

## 🎯 Diagnóstico del Problema

Cuando creas datos de prueba desde el tab "Testing" 🧪:
- ✅ Los datos se envían correctamente al backend
- ✅ El backend los guarda con `EsTestData = true`
- ✅ No hay errores en la creación
- ❌ **NO APARECEN en el panel de entregas principal**

## 🔍 Causa Raíz

El endpoint **`GET /api/EmbarquesEntrega`** del backend **NO está devolviendo** las entregas con `EsTestData = true`.

### Flujo Actual (Incorrecto)

```
Testing Tab → Crear datos
     ↓
POST /api/mobile/test/entregas (con EsTestData = true)
     ↓
Backend guarda en BD ✅
     ↓
Entregas Tab → Refrescar lista
     ↓
GET /api/EmbarquesEntrega
     ↓
Backend filtra: WHERE EsTestData = false ❌
     ↓
Devuelve lista vacía (sin entregas de prueba)
     ↓
Panel muestra "No hay entregas" 😢
```

### Flujo Esperado (Correcto)

```
Testing Tab → Crear datos
     ↓
POST /api/mobile/test/entregas (con EsTestData = true)
     ↓
Backend guarda en BD ✅
     ↓
Entregas Tab → Refrescar lista
     ↓
GET /api/EmbarquesEntrega
     ↓
Backend devuelve TODAS las entregas ✅
     ↓
Lista muestra entregas de prueba Y reales 🎉
     ↓
Botón "Ver Tracking" visible en cada entrega
```

---

## 🔧 SOLUCIÓN: Modificar Endpoint en Backend

### Ubicación del Archivo

Busca el archivo del controlador que maneja `/api/EmbarquesEntrega`. Probablemente:
- `Controllers/EmbarquesEntregaController.cs`
- `Controllers/MobileController.cs`
- Similar

### Código ACTUAL (Probablemente)

```csharp
[HttpGet]
[Route("api/EmbarquesEntrega")]
public async Task<ActionResult<List<ClienteEntregaDTO>>> GetEmbarquesEntrega()
{
    var choferId = ObtenerChoferIdActual();

    // ❌ PROBLEMA: Probablemente está filtrando entregas de prueba
    var entregas = await _context.Entregas
        .Where(e => e.ChoferId == choferId && e.EsTestData == false)  // ← AQUÍ ESTÁ EL PROBLEMA
        .Include(e => e.Cliente)
        .Include(e => e.Direccion)
        .Include(e => e.Articulos)
        .ToListAsync();

    // Transformar a DTOs...
    var clientesDTO = TransformarAClienteDTO(entregas);

    return Ok(clientesDTO);
}
```

### Código MODIFICADO (Solución)

```csharp
[HttpGet]
[Route("api/EmbarquesEntrega")]
public async Task<ActionResult<List<ClienteEntregaDTO>>> GetEmbarquesEntrega()
{
    var choferId = ObtenerChoferIdActual();

    // ✅ SOLUCIÓN: Incluir TODAS las entregas (reales y de prueba)
    var entregas = await _context.Entregas
        .Where(e => e.ChoferId == choferId)  // ← Solo filtrar por chofer
        // ⚠️ NO filtrar por EsTestData - queremos incluir TODAS
        .Include(e => e.Cliente)
        .Include(e => e.Direccion)
        .Include(e => e.Articulos)
        .OrderByDescending(e => e.FechaCreacion)
        .ToListAsync();

    // Agrupar por cliente
    var clientesDTO = entregas
        .GroupBy(e => new
        {
            ClienteId = e.ClienteId,
            e.Cliente.Nombre,
            e.Cliente.CuentaCliente,
            e.Direccion.Latitud,
            e.Direccion.Longitud,
            e.Direccion.Direccion
        })
        .Select(g => new ClienteEntregaDTO
        {
            Cliente = g.Key.Nombre,
            CuentaCliente = g.Key.CuentaCliente,
            Carga = g.First().Carga,
            DireccionEntrega = g.Key.Direccion,
            Latitud = g.Key.Latitud.ToString(),      // ← IMPORTANTE para tracking
            Longitud = g.Key.Longitud.ToString(),    // ← IMPORTANTE para tracking
            Entregas = g.Select(e => new EntregaDTO
            {
                Id = e.Id,                            // ← IMPORTANTE para tracking
                OrdenVenta = e.OrdenVenta,
                Folio = e.Folio,
                TipoEntrega = e.TipoEntrega,
                Estado = e.Estado,
                Articulos = e.Articulos.Select(a => new ArticuloEntregaDTO
                {
                    Id = a.Id,
                    NombreOrdenVenta = a.NombreOrdenVenta,
                    Producto = a.Producto,
                    CantidadProgramada = a.CantidadProgramada,
                    CantidadEntregada = a.CantidadEntregada,
                    Restante = a.Restante,
                    Peso = a.Peso,
                    UnidadMedida = a.UnidadMedida,
                    Descripcion = a.Descripcion
                }).ToList()
            }).ToList()
        })
        .ToList();

    return Ok(clientesDTO);
}
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Campos Obligatorios en el DTO

El backend **DEBE** devolver estos campos:

#### ClienteEntregaDTO
```csharp
public class ClienteEntregaDTO
{
    public string Cliente { get; set; }           // Nombre del cliente
    public string CuentaCliente { get; set; }     // Cuenta
    public string Carga { get; set; }             // Carga
    public string DireccionEntrega { get; set; }  // Dirección texto
    public string Latitud { get; set; }           // ← ⚠️ OBLIGATORIO (string)
    public string Longitud { get; set; }          // ← ⚠️ OBLIGATORIO (string)
    public List<EntregaDTO> Entregas { get; set; }
}
```

#### EntregaDTO
```csharp
public class EntregaDTO
{
    public int Id { get; set; }                   // ← ⚠️ OBLIGATORIO
    public string OrdenVenta { get; set; }
    public string Folio { get; set; }
    public string TipoEntrega { get; set; }
    public string Estado { get; set; }
    public List<ArticuloEntregaDTO> Articulos { get; set; }
}
```

### Checklist de Implementación

- [ ] **Eliminar** filtro `WHERE EsTestData = false`
- [ ] **Incluir** campo `Id` en EntregaDTO
- [ ] **Incluir** campo `Latitud` (como string) en ClienteEntregaDTO
- [ ] **Incluir** campo `Longitud` (como string) en ClienteEntregaDTO
- [ ] **Agrupar** entregas por cliente correctamente
- [ ] **Ordenar** por fecha de creación (más recientes primero)

---

## 🧪 CÓMO PROBAR LA SOLUCIÓN

### Paso 1: Verificar el Backend

Después de hacer los cambios, prueba el endpoint directamente:

```bash
# En Postman o similar
GET https://tu-backend.com/api/EmbarquesEntrega
Headers:
  X-Dev-User: chofer1
  Authorization: Bearer [token]
```

**Respuesta Esperada:**
```json
[
  {
    "cliente": "Construcciones García",
    "cuentaCliente": "C001",
    "carga": "CARGA001",
    "direccionEntrega": "Av. América 1234",
    "latitud": "20.6710",        // ← Debe estar presente
    "longitud": "-103.3600",     // ← Debe estar presente
    "entregas": [
      {
        "id": 123,               // ← Debe estar presente
        "ordenVenta": "OV-001",
        "folio": "E-20251111-001",
        "tipoEntrega": "ENTREGA",
        "estado": "PENDIENTE",
        "articulos": [...]
      }
    ]
  }
]
```

### Paso 2: Probar en la App

1. **Crear datos de prueba:**
   - Abre la app
   - Ve al tab "Testing" 🧪
   - Configura una entrega de prueba
   - Presiona "Cargar Datos"
   - Verifica que no haya errores en los logs

2. **Verificar en panel de entregas:**
   - Ve al tab "Entregas" 📦
   - **Desliza hacia abajo** para refrescar (pull to refresh)
   - **Deberías ver** la entrega que acabas de crear
   - Cada entrega debe tener el botón "Ver Tracking" 🧭

3. **Probar el tracking:**
   - Presiona "Ver Tracking" en cualquier entrega
   - Debería abrir el mapa con:
     - ✅ Marcador rojo (punto de entrega)
     - ✅ Marcador morado (tu ubicación)
     - ✅ Círculo azul (geocerca 50m)
     - ✅ Panel de información
     - ✅ Botón de simulación

4. **Simular movimiento:**
   - Presiona el botón "🚗 Navegar"
   - El marcador morado debe moverse hacia el destino
   - La distancia debe disminuir
   - Cuando llegue cerca (≤50m), el botón "Completar" se habilita

---

## 🐛 DEBUGGING: Si Aún No Aparecen

### Opción 1: Verificar Logs del Backend

```csharp
[HttpGet]
[Route("api/EmbarquesEntrega")]
public async Task<ActionResult<List<ClienteEntregaDTO>>> GetEmbarquesEntrega()
{
    var choferId = ObtenerChoferIdActual();

    var entregas = await _context.Entregas
        .Where(e => e.ChoferId == choferId)
        .ToListAsync();

    // ⚠️ DEBUGGING: Agregar este log
    Console.WriteLine($"[DEBUG] Total entregas para chofer {choferId}: {entregas.Count}");
    Console.WriteLine($"[DEBUG] Entregas de prueba: {entregas.Count(e => e.EsTestData)}");
    Console.WriteLine($"[DEBUG] Entregas reales: {entregas.Count(e => !e.EsTestData)}");

    // ... resto del código
}
```

### Opción 2: Verificar en Base de Datos

```sql
-- Consulta directa en la BD
SELECT
    Id,
    Folio,
    OrdenVenta,
    ChoferId,
    EsTestData,
    FechaCreacion
FROM Entregas
WHERE ChoferId = 1  -- Reemplaza con tu chofer ID
ORDER BY FechaCreacion DESC;
```

**Resultado Esperado:**
```
Id  | Folio          | ChoferId | EsTestData | FechaCreacion
----|----------------|----------|------------|------------------
123 | E-20251111-001 | 1        | True       | 2025-11-11 10:30
```

### Opción 3: Verificar Logs del Frontend

En la app, abre los logs de consola:

```typescript
// En EntregasListScreen.tsx ya está el log
useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  await dispatch(loadLocalData());
  await dispatch(fetchEmbarques());  // ← Este hace el GET
};
```

**Logs Esperados:**
```
[LOG] Fetching embarques entrega...
[LOG] Response: [
  { cliente: "Construcciones García", entregas: [...] }
]
```

**Logs de Error:**
```
[ERROR] Error fetching embarques entrega: [Error details]
```

---

## 📊 RESUMEN DE LA SOLUCIÓN

### El Problema
- Endpoint filtra `WHERE EsTestData = false`
- Entregas de prueba no se devuelven
- Panel queda vacío

### La Solución
```csharp
// ❌ ANTES (incorrecto)
.Where(e => e.ChoferId == choferId && e.EsTestData == false)

// ✅ DESPUÉS (correcto)
.Where(e => e.ChoferId == choferId)
```

### Campos Adicionales Necesarios
```csharp
// En ClienteEntregaDTO
Latitud = e.Direccion.Latitud.ToString(),
Longitud = e.Direccion.Longitud.ToString(),

// En EntregaDTO
Id = e.Id,
```

### Resultado Final
- ✅ Entregas de prueba aparecen en la lista
- ✅ Botón "Ver Tracking" visible
- ✅ Tracking funciona con simulación
- ✅ Puede completar entregas con validación de 50m
- ✅ Se pueden limpiar con "Limpiar Datos"

---

## 🆘 AYUDA ADICIONAL

Si después de implementar estos cambios aún no aparecen las entregas:

1. **Verifica el chofer ID:**
   - Asegúrate de que las entregas de prueba tengan el mismo `ChoferId` que estás usando en la app
   - El header `X-Dev-User` debe corresponder al chofer correcto

2. **Verifica la respuesta del backend:**
   - Usa Postman para llamar directamente al endpoint
   - Verifica que devuelve datos
   - Verifica que incluye los campos `id`, `latitud`, `longitud`

3. **Verifica el estado de la entrega:**
   - Las entregas deben tener estado `PENDIENTE` o similar
   - No deben estar marcadas como `COMPLETADO`

4. **Verifica los logs de la app:**
   - Abre la consola de React Native
   - Busca mensajes de error al hacer el `fetchEmbarques`

---

**Última actualización:** 2025-11-11
**Prioridad:** 🔴 ALTA
**Estado:** ⚠️ REQUIERE CAMBIOS EN BACKEND
