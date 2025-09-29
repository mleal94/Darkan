#!/bin/bash

# Script de configuración inicial del sistema de reserva de quirófanos
echo "🚀 Configurando el sistema de reserva de quirófanos..."

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

# Crear directorios necesarios
echo "📁 Creando directorios necesarios..."
mkdir -p data/mongodb
mkdir -p data/kafka
mkdir -p data/redis
mkdir -p data/minio

# Configurar permisos (solo en sistemas Unix)
if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "win32" ]]; then
    chmod 755 data/mongodb
    chmod 755 data/kafka
    chmod 755 data/redis
    chmod 755 data/minio
fi

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env..."
    cat > .env << EOF
# Configuración de la base de datos
MONGODB_URI=mongodb://admin:password123@localhost:27017/or_scheduler?authSource=admin

# Configuración de JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Configuración de Kafka
KAFKA_BROKERS=localhost:9092

# Configuración de Redis
REDIS_URL=redis://localhost:6379

# Configuración de S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=or-scheduler-files
S3_REGION=us-east-1

# Configuración de CORS
CORS_ORIGIN=*

# Configuración de puertos
AUTH_SERVICE_PORT=3001
AUTH_SERVICE_GRPC_PORT=5001
OR_SERVICE_PORT=3002
OR_SERVICE_GRPC_PORT=5002
FILE_SERVICE_PORT=3003

# Configuración de gRPC
AUTH_SERVICE_GRPC_URL=auth-service:5001
EOF
    echo "✅ Archivo .env creado"
else
    echo "✅ Archivo .env ya existe"
fi

# Iniciar servicios de infraestructura
echo "🐳 Iniciando servicios de infraestructura..."
docker-compose up -d mongodb kafka zookeeper redis minio

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Inicializar MongoDB con datos básicos
echo "🗄️ Inicializando MongoDB..."
docker-compose exec -T mongodb mongosh --eval "
  use admin;
  db.createUser({
    user: 'admin',
    pwd: 'password123',
    roles: [{ role: 'userAdminAnyDatabase', db: 'admin' }]
  });
  use or_scheduler;
  db.createCollection('users');
  db.createCollection('operating_rooms');
  db.createCollection('reservations');
  db.createCollection('files');
  db.createCollection('outbox_events');
  db.createCollection('idempotency');
  
  // Crear índices
  db.users.createIndex({ email: 1 }, { unique: true });
  db.operating_rooms.createIndex({ name: 1 }, { unique: true });
  db.reservations.createIndex({ operatingRoomId: 1, startTime: 1, endTime: 1 });
  db.reservations.createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true });
  db.files.createIndex({ reservationId: 1 });
  db.outbox_events.createIndex({ status: 1, createdAt: 1 });
  db.idempotency.createIndex({ key: 1 }, { unique: true });
  db.idempotency.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ MongoDB inicializado correctamente"
else
    echo "⚠️ MongoDB ya estaba inicializado o hubo un problema menor"
fi

# Verificar que los servicios estén funcionando
echo "🔍 Verificando servicios..."

# Verificar MongoDB
if docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB está funcionando"
else
    echo "❌ MongoDB no está funcionando"
fi

# Verificar Kafka
if docker-compose exec -T kafka kafka-topics --bootstrap-server localhost:9092 --list > /dev/null 2>&1; then
    echo "✅ Kafka está funcionando"
else
    echo "❌ Kafka no está funcionando"
fi

# Verificar Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis está funcionando"
else
    echo "❌ Redis no está funcionando"
fi

# Verificar MinIO
if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo "✅ MinIO está funcionando"
else
    echo "❌ MinIO no está funcionando"
fi

# Crear bucket en MinIO
echo "🪣 Configurando bucket en MinIO..."
docker-compose exec -T minio mc alias set myminio http://localhost:9000 minioadmin minioadmin123 > /dev/null 2>&1
docker-compose exec -T minio mc mb myminio/or-scheduler-files > /dev/null 2>&1
docker-compose exec -T minio mc policy set public myminio/or-scheduler-files > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Bucket MinIO configurado correctamente"
else
    echo "⚠️ Bucket MinIO ya existía o hubo un problema menor"
fi

echo "🎉 Configuración inicial completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Instalar dependencias: npm install"
echo "2. Compilar servicios: npm run build"
echo "3. Iniciar servicios: npm run start:dev"
echo ""
echo "🌐 URLs de acceso:"
echo "- Auth Service: http://localhost:3001"
echo "- OR Service: http://localhost:3002"
echo "- File Service: http://localhost:3003"
echo "- MinIO Console: http://localhost:9001 (admin/minioadmin123)"
echo ""
echo "🔧 Comandos útiles:"
echo "- Ver logs: docker-compose logs -f"
echo "- Parar servicios: docker-compose down"
echo "- Reiniciar servicios: docker-compose restart"
echo "- Ejecutar tests: npm test"
echo ""
echo "📚 Documentación: Ver README.md para más detalles"
echo ""
echo "⚠️  Nota: Asegúrate de que todos los servicios estén funcionando antes de iniciar la aplicación"
