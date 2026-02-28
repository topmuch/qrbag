import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get test QR codes (active and non-active)
export async function GET() {
  try {
    // Get packages that start with "TEST-" or are not associated with a batch
    const testPackages = await db.package.findMany({
      where: {
        OR: [
          { qrCode: { startsWith: 'TEST-' } },
          { qrCode: { startsWith: 'QR-PKG-001-' } },
          { qrCode: { startsWith: 'QR-PKG-002-' } }
        ]
      },
      orderBy: [
        { status: 'asc' },
        { qrCode: 'asc' }
      ],
      take: 20
    });

    const nonActivePackages = testPackages.filter(p => p.status === 'NON_ACTIVE');
    const activePackages = testPackages.filter(p => p.status !== 'NON_ACTIVE');

    // Also get some random non-activated packages from batches
    const batchNonActive = await db.package.findMany({
      where: {
        status: 'NON_ACTIVE',
        qrCode: { not: { startsWith: 'TEST-' } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get some active packages from batches
    const batchActive = await db.package.findMany({
      where: {
        status: { in: ['ACTIVE', 'IN_TRANSIT'] },
        qrCode: { not: { startsWith: 'TEST-' } }
      },
      include: {
        company: {
          select: { name: true }
        }
      },
      orderBy: { activatedAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      nonActive: [...nonActivePackages, ...batchNonActive].slice(0, 10).map(p => ({
        id: p.id,
        qrCode: p.qrCode,
        status: p.status,
        createdAt: p.createdAt
      })),
      active: [...activePackages, ...batchActive].slice(0, 10).map(p => ({
        id: p.id,
        qrCode: p.qrCode,
        status: p.status,
        senderName: p.senderName,
        recipientName: p.recipientName,
        activatedAt: p.activatedAt,
        company: (p as any).company?.name || null
      }))
    });
  } catch (error) {
    console.error('Get test QR codes error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des codes de test' },
      { status: 500 }
    );
  }
}
