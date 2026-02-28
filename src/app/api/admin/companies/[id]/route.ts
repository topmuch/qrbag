import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const company = await db.company.findUnique({
      where: { id },
      include: {
        User: {
          where: { role: 'OWNER' },
        },
        Bus: true,
        Driver: {
          include: {
            User: true,
          },
        },
        Route: true,
        Trip: {
          include: {
            Bus: true,
            Driver: {
              include: {
                User: true,
              },
            },
            Route: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        Package: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        Subscription: true,
        QRBatch: {
          include: {
            _count: {
              select: { Package: true },
            },
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Compagnie non trouvée' },
        { status: 404 }
      );
    }

    // Calculate revenue
    const subscription = company.Subscription;
    const monthlyFee = subscription?.monthlyFee || 0;
    const stickerFee = subscription?.stickerFee || 200;
    const activatedStickers = subscription?.activatedStickers || 0;
    const stickerRevenue = activatedStickers * stickerFee;
    const totalRevenue = monthlyFee + stickerRevenue;

    // Count stickers from QR batches
    const totalStickers = company.QRBatch.reduce((acc, b) => acc + b.quantity, 0);

    const formattedCompany = {
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      city: company.city,
      country: company.country,
      isActive: company.isActive,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      busesCount: company.Bus.length,
      driversCount: company.Driver.length,
      routesCount: company.Route.length,
      tripsCount: company.Trip.length,
      revenue: totalRevenue,
      subscription: subscription ? {
        id: subscription.id,
        planType: subscription.planType,
        monthlyFee: subscription.monthlyFee,
        stickerFee: subscription.stickerFee,
        activatedStickers: subscription.activatedStickers,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      } : null,
      stickers: {
        total: totalStickers,
        activated: activatedStickers
      },
      buses: company.Bus.map(bus => ({
        id: bus.id,
        plateNumber: bus.plateNumber,
        model: bus.model,
        capacity: bus.capacity,
        color: bus.color,
        year: bus.year,
        isActive: bus.isActive
      })),
      drivers: company.Driver.map(driver => ({
        id: driver.id,
        name: driver.User?.name || 'N/A',
        email: driver.User?.email,
        phone: driver.User?.phone,
        licenseNumber: driver.licenseNumber,
        isActive: driver.isActive
      })),
      recentTrips: company.Trip.map(trip => ({
        id: trip.id,
        trackingCode: trip.trackingCode,
        status: trip.status,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        passengers: trip.passengers,
        bus: trip.Bus ? { plateNumber: trip.Bus.plateNumber, model: trip.Bus.model } : null,
        route: trip.Route ? { name: trip.Route.name, origin: trip.Route.origin, destination: trip.Route.destination } : null
      })),
      qrBatches: company.QRBatch.map(batch => ({
        id: batch.id,
        batchCode: batch.batchCode,
        quantity: batch.quantity,
        activatedCount: batch.activatedCount,
        status: batch.status,
        createdAt: batch.createdAt
      }))
    };

    return NextResponse.json(formattedCompany);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la compagnie' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, address, city, country, isActive } = body;

    const company = await db.company.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        address,
        city,
        country,
        isActive,
        updatedAt: new Date()
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la compagnie' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete by setting isActive to false
    const company = await db.company.update({
      where: { id },
      data: { 
        isActive: false,
        updatedAt: new Date()
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la compagnie' },
      { status: 500 }
    );
  }
}
