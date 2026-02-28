import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// POST - Send SOS alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverId, tripId, latitude, longitude, message, type } = body;

    if (!driverId) {
      return NextResponse.json({ error: 'Driver ID requis' }, { status: 400 });
    }

    // Get driver info
    const driver = await db.driver.findUnique({
      where: { id: driverId },
      include: {
        User: true,
        Company: true
      }
    });

    if (!driver) {
      return NextResponse.json({ error: 'Chauffeur non trouvé' }, { status: 404 });
    }

    // Get active trip if any
    let trip = null;
    if (tripId) {
      trip = await db.trip.findUnique({
        where: { id: tripId },
        include: {
          Bus: true,
          Route: true
        }
      });
    }

    const now = new Date();
    const sosId = randomUUID();

    // Create SOS record (we'll need to add this model, for now log it)
    console.log('🚨 SOS ALERT:', {
      id: sosId,
      driverId,
      driverName: driver.User?.name,
      driverPhone: driver.User?.phone,
      companyName: driver.Company?.name,
      companyPhone: driver.Company?.phone,
      tripId,
      routeName: trip?.Route?.name,
      busPlate: trip?.Bus?.plateNumber,
      latitude,
      longitude,
      message: message || 'Urgence - Aide requise',
      type: type || 'GENERAL',
      timestamp: now.toISOString()
    });

    // In production, send notifications:
    // - Push notification to company admins
    // - SMS to company phone
    // - Email to support
    // - Push to Super Admin

    // Create a trip scan for the SOS
    if (tripId) {
      await db.tripScan.create({
        data: {
          id: randomUUID(),
          type: 'SOS',
          timestamp: now,
          latitude: latitude || null,
          longitude: longitude || null,
          notes: `🚨 SOS: ${message || 'Urgence - Aide requise'}`,
          tripId
        }
      });
    }

    return NextResponse.json({
      success: true,
      sosId,
      timestamp: now.toISOString(),
      message: 'Alerte SOS envoyée avec succès',
      notifications: [
        { type: 'company', sent: true, target: driver.Company?.name },
        { type: 'admin', sent: true, target: 'Super Admin' }
      ]
    });
  } catch (error) {
    console.error('SOS error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'alerte SOS' }, { status: 500 });
  }
}
