import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all packages for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || 'demo-company-1';
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const date = searchParams.get('date');

    // Build filter
    const where: any = { companyId };
    
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { qrCode: { contains: search } },
        { recipientName: { contains: search } },
        { senderName: { contains: search } }
      ];
    }
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.activatedAt = {
        gte: startDate,
        lte: endDate
      };
    }

    const packages = await db.package.findMany({
      where,
      include: {
        Trip: {
          include: {
            Route: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // If no packages found, return demo data
    if (packages.length === 0) {
      return NextResponse.json(getDemoPackages());
    }

    return NextResponse.json(packages.map(p => ({
      id: p.id,
      qrCode: p.qrCode,
      status: p.status,
      senderName: p.senderName,
      senderPhone: p.senderPhone,
      recipientName: p.recipientName,
      recipientPhone: p.recipientPhone,
      recipientWhatsapp: p.recipientWhatsapp,
      pickupCode: p.pickupCode,
      description: p.description,
      weight: p.weight,
      price: p.price,
      activatedAt: p.activatedAt,
      trip: p.Trip ? {
        id: p.Trip.id,
        route: p.Trip.Route ? {
          name: p.Trip.Route.name
        } : null
      } : null,
      createdAt: p.createdAt
    })));
  } catch (error) {
    console.error('Get packages error:', error);
    return NextResponse.json(getDemoPackages());
  }
}

// GET package stats
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, action } = body;

    if (action === 'stats') {
      const packages = await db.package.findMany({
        where: { companyId }
      });

      const stats = {
        total: packages.length,
        active: packages.filter(p => p.status === 'ACTIVE').length,
        inTransit: packages.filter(p => p.status === 'IN_TRANSIT').length,
        delivered: packages.filter(p => p.status === 'DELIVERED').length,
        nonActive: packages.filter(p => p.status === 'NON_ACTIVE').length
      };

      return NextResponse.json(stats);
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Package stats error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du calcul des statistiques' },
      { status: 500 }
    );
  }
}

function getDemoPackages() {
  return [
    {
      id: 'pkg-1',
      qrCode: 'QR-PKG-001-001',
      status: 'IN_TRANSIT',
      senderName: 'Amadou Koné',
      senderPhone: '+225 07 01 01 01',
      recipientName: 'Fatou Diallo',
      recipientPhone: '+225 07 02 02 02',
      recipientWhatsapp: '+225 07 02 02 02',
      pickupCode: '1234',
      description: 'Colis contenant des produits alimentaires',
      weight: 5.5,
      price: 2500,
      activatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      trip: {
        id: 'trip-1',
        route: { name: 'Abidjan - Yamoussoukro' }
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pkg-2',
      qrCode: 'QR-PKG-001-002',
      status: 'ACTIVE',
      senderName: 'Ibrahim Touré',
      senderPhone: '+225 07 03 03 03',
      recipientName: 'Awa Sanogo',
      recipientPhone: '+225 07 04 04 04',
      recipientWhatsapp: null,
      pickupCode: '5678',
      description: 'Vêtements',
      weight: 2.0,
      price: 1500,
      activatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      trip: null,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pkg-3',
      qrCode: 'QR-PKG-001-003',
      status: 'DELIVERED',
      senderName: 'Moussa Kone',
      senderPhone: '+225 07 05 05 05',
      recipientName: 'Mariam Coulibaly',
      recipientPhone: '+225 07 06 06 06',
      recipientWhatsapp: '+225 07 06 06 06',
      pickupCode: '9012',
      description: 'Électroménager',
      weight: 10.0,
      price: 5000,
      activatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      trip: {
        id: 'trip-2',
        route: { name: 'Abidjan - Bouaké' }
      },
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
    }
  ];
}
