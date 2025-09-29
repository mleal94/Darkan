#!/bin/bash

# Script para iniciar todos los servicios
echo "🚀 Iniciando servicios del sistema de reserva de quirófanos..."

# Verificar que Docker esté ejecutándose
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está ejecutándose. Por favor inicia Docker primero."
    exit 1
fi

# Iniciar servicios de infraestructura
echo "🐳 Iniciando servicios de infraestructura..."
docker-compose up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado de los servicios
echo "🔍 Verificando estado de los servicios..."
docker-compose ps

# Mostrar logs de los servicios
echo "📋 Mostrando logs de los servicios..."
echo "Para ver logs en tiempo real, ejecuta: docker-compose logs -f"
echo ""

# Mostrar información de acceso
echo "🌐 Servicios disponibles:"
echo "- Auth Service: http://localhost:3001"
echo "- OR Service: http://localhost:3002"
echo "- File Service: http://localhost:3003"
echo "- MinIO Console: http://localhost:9001"
echo "- MongoDB: mongodb://localhost:27017"
echo "- Redis: redis://localhost:6379"
echo ""

echo "✅ Servicios iniciados correctamente!"
echo "Para detener los servicios, ejecuta: docker-compose down"
