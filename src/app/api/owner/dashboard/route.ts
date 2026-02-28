import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Owner Dashboard Data
export async function GET(request: Request) {
  try {
    // For demo, we'll use company ID from query param
    // In production, this would come from authenticated session
    const { searchParams } = new URL(request.url);
    let companyId = searchParams.get('companyId');
    
    // If no company ID provided, get the first company from database
    if (!companyId || companyId === 'demo-company-1') {
      const firstCompany = await db.company.findFirst({
        orderBy: { createdAt: 'asc' }
      });
      if (firstCompany) {
        companyId = firstCompany.id;
      } else {
        // No companies exist, return demo data
        return NextResponse.json(getDemoDashboardData());
      }
    }
    
    // Get company info
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        Subscription: true,
        User: {
          where: { role: 'OWNER' },
          take: 1
        }
      }
    });

    if (!company) {
      // Return demo data if company not found
      return NextResponse.json(getDemoDashboardData());
    }

    // Get buses
    const buses = await db.bus.findMany({
      where: { companyId },
      include: {
        Trip: {
          where: { status: 'IN_PROGRESS' },
          take: 1
        }
      }
    });

    // Get drivers
    const drivers = await db.driver.findMany({
      where: { companyId },
      include: {
        User: true
      }
    });

    // Get routes with checkpoints
    const routes = await db.route.findMany({
      where: { companyId },
      include: {
        Checkpoints: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { Trip: true }
        }
      }
    });

    // Get trips (active and scheduled)
    const activeTrips = await db.trip.findMany({
      where: { 
        companyId,
        status: 'IN_PROGRESS'
      },
      include: {
        Bus: true,
        Driver: { include: { User: true } },
        Route: true,
        TripScan: { orderBy: { timestamp: 'desc' }, take: 4 },
        Package: { where: { status: 'IN_TRANSIT' } }
      },
      orderBy: { departureTime: 'desc' }
    });

    const scheduledTrips = await db.trip.findMany({
      where: { 
        companyId,
        status: 'SCHEDULED'
      },
      include: {
        Bus: true,
        Driver: { include: { User: true } },
        Route: true
      },
      orderBy: { departureTime: 'asc' },
      take: 5
    });

    // Get packages statistics
    const packages = await db.package.findMany({
      where: { companyId }
    });

    const activePackages = packages.filter(p => p.status === 'ACTIVE' || p.status === 'IN_TRANSIT');
    const inTransitPackages = packages.filter(p => p.status === 'IN_TRANSIT');
    const deliveredPackages = packages.filter(p => p.status === 'DELIVERED');

    // Calculate revenue
    const subscription = company.Subscription;
    const subscriptionRevenue = subscription?.monthlyFee || 0;
    const stickerRevenue = (subscription?.activatedStickers || 0) * (subscription?.stickerFee || 200);
    const monthlyRevenue = subscriptionRevenue + stickerRevenue;

    // Calculate stats
    const busesInRoute = buses.filter(b => b.Trip.some(t => t.status === 'IN_PROGRESS')).length;
    const activeDrivers = drivers.filter(d => d.isActive).length;

    // Get QR batches
    const qrBatches = await db.qRBatch.findMany({
      where: { companyId },
      include: { Company: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const totalStickers = qrBatches.reduce((acc, b) => acc + b.quantity, 0);
    const activatedStickers = qrBatches.reduce((acc, b) => acc + b.activatedCount, 0);
    const activationRate = totalStickers > 0 ? Math.round((activatedStickers / totalStickers) * 100) : 0;

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        city: company.city,
        country: company.country,
        subscription: subscription ? {
          planType: subscription.planType,
          monthlyFee: subscription.monthlyFee,
          activatedStickers: subscription.activatedStickers,
          status: subscription.status
        } : null
      },
      owner: company.User[0] ? {
        id: company.User[0].id,
        name: company.User[0].name,
        email: company.User[0].email
      } : { name: 'Propriétaire', email: 'owner@qrbag.com' },
      stats: {
        totalBuses: buses.length,
        activeBuses: buses.filter(b => b.isActive).length,
        busesInRoute,
        totalDrivers: drivers.length,
        activeDrivers,
        activeTrips: activeTrips.length,
        scheduledTrips: scheduledTrips.length,
        packagesActive: activePackages.length,
        packagesInTransit: inTransitPackages.length,
        packagesDelivered: deliveredPackages.length,
        monthlyRevenue,
        subscriptionRevenue,
        stickerRevenue,
        totalStickers,
        activatedStickers,
        activationRate
      },
      buses: buses.map(b => ({
        id: b.id,
        plateNumber: b.plateNumber,
        model: b.model,
        capacity: b.capacity,
        color: b.color,
        year: b.year,
        isActive: b.isActive,
        inTrip: b.Trip.some(t => t.status === 'IN_PROGRESS')
      })),
      drivers: drivers.map(d => ({
        id: d.id,
        name: d.User?.name || 'N/A',
        email: d.User?.email,
        phone: d.User?.phone,
        licenseNumber: d.licenseNumber,
        licenseExpiry: d.licenseExpiry,
        isActive: d.isActive
      })),
      routes: routes.map(r => ({
        id: r.id,
        name: r.name,
        origin: r.origin,
        destination: r.destination,
        distance: r.distance,
        estimatedTime: r.estimatedTime,
        checkpoints: r.Checkpoints.map(cp => ({
          id: cp.id,
          name: cp.name,
          type: cp.type,
          order: cp.order,
          recommendedDuration: cp.recommendedDuration,
          latitude: cp.latitude,
          longitude: cp.longitude,
          notes: cp.notes
        })),
        _count: {
          trips: r._count.Trip
        }
      })),
      activeTrips: activeTrips.map(t => formatTrip(t)),
      scheduledTrips: scheduledTrips.map(t => formatTrip(t)),
      qrBatches: qrBatches.map(b => ({
        id: b.id,
        batchCode: b.batchCode,
        quantity: b.quantity,
        activatedCount: b.activatedCount,
        status: b.status,
        createdAt: b.createdAt
      }))
    });
  } catch (error) {
    console.error('Owner dashboard API error:', error);
    return NextResponse.json(getDemoDashboardData());
  }
}

function formatTrip(trip: any) {
  return {
    id: trip.id,
    trackingCode: trip.trackingCode,
    status: trip.status,
    departureTime: trip.departureTime,
    actualDeparture: trip.actualDeparture,
    arrivalTime: trip.arrivalTime,
    passengers: trip.passengers,
    currentLat: trip.currentLat,
    currentLng: trip.currentLng,
    notes: trip.notes,
    bus: trip.Bus ? {
      id: trip.Bus.id,
      plateNumber: trip.Bus.plateNumber,
      model: trip.Bus.model,
      capacity: trip.Bus.capacity
    } : null,
    driver: trip.Driver ? {
      id: trip.Driver.id,
      name: trip.Driver.User?.name || 'N/A',
      phone: trip.Driver.User?.phone
    } : null,
    route: trip.Route ? {
      id: trip.Route.id,
      name: trip.Route.name,
      origin: trip.Route.origin,
      destination: trip.Route.destination,
      distance: trip.Route.distance,
      estimatedTime: trip.Route.estimatedTime
    } : null,
    scans: trip.TripScan ? trip.TripScan.map((s: any) => ({
      id: s.id,
      type: s.type,
      timestamp: s.timestamp,
      latitude: s.latitude,
      longitude: s.longitude,
      notes: s.notes
    })) : [],
    packagesCount: trip.Package?.length || 0
  };
}

function getDemoDashboardData() {
  return {
    company: {
      id: 'demo-company-1',
      name: 'Transport Express CI',
      email: 'contact@transport-express.ci',
      phone: '+225 27 00 00 00',
      city: 'Abidjan',
      country: "Côte d'Ivoire",
      subscription: {
        planType: 'PACK_COMPLET',
        monthlyFee: 70000,
        activatedStickers: 27,
        status: 'ACTIVE'
      }
    },
    owner: {
      id: 'owner-1',
      name: 'Kouassi Yao',
      email: 'owner@transport-express.ci'
    },
    stats: {
      totalBuses: 3,
      activeBuses: 3,
      busesInRoute: 2,
      totalDrivers: 2,
      activeDrivers: 2,
      activeTrips: 1,
      scheduledTrips: 2,
      packagesActive: 72,
      packagesInTransit: 1,
      packagesDelivered: 0,
      monthlyRevenue: 75400,
      subscriptionRevenue: 70000,
      stickerRevenue: 5400,
      totalStickers: 200,
      activatedStickers: 27,
      activationRate: 35
    },
    buses: [
      { id: 'bus-1', plateNumber: 'CI-5678-AB', model: 'Volvo 9700', capacity: 55, color: 'Orange', year: 2021, isActive: true, inTrip: true },
      { id: 'bus-2', plateNumber: 'CI-9012-CD', model: 'Scania K410', capacity: 45, color: 'Bleu', year: 2020, isActive: true, inTrip: true },
      { id: 'bus-3', plateNumber: 'CI-3456-EF', model: 'Mercedes 0400', capacity: 50, color: 'Vert', year: 2019, isActive: true, inTrip: false }
    ],
    drivers: [
      { id: 'driver-1', name: 'Jean-Baptiste Kouadio', email: 'driver1@transport-express.ci', phone: '+225 07 00 00 02', licenseNumber: 'CI-67890-2024', licenseExpiry: '2028-06-30', isActive: true },
      { id: 'driver-2', name: 'Mamadou Diallo', email: 'driver2@transport-express.ci', phone: '+225 07 00 00 03', licenseNumber: 'CI-11111-2024', licenseExpiry: '2027-03-15', isActive: true }
    ],
    routes: [
      { 
        id: 'route-1', 
        name: 'Abidjan - Yamoussoukro', 
        origin: 'Abidjan', 
        destination: 'Yamoussoukro', 
        distance: 250, 
        estimatedTime: 240,
        checkpoints: [
          { id: 'cp-1', name: 'Gare routière Abidjan', type: 'DEPART', order: 1, recommendedDuration: null, latitude: 5.3599, longitude: -4.0083, notes: null },
          { id: 'cp-2', name: 'Station Total Sikensi', type: 'PAUSE', order: 2, recommendedDuration: 20, latitude: null, longitude: null, notes: 'CARBURANT' },
          { id: 'cp-3', name: 'Gare routière Yamoussoukro', type: 'ARRIVAL', order: 3, recommendedDuration: null, latitude: 6.8276, longitude: -5.2893, notes: null }
        ],
        _count: { trips: 12 }
      },
      { 
        id: 'route-2', 
        name: 'Abidjan - Bouaké', 
        origin: 'Abidjan', 
        destination: 'Bouaké', 
        distance: 350, 
        estimatedTime: 360,
        checkpoints: [
          { id: 'cp-4', name: 'Gare routière Abidjan', type: 'DEPART', order: 1, recommendedDuration: null, latitude: 5.3599, longitude: -4.0083, notes: null },
          { id: 'cp-5', name: 'Relais Agboville', type: 'PAUSE', order: 2, recommendedDuration: 30, latitude: null, longitude: null, notes: 'REPAS' },
          { id: 'cp-6', name: 'Station Total Tiassalé', type: 'PAUSE', order: 3, recommendedDuration: 15, latitude: null, longitude: null, notes: 'CARBURANT' },
          { id: 'cp-7', name: 'Gare routière Bouaké', type: 'ARRIVAL', order: 4, recommendedDuration: null, latitude: 7.6892, longitude: -5.0708, notes: null }
        ],
        _count: { trips: 8 }
      },
      { 
        id: 'route-3', 
        name: 'Abidjan - Ouaga', 
        origin: 'Abidjan', 
        destination: 'Ouagadougou', 
        distance: 850, 
        estimatedTime: 1080,
        checkpoints: [
          { id: 'cp-8', name: 'Gare routière Abidjan', type: 'DEPART', order: 1, recommendedDuration: null, latitude: 5.3599, longitude: -4.0083, notes: null },
          { id: 'cp-9', name: 'Pause Bouaké', type: 'PAUSE', order: 2, recommendedDuration: 45, latitude: null, longitude: null, notes: 'REPAS' },
          { id: 'cp-10', name: 'Frontière CI/Ghana', type: 'PAUSE', order: 3, recommendedDuration: 30, latitude: null, longitude: null, notes: 'CONTROLE' },
          { id: 'cp-11', name: 'Station Ouagadougou', type: 'ARRIVAL', order: 4, recommendedDuration: null, latitude: 12.3686, longitude: -1.5275, notes: null }
        ],
        _count: { trips: 3 }
      }
    ],
    activeTrips: [
      {
        id: 'trip-1',
        trackingCode: 'TRK-A1B2C3',
        status: 'IN_PROGRESS',
        departureTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        actualDeparture: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        passengers: 42,
        currentLat: 6.8276,
        currentLng: -5.2893,
        notes: null,
        bus: { id: 'bus-1', plateNumber: 'CI-5678-AB', model: 'Volvo 9700', capacity: 55 },
        driver: { id: 'driver-1', name: 'Jean-Baptiste Kouadio', phone: '+225 07 00 00 02' },
        route: { id: 'route-1', name: 'Abidjan - Yamoussoukro', origin: 'Abidjan', destination: 'Yamoussoukro', distance: 250, estimatedTime: 240 },
        scans: [
          { id: 'scan-1', type: 'DEPARTURE', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), latitude: 5.3599, longitude: -4.0082, notes: 'Départ à l\'heure' },
          { id: 'scan-2', type: 'PAUSE', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), latitude: 6.5, longitude: -4.5, notes: 'Pause café - Station Total Yamoussoukro' },
          { id: 'scan-3', type: 'RESUME', timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), latitude: 6.5, longitude: -4.5, notes: 'Reprise du voyage' }
        ],
        packagesCount: 2
      }
    ],
    scheduledTrips: [
      {
        id: 'trip-2',
        trackingCode: 'TRK-D4E5F6',
        status: 'SCHEDULED',
        departureTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        passengers: 38,
        bus: { id: 'bus-3', plateNumber: 'CI-3456-EF', model: 'Mercedes 0400', capacity: 50 },
        driver: { id: 'driver-2', name: 'Mamadou Diallo', phone: '+225 07 00 00 03' },
        route: { id: 'route-2', name: 'Abidjan - Bouaké', origin: 'Abidjan', destination: 'Bouaké', distance: 350, estimatedTime: 360 },
        scans: [],
        packagesCount: 0
      },
      {
        id: 'trip-3',
        trackingCode: 'TRK-G7H8I9',
        status: 'SCHEDULED',
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        passengers: 45,
        bus: { id: 'bus-2', plateNumber: 'CI-9012-CD', model: 'Scania K410', capacity: 45 },
        driver: { id: 'driver-1', name: 'Jean-Baptiste Kouadio', phone: '+225 07 00 00 02' },
        route: { id: 'route-1', name: 'Abidjan - Yamoussoukro', origin: 'Abidjan', destination: 'Yamoussoukro', distance: 250, estimatedTime: 240 },
        scans: [],
        packagesCount: 0
      }
    ],
    qrBatches: [
      { id: 'batch-1', batchCode: 'QR-2024-001', quantity: 100, activatedCount: 27, status: 'ACTIVE', createdAt: new Date().toISOString() },
      { id: 'batch-2', batchCode: 'QR-2024-002', quantity: 100, activatedCount: 0, status: 'PENDING', createdAt: new Date().toISOString() }
    ]
  };
}
