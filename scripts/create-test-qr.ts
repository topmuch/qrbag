import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get first company
  const company = await prisma.company.findFirst();

  if (!company) {
    console.log('❌ Aucune compagnie trouvée. Créez d\'abord une compagnie.');
    return;
  }

  console.log(`📦 Création de QR codes de test pour: ${company.name}`);

  // Find or create a test batch
  let batch = await prisma.qRBatch.findFirst({
    where: { batchCode: `TEST-${new Date().getFullYear()}-DEMO` }
  });

  if (!batch) {
    batch = await prisma.qRBatch.create({
      data: {
        id: `test-batch-${Date.now()}`,
        batchCode: `TEST-${new Date().getFullYear()}-DEMO`,
        quantity: 3,
        activatedCount: 0,
        status: 'ACTIVE',
        companyId: company.id,
      }
    });
    console.log(`✅ Batch créé: ${batch.batchCode}`);
  } else {
    console.log(`✅ Batch existant: ${batch.batchCode}`);
  }

  // Create test packages
  const testCodes = [
    { code: 'TEST-QR-001', desc: 'Colis test 1' },
    { code: 'TEST-QR-002', desc: 'Colis test 2' },
    { code: 'TEST-QR-003', desc: 'Colis test 3' },
  ];

  for (const test of testCodes) {
    // Check if already exists
    const existing = await prisma.package.findUnique({
      where: { qrCode: test.code }
    });

    if (existing) {
      console.log(`   ⏭️  QR Code existe déjà: ${test.code}`);
      continue;
    }

    await prisma.package.create({
      data: {
        id: `pkg-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        qrCode: test.code,
        status: 'NON_ACTIVE',
        description: test.desc,
        companyId: company.id,
        batchId: batch.id,
        updatedAt: new Date(),
      }
    });
    console.log(`   ✅ QR Code créé: ${test.code}`);
  }

  console.log('\n🎉 QR Codes de test prêts!');
  console.log('\n📋 Codes à utiliser:');
  testCodes.forEach(t => console.log(`   - ${t.code}`));
  console.log('\n🚀 Allez sur /driver et utilisez ces codes pour tester!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
