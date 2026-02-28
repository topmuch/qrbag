import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BatchStatus } from '@prisma/client';

// Helper to generate unique QR code
function generateQRCode(batchCode: string, index: number): string {
  const batchNum = batchCode.split('-').pop() || '001';
  return `QR-PKG-${batchNum}-${String(index).padStart(3, '0')}`;
}

// Helper to generate batch code
function generateBatchCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `QR-${year}-${random}`;
}

// GET - List all QR batches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (batchId) {
      // Get specific batch with packages
      const batch = await db.qRBatch.findUnique({
        where: { id: batchId },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              email: true,
              city: true,
              country: true
            }
          },
          packages: {
            orderBy: {
              qrCode: 'asc'
            }
          }
        }
      });

      if (!batch) {
        return NextResponse.json(
          { error: 'Lot non trouvé' },
          { status: 404 }
        );
      }

      return NextResponse.json(batch);
    }

    // Get all batches
    const batches = await db.qRBatch.findMany({
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            packages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(batches);
  } catch (error) {
    console.error('Get QR batches error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des lots QR' },
      { status: 500 }
    );
  }
}

// POST - Generate new QR batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, quantity } = body;

    if (!companyId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'ID compagnie et quantité sont requis' },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await db.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Compagnie non trouvée' },
        { status: 404 }
      );
    }

    // Generate batch code
    let batchCode = generateBatchCode();
    
    // Ensure batch code is unique
    let existingBatch = await db.qRBatch.findUnique({
      where: { batchCode }
    });
    
    while (existingBatch) {
      batchCode = generateBatchCode();
      existingBatch = await db.qRBatch.findUnique({
        where: { batchCode }
      });
    }

    // Create batch
    const batch = await db.qRBatch.create({
      data: {
        batchCode,
        quantity,
        activatedCount: 0,
        status: BatchStatus.PENDING,
        companyId
      }
    });

    // Generate packages (QR codes)
    const packagesData = [];
    for (let i = 1; i <= quantity; i++) {
      packagesData.push({
        qrCode: generateQRCode(batchCode, i),
        status: 'NON_ACTIVE',
        companyId,
        batchId: batch.id
      });
    }

    // Insert packages in chunks to avoid SQLite limits
    const chunkSize = 100;
    for (let i = 0; i < packagesData.length; i += chunkSize) {
      const chunk = packagesData.slice(i, i + chunkSize);
      await db.package.createMany({ data: chunk });
    }

    // Return batch with codes
    const createdPackages = await db.package.findMany({
      where: { batchId: batch.id },
      select: { qrCode: true },
      orderBy: { qrCode: 'asc' }
    });

    return NextResponse.json({
      batch: {
        ...batch,
        company: {
          id: company.id,
          name: company.name
        }
      },
      codes: createdPackages.map(p => p.qrCode)
    }, { status: 201 });
  } catch (error) {
    console.error('Create QR batch error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du lot QR' },
      { status: 500 }
    );
  }
}
