import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST - Activate package with photo upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const qrCode = formData.get('qrCode') as string;
    const tripId = formData.get('tripId') as string;
    const senderName = formData.get('senderName') as string;
    const senderPhone = formData.get('senderPhone') as string;
    const recipientName = formData.get('recipientName') as string;
    const recipientPhone = formData.get('recipientPhone') as string;
    const recipientWhatsapp = formData.get('recipientWhatsapp') as string;
    const description = formData.get('description') as string;
    const weight = formData.get('weight') as string;
    const price = formData.get('price') as string;
    const photoFile = formData.get('photo') as File | null;

    // Validation
    if (!qrCode) {
      return NextResponse.json({ 
        success: false,
        error: 'QR code requis' 
      }, { status: 400 });
    }

    if (!senderName || !senderPhone || !recipientName || !recipientPhone) {
      return NextResponse.json({ 
        success: false,
        error: 'Expéditeur et destinataire sont requis' 
      }, { status: 400 });
    }

    if (!photoFile) {
      return NextResponse.json({ 
        success: false,
        error: 'Photo du colis obligatoire' 
      }, { status: 400 });
    }

    // Find existing package or create new one
    let existingPackage = await db.package.findFirst({
      where: { qrCode }
    });

    // Generate pickup code (4 digits)
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date();

    // Handle photo upload
    let photoUrl = '';
    if (photoFile && photoFile.size > 0) {
      try {
        const bytes = await photoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'packages');
        await mkdir(uploadsDir, { recursive: true });
        
        // Generate unique filename
        const fileExtension = photoFile.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);
        
        // Write file
        await writeFile(filePath, buffer);
        photoUrl = `/uploads/packages/${fileName}`;
      } catch (uploadError) {
        console.error('Photo upload error:', uploadError);
        // Continue without photo URL if upload fails
        photoUrl = '';
      }
    }

    let savedPackage;

    if (existingPackage) {
      // Check if already activated
      if (existingPackage.status !== 'NON_ACTIVE') {
        return NextResponse.json({ 
          success: false,
          error: 'Ce QR code a déjà été activé' 
        }, { status: 400 });
      }

      // Update existing package
      savedPackage = await db.package.update({
        where: { id: existingPackage.id },
        data: {
          status: tripId ? 'IN_TRANSIT' : 'ACTIVE',
          senderName,
          senderPhone,
          recipientName,
          recipientPhone,
          recipientWhatsapp: recipientWhatsapp || recipientPhone,
          pickupCode,
          description,
          weight: weight ? parseFloat(weight) : null,
          price: price ? parseFloat(price) : 200,
          photo: photoUrl,
          tripId: tripId || null,
          activatedAt: now,
          updatedAt: now
        }
      });
    } else {
      // Create new package (for demo/testing purposes)
      savedPackage = await db.package.create({
        data: {
          qrCode,
          status: tripId ? 'IN_TRANSIT' : 'ACTIVE',
          senderName,
          senderPhone,
          recipientName,
          recipientPhone,
          recipientWhatsapp: recipientWhatsapp || recipientPhone,
          pickupCode,
          description,
          weight: weight ? parseFloat(weight) : null,
          price: price ? parseFloat(price) : 200,
          photo: photoUrl,
          tripId: tripId || null,
          companyId: 'demo-company', // Default company for demo
          activatedAt: now
        }
      });
    }

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
        recipientWhatsapp: savedPackage.recipientWhatsapp,
        pickupCode: savedPackage.pickupCode,
        description: savedPackage.description,
        weight: savedPackage.weight,
        price: savedPackage.price,
        photo: savedPackage.photo,
        activatedAt: savedPackage.activatedAt
      },
      pickupCode
    }, { status: 201 });

  } catch (error) {
    console.error('Activate package error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur lors de l\'activation du colis' 
    }, { status: 500 });
  }
}
