import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Export all database data to JSON
export async function GET(request: NextRequest) {
  try {
    // Fetch all data from database
    const [
      companies,
      users,
      drivers,
      buses,
      routes,
      trips,
      packages,
      qrBatches,
      subscriptions,
      tripScans,
      settings
    ] = await Promise.all([
      // Companies
      db.company.findMany({
        include: {
          Subscription: true
        }
      }),
      // Users
      db.user.findMany(),
      // Drivers
      db.driver.findMany(),
      // Buses
      db.bus.findMany(),
      // Routes
      db.route.findMany(),
      // Trips
      db.trip.findMany({
        include: {
          Route: true,
          Bus: true,
          Driver: true
        }
      }),
      // Packages
      db.package.findMany(),
      // QR Batches
      db.qRBatch.findMany({
        include: {
          Company: true
        }
      }),
      // Subscriptions
      db.subscription.findMany(),
      // Trip Scans
      db.tripScan.findMany(),
      // Settings
      db.settings.findMany()
    ]);

    // Create backup object with metadata
    const backup = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        appName: 'QRBag',
        counts: {
          companies: companies.length,
          users: users.length,
          drivers: drivers.length,
          buses: buses.length,
          routes: routes.length,
          trips: trips.length,
          packages: packages.length,
          qrBatches: qrBatches.length,
          subscriptions: subscriptions.length,
          tripScans: tripScans.length,
          settings: settings.length
        }
      },
      data: {
        companies,
        users,
        drivers,
        buses,
        routes,
        trips,
        packages,
        qrBatches,
        subscriptions,
        tripScans,
        settings
      }
    };

    // Return as downloadable JSON
    const jsonString = JSON.stringify(backup, null, 2);
    
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="qrbag_backup_${new Date().toISOString().slice(0, 10)}.json"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur lors de l\'export des données',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
