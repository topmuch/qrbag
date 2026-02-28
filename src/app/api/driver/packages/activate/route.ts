import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// POST - Activate package with photo upload
export async function POST(request: NextRequest) {
  console.log('[ACTIVATE] ===== START ACTIVATION =====');
  
  try {
    const formData = await request.formData();
    
    const qrCode = formData.get('qrCode') as string;
    const tripId = formData.get('tripId') as string | null;
    const senderName = formData.get('senderName') as string;
    const senderPhone = formData.get('senderPhone') as string;
    const recipientName = formData.get('recipientName') as string;
    const recipientPhone = formData.get('recipientPhone') as string;
    const recipientWhatsapp = formData.get('recipientWhatsapp') as string | null;
    const description = formData.get('description') as string | null;
    const weight = formData.get('weight') as string | null;
    const price = formData.get('price') as string | null;
    const photoFile = formData.get('photo') as File | null;

    console.log('[ACTIVATE] Data received:', { 
      qrCode, 
      senderName, 
      senderPhone, 
      recipientName, 
      recipientPhone,
      hasPhoto: photoFile ? `${photoFile.name} (${photoFile.size} bytes)` : 'NO PHOTO'
    });

    // Validation
    if (!qrCode) {
      console.log('[ACTIVATE] ERROR: No QR code');
      return NextResponse.json({ success: false, error: 'QR code requis' }, { status: 400 });
    }

    if (!senderName || !senderPhone || !recipientName || !recipientPhone) {
      console.log('[ACTIVATE] ERROR: Missing required fields');
      return NextResponse.json({ success: false, error: 'Expéditeur et destinataire sont requis' }, { status: 400 });
    }

    if (!photoFile || photoFile.size === 0) {
      console.log('[ACTIVATE] ERROR: No photo');
      return NextResponse.json({ success: false, error: 'Photo du colis obligatoire' }, { status: 400 });
    }

    // Find existing package
    console.log('[ACTIVATE] Looking for existing package...');
    const existingPackage = await db.package.findFirst({
      where: { qrCode }
    });

    console.log('[ACTIVATE] Existing package:', existingPackage?.id, 'Status:', existingPackage?.status);

    // Check if already activated
    if (existingPackage && existingPackage.status !== 'NON_ACTIVE') {
      console.log('[ACTIVATE] ERROR: Package already activated');
      return NextResponse.json({ success: false, error: 'Ce QR code a déjà été activé' }, { status: 400 });
    }

    // Generate pickup code (4 digits)
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date();
    const validUntil = new Date(now.getTime() + (10 * 24 * 60 * 60 * 1000));

    // Handle photo upload
    let photoUrl = '';
    try {
      console.log('[ACTIVATE] Processing photo...');
      const bytes = await photoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'packages');
      await mkdir(uploadsDir, { recursive: true });
      const fileExtension = photoFile.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      await writeFile(path.join(uploadsDir, fileName), buffer);
      photoUrl = `/uploads/packages/${fileName}`;
      console.log('[ACTIVATE] Photo saved:', photoUrl);
    } catch (uploadError) {
      console.error('[ACTIVATE] Photo upload error:', uploadError);
    }

    const status = tripId ? 'IN_TRANSIT' : 'ACTIVE';
    const packageId = existingPackage?.id || randomUUID();

    console.log('[ACTIVATE] Saving package to database...');
    
    // Prepare update data
    const packageData = {
      status,
      senderName,
      senderPhone,
      recipientName,
      recipientPhone,
      recipientWhatsapp: recipientWhatsapp || recipientPhone,
      pickupCode,
      description: description || null,
      weight: weight ? parseFloat(weight) : null,
      price: price ? parseFloat(price) : 200,
      photo: photoUrl,
      activatedAt: now,
      validUntil,
      updatedAt: now
    };

    let savedPackage;

    if (existingPackage) {
      // Update existing
      savedPackage = await db.package.update({
        where: { id: existingPackage.id },
        data: packageData
      });
    } else {
      // Create new
      savedPackage = await db.package.create({
        data: {
          id: packageId,
          qrCode,
          ...packageData,
          tripId: tripId || null,
          companyId: null,
          batchId: null,
        }
      });
    }

    console.log('[ACTIVATE] Package saved successfully:', savedPackage.id);

    return NextResponse.json({
      success: true,
      package: {
        id: savedPackage.id,
        qrCode: savedPackage.qrCode,
        status: savedPackage.status,
        senderName: savedPackage.senderName,
        senderPhone: savedPackage.senderPhone,
        recipientName: savedPackage.recipientName,
        recipientPhone: savedPackage.recipientPhone,
        pickupCode: savedPackage.pickupCode,
        photo: savedPackage.photo,
        activatedAt: savedPackage.activatedAt?.toISOString(),
        validUntil: savedPackage.validUntil?.toISOString()
      },
      pickupCode,
      message: 'Colis activé avec succès. Validité: 10 jours'
    }, { status: 201 });

  } catch (error: any) {
    console.error('[ACTIVATE] UNHANDLED ERROR:', error);
    console.error('[ACTIVATE] Error stack:', error.stack);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur lors de l\'activation du colis',
      details: error.message || String(error)
    }, { status: 500 });
  }
}
