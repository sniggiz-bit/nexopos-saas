#!/bin/bash

# Script de diagnóstico para el problema de Docker Build en CloudLinux
# Este script te ayudará a identificar si hay restricciones del sistema

echo "=== Diagnóstico de Docker Build en CloudLinux ==="
echo ""

echo "1. Verificando versión de Docker..."
docker --version
docker info | grep "Storage Driver"

echo ""
echo "2. Verificando límites de LVE (CloudLinux)..."
if command -v lvectl &> /dev/null; then
    lvectl limits
else
    echo "lvectl no disponible (esto es normal si no estás en CloudLinux)"
fi

echo ""
echo "3. Verificando espacio en disco..."
df -h

echo ""
echo "4. Verificando permisos del usuario Docker..."
id
groups

echo ""
echo "5. Intentando build de prueba con logs detallados..."
echo "Ejecuta manualmente: docker build --progress=plain --no-cache -f apps/api/Dockerfile.prod -t nexopos-api-test ."

echo ""
echo "6. Para verificar si dist se crea durante el build:"
echo "docker build --progress=plain --no-cache -f apps/api/Dockerfile.prod --target builder -t nexopos-builder-test . 2>&1 | tee build.log"
echo "docker run --rm nexopos-builder-test ls -la /app/apps/api/"
echo "docker run --rm nexopos-builder-test ls -la /app/apps/api/dist/ || echo 'dist no existe'"

echo ""
echo "=== Fin del diagnóstico ==="
