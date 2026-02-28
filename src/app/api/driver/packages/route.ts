import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET - Get packages for driver
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');
    const driverId = searchParams.get('driverId');
    const status = searchParams.get('status');

    let where: any = {};

    if (tripId) {
      where.tripId = tripId;
    } else if (driverId) {
      where.trip = { driverId };
    }

    if (status) {
      where.status = status;
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
      orderBy: { createdAt: 'desc' }
    });

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
      photo: p.photo,
      activatedAt: p.activatedAt,
      trip: p.Trip ? {
        id: p.Trip.id,
        status: p.Trip.status,
        route: p.Trip.Route ? {
          name: p.Trip.Route.name,
          destination: p.Trip.Route.destination
        } : null
      } : null
    })));
  } catch (error) {
    console.error('Get packages error:', error);
    return NextResponse.json([]);
  }
}

// POST - Activate package or deliver package
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'activate') {
      return await activatePackage(data);
    } else if (action === 'deliver') {
      return await deliverPackage(data);
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Package action error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'action' }, { status: 500 });
  }
}

async function activatePackage(data: any) {
  const {
    qrCode,
    senderName,
    senderPhone,
    recipientName,
    recipientPhone,
    recipientWhatsapp,
    description,
    weight,
    price,
    photo,
    tripId,
    companyId
  } = data;

  if (!qrCode || !senderName || !senderPhone || !recipientName || !recipientPhone || !tripId) {
    return NextResponse.json({ 
      error: 'QR code, expéditeur, destinataire et voyage sont requis' 
    }, { status: 400 });
  }

  // Find the package with this QR code
  const existingPackage = await db.package.findFirst({
    where: { qrCode }
  });

  if (!existingPackage) {
    return NextResponse.json({ error: 'QR code non trouvé dans le système' }, { status: 404 });
  }

  if (existingPackage.status !== 'NON_ACTIVE') {
    return NextResponse.json({ error: 'Ce colis a déjà été activé' }, { status: 400 });
  }

  // Generate pickup code
  const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
  const now = new Date();

  // Update package
  const updatedPackage = await db.package.update({
    where: { id: existingPackage.id },
    data: {
      status: 'ACTIVE',
      senderName,
      senderPhone,
      recipientName,
      recipientPhone,
      recipientWhatsapp: recipientWhatsapp || recipientPhone,
      pickupCode,
      description,
      weight: weight ? parseFloat(weight) : null,
      price: price ? parseFloat(price) : 200, // Default 200 FCFA
      photo,
      tripId,
      companyId: companyId || existingPackage.companyId,
      activatedAt: now,
      updatedAt: now
    }
  });

  // Update trip if needed
  if (tripId) {
    const trip = await db.trip.findUnique({ where: { id: tripId } });
    if (trip && trip.status === 'IN_PROGRESS') {
      // Package will be in transit when trip starts
      await db.package.update({
        where: { id: updatedPackage.id },
        data: { status: 'IN_TRANSIT' }
      });
    }
  }

  return NextResponse.json({
    success: true,
    package: {
      id: updatedPackage.id,
      qrCode: updatedPackage.qrCode,
      status: updatedPackage.status,
      senderName: updatedPackage.senderName,
      senderPhone: updatedPackage.senderPhone,
      recipientName: updatedPackage.recipientName,
      recipientPhone: updatedPackage.recipientPhone,
      recipientWhatsapp: updatedPackage.recipientWhatsapp,
      pickupCode: updatedPackage.pickupCode,
      description: updatedPackage.description,
      weight: updatedPackage.weight,
      price: updatedPackage.price,
      activatedAt: updatedPackage.activatedAt
    }
  }, { status: 201 });
}

async function deliverPackage(data: any) {
  const { packageId, pickupCode, signature, deliveredBy } = data;

  if (!packageId || !pickupCode) {
    return NextResponse.json({ error: 'ID colis et code de retrait requis' }, { status: 400 });
  }

  // Find package
  const pkg = await db.package.findUnique({
    where: { id: packageId }
  });

  if (!pkg) {
    return NextResponse.json({ error: 'Colis non trouvé' }, { status: 404 });
  }

  // Verify pickup code
  if (pkg.pickupCode !== pickupCode) {
    return NextResponse.json({ 
      success: false,
      error: 'Code de retrait incorrect' 
    }, { status: 400 });
  }

  const now = new Date();

  // Update package status
  const updatedPackage = await db.package.update({
    where: { id: packageId },
    data: {
      status: 'DELIVERED',
      deliveredAt: now,
      deliverySignature: signature,
      updatedAt: now
    }
  });

  return NextResponse.json({
    success: true,
    package: {
      id: updatedPackage.id,
      status: updatedPackage.status,
      deliveredAt: updatedPackage.deliveredAt
    }
  });
}
