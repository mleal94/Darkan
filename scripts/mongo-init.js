// Script de inicialización de MongoDB
db = db.getSiblingDB('or_scheduler');

// Crear usuario para la aplicación
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'or_scheduler'
    }
  ]
});

// Crear colecciones con índices
db.createCollection('users');
db.createCollection('operating_rooms');
db.createCollection('reservations');
db.createCollection('files');
db.createCollection('outbox_events');

// Índices para users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// Índices para operating_rooms
db.operating_rooms.createIndex({ name: 1 }, { unique: true });
db.operating_rooms.createIndex({ isActive: 1 });

// Índices para reservations
db.reservations.createIndex({ operatingRoomId: 1, startTime: 1, endTime: 1 });
db.reservations.createIndex({ status: 1 });
db.reservations.createIndex({ surgeonId: 1 });
db.reservations.createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true });

// Índices para files
db.files.createIndex({ reservationId: 1 });
db.files.createIndex({ uploaderId: 1 });
db.files.createIndex({ type: 1 });

// Índices para outbox_events
db.outbox_events.createIndex({ status: 1, createdAt: 1 });
db.outbox_events.createIndex({ eventType: 1 });

print('MongoDB inicializado correctamente');
