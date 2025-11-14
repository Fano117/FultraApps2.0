-- ============================================
-- QUERIES CORRECTAS PARA TU BASE DE DATOS
-- ============================================

-- ========================================
-- PASO 1: Ver entregas del chofer actual
-- ========================================
SELECT
    Id,
    EmbarqueId,
    OVRemisionId,
    Chofer,
    Referencia,
    FechaEntrega,
    EsTestData,
    Latitud,
    Longitud,
    FechaRegistro
FROM Entregas
WHERE Chofer = 'Alfredo Gallegos'  -- Usa el NOMBRE, no el ID
ORDER BY FechaRegistro DESC;


-- ========================================
-- PASO 2: Ver TODAS las entregas (debugging)
-- ========================================
SELECT TOP 10
    Id,
    EmbarqueId,
    Chofer,
    Referencia,
    EsTestData,
    FechaRegistro
FROM Entregas
ORDER BY FechaRegistro DESC;


-- ========================================
-- PASO 3: Ver entregas de prueba
-- ========================================
SELECT
    Id,
    EmbarqueId,
    OVRemisionId,
    Chofer,
    Referencia,
    EsTestData,
    FechaRegistro
FROM Entregas
WHERE EsTestData = 1
ORDER BY FechaRegistro DESC;


-- ========================================
-- PASO 4: Limpiar entregas de prueba viejas
-- ========================================
DELETE FROM Entregas
WHERE EsTestData = 1;


-- ========================================
-- DIAGNÓSTICO
-- ========================================

/*
IMPORTANTE: Esta tabla tiene una estructura diferente.

En lugar de tener ChoferId (relación), tiene:
- Chofer (varchar) - El NOMBRE del chofer como texto

Esto significa que el backend debe:
1. Buscar el nombre del chofer desde la tabla Choferes
2. Usarlo para filtrar en la tabla Entregas

Ejemplo en C#:

var chofer = _context.Choferes
    .Where(c => c.UsuarioIntranet == usuario)
    .FirstOrDefault();

if (chofer == null)
    return NotFound("Chofer no encontrado");

var entregas = await _context.Entregas
    .Where(e => e.Chofer == chofer.Nombre)  // ⚠️ Comparar por NOMBRE
    .ToListAsync();
*/


-- ========================================
-- VERIFICAR SI HAY ENTREGAS
-- ========================================
-- Contar entregas totales
SELECT COUNT(*) AS TotalEntregas FROM Entregas;

-- Contar entregas de prueba
SELECT COUNT(*) AS EntregasPrueba FROM Entregas WHERE EsTestData = 1;

-- Contar entregas del chofer
SELECT COUNT(*) AS EntregasChofer FROM Entregas WHERE Chofer = 'Alfredo Gallegos';
