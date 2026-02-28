import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET - Get active trip or trip details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const tripId = searchParams.get('tripId');
    const status = searchParams.get('status');

    if (tripId) {
      // Get specific trip
      const trip = await db.trip.findUnique({
        where: { id: tripId },
        include: {
          Bus: true,
          Driver: { include: { User: true } },
          Route: true,
          TripScan: { orderBy: { timestamp: 'asc' } },
          Package: {
            where: { status: { in: ['ACTIVE', 'IN_TRANSIT', 'DELIVERED'] } }
          }
        }
      });

      if (!trip) {
        return NextResponse.json({ error: 'Voyage non trouvé' }, { status: 404 });
      }

      return NextResponse.json(trip);
    }

    // Get trips by driver and status
    const where: any = {};
    if (driverId) where.driverId = driverId;
    if (status) where.status = status;

    const trips = await db.trip.findMany({
      where,
      include: {
        Bus: true,
        Route: true,
        Driver: { include: { User: true } },
        TripScan: { orderBy: { timestamp: 'asc' } }
      },
      orderBy: { departureTime: 'desc' },
      take: 20
    });

    return NextResponse.json(trips);
  } catch (error) {
    console.error('Get trips error:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des voyages' }, { status: 500 });
  }
}

// POST - Create new trip or scan checkpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'start') {
      return await startTrip(data);
    } else if (action === 'scan') {
      return await scanCheckpoint(data);
    } else if (action === 'complete') {
      return await completeTrip(data);
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Trip action error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'action' }, { status: 500 });
  }
}

async function startTrip(data: any) {
  const { routeId, busId, driverId, companyId, departureTime, passengers } = data;

  if (!routeId || !busId || !driverId || !companyId) {
    return NextResponse.json({ error: 'Route, bus et chauffeur sont requis' }, { status: 400 });
  }

  // Check if driver already has an active trip
  const activeTrip = await db.trip.findFirst({
    where: { driverId, status: { in: ['IN_PROGRESS', 'PAUSED', 'SCHEDULED'] } }
  });

  if (activeTrip) {
    return NextResponse.json({ error: 'Vous avez déjà un voyage en cours' }, { status: 400 });
  }

  const tripId = randomUUID();
  const trackingCode = `TRK-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date();

  // Create trip with departure scan
  const trip = await db.trip.create({
    data: {
      id: tripId,
      trackingCode,
      status: 'IN_PROGRESS',
      departureTime: departureTime ? new Date(departureTime) : now,
      actualDeparture: now,
      passengers: passengers || 0,
      busId,
      driverId,
      routeId,
      companyId,
      updatedAt: now
    }
  });

  // Create departure scan
  const scanId = randomUUID();
  const departureScan = await db.tripScan.create({
    data: {
      id: scanId,
      type: 'DEPARTURE',
      timestamp: now,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      notes: data.notes || 'Début du voyage',
      tripId
    }
  });

  return NextResponse.json({
    success: true,
    trip: {
      id: trip.id,
      trackingCode: trip.trackingCode,
      status: trip.status,
      departureTime: trip.departureTime,
      actualDeparture: trip.actualDeparture,
      passengers: trip.passengers
    },
    scan: {
      id: departureScan.id,
      type: departureScan.type,
      timestamp: departureScan.timestamp,
      latitude: departureScan.latitude,
      longitude: departureScan.longitude
    }
  }, { status: 201 });
}

async function scanCheckpoint(data: any) {
  const { tripId, type, latitude, longitude, notes, stationName, pauseType, passengers } = data;

  if (!tripId || !type) {
    return NextResponse.json({ error: 'Trip ID et type de scan sont requis' }, { status: 400 });
  }

  // Get current trip
  const trip = await db.trip.findUnique({ where: { id: tripId } });
  if (!trip) {
    return NextResponse.json({ error: 'Voyage non trouvé' }, { status: 404 });
  }

  const scanId = randomUUID();
  const now = new Date();
  let newStatus = trip.status;

  // Update trip status based on scan type
  if (type === 'PAUSE') {
    newStatus = 'PAUSED';
  } else if (type === 'RESUME') {
    newStatus = 'IN_PROGRESS';
  } else if (type === 'ARRIVAL') {
    newStatus = 'COMPLETED';
  }

  // Create scan
  const scan = await db.tripScan.create({
    data: {
      id: scanId,
      type,
      timestamp: now,
      latitude: latitude || null,
      longitude: longitude || null,
      notes: notes || stationName || null,
      tripId
    }
  });

  // Update trip
  const updateData: any = {
    status: newStatus,
    currentLat: latitude || trip.currentLat,
    currentLng: longitude || trip.currentLng,
    updatedAt: now
  };

  if (type === 'ARRIVAL') {
    updateData.actualArrival = now;
  }

  const updatedTrip = await db.trip.update({
    where: { id: tripId },
    data: updateData
  });

  // If arrival, update all packages to notify
  if (type === 'ARRIVAL') {
    await db.package.updateMany({
      where: { tripId, status: 'IN_TRANSIT' },
      data: { status: 'ACTIVE' } // Ready for pickup
    });
  }

  return NextResponse.json({
    success: true,
    scan: {
      id: scan.id,
      type: scan.type,
      timestamp: scan.timestamp,
      latitude: scan.latitude,
      longitude: scan.longitude,
      notes: scan.notes
    },
    trip: {
      id: updatedTrip.id,
      status: updatedTrip.status,
      currentLat: updatedTrip.currentLat,
      currentLng: updatedTrip.currentLng
    }
  });
}

async function completeTrip(data: any) {
  const { tripId, actualArrival, notes, passengersDescended } = data;

  if (!tripId) {
    return NextResponse.json({ error: 'Trip ID requis' }, { status: 400 });
  }

  const now = new Date();

  const trip = await db.trip.update({
    where: { id: tripId },
    data: {
      status: 'COMPLETED',
      actualArrival: actualArrival ? new Date(actualArrival) : now,
      notes,
      updatedAt: now
    }
  });

  return NextResponse.json({
    success: true,
    trip
  });
}
