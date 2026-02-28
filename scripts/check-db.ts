import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const packages = await db.package.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      qrCode: true,
      status: true,
      senderName: true,
      pickupCode: true,
      createdAt: true
    }
  });
  console.log('Latest packages:', JSON.stringify(packages, null, 2));
}

main().catch(console.error).finally(() => db.$disconnect());
