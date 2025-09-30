# 🏥 Sistema de Reserva de Quirófanos

Sistema de microservicios event-driven para la gestión y reserva de quirófanos con arquitectura moderna, tiempo real y alta disponibilidad.

## 🚀 Características Principales

- **Arquitectura de Microservicios**: 3 servicios independientes y escalables
- **Event-Driven**: Comunicación asíncrona con Apache Kafka
- **Tiempo Real**: WebSockets para actualizaciones instantáneas
- **gRPC**: Comunicación síncrona de alta performance
- **Prevención de Concurrencia**: Control de solapamientos y locking
- **Idempotencia**: Headers Idempotency-Key para operaciones seguras
- **Sagas/Outbox**: Consistencia eventual con patrón outbox
- **Autenticación JWT**: Roles y permisos granulares
- **Almacenamiento S3**: MinIO para archivos adjuntos
- **CI/CD**: GitHub Actions con tests automatizados

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │    │   OR Service    │    │  File Service   │
│                 │    │                 │    │                 │
│ • JWT Auth      │    │ • Reservas      │    │ • S3 Upload     │
│ • Roles         │    │ • Quirófanos    │    │ • Presign URLs  │
│ • gRPC Server   │    │ • WebSockets    │    │ • Metadatos     │
│ • Rate Limiting │    │ • Kafka Events  │    │ • Kafka Events  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Infraestructura  │
                    │                 │
                    │ • MongoDB       │
                    │ • Kafka         │
                    │ • Redis         │
                    │ • MinIO (S3)    │
                    └─────────────────┘
```

## 📋 Microservicios

### 1. AuthService (Puerto 3001/5001)
- **Registro/Login** con roles: admin, scheduler, surgeon
- **JWT** con access + refresh tokens
- **gRPC Server**: GetUserById, GetUserPermissions, ValidateToken
- **Seguridad**: Password hash, rate limiting
- **Índices MongoDB**: Email único

### 2. ORService (Puerto 3002/5002)
- **CRUD** de quirófanos y reservas
- **POST /reservations** con prevención de solapamientos
- **Idempotencia** por header Idempotency-Key
- **Estados**: PENDING → CONFIRMED | CANCELLED | EXPIRED
- **Kafka**: Publica reservation.created/updated/cancelled
- **WebSockets**: Emite cambios en tiempo real
- **gRPC Client**: Validación hacia AuthService

### 3. FileService (Puerto 3003)
- **POST /files/presign**: URL prefirmada de S3
- **Metadatos MongoDB**: reservationId, uploaderId, type
- **Kafka**: Publica file.attached
- **Validaciones**: Tamaño y content-type

## 🛠️ Tecnologías

- **Backend**: NestJS, TypeScript
- **Base de Datos**: MongoDB con Mongoose
- **Message Broker**: Apache Kafka
- **Cache**: Redis
- **Almacenamiento**: MinIO (S3 compatible)
- **Comunicación**: gRPC, WebSockets
- **Autenticación**: JWT
- **Contenedores**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- Docker y Docker Compose
- Git

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd operating-room-scheduler
```

### 2. Configuración Inicial

```bash
# Ejecutar script de configuración
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Iniciar Servicios

```bash
# Iniciar infraestructura
./scripts/start-services.sh

# O manualmente
docker-compose up -d
```

### 5. Poblar Datos de Prueba

```bash
./scripts/seed-data.sh
```

### 6. Compilar y Ejecutar Servicios

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start
```

## 🌐 URLs de Acceso

- **Auth Service**: http://localhost:3001
- **OR Service**: http://localhost:3002
- **File Service**: http://localhost:3003
- **MinIO Console**: http://localhost:9001 (admin/minioadmin123)
- **MongoDB**: mongodb://localhost:27017
- **Redis**: redis://localhost:6379

## 📚 API Endpoints

### Auth Service (Puerto 3001)

#### Autenticación
```bash
# Registro (sin tokens)
POST /auth/register
{
  "email": "user@hospital.com",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "role": "surgeon"
}

# Login
POST /auth/login
{
  "email": "user@hospital.com",
  "password": "password123"
}

# Refresh Token
POST /auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Logout
POST /auth/logout
Headers: { "Authorization": "Bearer <token>" }

# Test endpoint
POST /auth/test
```

#### Gestión de Usuarios
```bash
# Crear usuario (solo admin)
POST /users
Headers: { "Authorization": "Bearer <token>" }
{
  "email": "user@hospital.com",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "role": "surgeon"
}

# Obtener todos los usuarios (admin/scheduler)
GET /users
Headers: { "Authorization": "Bearer <token>" }

# Obtener usuario actual
GET /users/me
Headers: { "Authorization": "Bearer <token>" }

# Obtener usuario por ID (admin/scheduler)
GET /users/:id
Headers: { "Authorization": "Bearer <token>" }

# Actualizar usuario (solo admin)
PATCH /users/:id
Headers: { "Authorization": "Bearer <token>" }
{
  "firstName": "Juan Carlos",
  "lastName": "Pérez García"
}

# Eliminar usuario (solo admin)
DELETE /users/:id
Headers: { "Authorization": "Bearer <token>" }

# Test endpoint
GET /users/admin/test
```

### OR Service (Puerto 3002)

#### Quirófanos
```bash
# Crear quirófano (admin/scheduler)
POST /operating-rooms
Headers: { "Authorization": "Bearer <token>" }
{
  "name": "Quirófano 1",
  "description": "Quirófano principal",
  "equipment": ["Monitor", "Anestesia"],
  "capacity": 8
}

# Obtener todos los quirófanos
GET /operating-rooms
Headers: { "Authorization": "Bearer <token>" }

# Obtener quirófanos activos
GET /operating-rooms/active
Headers: { "Authorization": "Bearer <token>" }

# Obtener quirófano por ID
GET /operating-rooms/:id
Headers: { "Authorization": "Bearer <token>" }

# Actualizar quirófano (admin/scheduler)
PATCH /operating-rooms/:id
Headers: { "Authorization": "Bearer <token>" }
{
  "name": "Quirófano 1 - Actualizado",
  "isActive": true
}

# Eliminar quirófano (solo admin)
DELETE /operating-rooms/:id
Headers: { "Authorization": "Bearer <token>" }

# Test endpoint
GET /operating-rooms/admin/test
```

#### Reservas
```bash
# Crear reserva
POST /reservations
Headers: {
  "Authorization": "Bearer <token>",
  "Idempotency-Key": "unique-key-123"
}
{
  "operatingRoomId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "surgeonId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "type": "surgery",
  "description": "Cirugía de apendicectomía",
  "patientName": "Ana García"
}

# Verificar disponibilidad
POST /reservations/check-availability
Headers: { "Authorization": "Bearer <token>" }
{
  "operatingRoomId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "surgeonId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T11:00:00Z"
}

# Obtener todas las reservas (admin/scheduler)
GET /reservations
Headers: { "Authorization": "Bearer <token>" }

# Obtener mis reservas
GET /reservations/my-reservations
Headers: { "Authorization": "Bearer <token>" }

# Obtener reservas por quirófano (admin/scheduler)
GET /reservations/operating-room/:operatingRoomId
Headers: { "Authorization": "Bearer <token>" }

# Obtener reservas por cirujano (admin/scheduler)
GET /reservations/surgeon/:surgeonId
Headers: { "Authorization": "Bearer <token>" }

# Obtener reserva por ID
GET /reservations/:id
Headers: { "Authorization": "Bearer <token>" }

# Actualizar reserva (admin/scheduler)
PATCH /reservations/:id
Headers: { "Authorization": "Bearer <token>" }
{
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T12:00:00Z",
  "description": "Descripción actualizada"
}

# Cancelar reserva (admin/scheduler)
DELETE /reservations/:id?reason=Motivo de cancelación
Headers: { "Authorization": "Bearer <token>" }

# Test endpoint
GET /reservations/admin/test
```

### File Service (Puerto 3003)

#### Gestión de Archivos
```bash
# Obtener URL de subida
POST /files/presign
Headers: { "Authorization": "Bearer <token>" }
{
  "reservationId": "64f1a2b3c4d5e6f7g8h9i0j3",
  "type": "consent",
  "originalName": "consentimiento.pdf",
  "mimeType": "application/pdf",
  "description": "Consentimiento informado"
}

# Confirmar subida
POST /files/confirm-upload
Headers: { "Authorization": "Bearer <token>" }
{
  "fileId": "64f1a2b3c4d5e6f7g8h9i0j4",
  "etag": "d41d8cd98f00b204e9800998ecf8427e"
}

# Obtener todos los archivos (admin/scheduler)
GET /files
Headers: { "Authorization": "Bearer <token>" }

# Obtener mis archivos
GET /files/my-files
Headers: { "Authorization": "Bearer <token>" }

# Obtener archivos por reserva
GET /files/reservation/:reservationId
Headers: { "Authorization": "Bearer <token>" }

# Obtener archivo por ID
GET /files/:id
Headers: { "Authorization": "Bearer <token>" }

# Obtener URL de descarga
GET /files/:id/download
Headers: { "Authorization": "Bearer <token>" }

# Eliminar archivo
DELETE /files/:id
Headers: { "Authorization": "Bearer <token>" }

# Test endpoint
GET /files/admin/test
```

## 🔐 Autenticación y Roles

### Roles Disponibles

- **admin**: Acceso completo al sistema
- **scheduler**: Gestión de reservas y quirófanos
- **surgeon**: Creación de reservas propias

### Permisos por Rol

| Acción | Admin | Scheduler | Surgeon |
|--------|-------|-----------|---------|
| Crear reservas | ✅ | ✅ | ✅ |
| Ver todas las reservas | ✅ | ✅ | ❌ |
| Actualizar reservas | ✅ | ✅ | ❌ |
| Eliminar reservas | ✅ | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Subir archivos | ✅ | ✅ | ✅ |

## 🐳 Docker

### Comandos Útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f auth-service

# Reiniciar un servicio
docker-compose restart auth-service

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

### Variables de Entorno

```bash
# Base de datos
MONGODB_URI=mongodb://admin:password123@localhost:27017/or_scheduler?authSource=admin

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Kafka
KAFKA_BROKERS=localhost:9092

# Redis
REDIS_URL=redis://localhost:6379

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=or-scheduler-files
```

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests E2E
npm run test:e2e

# Coverage
npm run test:cov

# Linting
npm run lint

# Formateo
npm run format
```

## 📊 Monitoreo y Logs

### Health Checks

```bash
# Auth Service
curl http://localhost:3001/auth/test

# OR Service
curl http://localhost:3002/operating-rooms/admin/test

# File Service
curl http://localhost:3003/files/admin/test
```

### Logs Estructurados

Los servicios generan logs estructurados en formato JSON para facilitar el análisis:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "service": "or-service",
  "message": "Reservation created",
  "reservationId": "64f1a2b3c4d5e6f7g8h9i0j3",
  "userId": "64f1a2b3c4d5e6f7g8h9i0j2"
}
```

## 🔄 Eventos Kafka

### Topics Principales

- `reservation.created`: Nueva reserva creada
- `reservation.updated`: Reserva actualizada
- `reservation.cancelled`: Reserva cancelada
- `file.attached`: Archivo adjunto a reserva

### Estructura de Eventos

```json
{
  "eventType": "reservation.created",
  "eventId": "uuid-v4",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "reservationId": "64f1a2b3c4d5e6f7g8h9i0j3",
    "operatingRoomId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "surgeonId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "startTime": "2024-01-15T09:00:00Z",
    "endTime": "2024-01-15T11:00:00Z",
    "status": "pending",
    "type": "surgery"
  },
  "version": "1.0"
}
```

## 🚀 Despliegue en Producción

### 1. Configurar Variables de Entorno

```bash
# Generar secretos seguros
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Configurar URLs de producción
MONGODB_URI=mongodb://user:pass@prod-mongodb:27017/or_scheduler
KAFKA_BROKERS=prod-kafka:9092
S3_ENDPOINT=https://s3.amazonaws.com
```

### 2. Desplegar con Docker Compose

```bash
# Producción
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Configurar Load Balancer

```nginx
upstream auth_service {
    server auth-service-1:3001;
    server auth-service-2:3001;
}

upstream or_service {
    server or-service-1:3002;
    server or-service-2:3002;
}

upstream file_service {
    server file-service-1:3003;
    server file-service-2:3003;
}
```

## 🔧 Desarrollo

### Estructura del Proyecto

```
├── services/
│   ├── auth-service/          # Servicio de autenticación
│   ├── or-service/            # Servicio de quirófanos
│   └── file-service/          # Servicio de archivos
├── shared/                    # Código compartido
├── scripts/                   # Scripts de utilidad
├── .github/workflows/         # CI/CD
└── docker-compose.yml         # Orquestación
```

### Comandos de Desarrollo

```bash
# Instalar dependencias de todos los servicios
npm install

# Compilar todos los servicios
npm run build

# Ejecutar en modo desarrollo
npm run start:dev

# Ejecutar tests
npm run test

# Linting
npm run lint
```

## 📈 Escalabilidad

### Estrategias de Escalado

1. **Horizontal**: Múltiples instancias de cada servicio
2. **Vertical**: Aumentar recursos de CPU/RAM
3. **Base de Datos**: Sharding y réplicas
4. **Cache**: Redis Cluster
5. **Message Broker**: Kafka con múltiples brokers

### Métricas de Performance

- **Latencia**: < 100ms para operaciones CRUD
- **Throughput**: > 1000 requests/segundo
- **Disponibilidad**: 99.9% uptime
- **Recovery Time**: < 5 minutos

## 🛡️ Seguridad

### Medidas Implementadas

- **Autenticación JWT** con refresh tokens
- **Rate Limiting** en endpoints críticos
- **Validación de entrada** con class-validator
- **CORS** configurado apropiadamente
- **Headers de seguridad** (HSTS, CSP)
- **Logs de auditoría** para operaciones sensibles

### Recomendaciones Adicionales

- Usar HTTPS en producción
- Implementar WAF (Web Application Firewall)
- Configurar backup automático de MongoDB
- Monitorear logs de seguridad
- Actualizar dependencias regularmente
