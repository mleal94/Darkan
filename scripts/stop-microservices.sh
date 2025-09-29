#!/bin/bash

# Script para detener todos los microservicios
echo "🛑 Deteniendo microservicios del sistema de reserva de quirófanos..."

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

# Función para detener proceso por PID
stop_process() {
    local pid=$1
    local service_name=$2
    
    if kill -0 $pid 2>/dev/null; then
        print_message $YELLOW "Deteniendo $service_name (PID: $pid)..."
        kill $pid
        sleep 2
        
        # Verificar si el proceso sigue ejecutándose
        if kill -0 $pid 2>/dev/null; then
            print_message $YELLOW "Forzando detención de $service_name..."
            kill -9 $pid
        fi
        
        print_message $GREEN "✅ $service_name detenido"
    else
        print_message $YELLOW "⚠️  $service_name ya estaba detenido"
    fi
}

# Leer PIDs del archivo si existe
if [ -f "logs/service-pids.txt" ]; then
    print_message $BLUE "📖 Leyendo PIDs desde logs/service-pids.txt..."
    read -r AUTH_PID OR_PID FILE_PID < logs/service-pids.txt
    
    stop_process $AUTH_PID "Auth Service"
    stop_process $OR_PID "OR Service"
    stop_process $FILE_PID "File Service"
    
    # Limpiar archivo de PIDs
    rm -f logs/service-pids.txt
    print_message $GREEN "✅ Archivo de PIDs limpiado"
else
    print_message $YELLOW "⚠️  No se encontró archivo de PIDs, buscando procesos por puerto..."
    
    # Buscar procesos por puerto
    for port in 3001 3002 3003; do
        pid=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$pid" ]; then
            case $port in
                3001) service_name="Auth Service" ;;
                3002) service_name="OR Service" ;;
                3003) service_name="File Service" ;;
            esac
            stop_process $pid "$service_name"
        fi
    done
fi

# Buscar procesos Node.js relacionados con los servicios
print_message $BLUE "🔍 Buscando procesos Node.js restantes..."

# Buscar procesos que contengan los nombres de los servicios
for service in "auth-service" "or-service" "file-service"; do
    pids=$(pgrep -f "$service" 2>/dev/null)
    if [ ! -z "$pids" ]; then
        for pid in $pids; do
            stop_process $pid "$service"
        done
    fi
done

print_message $GREEN "🎉 Todos los microservicios han sido detenidos"
