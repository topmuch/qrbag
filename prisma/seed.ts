// QRBag - Seed Database with Test Data
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Helper to generate QR codes
function generateQRCode(batchId: string, index: number): string {
  const batchNum = batchId.slice(-3).toUpperCase();
  return `QR-PKG-${batchNum}-${String(index).padStart(3, '0')}`;
}

// Helper to generate tracking code
function generateTrackingCode(): string {
  return `TRK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// Helper to generate unique ID
const genId = () => randomUUID();

// Current timestamp for updatedAt fields
const now = () => new Date();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.tripScan.deleteMany();
  await prisma.package.deleteMany();
  await prisma.qRBatch.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.route.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.settings.deleteMany();

  // Create Settings
  await prisma.settings.create({
    data: {
      id: genId(),
      stickerPrice: 200,
      busOnlyPrice: 50000,
      colisOnlyPrice: 30000,
      packCompletPrice: 70000,
    },
  });
  console.log('✅ Settings created');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Super Admin
  await prisma.user.create({
    data: {
      id: genId(),
      email: 'admin@qrbag.com',
      name: 'Super Admin',
      phone: '+225 07 00 00 00 00',
      password: hashedPassword,
      role: 'SUPERADMIN',
      isActive: true,
      updatedAt: now(),
    },
  });
  console.log('✅ Super Admin created');

  // ============================================
  // COMPANY 1: Savana Voyages
  // ============================================
  const company1Id = genId();
  await prisma.company.create({
    data: {
      id: company1Id,
      name: 'Savana Voyages',
      email: 'contact@savana-voyages.bf',
      phone: '+226 25 00 00 00',
      address: 'Avenue Kwame Nkrumah',
      city: 'Ouagadougou',
      country: 'Burkina Faso',
      isActive: true,
      updatedAt: now(),
    },
  });

  // Owner for company 1
  const owner1Id = genId();
  await prisma.user.create({
    data: {
      id: owner1Id,
      email: 'owner@savana-voyages.bf',
      name: 'Amadou Koné',
      phone: '+226 70 00 00 01',
      password: hashedPassword,
      role: 'OWNER',
      companyId: company1Id,
      isActive: true,
      updatedAt: now(),
    },
  });

  // Driver for company 1
  const driver1UserId = genId();
  await prisma.user.create({
    data: {
      id: driver1UserId,
      email: 'driver1@savana-voyages.bf',
      name: 'Ibrahim Traoré',
      phone: '+226 70 00 00 02',
      password: hashedPassword,
      role: 'DRIVER',
      companyId: company1Id,
      isActive: true,
      updatedAt: now(),
    },
  });

  const driver1Id = genId();
  await prisma.driver.create({
    data: {
      id: driver1Id,
      userId: driver1UserId,
      licenseNumber: 'BF-12345-2024',
      licenseExpiry: new Date('2027-12-31'),
      companyId: company1Id,
      isActive: true,
      updatedAt: now(),
    },
  });

  // Bus for company 1
  const bus1Id = genId();
  await prisma.bus.create({
    data: {
      id: bus1Id,
      plateNumber: 'BF-1234-AO',
      model: 'Mercedes Benz 0350',
      capacity: 50,
      color: 'Vert',
      year: 2019,
      companyId: company1Id,
      isActive: true,
      updatedAt: now(),
    },
  });

  // Route for company 1
  const route1Id = genId();
  await prisma.route.create({
    data: {
      id: route1Id,
      name: 'Ouaga - Abidjan',
      origin: 'Ouagadougou',
      destination: 'Abidjan',
      distance: 850,
      estimatedTime: 1080,
      companyId: company1Id,
      updatedAt: now(),
    },
  });

  // Subscription for company 1 (Colis Seul)
  await prisma.subscription.create({
    data: {
      id: genId(),
      planType: 'COLIS_ONLY',
      monthlyFee: 30000,
      stickerFee: 200,
      activatedStickers: 42,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVE',
      companyId: company1Id,
      updatedAt: now(),
    },
  });

  // QR Batch for company 1
  const batch1Id = genId();
  await prisma.qRBatch.create({
    data: {
      id: batch1Id,
      batchCode: 'QR-2024-001',
      quantity: 100,
      activatedCount: 42,
      status: 'ACTIVE',
      companyId: company1Id,
    },
  });

  // Create packages for batch 1 (100 stickers)
  const packages1Data = [];
  for (let i = 1; i <= 100; i++) {
    const isActive = i <= 42;
    packages1Data.push({
      id: genId(),
      qrCode: generateQRCode('001', i),
      status: isActive ? 'ACTIVE' : 'NON_ACTIVE',
      activatedAt: isActive ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
      companyId: company1Id,
      batchId: batch1Id,
      senderName: isActive ? `Expéditeur ${i}` : null,
      senderPhone: isActive ? `+226 70 ${String(i).padStart(2, '0')} ${String(i * 10).padStart(2, '0')} ${String(i * 5).padStart(2, '0')}` : null,
      recipientName: isActive ? `Destinataire ${i}` : null,
      recipientPhone: isActive ? `+225 07 ${String(i).padStart(2, '0')} ${String(i * 10).padStart(2, '0')} ${String(i * 5).padStart(2, '0')}` : null,
      pickupCode: isActive ? String(Math.floor(1000 + Math.random() * 9000)) : null,
      updatedAt: now(),
    });
  }
  await prisma.package.createMany({ data: packages1Data });

  console.log('✅ Company 1 (Savana Voyages) created with 100 QR codes');

  // ============================================
  // COMPANY 2: Transport Express CI
  // ============================================
  const company2Id = genId();
  await prisma.company.create({
    data: {
      id: company2Id,
      name: 'Transport Express CI',
      email: 'contact@transport-express.ci',
      phone: '+225 27 00 00 00',
      address: 'Boulevard de la République',
      city: 'Abidjan',
      country: 'Côte d\'Ivoire',
      isActive: true,
      updatedAt: now(),
    },
  });

  // Owner for company 2
  const owner2Id = genId();
  await prisma.user.create({
    data: {
      id: owner2Id,
      email: 'owner@transport-express.ci',
      name: 'Kouassi Yao',
      phone: '+225 07 00 00 01',
      password: hashedPassword,
      role: 'OWNER',
      companyId: company2Id,
      isActive: true,
      updatedAt: now(),
    },
  });

  // Drivers for company 2
  const driver2UserId = genId();
  await prisma.user.create({
    data: {
      id: driver2UserId,
      email: 'driver1@transport-express.ci',
      name: 'Jean-Baptiste Kouadio',
      phone: '+225 07 00 00 02',
      password: hashedPassword,
      role: 'DRIVER',
      companyId: company2Id,
      isActive: true,
      updatedAt: now(),
    },
  });

  const driver2Id = genId();
  await prisma.driver.create({
    data: {
      id: driver2Id,
      userId: driver2UserId,
      licenseNumber: 'CI-67890-2024',
      licenseExpiry: new Date('2028-06-30'),
      companyId: company2Id,
      isActive: true,
      updatedAt: now(),
    },
  });

  const driver3UserId = genId();
  await prisma.user.create({
    data: {
      id: driver3UserId,
      email: 'driver2@transport-express.ci',
      name: 'Mamadou Diallo',
      phone: '+225 07 00 00 03',
      password: hashedPassword,
      role: 'DRIVER',
      companyId: company2Id,
      isActive: true,
      updatedAt: now(),
    },
  });

  const driver3Id = genId();
  await prisma.driver.create({
    data: {
      id: driver3Id,
      userId: driver3UserId,
      licenseNumber: 'CI-11111-2024',
      licenseExpiry: new Date('2027-03-15'),
      companyId: company2Id,
      isActive: true,
      updatedAt: now(),
    },
  });

  // Buses for company 2
  const bus2Id = genId();
  await prisma.bus.create({
    data: {
      id: bus2Id,
      plateNumber: 'CI-5678-AB',
      model: 'Volvo 9700',
      capacity: 55,
      color: 'Orange',
      year: 2021,
      companyId: company2Id,
      isActive: true,
      updatedAt: now(),
    },
  });

  const bus3Id = genId();
  await prisma.bus.create({
    data: {
      id: bus3Id,
      plateNumber: 'CI-9012-CD',
      model: 'Scania K410',
      capacity: 45,
      color: 'Bleu',
      year: 2020,
      companyId: company2Id,
      isActive: true,
      updatedAt: now(),
    },
  });

  // Routes for company 2
  const route2Id = genId();
  await prisma.route.create({
    data: {
      id: route2Id,
      name: 'Abidjan - Ouaga',
      origin: 'Abidjan',
      destination: 'Ouagadougou',
      distance: 850,
      estimatedTime: 1080,
      companyId: company2Id,
      updatedAt: now(),
    },
  });

  const route3Id = genId();
  await prisma.route.create({
    data: {
      id: route3Id,
      name: 'Abidjan - Bamako',
      origin: 'Abidjan',
      destination: 'Bamako',
      distance: 1200,
      estimatedTime: 1440,
      companyId: company2Id,
      updatedAt: now(),
    },
  });

  // Subscription for company 2 (Pack Complet)
  await prisma.subscription.create({
    data: {
      id: genId(),
      planType: 'PACK_COMPLET',
      monthlyFee: 70000,
      stickerFee: 200,
      activatedStickers: 27,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2026-06-01'),
      status: 'ACTIVE',
      companyId: company2Id,
      updatedAt: now(),
    },
  });

  // QR Batch for company 2
  const batch2Id = genId();
  await prisma.qRBatch.create({
    data: {
      id: batch2Id,
      batchCode: 'QR-2024-002',
      quantity: 100,
      activatedCount: 27,
      status: 'ACTIVE',
      companyId: company2Id,
    },
  });

  // Create packages for batch 2
  const packages2Data = [];
  for (let i = 1; i <= 100; i++) {
    const isActive = i <= 27;
    packages2Data.push({
      id: genId(),
      qrCode: generateQRCode('002', i),
      status: isActive ? 'ACTIVE' : 'NON_ACTIVE',
      activatedAt: isActive ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
      companyId: company2Id,
      batchId: batch2Id,
      senderName: isActive ? `Client ${i}` : null,
      senderPhone: isActive ? `+225 07 ${String(i).padStart(2, '0')} ${String(i * 10).padStart(2, '0')} ${String(i * 5).padStart(2, '0')}` : null,
      recipientName: isActive ? `Destinataire CI ${i}` : null,
      recipientPhone: isActive ? `+226 70 ${String(i).padStart(2, '0')} ${String(i * 10).padStart(2, '0')} ${String(i * 5).padStart(2, '0')}` : null,
      pickupCode: isActive ? String(Math.floor(1000 + Math.random() * 9000)) : null,
      updatedAt: now(),
    });
  }
  await prisma.package.createMany({ data: packages2Data });

  console.log('✅ Company 2 (Transport Express CI) created with 100 QR codes');

  // ============================================
  // TRIPS (Voyages)
  // ============================================

  // Trip 1: In progress (Savana Voyages)
  const trip1Id = genId();
  await prisma.trip.create({
    data: {
      id: trip1Id,
      status: 'IN_PROGRESS',
      departureTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
      passengers: 35,
      trackingCode: generateTrackingCode(),
      currentLat: 11.5,
      currentLng: -3.5,
      busId: bus1Id,
      driverId: driver1Id,
      routeId: route1Id,
      companyId: company1Id,
      updatedAt: now(),
    },
  });

  // Trip scans for trip 1
  await prisma.tripScan.create({
    data: {
      id: genId(),
      type: 'DEPARTURE',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      latitude: 12.3686,
      longitude: -1.5275,
      notes: 'Départ à l\'heure',
      tripId: trip1Id,
    },
  });

  // Trip 2: Completed (Transport Express CI)
  const trip2Id = genId();
  await prisma.trip.create({
    data: {
      id: trip2Id,
      status: 'COMPLETED',
      departureTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      actualDeparture: new Date(Date.now() - 24 * 60 * 60 * 1000),
      arrivalTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
      actualArrival: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
      passengers: 42,
      trackingCode: generateTrackingCode(),
      currentLat: 5.3599,
      currentLng: -4.0083,
      busId: bus2Id,
      driverId: driver2Id,
      routeId: route2Id,
      companyId: company2Id,
      updatedAt: now(),
    },
  });

  // Trip scans for trip 2
  await prisma.tripScan.createMany({
    data: [
      {
        id: genId(),
        type: 'DEPARTURE',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        latitude: 5.3599,
        longitude: -4.0083,
        tripId: trip2Id,
      },
      {
        id: genId(),
        type: 'PAUSE',
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
        latitude: 8.0,
        longitude: -3.5,
        tripId: trip2Id,
      },
      {
        id: genId(),
        type: 'RESUME',
        timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000),
        latitude: 8.0,
        longitude: -3.5,
        tripId: trip2Id,
      },
      {
        id: genId(),
        type: 'ARRIVAL',
        timestamp: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
        latitude: 12.3686,
        longitude: -1.5275,
        tripId: trip2Id,
      },
    ],
  });

  // Trip 3: In progress (Transport Express CI)
  const trip3Id = genId();
  await prisma.trip.create({
    data: {
      id: trip3Id,
      status: 'IN_PROGRESS',
      departureTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
      passengers: 38,
      trackingCode: generateTrackingCode(),
      currentLat: 7.5,
      currentLng: -5.5,
      busId: bus3Id,
      driverId: driver3Id,
      routeId: route3Id,
      companyId: company2Id,
      updatedAt: now(),
    },
  });

  await prisma.tripScan.create({
    data: {
      id: genId(),
      type: 'DEPARTURE',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      latitude: 5.3599,
      longitude: -4.0083,
      tripId: trip3Id,
    },
  });

  console.log('✅ Trips created');

  // ============================================
  // TEST QR CODES (for testing)
  // ============================================
  const testCodes = [
    { qrCode: 'TEST-COLIS-001', status: 'NON_ACTIVE' },
    { qrCode: 'TEST-COLIS-002', status: 'NON_ACTIVE' },
    { qrCode: 'TEST-COLIS-003', status: 'NON_ACTIVE' },
    { qrCode: 'TEST-COLIS-004', status: 'NON_ACTIVE' },
    { qrCode: 'TEST-COLIS-005', status: 'NON_ACTIVE' },
    { qrCode: 'TEST-ACTIVE-001', status: 'ACTIVE', senderName: 'Test Sender 1', recipientName: 'Test Recipient 1', pickupCode: '1234' },
    { qrCode: 'TEST-ACTIVE-002', status: 'ACTIVE', senderName: 'Test Sender 2', recipientName: 'Test Recipient 2', pickupCode: '5678' },
    { qrCode: 'TEST-ACTIVE-003', status: 'IN_TRANSIT', senderName: 'Test Sender 3', recipientName: 'Test Recipient 3', pickupCode: '9012', tripId: trip1Id },
  ];

  for (const testCode of testCodes) {
    await prisma.package.create({
      data: {
        id: genId(),
        qrCode: testCode.qrCode,
        status: testCode.status,
        senderName: testCode.senderName || null,
        recipientName: testCode.recipientName || null,
        pickupCode: testCode.pickupCode || null,
        activatedAt: testCode.status !== 'NON_ACTIVE' ? new Date() : null,
        companyId: testCode.status !== 'NON_ACTIVE' ? company1Id : null,
        tripId: testCode.tripId || null,
        updatedAt: now(),
      },
    });
  }

  console.log('✅ Test QR codes created');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 2 Companies`);
  console.log(`   - 1 Super Admin, 2 Owners, 3 Drivers`);
  console.log(`   - 3 Buses, 3 Routes, 3 Trips`);
  console.log(`   - 2 QR Batches (200 stickers total)`);
  console.log(`   - 69 activated packages`);
  console.log(`   - 2 Subscriptions`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
