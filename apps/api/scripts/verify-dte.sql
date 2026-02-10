-- SQL Query para verificar DTEs emitidos
-- Ejecutar en Prisma Studio o directamente en PostgreSQL

-- Ver las últimas 5 ventas con sus DTEs
SELECT 
    id,
    total,
    "paymentMethod",
    "dteType",
    "dteFolio",
    "dteStatus",
    "createdAt"
FROM "Sale"
ORDER BY "createdAt" DESC
LIMIT 5;

-- Contar ventas por estado de DTE
SELECT 
    "dteStatus",
    COUNT(*) as cantidad
FROM "Sale"
GROUP BY "dteStatus";

-- Ver ventas pendientes de DTE
SELECT 
    id,
    total,
    "dteStatus",
    "createdAt"
FROM "Sale"
WHERE "dteStatus" = 'PENDING'
ORDER BY "createdAt" DESC;
