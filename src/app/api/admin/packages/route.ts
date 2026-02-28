import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build filter
    const where: any = {};
    
    if (companyId) {
      where.companyId = companyId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { qrCode: { contains: search } },
        { recipientName: { contains: search } },
        { senderName: { contains: search } },
      ];
    }

    const packages = await db.package.findMany({
      where,
      include: {
        Trip: {
          select: {
            Route: {
              select: {
                origin: true,
                destination: true,
              },
            },
          },
        },
        Company: {
          select: {
            name: true,
            city: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des colis' },
      { status: 500 }
    );
  }
}
