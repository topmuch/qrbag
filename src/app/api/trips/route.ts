import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// Helper to generate tracking code
function generateTrackingCode(): string {
  return `TRK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// GET - List all trips or get by status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tripId = searchParams.get('tripId');
    const companyId = searchParams.get('companyId');

    if (tripId) {
      // Get specific trip with all details
      const trip = await db.trip.findUnique({
        where: { id: tripId },
        include: {
          Bus: true,
          Driver: { include: { User: true } },
          Route: true,
          TripScan: { orderBy: { timestamp: 'asc' } },
          Package: {
            where: { status: 'IN_TRANSIT' },
            select: {
              id: true,
              qrCode: true,
              status: true,
              senderName: true,
              recipientName: true,
              pickupCode: true
            }
          }
        }
      });

      if (!trip) {
        return NextResponse.json(
          { error: 'Voyage non trouvé' },
          { status: 404 }
        );
      }

      return NextResponse.json({
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
        scans: trip.TripScan.map(s => ({
          id: s.id,
          type: s.type,
          timestamp: s.timestamp,
          latitude: s.latitude,
          longitude: s.longitude,
          notes: s.notes
        })),
        packagesCount: trip.Package.length,
        packages: trip.Package
      });
    }

    // Build filter
    const where: any = {};
    if (status) where.status = status;
    if (companyId) where.companyId = companyId;

    const trips = await db.trip.findMany({
      where,
      include: {
        Bus: true,
        Driver: { include: { User: true } },
        Route: true,
        TripScan: { orderBy: { timestamp: 'desc' }, take: 1 },
        _count: { select: { Package: { where: { status: 'IN_TRANSIT' } } } }
      },
      orderBy: { departureTime: 'desc' }
    });

    return NextResponse.json(trips.map(trip => ({
      id: trip.id,
      trackingCode: trip.trackingCode,
      status: trip.status,
      departureTime: trip.departureTime,
      actualDeparture: trip.actualDeparture,
      passengers: trip.passengers,
      currentLat: trip.currentLat,
      currentLng: trip.currentLng,
      bus: trip.Bus ? {
        id: trip.Bus.id,
        plateNumber: trip.Bus.plateNumber,
        model: trip.Bus.model
      } : null,
      driver: trip.Driver ? {
        id: trip.Driver.id,
        name: trip.Driver.User?.name || 'N/A'
      } : null,
      route: trip.Route ? {
        id: trip.Route.id,
        name: trip.Route.name
      } : null,
      lastScan: trip.TripScan[0] || null,
      packagesCount: trip._count.Package
    })));
  } catch (error) {
    console.error('Get trips error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des voyages' },
      { status: 500 }
    );
  }
}

// POST - Create new trip
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { busId, driverId, routeId, departureTime, passengers, notes, companyId } = body;

    if (!busId || !driverId || !routeId || !departureTime || !companyId) {
      return NextResponse.json(
        { error: 'Bus, chauffeur, route, date de départ et compagnie sont requis' },
        { status: 400 }
      );
    }

    // Verify bus is available
    const bus = await db.bus.findUnique({
      where: { id: busId },
      include: { Trip: { where: { status: 'IN_PROGRESS' } } }
    });

    if (!bus) {
      return NextResponse.json(
        { error: 'Bus non trouvé' },
        { status: 404 }
      );
    }

    if (bus.Trip.length > 0) {
      return NextResponse.json(
        { error: 'Ce bus est déjà en voyage' },
        { status: 400 }
      );
    }

    // Verify driver
    const driver = await db.driver.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Chauffeur non trouvé' },
        { status: 404 }
      );
    }

    // Verify route
    const route = await db.route.findUnique({
      where: { id: routeId }
    });

    if (!route) {
      return NextResponse.json(
        { error: 'Route non trouvée' },
        { status: 404 }
      );
    }

    // Create trip
    const tripId = randomUUID();
    const trackingCode = generateTrackingCode();
    const now = new Date();

    const trip = await db.trip.create({
      data: {
        id: tripId,
        trackingCode,
        status: 'SCHEDULED',
        departureTime: new Date(departureTime),
        passengers: passengers || 0,
        notes,
        busId,
        driverId,
        routeId,
        companyId,
        updatedAt: now
      },
      include: {
        Bus: true,
        Driver: { include: { User: true } },
        Route: true
      }
    });

    return NextResponse.json({
      id: trip.id,
      trackingCode: trip.trackingCode,
      status: trip.status,
      departureTime: trip.departureTime,
      passengers: trip.passengers,
      bus: trip.Bus ? {
        id: trip.Bus.id,
        plateNumber: trip.Bus.plateNumber,
        model: trip.Bus.model
      } : null,
      driver: trip.Driver ? {
        id: trip.Driver.id,
        name: trip.Driver.User?.name || 'N/A'
      } : null,
      route: trip.Route ? {
        id: trip.Route.id,
        name: trip.Route.name
      } : null
    }, { status: 201 });
  } catch (error) {
    console.error('Create trip error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du voyage' },
      { status: 500 }
    );
  }
}
