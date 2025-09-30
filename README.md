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

## 🚀 Puesta en marcha.

```bash
# Desarrollo
npm run start:dev
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
Content-Type: application/json
{
  "email": "user@hospital.com",
  "password": "Password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "role": "surgeon"
}

# Login
POST /auth/login
Content-Type: application/json
{
  "email": "user@hospital.com",
  "password": "Password123"
}

# Refresh Token
POST /auth/refresh
Content-Type: application/json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Logout
POST /auth/logout
Authorization: Bearer <access_token>

# Test endpoint
POST /auth/test
```

#### Gestión de Usuarios
```bash
# Crear usuario (solo admin)
POST /users
Authorization: Bearer <admin_token>
Content-Type: application/json
{
  "email": "user@hospital.com",
  "password": "Password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "role": "surgeon"
}

# Obtener todos los usuarios (admin/scheduler)
GET /users
Authorization: Bearer <token>

# Obtener usuario actual
GET /users/me
Authorization: Bearer <token>

# Obtener usuario por ID (admin/scheduler)
GET /users/:id
Authorization: Bearer <token>

# Actualizar usuario (solo admin)
PATCH /users/:id
Authorization: Bearer <admin_token>
Content-Type: application/json
{
  "firstName": "Juan Carlos",
  "lastName": "Pérez García",
  "isActive": true
}

# Eliminar usuario (solo admin)
DELETE /users/:id
Authorization: Bearer <admin_token>

# Test endpoint
GET /users/admin/test
Authorization: Bearer <token>
```

**Roles disponibles:** `admin`, `scheduler`, `surgeon`
**Validaciones de contraseña:** Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número

### OR Service (Puerto 3002)

#### Quirófanos
```bash
# Crear quirófano (admin/scheduler)
POST /operating-rooms
Authorization: Bearer <token>
Content-Type: application/json
{
  "name": "Quirófano 1",
  "description": "Quirófano principal para cirugías generales",
  "location": {
    "floor": 2,
    "wing": "A",
    "roomNumber": "OR-201"
  },
  "capacity": {
    "maxPatients": 1,
    "maxStaff": 8
  },
  "equipment": [
    {
      "name": "Monitor de signos vitales",
      "type": "monitoring",
      "isRequired": true
    },
    {
      "name": "Máquina de anestesia",
      "type": "anesthesia",
      "isRequired": true
    }
  ],
  "isActive": true,
  "maxReservationsPerDay": 4
}

# Obtener todos los quirófanos
GET /operating-rooms
Authorization: Bearer <token>

# Obtener quirófanos activos
GET /operating-rooms/active
Authorization: Bearer <token>

# Obtener quirófano por ID
GET /operating-rooms/:id
Authorization: Bearer <token>

# Actualizar quirófano (admin/scheduler)
PATCH /operating-rooms/:id
Authorization: Bearer <token>
Content-Type: application/json
{
  "name": "Quirófano 1 - Actualizado",
  "isActive": true,
  "maxReservationsPerDay": 6
}

# Eliminar quirófano (solo admin)
DELETE /operating-rooms/:id
Authorization: Bearer <admin_token>

# Test endpoint
GET /operating-rooms/admin/test
Authorization: Bearer <token>
```

#### Reservas
```bash
# Crear reserva
POST /reservations
Authorization: Bearer <token>
Idempotency-Key: unique-key-123
Content-Type: application/json
{
  "operatingRoomId": "507f1f77bcf86cd799439011",
  "surgeonId": "507f1f77bcf86cd799439012",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "type": "surgery",
  "description": "Cirugía de apendicectomía",
  "patientName": "Ana García",
  "patientId": "P123456",
  "notes": "Paciente con alergia a penicilina",
  "isRecurring": false
}

# Verificar disponibilidad
POST /reservations/check-availability
Authorization: Bearer <token>
Content-Type: application/json
{
  "operatingRoomId": "507f1f77bcf86cd799439011",
  "surgeonId": "507f1f77bcf86cd799439012",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T11:00:00Z"
}

# Obtener todas las reservas (admin/scheduler)
GET /reservations
Authorization: Bearer <token>

# Obtener mis reservas
GET /reservations/my-reservations
Authorization: Bearer <token>

# Obtener reservas por quirófano (admin/scheduler)
GET /reservations/operating-room/:operatingRoomId
Authorization: Bearer <token>

# Obtener reservas por cirujano (admin/scheduler)
GET /reservations/surgeon/:surgeonId
Authorization: Bearer <token>

# Obtener reserva por ID
GET /reservations/:id
Authorization: Bearer <token>

# Actualizar reserva (admin/scheduler)
PATCH /reservations/:id
Authorization: Bearer <token>
Content-Type: application/json
{
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T12:00:00Z",
  "description": "Descripción actualizada",
  "status": "confirmed",
  "notes": "Reserva confirmada por el cirujano"
}

# Cancelar reserva (admin/scheduler)
DELETE /reservations/:id?reason=Motivo de cancelación
Authorization: Bearer <token>

# Test endpoint
GET /reservations/admin/test
Authorization: Bearer <token>
```

**Tipos de reserva:** `surgery`, `consultation`, `emergency`, `maintenance`
**Estados de reserva:** `pending`, `confirmed`, `cancelled`, `expired`

### File Service (Puerto 3003)

#### Gestión de Archivos
```bash
# Obtener URL de subida
POST /files/presign
Authorization: Bearer <token>
Content-Type: application/json
{
  "reservationId": "507f1f77bcf86cd799439013",
  "type": "consent",
  "originalName": "consentimiento.pdf",
  "mimeType": "application/pdf",
  "description": "Consentimiento informado",
  "tags": ["consentimiento", "cirugia"],
  "isPublic": false,
  "size": 1024000
}

# Confirmar subida
POST /files/confirm-upload
Authorization: Bearer <token>
Content-Type: application/json
{
  "fileId": "507f1f77bcf86cd799439014",
  "etag": "d41d8cd98f00b204e9800998ecf8427e"
}

# Obtener todos los archivos (admin/scheduler)
GET /files
Authorization: Bearer <token>

# Obtener mis archivos
GET /files/my-files
Authorization: Bearer <token>

# Obtener archivos por reserva
GET /files/reservation/:reservationId
Authorization: Bearer <token>

# Obtener archivo por ID
GET /files/:id
Authorization: Bearer <token>

# Obtener URL de descarga
GET /files/:id/download
Authorization: Bearer <token>

# Eliminar archivo
DELETE /files/:id
Authorization: Bearer <token>

# Test endpoint
GET /files/admin/test
Authorization: Bearer <token>
```

**Tipos de archivo:** `consent`, `study`, `image`, `document`, `other`
**Estados de archivo:** `uploading`, `uploaded`, `processing`, `ready`, `error`, `deleted`
**Tamaño máximo:** 10MB por archivo

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
| Gestionar quirófanos | ✅ | ✅ | ❌ |
| Subir archivos | ✅ | ✅ | ✅ |

### gRPC Endpoints (Auth Service)

```bash
# GetUserById
gRPC: auth.AuthService/GetUserById
{
  "userId": "507f1f77bcf86cd799439011"
}

# GetUserPermissions
gRPC: auth.AuthService/GetUserPermissions
{
  "userId": "507f1f77bcf86cd799439011"
}

# ValidateToken
gRPC: auth.AuthService/ValidateToken
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Puerto gRPC:** 5001 (Auth Service)

## 📋 Ejemplos de Respuestas

### Auth Service - Login Response
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@hospital.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "surgeon",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "lastLoginAt": "2024-01-15T10:30:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### OR Service - Operating Room Response
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Quirófano 1",
  "description": "Quirófano principal para cirugías generales",
  "location": {
    "floor": 2,
    "wing": "A",
    "roomNumber": "OR-201"
  },
  "capacity": {
    "maxPatients": 1,
    "maxStaff": 8
  },
  "equipment": [
    {
      "name": "Monitor de signos vitales",
      "type": "monitoring",
      "isRequired": true
    }
  ],
  "isActive": true,
  "maxReservationsPerDay": 4,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### OR Service - Reservation Response
```json
{
  "id": "507f1f77bcf86cd799439013",
  "operatingRoomId": "507f1f77bcf86cd799439011",
  "surgeonId": "507f1f77bcf86cd799439012",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "status": "pending",
  "type": "surgery",
  "description": "Cirugía de apendicectomía",
  "patientName": "Ana García",
  "patientId": "P123456",
  "notes": "Paciente con alergia a penicilina",
  "isRecurring": false,
  "version": 1,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### File Service - Presigned URL Response
```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/path/to/file?signature...",
  "key": "reservations/507f1f77bcf86cd799439013/consentimiento.pdf",
  "expiresIn": 3600,
  "fileId": "507f1f77bcf86cd799439014",
  "expiresAt": "2024-01-15T11:30:00Z"
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
