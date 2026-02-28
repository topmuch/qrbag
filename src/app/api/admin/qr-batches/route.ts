import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

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
          Company: {
            select: {
              id: true,
              name: true,
              email: true,
              city: true,
              country: true
            }
          },
          Package: {
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

      // Transform to match frontend expectations
      return NextResponse.json({
        ...batch,
        company: batch.Company,
        packages: batch.Package
      });
    }

    // Get all batches
    const batches = await db.qRBatch.findMany({
      include: {
        Company: {
          select: {
            id: true,
            name: true
          }
        },
        Package: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to match frontend expectations
    return NextResponse.json(batches.map(b => ({
      ...b,
      company: b.Company,
      _count: { packages: b.Package.length }
    })));
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
    const { companyId, quantity, notes } = body;

    if (!companyId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'ID compagnie et quantité sont requis' },
        { status: 400 }
      );
    }

    if (quantity > 1000) {
      return NextResponse.json(
        { error: 'La quantité maximale est de 1000 QR codes' },
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
    const batchId = randomUUID();
    const batch = await db.qRBatch.create({
      data: {
        id: batchId,
        batchCode,
        quantity,
        activatedCount: 0,
        status: 'PENDING',
        companyId
      }
    });

    // Generate packages (QR codes)
    const packagesData = [];
    for (let i = 1; i <= quantity; i++) {
      packagesData.push({
        id: randomUUID(),
        qrCode: generateQRCode(batchCode, i),
        status: 'NON_ACTIVE',
        companyId,
        batchId: batch.id,
        updatedAt: new Date()
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
  } catch (error: any) {
    console.error('Create QR batch error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du lot QR', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
