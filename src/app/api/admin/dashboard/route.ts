import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get all companies with their data
    const companies = await db.company.findMany({
      include: {
        Bus: true,
        Driver: true,
        Subscription: true,
        QRBatch: true,
        Package: {
          where: {
            status: { not: 'NON_ACTIVE' }
          }
        }
      }
    });

    // Get all QR batches
    const qrBatches = await db.qRBatch.findMany({
      include: {
        Company: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all packages with status breakdown
    const packages = await db.package.findMany();
    
    // Get test QR codes
    const testQRCodes = await db.package.findMany({
      where: {
        qrCode: { startsWith: 'TEST-' }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Get active trips
    const activeTrips = await db.trip.findMany({
      where: {
        status: 'IN_PROGRESS'
      },
      include: {
        Bus: true,
        Driver: {
          include: {
            User: true
          }
        },
        Route: true,
        Company: true,
        TripScan: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1
        }
      }
    });

    // Calculate statistics
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(c => c.isActive).length;
    
    const totalBuses = companies.reduce((acc, c) => acc + c.Bus.length, 0);
    const busesInRoute = activeTrips.length;
    
    // Package statistics
    const totalPackages = packages.length;
    const activePackages = packages.filter(p => p.status !== 'NON_ACTIVE').length;
    const inTransitPackages = packages.filter(p => p.status === 'IN_TRANSIT').length;
    const deliveredPackages = packages.filter(p => p.status === 'DELIVERED').length;
    const pendingPackages = packages.filter(p => p.status === 'ACTIVE').length;
    
    const totalStickers = qrBatches.reduce((acc, b) => acc + b.quantity, 0);
    const activatedStickers = qrBatches.reduce((acc, b) => acc + b.activatedCount, 0);

    // Calculate monthly revenue
    const subscriptions = await db.subscription.findMany({
      where: { status: 'ACTIVE' }
    });

    const subscriptionRevenue = subscriptions.reduce((acc, s) => acc + s.monthlyFee, 0);
    const stickerRevenue = subscriptions.reduce((acc, s) => acc + (s.activatedStickers * s.stickerFee), 0);
    const monthlyRevenue = subscriptionRevenue + stickerRevenue;

    // Group subscriptions by plan type
    const subscriptionStats = [
      {
        planType: 'BUS_ONLY',
        label: 'Bus Seul',
        count: subscriptions.filter(s => s.planType === 'BUS_ONLY').length,
        revenue: subscriptions.filter(s => s.planType === 'BUS_ONLY').reduce((acc, s) => acc + s.monthlyFee, 0),
        monthlyFee: 50000
      },
      {
        planType: 'COLIS_ONLY',
        label: 'Colis Seul',
        count: subscriptions.filter(s => s.planType === 'COLIS_ONLY').length,
        revenue: subscriptions.filter(s => s.planType === 'COLIS_ONLY').reduce((acc, s) => acc + s.monthlyFee, 0),
        monthlyFee: 30000
      },
      {
        planType: 'PACK_COMPLET',
        label: 'Pack Complet',
        count: subscriptions.filter(s => s.planType === 'PACK_COMPLET').length,
        revenue: subscriptions.filter(s => s.planType === 'PACK_COMPLET').reduce((acc, s) => acc + s.monthlyFee, 0),
        monthlyFee: 70000
      }
    ];

    // Format companies for response - FIX: Subscription is singular, not array
    const formattedCompanies = companies.map(company => {
      // Subscription is a single object (one-to-one relation), not an array
      const subscription = company.Subscription;
      const totalStickersForCompany = company.QRBatch.reduce((acc, b) => acc + b.quantity, 0);
      const activatedStickersForCompany = subscription?.activatedStickers || 0;
      
      // Calculate revenue for this company
      const monthlyFee = subscription?.monthlyFee || 0;
      const stickerFee = subscription?.stickerFee || 200;
      const stickerRevenueForCompany = activatedStickersForCompany * stickerFee;
      const totalRevenue = monthlyFee + stickerRevenueForCompany;

      return {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        city: company.city,
        country: company.country,
        isActive: company.isActive,
        createdAt: company.createdAt,
        busesCount: company.Bus.length,
        driversCount: company.Driver.length,
        subscription: subscription ? {
          id: subscription.id,
          planType: subscription.planType,
          monthlyFee: subscription.monthlyFee,
          stickerFee: subscription.stickerFee,
          activatedStickers: subscription.activatedStickers,
          status: subscription.status
        } : null,
        stickers: {
          total: totalStickersForCompany,
          activated: activatedStickersForCompany
        },
        revenue: totalRevenue
      };
    });

    return NextResponse.json({
      stats: {
        totalCompanies,
        activeCompanies,
        totalBuses,
        busesInRoute,
        totalPackages,
        activePackages,
        inTransitPackages,
        deliveredPackages,
        pendingPackages,
        monthlyRevenue,
        subscriptionRevenue,
        stickerRevenue,
        totalStickers,
        activatedStickers
      },
      companies: formattedCompanies,
      qrBatches: qrBatches.map(batch => ({
        id: batch.id,
        batchCode: batch.batchCode,
        quantity: batch.quantity,
        activatedCount: batch.activatedCount,
        status: batch.status,
        createdAt: batch.createdAt,
        company: batch.Company
      })),
      subscriptions: subscriptionStats,
      testQRCodes: testQRCodes.map(pkg => ({
        id: pkg.id,
        qrCode: pkg.qrCode,
        status: pkg.status,
        senderName: pkg.senderName,
        recipientName: pkg.recipientName,
        activatedAt: pkg.activatedAt
      })),
      activeTrips: activeTrips.map(trip => ({
        id: trip.id,
        trackingCode: trip.trackingCode,
        status: trip.status,
        departureTime: trip.departureTime,
        passengers: trip.passengers,
        currentLat: trip.currentLat,
        currentLng: trip.currentLng,
        bus: {
          plateNumber: trip.Bus.plateNumber,
          model: trip.Bus.model
        },
        driver: {
          name: trip.Driver?.User?.name || 'N/A'
        },
        route: {
          name: trip.Route.name,
          origin: trip.Route.origin,
          destination: trip.Route.destination
        },
        company: {
          name: trip.Company.name
        },
        lastScan: trip.TripScan?.[0] || null
      }))
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}
