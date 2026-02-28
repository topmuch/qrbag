import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get all companies with their package stats
    const companies = await db.company.findMany({
      include: {
        Package: true,
        Subscription: true,
        _count: {
          select: {
            Bus: true,
            Driver: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calculate stats for each company
    const agencyStats = companies.map((company) => {
      const packages = company.Package;
      
      // Count by status
      const totalPackages = packages.length;
      const activatedPackages = packages.filter(
        (p) => p.status !== 'NON_ACTIVE'
      ).length;
      
      const activePackages = packages.filter(
        (p) => p.status === 'ACTIVE' || p.status === 'IN_TRANSIT'
      ).length;
      
      // Check for expired (status = EXPIRED or validUntil < now but status is ACTIVE)
      const now = new Date();
      const expiredPackages = packages.filter(
        (p) => p.status === 'EXPIRED' || 
        (p.validUntil && new Date(p.validUntil) < now && (p.status === 'ACTIVE' || p.status === 'IN_TRANSIT'))
      ).length;
      
      const deliveredPackages = packages.filter(
        (p) => p.status === 'DELIVERED'
      ).length;
      
      const availablePackages = packages.filter(
        (p) => p.status === 'NON_ACTIVE'
      ).length;
      
      // Revenue from activated stickers (200 FCFA per activation)
      const revenue = activatedPackages * 200;
      
      // Activation rate
      const activationRate = totalPackages > 0 
        ? Math.round((activatedPackages / totalPackages) * 100) 
        : 0;

      return {
        id: company.id,
        name: company.name,
        email: company.email,
        city: company.city,
        country: company.country,
        isActive: company.isActive,
        totalPackages,
        activatedPackages,
        activePackages,
        expiredPackages,
        deliveredPackages,
        availablePackages,
        revenue,
        activationRate,
        busesCount: company._count.Bus,
        driversCount: company._count.Driver,
        subscription: company.Subscription,
      };
    });

    return NextResponse.json(agencyStats);
  } catch (error) {
    console.error('Error fetching agency stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
