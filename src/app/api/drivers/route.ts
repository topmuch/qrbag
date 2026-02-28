import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

// GET - List all drivers for a company
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
      return NextResponse.json(getDemoDrivers());
    }

    const drivers = await db.driver.findMany({
      where: { companyId },
      include: {
        User: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // If no drivers found, return demo data
    if (drivers.length === 0) {
      return NextResponse.json(getDemoDrivers());
    }

    return NextResponse.json(drivers.map(d => ({
      id: d.id,
      name: d.User?.name || 'N/A',
      email: d.User?.email,
      phone: d.User?.phone,
      licenseNumber: d.licenseNumber,
      licenseExpiry: d.licenseExpiry,
      isActive: d.isActive,
      createdAt: d.createdAt
    })));
  } catch (error) {
    console.error('Get drivers error:', error);
    return NextResponse.json(getDemoDrivers());
  }
}

// POST - Create new driver
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, licenseNumber, licenseExpiry, password, companyId } = body;

    if (!name || !email || !phone || !licenseNumber || !licenseExpiry || !password || !companyId) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    // Create user and driver in transaction
    const userId = randomUUID();
    const driverId = randomUUID();

    const user = await db.user.create({
      data: {
        id: userId,
        email,
        name,
        phone,
        password: hashedPassword,
        role: 'DRIVER',
        companyId,
        isActive: true,
        updatedAt: now
      }
    });

    const driver = await db.driver.create({
      data: {
        id: driverId,
        userId,
        licenseNumber,
        licenseExpiry: new Date(licenseExpiry),
        companyId,
        isActive: true,
        updatedAt: now
      },
      include: {
        User: true
      }
    });

    return NextResponse.json({
      success: true,
      driver: {
        id: driver.id,
        name: driver.User?.name,
        email: driver.User?.email,
        phone: driver.User?.phone,
        licenseNumber: driver.licenseNumber,
        licenseExpiry: driver.licenseExpiry,
        isActive: driver.isActive
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create driver error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du chauffeur' },
      { status: 500 }
    );
  }
}

// DELETE - Delete driver
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('id');

    if (!driverId) {
      return NextResponse.json(
        { error: 'ID chauffeur requis' },
        { status: 400 }
      );
    }

    // Get driver to find user
    const driver = await db.driver.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Chauffeur non trouvé' },
        { status: 404 }
      );
    }

    // Delete driver and user
    await db.driver.delete({ where: { id: driverId } });
    await db.user.delete({ where: { id: driver.userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete driver error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du chauffeur' },
      { status: 500 }
    );
  }
}

function getDemoDrivers() {
  return [
    {
      id: 'driver-1',
      name: 'Jean-Baptiste Kouadio',
      email: 'driver1@transport-express.ci',
      phone: '+225 07 00 00 02',
      licenseNumber: 'CI-67890-2024',
      licenseExpiry: '2028-06-30',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'driver-2',
      name: 'Mamadou Diallo',
      email: 'driver2@transport-express.ci',
      phone: '+225 07 00 00 03',
      licenseNumber: 'CI-11111-2024',
      licenseExpiry: '2027-03-15',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];
}
