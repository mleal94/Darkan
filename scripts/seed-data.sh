#!/bin/bash

# Script para poblar la base de datos con datos de prueba
echo "🌱 Poblando base de datos con datos de prueba..."

# Verificar que MongoDB esté ejecutándose
if ! docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo "❌ MongoDB no está ejecutándose. Por favor inicia los servicios primero."
    exit 1
fi

# Crear usuarios de prueba
echo "👥 Creando usuarios de prueba..."
docker-compose exec -T mongodb mongosh or_scheduler --eval "
db.users.insertMany([
  {
    email: 'admin@hospital.com',
    password: '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', // password123
    firstName: 'Admin',
    lastName: 'Sistema',
    role: 'admin',
    isActive: true,
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: 'scheduler@hospital.com',
    password: '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', // password123
    firstName: 'María',
    lastName: 'González',
    role: 'scheduler',
    isActive: true,
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: 'surgeon@hospital.com',
    password: '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', // password123
    firstName: 'Dr. Juan',
    lastName: 'Pérez',
    role: 'surgeon',
    isActive: true,
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);
"

# Crear quirófanos de prueba
echo "🏥 Creando quirófanos de prueba..."
docker-compose exec -T mongodb mongosh or_scheduler --eval "
db.operating_rooms.insertMany([
  {
    name: 'Quirófano 1',
    description: 'Quirófano principal para cirugías generales',
    location: {
      floor: 2,
      wing: 'A',
      roomNumber: '201'
    },
    capacity: {
      maxPatients: 1,
      maxStaff: 8
    },
    equipment: [
      { name: 'Mesa de operaciones', type: 'equipment', isRequired: true },
      { name: 'Lámpara quirúrgica', type: 'lighting', isRequired: true },
      { name: 'Monitor de signos vitales', type: 'monitoring', isRequired: true }
    ],
    isActive: true,
    isMaintenance: false,
    currentReservations: 0,
    maxReservationsPerDay: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Quirófano 2',
    description: 'Quirófano para cirugías cardíacas',
    location: {
      floor: 2,
      wing: 'A',
      roomNumber: '202'
    },
    capacity: {
      maxPatients: 1,
      maxStaff: 10
    },
    equipment: [
      { name: 'Mesa de operaciones', type: 'equipment', isRequired: true },
      { name: 'Lámpara quirúrgica', type: 'lighting', isRequired: true },
      { name: 'Monitor de signos vitales', type: 'monitoring', isRequired: true },
      { name: 'Máquina de circulación extracorpórea', type: 'cardiac', isRequired: true }
    ],
    isActive: true,
    isMaintenance: false,
    currentReservations: 0,
    maxReservationsPerDay: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Quirófano 3',
    description: 'Quirófano para cirugías menores',
    location: {
      floor: 2,
      wing: 'B',
      roomNumber: '203'
    },
    capacity: {
      maxPatients: 1,
      maxStaff: 6
    },
    equipment: [
      { name: 'Mesa de operaciones', type: 'equipment', isRequired: true },
      { name: 'Lámpara quirúrgica', type: 'lighting', isRequired: true },
      { name: 'Monitor de signos vitales', type: 'monitoring', isRequired: true }
    ],
    isActive: true,
    isMaintenance: false,
    currentReservations: 0,
    maxReservationsPerDay: 6,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);
"

# Crear reservas de prueba
echo "📅 Creando reservas de prueba..."
docker-compose exec -T mongodb mongosh or_scheduler --eval "
// Obtener IDs de los quirófanos y usuarios creados
const operatingRooms = db.operating_rooms.find().toArray();
const users = db.users.find().toArray();

// Crear algunas reservas de prueba
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(9, 0, 0, 0);

const dayAfterTomorrow = new Date();
dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
dayAfterTomorrow.setHours(14, 0, 0, 0);

db.reservations.insertMany([
  {
    operatingRoomId: operatingRooms[0]._id,
    surgeonId: users[2]._id, // Dr. Juan Pérez
    startTime: tomorrow,
    endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // +2 horas
    status: 'confirmed',
    type: 'surgery',
    description: 'Cirugía de apendicectomía',
    patientName: 'Ana García',
    patientId: 'P001',
    notes: 'Paciente con alergia a la penicilina',
    isRecurring: false,
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    operatingRoomId: operatingRooms[1]._id,
    surgeonId: users[2]._id, // Dr. Juan Pérez
    startTime: dayAfterTomorrow,
    endTime: new Date(dayAfterTomorrow.getTime() + 4 * 60 * 60 * 1000), // +4 horas
    status: 'pending',
    type: 'surgery',
    description: 'Cirugía cardíaca de bypass',
    patientName: 'Carlos López',
    patientId: 'P002',
    notes: 'Paciente diabético, requiere monitoreo especial',
    isRecurring: false,
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);
"

echo "✅ Datos de prueba creados correctamente!"
echo ""
echo "👥 Usuarios de prueba:"
echo "- admin@hospital.com / password123 (Admin)"
echo "- scheduler@hospital.com / password123 (Scheduler)"
echo "- surgeon@hospital.com / password123 (Surgeon)"
echo ""
echo "🏥 Quirófanos creados:"
echo "- Quirófano 1 (Cirugías generales)"
echo "- Quirófano 2 (Cirugías cardíacas)"
echo "- Quirófano 3 (Cirugías menores)"
echo ""
echo "📅 Reservas de prueba creadas para los próximos días"
