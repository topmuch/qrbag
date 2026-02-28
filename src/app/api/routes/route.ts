import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET - List all routes for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let companyId = searchParams.get('companyId');

    // If no company ID or demo ID, get the first company
    if (!companyId || companyId === 'demo-company-1') {
      const firstCompany = await db.company.findFirst({
        orderBy: { createdAt: 'asc' }
      });
      if (firstCompany) {
        companyId = firstCompany.id;
      }
    }

    if (!companyId) {
      return NextResponse.json(getDemoRoutes());
    }

    const routes = await db.route.findMany({
      where: { companyId },
      include: {
        Checkpoints: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { Trip: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // If no routes found, return demo data
    if (routes.length === 0) {
      return NextResponse.json(getDemoRoutes());
    }

    return NextResponse.json(routes.map(r => ({
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
      },
      createdAt: r.createdAt
    })));
  } catch (error) {
    console.error('Get routes error:', error);
    return NextResponse.json(getDemoRoutes());
  }
}

// POST - Create new route with checkpoints
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, origin, destination, distance, estimatedTime, companyId, checkpoints } = body;

    if (!name || !origin || !destination || !companyId) {
      return NextResponse.json(
        { error: 'Nom, ville de départ, ville d\'arrivée et compagnie sont requis' },
        { status: 400 }
      );
    }

    const routeId = randomUUID();
    const now = new Date();

    // Create route with checkpoints in a transaction
    const route = await db.route.create({
      data: {
        id: routeId,
        name,
        origin,
        destination,
        distance: distance ? parseFloat(distance) : null,
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : null,
        companyId,
        createdAt: new Date(),
        updatedAt: now,
        // Create checkpoints if provided
        Checkpoints: checkpoints && checkpoints.length > 0 ? {
          create: checkpoints.map((cp: any, index: number) => ({
            id: randomUUID(),
            name: cp.name,
            type: cp.type,
            order: index + 1,
            recommendedDuration: cp.recommendedDuration || null,
            latitude: cp.latitude || null,
            longitude: cp.longitude || null,
            notes: cp.notes || null,
            updatedAt: now
          }))
        } : undefined
      },
      include: {
        Checkpoints: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      id: route.id,
      route: {
        id: route.id,
        name: route.name,
        origin: route.origin,
        destination: route.destination,
        distance: route.distance,
        estimatedTime: route.estimatedTime,
        checkpoints: route.Checkpoints
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create route error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la route' },
      { status: 500 }
    );
  }
}

// PUT - Update route
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, origin, destination, distance, estimatedTime, checkpoints } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID route requis' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update route basic info
    const route = await db.route.update({
      where: { id },
      data: {
        name,
        origin,
        destination,
        distance: distance ? parseFloat(distance) : null,
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : null,
        updatedAt: now
      }
    });

    // Update checkpoints if provided
    if (checkpoints && Array.isArray(checkpoints)) {
      // Delete existing checkpoints
      await db.routeCheckpoint.deleteMany({
        where: { routeId: id }
      });

      // Create new checkpoints
      for (let i = 0; i < checkpoints.length; i++) {
        const cp = checkpoints[i];
        await db.routeCheckpoint.create({
          data: {
            id: randomUUID(),
            name: cp.name,
            type: cp.type,
            order: i + 1,
            recommendedDuration: cp.recommendedDuration || null,
            latitude: cp.latitude || null,
            longitude: cp.longitude || null,
            notes: cp.notes || null,
            routeId: id,
            updatedAt: now
          }
        });
      }
    }

    // Fetch updated route with checkpoints
    const updatedRoute = await db.route.findUnique({
      where: { id },
      include: {
        Checkpoints: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      route: updatedRoute
    });
  } catch (error) {
    console.error('Update route error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la route' },
      { status: 500 }
    );
  }
}

// DELETE - Delete route
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('id');

    if (!routeId) {
      return NextResponse.json(
        { error: 'ID route requis' },
        { status: 400 }
      );
    }

    // Check if route is used in trips
    const trips = await db.trip.findFirst({
      where: { routeId }
    });

    if (trips) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une route utilisée dans des voyages' },
        { status: 400 }
      );
    }

    // Delete checkpoints first
    await db.routeCheckpoint.deleteMany({
      where: { routeId }
    });

    // Delete route
    await db.route.delete({ where: { id: routeId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete route error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la route' },
      { status: 500 }
    );
  }
}

function getDemoRoutes() {
  return [
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
      _count: { trips: 12 },
      createdAt: new Date().toISOString()
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
      _count: { trips: 8 },
      createdAt: new Date().toISOString()
    },
    {
      id: 'route-3',
      name: 'Abidjan - Ouagadougou',
      origin: 'Abidjan',
      destination: 'Ouagadougou',
      distance: 850,
      estimatedTime: 1080,
      checkpoints: [
        { id: 'cp-8', name: 'Gare routière Abidjan', type: 'DEPART', order: 1, recommendedDuration: null, latitude: 5.3599, longitude: -4.0083, notes: null },
        { id: 'cp-9', name: 'Pause Bouaké', type: 'PAUSE', order: 2, recommendedDuration: 45, latitude: null, longitude: null, notes: 'REPAS' },
        { id: 'cp-10', name: 'Frontière Côte d\'Ivoire/Ghana', type: 'PAUSE', order: 3, recommendedDuration: 30, latitude: null, longitude: null, notes: 'CONTROLE' },
        { id: 'cp-11', name: 'Station Ouagadougou', type: 'ARRIVAL', order: 4, recommendedDuration: null, latitude: 12.3686, longitude: -1.5275, notes: null }
      ],
      _count: { trips: 3 },
      createdAt: new Date().toISOString()
    }
  ];
}
