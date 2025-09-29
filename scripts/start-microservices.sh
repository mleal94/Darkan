#!/bin/bash

# Script para iniciar todos los microservicios Node.js
echo "🚀 Iniciando microservicios del sistema de reserva de quirófanos..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Función para verificar si un puerto está en uso
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Función para esperar a que un servicio esté listo
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    print_message $YELLOW "⏳ Esperando a que $service_name esté listo en puerto $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if check_port $port; then
            print_message $GREEN "✅ $service_name está listo"
            return 0
        fi
        
        print_message $YELLOW "Intento $attempt/$max_attempts - Esperando $service_name..."
        sleep 2
        ((attempt++))
    done
    
    print_message $RED "❌ $service_name no está disponible después de $max_attempts intentos"
    return 1
}

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    print_message $RED "❌ Node.js no está instalado"
    exit 1
fi

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    print_message $RED "❌ npm no está instalado"
    exit 1
fi

print_message $BLUE "📦 Instalando dependencias..."

# Instalar dependencias para cada servicio
cd services/auth-service && npm install
cd ../or-service && npm install
cd ../file-service && npm install
cd ../..

print_message $GREEN "✅ Dependencias instaladas"

print_message $BLUE "🔨 Compilando servicios..."

# Compilar servicios
cd services/auth-service && npm run build
cd ../or-service && npm run build
cd ../file-service && npm run build
cd ../..

print_message $GREEN "✅ Servicios compilados"

print_message $BLUE "🚀 Iniciando servicios..."

# Iniciar Auth Service
print_message $YELLOW "Iniciando Auth Service..."
cd services/auth-service
npm run start:dev > ../../logs/auth-service.log 2>&1 &
AUTH_PID=$!
cd ../..

# Iniciar OR Service
print_message $YELLOW "Iniciando OR Service..."
cd services/or-service
npm run start:dev > ../../logs/or-service.log 2>&1 &
OR_PID=$!
cd ../..

# Iniciar File Service
print_message $YELLOW "Iniciando File Service..."
cd services/file-service
npm run start:dev > ../../logs/file-service.log 2>&1 &
FILE_PID=$!
cd ../..

# Crear directorio de logs si no existe
mkdir -p logs

# Esperar a que los servicios estén listos
wait_for_service "Auth Service" 3001
wait_for_service "OR Service" 3002
wait_for_service "File Service" 3003

print_message $GREEN "🎉 Todos los microservicios están ejecutándose!"

echo ""
print_message $BLUE "📊 Información de los servicios:"
echo "- Auth Service: http://localhost:3001 (PID: $AUTH_PID)"
echo "- OR Service: http://localhost:3002 (PID: $OR_PID)"
echo "- File Service: http://localhost:3003 (PID: $FILE_PID)"
echo ""

print_message $YELLOW "📋 Comandos útiles:"
echo "Ver logs de Auth Service: tail -f logs/auth-service.log"
echo "Ver logs de OR Service: tail -f logs/or-service.log"
echo "Ver logs de File Service: tail -f logs/file-service.log"
echo "Ver todos los logs: tail -f logs/*.log"
echo ""

print_message $YELLOW "🛑 Para detener todos los servicios:"
echo "kill $AUTH_PID $OR_PID $FILE_PID"
echo ""

# Guardar PIDs en un archivo para facilitar el stop
echo "$AUTH_PID $OR_PID $FILE_PID" > logs/service-pids.txt
print_message $GREEN "✅ PIDs guardados en logs/service-pids.txt"

print_message $GREEN "🎯 Sistema listo para usar!"
