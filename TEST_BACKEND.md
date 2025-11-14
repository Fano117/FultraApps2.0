# 🧪 TEST: Verificar Backend de Entregas

## 📊 Logs Actuales

Los logs muestran que:
- ✅ Backend está funcionando
- ✅ Encuentra al chofer `alfredo.gallegos`
- ✅ Query SQL ejecutada correctamente

Pero **NO vemos** el query de entregas. Esto significa que:
1. El endpoint de entregas NO se está llamando, O
2. El endpoint se está llamando pero no hay logs

## 🔍 Verificación Paso a Paso

### Paso 1: Verificar en la Base de Datos

Ejecuta esta query directamente en SQL Server Management Studio:

```sql
-- Ver todas las entregas del chofer
SELECT
    e.Id,
    e.Folio,
    e.OrdenVenta,
    e.ChoferId,
    e.Estado,
    e.EsTestData,
    e.FechaCreacion,
    c.Nombre AS Cliente,
    d.Latitud,
    d.Longitud
FROM Entregas e
INNER JOIN Choferes ch ON e.ChoferId = ch.Id
LEFT JOIN Clientes c ON e.ClienteId = c.Id
LEFT JOIN Direcciones d ON e.DireccionId = d.Id
WHERE ch.UsuarioIntranet = 'alfredo.gallegos'
ORDER BY e.FechaCreacion DESC;
```

**Resultado Esperado:**
```
Id  | Folio          | ChoferId | Estado    | EsTestData | Latitud   | Longitud
----|----------------|----------|-----------|------------|-----------|----------
123 | E-20251111-001 | 1        | PENDIENTE | True       | 20.6710   | -103.3600
```

**Si NO hay resultados:**
- Las entregas de prueba NO se guardaron en la BD
- Verifica los logs cuando creas datos de prueba

**Si HAY resultados pero no aparecen en la app:**
- El endpoint `/api/EmbarquesEntrega` está filtrando incorrectamente

---

### Paso 2: Probar el Endpoint Directamente

#### Opción A: Usando Postman

```http
GET https://api.fultra.net/api/EmbarquesEntrega
Headers:
  X-Dev-User: alfredo.gallegos
  Content-Type: application/json
```

#### Opción B: Usando curl (desde terminal)

```bash
curl -X GET "https://api.fultra.net/api/EmbarquesEntrega" \
  -H "X-Dev-User: alfredo.gallegos" \
  -H "Content-Type: application/json" \
  -v
```

**Respuesta Esperada (Si está bien):**
```json
[
  {
    "cliente": "Construcciones García",
    "cuentaCliente": "C001",
    "carga": "CARGA001",
    "direccionEntrega": "Av. América 1234",
    "latitud": "20.6710",
    "longitud": "-103.3600",
    "entregas": [
      {
        "id": 123,
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

**Respuesta si está mal:**
```json
[]  // ← Array vacío
```

---

### Paso 3: Agregar Logs al Backend

Modifica el endpoint `GetEmbarquesEntrega` para agregar logs:

```csharp
[HttpGet]
[Route("api/EmbarquesEntrega")]
public async Task<ActionResult<List<ClienteEntregaDTO>>> GetEmbarquesEntrega()
{
    var choferId = ObtenerChoferIdActual();

    _logger.LogInformation($"[ENTREGAS] Buscando entregas para chofer ID: {choferId}");

    var entregas = await _context.Entregas
        .Where(e => e.ChoferId == choferId)
        .Include(e => e.Cliente)
        .Include(e => e.Direccion)
        .Include(e => e.Articulos)
        .ToListAsync();

    _logger.LogInformation($"[ENTREGAS] Total encontradas: {entregas.Count}");
    _logger.LogInformation($"[ENTREGAS] Con EsTestData=true: {entregas.Count(e => e.EsTestData)}");
    _logger.LogInformation($"[ENTREGAS] Con EsTestData=false: {entregas.Count(e => !e.EsTestData)}");

    // Si no hay entregas, log de debugging
    if (entregas.Count == 0)
    {
        _logger.LogWarning($"[ENTREGAS] ⚠️ No se encontraron entregas para chofer {choferId}");

        // Verificar si existen entregas en la BD sin filtrar por chofer
        var totalEntregas = await _context.Entregas.CountAsync();
        _logger.LogInformation($"[ENTREGAS] Total entregas en BD (todos los choferes): {totalEntregas}");
    }

    // Resto del código para transformar a DTOs...
    var clientesDTO = TransformarAClienteDTO(entregas);

    _logger.LogInformation($"[ENTREGAS] Devolviendo {clientesDTO.Count} clientes");

    return Ok(clientesDTO);
}
```

---

### Paso 4: Verificar el Flujo Completo

Después de agregar los logs, recarga la app y observa los logs del backend:

**Logs Esperados (Si todo está bien):**
```
[ENTREGAS] Buscando entregas para chofer ID: 1
[ENTREGAS] Total encontradas: 3
[ENTREGAS] Con EsTestData=true: 3
[ENTREGAS] Con EsTestData=false: 0
[ENTREGAS] Devolviendo 2 clientes
```

**Logs si hay problema:**
```
[ENTREGAS] Buscando entregas para chofer ID: 1
[ENTREGAS] Total encontradas: 0
[ENTREGAS] ⚠️ No se encontraron entregas para chofer 1
[ENTREGAS] Total entregas en BD (todos los choferes): 0
```

---

## 🐛 DIAGNÓSTICOS SEGÚN LOGS

### Caso 1: "Total encontradas: 0" + "Total en BD: 0"
**Problema:** Las entregas NO se están guardando en la BD.

**Solución:** Verifica el endpoint `POST /api/mobile/test/entregas` que crea las entregas.

---

### Caso 2: "Total encontradas: 0" + "Total en BD: 5"
**Problema:** Las entregas existen pero están asignadas a OTRO chofer.

**Solución:** Verifica el `ChoferId` al crear entregas de prueba. Debe ser el mismo que el chofer autenticado.

---

### Caso 3: "Total encontradas: 3" + "Devolviendo 0 clientes"
**Problema:** Las entregas existen pero la transformación a DTO está fallando.

**Solución:** Verifica que las entregas tienen `ClienteId` y `DireccionId` válidos.

---

### Caso 4: Backend devuelve datos pero app muestra vacío
**Problema:** El frontend no está procesando correctamente la respuesta.

**Solución:** Verifica los logs del frontend en React Native:
```javascript
// En entregasApiService.ts línea 5-12
async fetchEmbarquesEntrega(): Promise<ClienteEntregaDTO[]> {
  try {
    console.log('[APP] Llamando a /EmbarquesEntrega...');
    const response = await apiService.get<ClienteEntregaDTO[]>('/EmbarquesEntrega');
    console.log('[APP] Respuesta recibida:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('[APP] Error fetching embarques entrega:', error);
    throw error;
  }
}
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Ejecutar query SQL para ver entregas en BD
- [ ] Verificar que existen entregas con `EsTestData = true`
- [ ] Verificar que `ChoferId` coincide con el chofer autenticado
- [ ] Verificar que entregas tienen `ClienteId` y `DireccionId`
- [ ] Probar endpoint con Postman/curl
- [ ] Agregar logs al backend
- [ ] Recargar app y revisar logs
- [ ] Verificar respuesta del endpoint
- [ ] Verificar logs del frontend

---

## 🎯 SIGUIENTE PASO

Por favor ejecuta la **query SQL del Paso 1** y comparte el resultado. Esto nos dirá exactamente dónde está el problema:

```sql
SELECT
    e.Id,
    e.Folio,
    e.ChoferId,
    e.Estado,
    e.EsTestData,
    c.Nombre AS Cliente
FROM Entregas e
LEFT JOIN Clientes c ON e.ClienteId = c.Id
WHERE e.ChoferId IN (
    SELECT Id FROM Choferes WHERE UsuarioIntranet = 'alfredo.gallegos'
)
ORDER BY e.FechaCreacion DESC;
```

Una vez que vea el resultado, podré decirte exactamente qué ajustar. 🔍
