import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all companies
export async function GET() {
  try {
    const companies = await db.company.findMany({
      include: {
        Bus: true,
        Driver: true,
        Subscription: true,
        QRBatch: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedCompanies = companies.map(company => {
      const subscription = company.Subscription?.[0];
      const totalStickers = company.QRBatch.reduce((acc, b) => acc + b.quantity, 0);
      const activatedStickers = subscription?.activatedStickers || 0;
      
      const monthlyFee = subscription?.monthlyFee || 0;
      const stickerFee = subscription?.stickerFee || 200;
      const stickerRevenue = activatedStickers * stickerFee;
      const totalRevenue = monthlyFee + stickerRevenue;

      return {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        city: company.city,
        country: company.country,
        isActive: company.isActive,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        busesCount: company.Bus.length,
        driversCount: company.Driver.length,
        subscription: subscription ? {
          id: subscription.id,
          planType: subscription.planType,
          monthlyFee: subscription.monthlyFee,
          stickerFee: subscription.stickerFee,
          activatedStickers: subscription.activatedStickers,
          status: subscription.status
        } : null,
        stickers: {
          total: totalStickers,
          activated: activatedStickers
        },
        revenue: totalRevenue
      };
    });

    return NextResponse.json(formattedCompanies);
  } catch (error) {
    console.error('Get companies error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des compagnies' },
      { status: 500 }
    );
  }
}

// POST - Create new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, city, country, planType } = body;

    // Validate required fields
    if (!name || !email || !country || !planType) {
      return NextResponse.json(
        { error: 'Nom, email, pays et forfait sont requis' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingCompany = await db.company.findUnique({
      where: { email }
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Une compagnie avec cet email existe déjà' },
        { status: 400 }
      );
    }

    // Get pricing from settings
    const settings = await db.settings.findFirst();
    if (!settings) {
      return NextResponse.json(
        { error: 'Configuration non trouvée' },
        { status: 500 }
      );
    }

    // Determine monthly fee based on plan
    let monthlyFee: number;
    switch (planType) {
      case 'BUS_ONLY':
        monthlyFee = settings.busOnlyPrice;
        break;
      case 'COLIS_ONLY':
        monthlyFee = settings.colisOnlyPrice;
        break;
      case 'PACK_COMPLET':
        monthlyFee = settings.packCompletPrice;
        break;
      default:
        return NextResponse.json(
          { error: 'Forfait invalide' },
          { status: 400 }
        );
    }

    // Create company with subscription
    const company = await db.company.create({
      data: {
        name,
        email,
        phone: phone || null,
        address: address || null,
        city: city || null,
        country,
        isActive: true,
        Subscription: {
          create: {
            planType: planType,
            monthlyFee,
            stickerFee: settings.stickerPrice,
            activatedStickers: 0,
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            status: 'ACTIVE'
          }
        }
      },
      include: {
        Subscription: true
      }
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la compagnie' },
      { status: 500 }
    );
  }
}
