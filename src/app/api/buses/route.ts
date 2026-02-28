import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET - List all buses for a company
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
      return NextResponse.json(getDemoBuses());
    }

    const buses = await db.bus.findMany({
      where: { companyId },
      include: {
        Trip: {
          where: { status: 'IN_PROGRESS' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // If no buses found, return demo data
    if (buses.length === 0) {
      return NextResponse.json(getDemoBuses());
    }

    return NextResponse.json(buses.map(b => ({
      id: b.id,
      plateNumber: b.plateNumber,
      model: b.model,
      capacity: b.capacity,
      color: b.color,
      year: b.year,
      isActive: b.isActive,
      inTrip: b.Trip.length > 0,
      createdAt: b.createdAt
    })));
  } catch (error) {
    console.error('Get buses error:', error);
    return NextResponse.json(getDemoBuses());
  }
}

// POST - Create new bus
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plateNumber, model, capacity, color, year, companyId } = body;

    if (!plateNumber || !companyId) {
      return NextResponse.json(
        { error: 'Numéro d\'immatriculation et compagnie sont requis' },
        { status: 400 }
      );
    }

    // Check if plate number already exists
    const existingBus = await db.bus.findUnique({
      where: { plateNumber }
    });

    if (existingBus) {
      return NextResponse.json(
        { error: 'Un bus avec cette immatriculation existe déjà' },
        { status: 400 }
      );
    }

    const busId = randomUUID();
    const now = new Date();

    const bus = await db.bus.create({
      data: {
        id: busId,
        plateNumber,
        model: model || null,
        capacity: capacity ? parseInt(capacity) : null,
        color: color || null,
        year: year ? parseInt(year) : null,
        companyId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: now
      }
    });

    return NextResponse.json({
      success: true,
      bus: {
        id: bus.id,
        plateNumber: bus.plateNumber,
        model: bus.model,
        capacity: bus.capacity,
        color: bus.color,
        year: bus.year,
        isActive: bus.isActive,
        inTrip: false
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create bus error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du bus' },
      { status: 500 }
    );
  }
}

// PUT - Update bus
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, plateNumber, model, capacity, color, year, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID bus requis' },
        { status: 400 }
      );
    }

    const bus = await db.bus.update({
      where: { id },
      data: {
        plateNumber,
        model: model || null,
        capacity: capacity ? parseInt(capacity) : null,
        color: color || null,
        year: year ? parseInt(year) : null,
        isActive: isActive !== undefined ? isActive : undefined,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      bus
    });
  } catch (error) {
    console.error('Update bus error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du bus' },
      { status: 500 }
    );
  }
}

// DELETE - Delete bus
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busId = searchParams.get('id');

    if (!busId) {
      return NextResponse.json(
        { error: 'ID bus requis' },
        { status: 400 }
      );
    }

    // Check if bus is in a trip
    const activeTrips = await db.trip.findFirst({
      where: { busId, status: 'IN_PROGRESS' }
    });

    if (activeTrips) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un bus en voyage' },
        { status: 400 }
      );
    }

    await db.bus.delete({ where: { id: busId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete bus error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du bus' },
      { status: 500 }
    );
  }
}

function getDemoBuses() {
  return [
    {
      id: 'bus-1',
      plateNumber: 'CI-5678-AB',
      model: 'Volvo 9700',
      capacity: 55,
      color: 'Orange',
      year: 2021,
      isActive: true,
      inTrip: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'bus-2',
      plateNumber: 'CI-9012-CD',
      model: 'Scania K410',
      capacity: 45,
      color: 'Bleu',
      year: 2020,
      isActive: true,
      inTrip: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'bus-3',
      plateNumber: 'CI-3456-EF',
      model: 'Mercedes 0400',
      capacity: 50,
      color: 'Vert',
      year: 2019,
      isActive: true,
      inTrip: false,
      createdAt: new Date().toISOString()
    }
  ];
}
