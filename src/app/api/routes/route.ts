import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET - List all routes for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || 'demo-company-1';

    const routes = await db.route.findMany({
      where: { companyId },
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
      createdAt: r.createdAt
    })));
  } catch (error) {
    console.error('Get routes error:', error);
    return NextResponse.json(getDemoRoutes());
  }
}

// POST - Create new route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, origin, destination, distance, estimatedTime, companyId } = body;

    if (!name || !origin || !destination || !companyId) {
      return NextResponse.json(
        { error: 'Nom, ville de départ, ville d\'arrivée et compagnie sont requis' },
        { status: 400 }
      );
    }

    const routeId = randomUUID();
    const now = new Date();

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
        updatedAt: now
      }
    });

    return NextResponse.json({
      success: true,
      route: {
        id: route.id,
        name: route.name,
        origin: route.origin,
        destination: route.destination,
        distance: route.distance,
        estimatedTime: route.estimatedTime
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
    const { id, name, origin, destination, distance, estimatedTime } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID route requis' },
        { status: 400 }
      );
    }

    const route = await db.route.update({
      where: { id },
      data: {
        name,
        origin,
        destination,
        distance: distance ? parseFloat(distance) : null,
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      route
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
      createdAt: new Date().toISOString()
    },
    {
      id: 'route-2',
      name: 'Abidjan - Bouaké',
      origin: 'Abidjan',
      destination: 'Bouaké',
      distance: 350,
      estimatedTime: 360,
      createdAt: new Date().toISOString()
    },
    {
      id: 'route-3',
      name: 'Abidjan - Ouagadougou',
      origin: 'Abidjan',
      destination: 'Ouagadougou',
      distance: 850,
      estimatedTime: 1080,
      createdAt: new Date().toISOString()
    }
  ];
}
