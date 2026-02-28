import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Cron job to expire QR codes that have passed their 10-day validity period
 * This endpoint should be called by a cron scheduler (e.g., Vercel Cron, or external service)
 * 
 * Recommended schedule: Every hour
 */

export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    
    // Find all packages that are:
    // 1. Status is ACTIVE or IN_TRANSIT
    // 2. validUntil is in the past
    const expiredPackages = await db.package.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'IN_TRANSIT' }
        ],
        validUntil: {
          lt: now
        }
      },
      include: {
        Company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (expiredPackages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired QR codes found',
        expired: 0
      });
    }

    // Update all expired packages
    const updateResult = await db.package.updateMany({
      where: {
        id: {
          in: expiredPackages.map(p => p.id)
        }
      },
      data: {
        status: 'EXPIRED',
        expiredAt: now,
        updatedAt: now
      }
    });

    // Update expired count in QR batches
    const batchIds = [...new Set(expiredPackages.map(p => p.batchId).filter(Boolean))];
    
    for (const batchId of batchIds) {
      const expiredCount = await db.package.count({
        where: {
          batchId,
          status: 'EXPIRED'
        }
      });
      
      await db.qRBatch.update({
        where: { id: batchId },
        data: { expiredCount }
      });
    }

    // Group by company for reporting
    const byCompany = expiredPackages.reduce((acc, pkg) => {
      const companyId = pkg.companyId || 'unknown';
      if (!acc[companyId]) {
        acc[companyId] = {
          companyId,
          companyName: pkg.Company?.name || 'Unknown',
          count: 0
        };
      }
      acc[companyId].count++;
      return acc;
    }, {} as Record<string, { companyId: string; companyName: string; count: number }>);

    console.log(`[Cron] Expired ${updateResult.count} QR codes`);

    return NextResponse.json({
      success: true,
      message: `Expired ${updateResult.count} QR codes`,
      expired: updateResult.count,
      details: Object.values(byCompany)
    });

  } catch (error) {
    console.error('Error expiring QR codes:', error);
    return NextResponse.json(
      { error: 'Failed to expire QR codes' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
