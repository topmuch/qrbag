import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET - Get checkpoints for a route
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');

    if (!routeId) {
      return NextResponse.json(
        { error: 'Route ID requis' },
        { status: 400 }
      );
    }

    const checkpoints = await db.routeCheckpoint.findMany({
      where: { routeId },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(checkpoints);
  } catch (error) {
    console.error('Get checkpoints error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des checkpoints' },
      { status: 500 }
    );
  }
}

// POST - Create a new checkpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { routeId, name, type, order, recommendedDuration, latitude, longitude, notes } = body;

    if (!routeId || !name || !type) {
      return NextResponse.json(
        { error: 'Route ID, nom et type sont requis' },
        { status: 400 }
      );
    }

    // Verify route exists
    const route = await db.route.findUnique({
      where: { id: routeId }
    });

    if (!route) {
      return NextResponse.json(
        { error: 'Route non trouvée' },
        { status: 404 }
      );
    }

    const checkpoint = await db.routeCheckpoint.create({
      data: {
        id: randomUUID(),
        name,
        type,
        order: order || 1,
        recommendedDuration: recommendedDuration || null,
        latitude: latitude || null,
        longitude: longitude || null,
        notes: notes || null,
        routeId,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(checkpoint, { status: 201 });
  } catch (error) {
    console.error('Create checkpoint error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du checkpoint' },
      { status: 500 }
    );
  }
}

// PUT - Update checkpoint order
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkpoints } = body;

    if (!Array.isArray(checkpoints)) {
      return NextResponse.json(
        { error: 'Liste de checkpoints invalide' },
        { status: 400 }
      );
    }

    // Update each checkpoint order
    for (const cp of checkpoints) {
      await db.routeCheckpoint.update({
        where: { id: cp.id },
        data: { order: cp.order, updatedAt: new Date() }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update checkpoints order error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des checkpoints' },
      { status: 500 }
    );
  }
}
