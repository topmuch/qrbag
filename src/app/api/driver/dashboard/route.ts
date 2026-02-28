import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Driver Dashboard Data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId') || 'demo-driver-1';

    // Get driver info
    const driver = await db.driver.findUnique({
      where: { id: driverId },
      include: {
        User: true,
        Company: true
      }
    });

    if (!driver) {
      return NextResponse.json(getDemoDriverData());
    }

    // Get active trip
    const activeTrip = await db.trip.findFirst({
      where: {
        driverId,
        status: { in: ['IN_PROGRESS', 'PAUSED', 'SCHEDULED'] }
      },
      include: {
        Bus: true,
        Route: true,
        TripScan: { orderBy: { timestamp: 'asc' } },
        Package: {
          where: { status: { in: ['ACTIVE', 'IN_TRANSIT'] } }
        }
      }
    });

    // Get completed trips (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedTrips = await db.trip.findMany({
      where: {
        driverId,
        status: 'COMPLETED',
        updatedAt: { gte: thirtyDaysAgo }
      },
      include: {
        Route: true,
        Package: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    // Get packages in transit
    const packagesInTransit = await db.package.findMany({
      where: {
        trip: { driverId },
        status: { in: ['ACTIVE', 'IN_TRANSIT'] }
      },
      include: {
        Trip: { include: { Route: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      driver: {
        id: driver.id,
        name: driver.User?.name || 'Chauffeur',
        email: driver.User?.email,
        phone: driver.User?.phone,
        licenseNumber: driver.licenseNumber,
        licenseExpiry: driver.licenseExpiry,
        isActive: driver.isActive
      },
      company: {
        id: driver.Company?.id,
        name: driver.Company?.name,
        phone: driver.Company?.phone
      },
      activeTrip: activeTrip ? formatTrip(activeTrip) : null,
      completedTrips: completedTrips.map(t => formatTrip(t)),
      packagesInTransit: packagesInTransit.map(p => ({
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
        photo: p.photo,
        activatedAt: p.activatedAt,
        trip: p.Trip ? {
          id: p.Trip.id,
          route: p.Trip.Route ? {
            name: p.Trip.Route.name
          } : null
        } : null
      }))
    });
  } catch (error) {
    console.error('Driver dashboard API error:', error);
    return NextResponse.json(getDemoDriverData());
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
    actualArrival: trip.actualArrival,
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

function getDemoDriverData() {
  return {
    driver: {
      id: 'driver-1',
      name: 'Jean-Baptiste Kouadio',
      email: 'driver1@transport-express.ci',
      phone: '+225 07 00 00 02',
      licenseNumber: 'CI-67890-2024',
      licenseExpiry: '2028-06-30',
      isActive: true
    },
    company: {
      id: 'company-1',
      name: 'Transport Express CI',
      phone: '+225 27 00 00 00'
    },
    activeTrip: {
      id: 'trip-1',
      trackingCode: 'TRK-A1B2C3',
      status: 'IN_PROGRESS',
      departureTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      actualDeparture: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      passengers: 42,
      currentLat: 6.8276,
      currentLng: -5.2893,
      bus: {
        id: 'bus-1',
        plateNumber: 'CI-5678-AB',
        model: 'Volvo 9700',
        capacity: 55
      },
      route: {
        id: 'route-1',
        name: 'Abidjan - Yamoussoukro',
        origin: 'Abidjan',
        destination: 'Yamoussoukro',
        distance: 250,
        estimatedTime: 240
      },
      scans: [
        {
          id: 'scan-1',
          type: 'DEPARTURE',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          latitude: 5.3599,
          longitude: -4.0082,
          notes: 'Départ à l\'heure'
        }
      ],
      packagesCount: 2
    },
    completedTrips: [
      {
        id: 'trip-2',
        trackingCode: 'TRK-X1Y2Z3',
        status: 'COMPLETED',
        departureTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        actualDeparture: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        actualArrival: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        passengers: 38,
        bus: { id: 'bus-1', plateNumber: 'CI-5678-AB', model: 'Volvo 9700', capacity: 55 },
        route: { id: 'route-1', name: 'Abidjan - Yamoussoukro', origin: 'Abidjan', destination: 'Yamoussoukro' },
        scans: [],
        packagesCount: 3
      },
      {
        id: 'trip-3',
        trackingCode: 'TRK-M4N5P6',
        status: 'COMPLETED',
        departureTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        actualDeparture: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        actualArrival: new Date(Date.now() - 42 * 60 * 60 * 1000).toISOString(),
        passengers: 45,
        bus: { id: 'bus-2', plateNumber: 'CI-9012-CD', model: 'Scania K410', capacity: 45 },
        route: { id: 'route-2', name: 'Abidjan - Bouaké', origin: 'Abidjan', destination: 'Bouaké' },
        scans: [],
        packagesCount: 5
      }
    ],
    packagesInTransit: [
      {
        id: 'pkg-1',
        qrCode: 'QR-PKG-001-001',
        status: 'IN_TRANSIT',
        senderName: 'Amadou Koné',
        senderPhone: '+225 07 01 01 01',
        recipientName: 'Fatou Diallo',
        recipientPhone: '+225 07 02 02 02',
        recipientWhatsapp: '+225 07 02 02 02',
        pickupCode: '8472',
        description: 'Colis alimentaire',
        weight: 5.5,
        photo: null,
        activatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        trip: { id: 'trip-1', route: { name: 'Abidjan - Yamoussoukro' } }
      },
      {
        id: 'pkg-2',
        qrCode: 'QR-PKG-001-002',
        status: 'IN_TRANSIT',
        senderName: 'Ibrahim Touré',
        senderPhone: '+225 07 03 03 03',
        recipientName: 'Marie Sow',
        recipientPhone: '+225 07 04 04 04',
        recipientWhatsapp: '+225 07 04 04 04',
        pickupCode: '3156',
        description: 'Vêtements',
        weight: 2.0,
        photo: null,
        activatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        trip: { id: 'trip-1', route: { name: 'Abidjan - Yamoussoukro' } }
      }
    ]
  };
}
