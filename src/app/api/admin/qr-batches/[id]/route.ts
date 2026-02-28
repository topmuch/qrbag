import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const batch = await db.qRBatch.findUnique({
      where: { id },
      include: {
        Company: true,
        Package: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'QR Batch not found' },
        { status: 404 }
      );
    }

    // Get counts by status
    const statusCounts = await db.package.groupBy({
      by: ['status'],
      where: { batchId: id },
      _count: true,
    });

    // Transform to match frontend expectations
    return NextResponse.json({
      ...batch,
      company: batch.Company,
      packages: batch.Package,
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('Error fetching QR batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QR batch' },
      { status: 500 }
    );
  }
}
