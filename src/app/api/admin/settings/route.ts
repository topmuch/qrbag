import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get settings
export async function GET() {
  try {
    const settings = await db.settings.findFirst();
    
    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = await db.settings.create({
        data: {
          stickerPrice: 200,
          busOnlyPrice: 50000,
          colisOnlyPrice: 30000,
          packCompletPrice: 70000
        }
      });
      return NextResponse.json(defaultSettings);
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    );
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { stickerPrice, busOnlyPrice, colisOnlyPrice, packCompletPrice } = body;

    // Get existing settings
    let settings = await db.settings.findFirst();
    
    if (!settings) {
      // Create if doesn't exist
      settings = await db.settings.create({
        data: {
          stickerPrice: stickerPrice || 200,
          busOnlyPrice: busOnlyPrice || 50000,
          colisOnlyPrice: colisOnlyPrice || 30000,
          packCompletPrice: packCompletPrice || 70000
        }
      });
    } else {
      // Update existing
      settings = await db.settings.update({
        where: { id: settings.id },
        data: {
          stickerPrice: stickerPrice !== undefined ? stickerPrice : settings.stickerPrice,
          busOnlyPrice: busOnlyPrice !== undefined ? busOnlyPrice : settings.busOnlyPrice,
          colisOnlyPrice: colisOnlyPrice !== undefined ? colisOnlyPrice : settings.colisOnlyPrice,
          packCompletPrice: packCompletPrice !== undefined ? packCompletPrice : settings.packCompletPrice
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des paramètres' },
      { status: 500 }
    );
  }
}
