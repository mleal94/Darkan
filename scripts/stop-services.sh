#!/bin/bash

# Script para detener todos los servicios
echo "🛑 Deteniendo servicios del sistema de reserva de quirófanos..."

# Detener servicios de Docker Compose
docker-compose down

echo "✅ Servicios detenidos correctamente!"
echo ""
echo "💡 Para eliminar también los volúmenes de datos, ejecuta:"
echo "   docker-compose down -v"
echo ""
echo "💡 Para eliminar también las imágenes, ejecuta:"
echo "   docker-compose down --rmi all"
