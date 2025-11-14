-- ============================================
-- CREAR CHOFER PARA TESTING
-- ============================================

-- ========================================
-- PASO 1: Ver la estructura de la tabla Choferes
-- ========================================
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Choferes'
ORDER BY ORDINAL_POSITION;

-- Esto nos muestra qué campos son obligatorios


-- ========================================
-- PASO 2: Ver qué UnidadesNegocio existen
-- ========================================
SELECT
    Id,
    Nombre,
    Codigo
FROM UnidadesNegocio;

-- Si esta tabla NO existe o está vacía, necesitamos crear una


-- ========================================
-- PASO 3A: Si NO existe UnidadNegocio, crearla primero
-- ========================================
-- Solo ejecuta esto si la tabla UnidadesNegocio está vacía

/*
INSERT INTO UnidadesNegocio (Nombre, Codigo, Activo)
VALUES ('Unidad Principal', 'UP001', 1);

-- Verificar
SELECT * FROM UnidadesNegocio;
*/


-- ========================================
-- PASO 3B: Crear el Chofer (Con UnidadNegocioId)
-- ========================================

-- Opción 1: Si conoces el UnidadNegocioId
-- Reemplaza el '1' con el ID que obtuviste en el PASO 2
/*
INSERT INTO Choferes (
    Nombre,
    UsuarioIntranet,
    UnidadNegocioId,
    Activo
)
VALUES (
    'Alfredo Gallegos',
    'alfredo.gallegos',
    1,  -- ⚠️ Reemplaza con el ID real
    1
);
*/

-- Opción 2: Crear con la primera UnidadNegocio que exista
INSERT INTO Choferes (
    Nombre,
    UsuarioIntranet,
    UnidadNegocioId,
    Activo
)
SELECT
    'Alfredo Gallegos',
    'alfredo.gallegos',
    (SELECT TOP 1 Id FROM UnidadesNegocio),  -- Usa la primera que encuentre
    1;


-- ========================================
-- PASO 4: Verificar que se creó
-- ========================================
SELECT
    Id,
    Nombre,
    UsuarioIntranet,
    UnidadNegocioId,
    Activo
FROM Choferes
WHERE UsuarioIntranet = 'alfredo.gallegos';

-- Debe mostrar 1 fila con todos los campos llenos


-- ========================================
-- PASO 5: Ver todos los choferes
-- ========================================
SELECT
    c.Id,
    c.Nombre,
    c.UsuarioIntranet,
    c.UnidadNegocioId,
    un.Nombre AS UnidadNegocio
FROM Choferes c
LEFT JOIN UnidadesNegocio un ON c.UnidadNegocioId = un.Id;


-- ========================================
-- SOLUCIÓN ALTERNATIVA: Si aún falla
-- ========================================
-- Es posible que haya MÁS campos obligatorios.
-- Ejecuta el PASO 1 y comparte los resultados.

-- Campos comunes que podrían ser obligatorios:
-- - Email
-- - Telefono
-- - Licencia
-- - FechaContratacion
-- - etc.

-- Si hay más campos obligatorios, usa este template:
/*
INSERT INTO Choferes (
    Nombre,
    UsuarioIntranet,
    UnidadNegocioId,
    Email,              -- Si es obligatorio
    Telefono,           -- Si es obligatorio
    Licencia,           -- Si es obligatorio
    FechaContratacion,  -- Si es obligatorio
    Activo
)
VALUES (
    'Alfredo Gallegos',
    'alfredo.gallegos',
    1,
    'alfredo.gallegos@fultra.com',
    '3312345678',
    'LIC123456',
    GETDATE(),
    1
);
*/
