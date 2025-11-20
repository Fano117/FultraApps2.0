-- ============================================
-- QUERIES DE VERIFICACIÓN - SISTEMA DE ENTREGAS
-- ============================================

-- ========================================
-- PASO 1: Verificar que existe el chofer
-- ========================================
SELECT
    Id,
    Nombre,
    UsuarioIntranet
FROM Choferes
WHERE UsuarioIntranet = 'alfredo.gallegos';

-- Resultado esperado: Debe mostrar 1 fila con el ID del chofer


-- ========================================
-- PASO 2: Verificar entregas del chofer
-- ========================================
-- Query más simple sin JOINs
SELECT
    Id,
    Folio,
    OrdenVenta,
    ChoferId,
    Estado,
    ISNULL(EsTestData, 0) AS EsTestData,
    FechaCreacion
FROM Entregas
WHERE ChoferId IN (
    SELECT Id FROM Choferes WHERE UsuarioIntranet = 'alfredo.gallegos'
);

-- Resultado esperado:
-- Debería mostrar las entregas de prueba que creaste
-- Si está vacío, las entregas NO se guardaron


-- ========================================
-- PASO 3: Ver TODAS las entregas (debugging)
-- ========================================
-- Si el PASO 2 no devuelve nada, ejecuta esto
SELECT TOP 10
    Id,
    Folio,
    OrdenVenta,
    ChoferId,
    Estado,
    ISNULL(EsTestData, 0) AS EsTestData,
    FechaCreacion
FROM Entregas
ORDER BY FechaCreacion DESC;

-- Esto muestra las últimas 10 entregas de CUALQUIER chofer
-- Si está vacío, NO HAY ENTREGAS en la BD


-- ========================================
-- PASO 4: Verificar estructura de tabla
-- ========================================
-- Ver qué columnas tiene la tabla Entregas
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Entregas'
ORDER BY ORDINAL_POSITION;

-- Esto nos dice si existe la columna EsTestData


-- ========================================
-- PASO 5: Verificar relaciones
-- ========================================
-- Ver si las entregas tienen ClienteId y DireccionId
SELECT
    Id,
    Folio,
    ChoferId,
    ClienteId,
    DireccionId,
    Estado
FROM Entregas
WHERE ChoferId IN (
    SELECT Id FROM Choferes WHERE UsuarioIntranet = 'alfredo.gallegos'
);


-- ========================================
-- DIAGNÓSTICO SEGÚN RESULTADOS
-- ========================================

/*
CASO 1: PASO 1 devuelve vacío
→ El chofer 'alfredo.gallegos' NO existe en la BD
→ Solución: Crear el chofer o usar otro usuario

CASO 2: PASO 2 devuelve vacío pero PASO 3 devuelve datos
→ Las entregas existen pero están asignadas a OTRO chofer
→ Solución: Al crear datos de prueba, usar el ChoferId correcto

CASO 3: PASO 2 y PASO 3 devuelven vacío
→ NO HAY ENTREGAS en la BD
→ Solución: El endpoint POST /api/mobile/test/entregas no está guardando datos

CASO 4: PASO 2 devuelve datos pero app muestra vacío
→ Las entregas existen pero el endpoint GET no las devuelve
→ Solución: Ver QUERIES_AVANZADAS.sql

CASO 5: PASO 4 no muestra columna 'EsTestData'
→ La columna NO existe en la tabla
→ Solución: Ejecutar migración o ALTER TABLE
*/


-- ========================================
-- SOLUCIÓN RÁPIDA: Si las entregas existen
-- ========================================
-- Si PASO 2 devuelve datos, tu problema está en el endpoint GET
-- El endpoint debe ser algo como esto:

/*
[HttpGet]
[Route("api/EmbarquesEntrega")]
public async Task<ActionResult<List<ClienteEntregaDTO>>> GetEmbarquesEntrega()
{
    var choferId = ObtenerChoferIdActual();

    // Obtener TODAS las entregas del chofer
    var entregas = await _context.Entregas
        .Where(e => e.ChoferId == choferId)
        // ⚠️ NO filtrar por EsTestData
        .Include(e => e.Cliente)
        .Include(e => e.Direccion)
        .Include(e => e.Articulos)
        .ToListAsync();

    // ... transformar a DTOs
}
*/
