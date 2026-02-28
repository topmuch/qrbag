import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface Alert {
  type: 'PAUSE_TOO_SHORT' | 'PAUSE_TOO_LONG' | 'PAUSE_EXTENDED' | 'DELAY' | 'NO_CHECKPOINT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  tripId: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface TripWithAlerts {
  id: string;
  trackingCode: string;
  status: string;
  departureTime: Date;
  actualDeparture: Date | null;
  arrivalTime: Date | null;
  actualArrival: Date | null;
  passengers: number;
  currentLat: number | null;
  currentLng: number | null;
  notes: string | null;
  company: {
    id: string;
    name: string;
    city: string | null;
  };
  bus: {
    id: string;
    plateNumber: string;
    model: string | null;
    capacity: number | null;
  };
  driver: {
    id: string;
    name: string;
    phone: string | null;
  };
  route: {
    id: string;
    name: string;
    origin: string;
    destination: string;
    distance: number | null;
    estimatedTime: number | null;
  };
  scans: Array<{
    id: string;
    type: string;
    timestamp: Date;
    latitude: number | null;
    longitude: number | null;
    notes: string | null;
  }>;
  lastScan: {
    type: string;
    timestamp: Date;
  } | null;
  packagesCount: number;
  pauseDuration: number;
  alerts: Alert[];
  checkpoints: {
    departure: { completed: boolean; timestamp: Date | null };
    pause: { completed: boolean; timestamp: Date | null };
    resume: { completed: boolean; timestamp: Date | null };
    arrival: { completed: boolean; timestamp: Date | null };
  };
}

// GET - Get all trips in progress with alerts and monitoring data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    // Build filter
    const where: any = {};
    
    // Filter by active trips (in progress or paused)
    if (status && status !== 'all') {
      where.status = status;
    } else {
      where.status = { in: ['SCHEDULED', 'IN_PROGRESS', 'PAUSED'] };
    }
    
    if (companyId) {
      where.companyId = companyId;
    }

    // Date filter
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date === 'today') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        where.departureTime = { gte: today, lt: tomorrow };
      } else if (date === 'week') {
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        where.departureTime = { gte: today, lt: nextWeek };
      }
    }

    const trips = await db.trip.findMany({
      where,
      include: {
        Company: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        Bus: {
          select: {
            id: true,
            plateNumber: true,
            model: true,
            capacity: true,
          },
        },
        Driver: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        Route: {
          select: {
            id: true,
            name: true,
            origin: true,
            destination: true,
            distance: true,
            estimatedTime: true,
          },
        },
        TripScan: {
          orderBy: {
            timestamp: 'asc',
          },
        },
        Package: {
          where: {
            status: { in: ['IN_TRANSIT', 'ACTIVE'] },
          },
          select: {
            id: true,
            qrCode: true,
            status: true,
            senderName: true,
            recipientName: true,
            recipientPhone: true,
          },
        },
      },
      orderBy: {
        departureTime: 'desc',
      },
    });

    // Calculate alerts and pause durations
    const now = new Date();
    const tripsWithAlerts: TripWithAlerts[] = trips.map((trip) => {
      const scans = trip.TripScan;
      const lastScan = scans.length > 0 ? scans[scans.length - 1] : null;
      
      // Find checkpoints
      const departureScan = scans.find(s => s.type === 'DEPARTURE');
      const pauseScan = scans.find(s => s.type === 'PAUSE');
      const resumeScan = scans.find(s => s.type === 'RESUME');
      const arrivalScan = scans.find(s => s.type === 'ARRIVAL');
      
      // Calculate pause duration if currently paused
      let pauseDuration = 0;
      const alerts: Alert[] = [];
      
      if (trip.status === 'PAUSED' && pauseScan && !resumeScan) {
        // Currently in pause
        pauseDuration = Math.floor(
          (now.getTime() - new Date(pauseScan.timestamp).getTime()) / 60000
        );
        
        // Alert for extended pause (> 20 min)
        if (pauseDuration > 20 && pauseDuration <= 120) {
          alerts.push({
            type: 'PAUSE_EXTENDED',
            severity: 'LOW',
            message: `Pause de ${pauseDuration} min (> 20 min recommandées)`,
            tripId: trip.id,
            timestamp: now,
            acknowledged: false,
          });
        }
        
        // Alert for too long pause (> 2 hours)
        if (pauseDuration > 120) {
          alerts.push({
            type: 'PAUSE_TOO_LONG',
            severity: 'HIGH',
            message: `Pause de ${pauseDuration} min (> 2h) - Intervention requise`,
            tripId: trip.id,
            timestamp: now,
            acknowledged: false,
          });
        }
      }
      
      // Check for completed pauses that were too short
      if (pauseScan && resumeScan) {
        const completedPauseDuration = Math.floor(
          (new Date(resumeScan.timestamp).getTime() - new Date(pauseScan.timestamp).getTime()) / 60000
        );
        
        if (completedPauseDuration < 15) {
          alerts.push({
            type: 'PAUSE_TOO_SHORT',
            severity: 'MEDIUM',
            message: `Pause de seulement ${completedPauseDuration} min (< 15 min recommandées)`,
            tripId: trip.id,
            timestamp: new Date(resumeScan.timestamp),
            acknowledged: false,
          });
        }
      }
      
      // Check for delay
      if (trip.arrivalTime && !trip.actualArrival && now > new Date(trip.arrivalTime)) {
        const delayMinutes = Math.floor(
          (now.getTime() - new Date(trip.arrivalTime).getTime()) / 60000
        );
        
        if (delayMinutes > 30) {
          alerts.push({
            type: 'DELAY',
            severity: delayMinutes > 60 ? 'HIGH' : 'MEDIUM',
            message: `Retard de ${delayMinutes} min sur l'heure d'arrivée prévue`,
            tripId: trip.id,
            timestamp: now,
            acknowledged: false,
          });
        }
      }
      
      // Check for trip in progress without departure checkpoint
      if (trip.status === 'IN_PROGRESS' && !departureScan) {
        alerts.push({
          type: 'NO_CHECKPOINT',
          severity: 'MEDIUM',
          message: 'Voyage en cours sans checkpoint de départ enregistré',
          tripId: trip.id,
          timestamp: now,
          acknowledged: false,
        });
      }

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
        company: {
          id: trip.Company.id,
          name: trip.Company.name,
          city: trip.Company.city,
        },
        bus: {
          id: trip.Bus.id,
          plateNumber: trip.Bus.plateNumber,
          model: trip.Bus.model,
          capacity: trip.Bus.capacity,
        },
        driver: {
          id: trip.Driver.id,
          name: trip.Driver.User?.name || 'N/A',
          phone: trip.Driver.User?.phone || null,
        },
        route: {
          id: trip.Route.id,
          name: trip.Route.name,
          origin: trip.Route.origin,
          destination: trip.Route.destination,
          distance: trip.Route.distance,
          estimatedTime: trip.Route.estimatedTime,
        },
        scans: scans.map(s => ({
          id: s.id,
          type: s.type,
          timestamp: s.timestamp,
          latitude: s.latitude,
          longitude: s.longitude,
          notes: s.notes,
        })),
        lastScan: lastScan ? {
          type: lastScan.type,
          timestamp: lastScan.timestamp,
        } : null,
        packagesCount: trip.Package.length,
        packages: trip.Package,
        pauseDuration,
        alerts,
        checkpoints: {
          departure: { 
            completed: !!departureScan, 
            timestamp: departureScan?.timestamp || null 
          },
          pause: { 
            completed: !!pauseScan, 
            timestamp: pauseScan?.timestamp || null 
          },
          resume: { 
            completed: !!resumeScan, 
            timestamp: resumeScan?.timestamp || null 
          },
          arrival: { 
            completed: !!arrivalScan, 
            timestamp: arrivalScan?.timestamp || null 
          },
        },
      };
    });

    // Calculate summary stats
    const summary = {
      total: tripsWithAlerts.length,
      inProgress: tripsWithAlerts.filter(t => t.status === 'IN_PROGRESS').length,
      paused: tripsWithAlerts.filter(t => t.status === 'PAUSED').length,
      scheduled: tripsWithAlerts.filter(t => t.status === 'SCHEDULED').length,
      totalAlerts: tripsWithAlerts.reduce((sum, t) => sum + t.alerts.length, 0),
      highPriorityAlerts: tripsWithAlerts.reduce(
        (sum, t) => sum + t.alerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL').length, 
        0
      ),
    };

    return NextResponse.json({
      trips: tripsWithAlerts,
      summary,
    });
  } catch (error) {
    console.error('Get trips monitoring error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des voyages' },
      { status: 500 }
    );
  }
}
