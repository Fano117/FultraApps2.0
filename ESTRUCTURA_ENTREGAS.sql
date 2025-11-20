-- ============================================
-- DESCUBRIR ESTRUCTURA REAL DE LA TABLA ENTREGAS
-- ============================================

-- Ver todas las columnas de la tabla Entregas
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Entregas'
ORDER BY ORDINAL_POSITION;

-- Esta query nos dirá los nombres REALES de las columnas
