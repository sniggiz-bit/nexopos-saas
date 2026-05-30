#!/bin/bash

# Script de despliegue sin Docker para NexoPOS
# Ejecutar en el servidor: bash deploy-no-docker.sh

set -e  # Detener si hay errores

# Cargar rutas de Node.js en cPanel y binarios locales de npm del usuario
export PATH=$(ls -d /opt/cpanel/ea-nodejs*/bin 2>/dev/null | head -n 1):$PATH
export PATH=$HOME/.npm-global/bin:$PATH

echo "🚀 Iniciando despliegue de NexoPOS (sin Docker)..."

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar Node.js
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "Instalando Node.js 20..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js instalado: $NODE_VERSION${NC}"

# 2. Verificar PostgreSQL
echo "🐘 Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL no está instalado${NC}"
    echo "Por favor instala PostgreSQL manualmente"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL disponible${NC}"

# 3. Instalar PM2 si no existe
echo "⚙️  Verificando PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2..."
    npm install -g pm2
fi
echo -e "${GREEN}✅ PM2 disponible${NC}"

# 4. Navegar al directorio del proyecto
PROJECT_DIR="/home/nexopos/nexopos.cl"
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Directorio del proyecto no encontrado: $PROJECT_DIR${NC}"
    echo "Clonando desde GitHub..."
    cd /home/nexopos
    git clone https://github.com/tu-usuario/nexopos.git nexopos.cl
fi

cd "$PROJECT_DIR"
echo -e "${GREEN}✅ En directorio: $(pwd)${NC}"

# 5. Actualizar código desde Git
echo "📥 Actualizando código desde Git..."
git fetch origin
git reset --hard origin/main
git pull origin main
echo -e "${GREEN}✅ Código actualizado${NC}"

# 6. Instalar dependencias
echo "📦 Instalando dependencias..."
npm install
echo -e "${GREEN}✅ Dependencias instaladas${NC}"

# 7. Backend - API
echo "🔧 Configurando Backend..."
cd apps/api

# Verificar .env
if [ ! -f .env ]; then
    echo -e "${RED}⚠️  Archivo .env no encontrado${NC}"
    echo "Creando .env desde .env.example..."
    cp .env.example .env
    echo -e "${RED}⚠️  IMPORTANTE: Edita apps/api/.env con tus credenciales${NC}"
    echo "Presiona Enter cuando hayas editado el archivo..."
    read
fi

# Generar Prisma Client
echo "🔨 Generando Prisma Client..."
npx prisma generate

# Ejecutar migraciones
echo "🗄️  Ejecutando migraciones de base de datos..."
npx prisma migrate deploy

# Build del backend
echo "🏗️  Compilando backend..."
npm run build

# Verificar que dist existe
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: carpeta dist no fue creada${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend compilado exitosamente${NC}"

# 8. Detener proceso anterior si existe
echo "🔄 Reiniciando servicio..."
pm2 delete nexopos-api 2>/dev/null || true

# 9. Iniciar con PM2
echo "🚀 Iniciando aplicación..."
pm2 start dist/main.js --name nexopos-api
pm2 save

echo ""
echo -e "${GREEN}✅ ¡Despliegue completado exitosamente!${NC}"
echo ""
echo "📊 Estado de la aplicación:"
pm2 status

echo ""
echo "📝 Comandos útiles:"
echo "  - Ver logs: pm2 logs nexopos-api"
echo "  - Reiniciar: pm2 restart nexopos-api"
echo "  - Detener: pm2 stop nexopos-api"
echo "  - Estado: pm2 status"
echo ""
echo "🌐 La API debería estar corriendo en: http://localhost:3000"
