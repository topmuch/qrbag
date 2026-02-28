import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get specific trip details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id;

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
      // Return demo data for development
      return NextResponse.json(getDemoTripData());
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
  } catch (error) {
    console.error('Get trip details error:', error);
    return NextResponse.json(getDemoTripData());
  }
}

// POST - Cancel trip
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id;
    const body = await request.json();
    const { reason } = body;

    const trip = await db.trip.findUnique({
      where: { id: tripId }
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Voyage non trouvé' },
        { status: 404 }
      );
    }

    if (trip.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Impossible d\'annuler un voyage terminé' },
        { status: 400 }
      );
    }

    // Update trip status
    const updatedTrip = await db.trip.update({
      where: { id: tripId },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${trip.notes || ''}\nAnnulation: ${reason}` : trip.notes,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      trip: updatedTrip
    });
  } catch (error) {
    console.error('Cancel trip error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation du voyage' },
      { status: 500 }
    );
  }
}

function getDemoTripData() {
  return {
    id: 'trip-demo',
    trackingCode: 'TRK-A1B2C3',
    status: 'IN_PROGRESS',
    departureTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    actualDeparture: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    arrivalTime: null,
    actualArrival: null,
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
    packagesCount: 2,
    packages: [
      { id: 'pkg-1', qrCode: 'QR-PKG-001-001', status: 'IN_TRANSIT', senderName: 'Client 1', recipientName: 'Destinataire 1', pickupCode: '1234' },
      { id: 'pkg-2', qrCode: 'QR-PKG-001-002', status: 'IN_TRANSIT', senderName: 'Client 2', recipientName: 'Destinataire 2', pickupCode: '5678' }
    ]
  };
}
