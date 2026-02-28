import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Import/restore data from JSON backup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate backup structure
    if (!body.metadata || !body.data) {
      return NextResponse.json({ 
        success: false,
        error: 'Format de fichier invalide. Ce n\'est pas une sauvegarde QRBag.' 
      }, { status: 400 });
    }

    if (body.metadata.appName !== 'QRBag') {
      return NextResponse.json({ 
        success: false,
        error: 'Ce fichier n\'est pas une sauvegarde QRBag valide.' 
      }, { status: 400 });
    }

    const { data } = body;
    const results = {
      companies: 0,
      users: 0,
      drivers: 0,
      buses: 0,
      routes: 0,
      trips: 0,
      packages: 0,
      qrBatches: 0,
      subscriptions: 0,
      tripScans: 0,
      settings: 0,
      errors: [] as string[]
    };

    // Use transaction for data integrity
    await db.$transaction(async (tx) => {
      // 1. Import Companies (must be first due to foreign keys)
      if (data.companies && Array.isArray(data.companies)) {
        for (const company of data.companies) {
          try {
            await tx.company.upsert({
              where: { id: company.id },
              create: {
                id: company.id,
                name: company.name,
                email: company.email,
                phone: company.phone || '',
                address: company.address,
                city: company.city,
                country: company.country || 'Côte d\'Ivoire',
                isActive: company.isActive ?? true,
                createdAt: new Date(company.createdAt),
                updatedAt: new Date()
              },
              update: {
                name: company.name,
                email: company.email,
                phone: company.phone,
                address: company.address,
                city: company.city,
                country: company.country,
                isActive: company.isActive,
                updatedAt: new Date()
              }
            });
            results.companies++;
          } catch (e: any) {
            results.errors.push(`Company ${company.id}: ${e.message}`);
          }
        }
      }

      // 2. Import Users
      if (data.users && Array.isArray(data.users)) {
        for (const user of data.users) {
          try {
            await tx.user.upsert({
              where: { id: user.id },
              create: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                password: user.password,
                role: user.role || 'OWNER',
                companyId: user.companyId,
                isActive: user.isActive ?? true,
                createdAt: new Date(user.createdAt),
                updatedAt: new Date()
              },
              update: {
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                companyId: user.companyId,
                isActive: user.isActive,
                updatedAt: new Date()
              }
            });
            results.users++;
          } catch (e: any) {
            results.errors.push(`User ${user.id}: ${e.message}`);
          }
        }
      }

      // 3. Import Drivers
      if (data.drivers && Array.isArray(data.drivers)) {
        for (const driver of data.drivers) {
          try {
            await tx.driver.upsert({
              where: { id: driver.id },
              create: {
                id: driver.id,
                userId: driver.userId,
                licenseNumber: driver.licenseNumber,
                licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry) : null,
                companyId: driver.companyId,
                isActive: driver.isActive ?? true,
                createdAt: new Date(driver.createdAt),
                updatedAt: new Date()
              },
              update: {
                userId: driver.userId,
                licenseNumber: driver.licenseNumber,
                licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry) : null,
                companyId: driver.companyId,
                isActive: driver.isActive,
                updatedAt: new Date()
              }
            });
            results.drivers++;
          } catch (e: any) {
            results.errors.push(`Driver ${driver.id}: ${e.message}`);
          }
        }
      }

      // 4. Import Buses
      if (data.buses && Array.isArray(data.buses)) {
        for (const bus of data.buses) {
          try {
            await tx.bus.upsert({
              where: { id: bus.id },
              create: {
                id: bus.id,
                plateNumber: bus.plateNumber,
                model: bus.model,
                capacity: bus.capacity || 50,
                color: bus.color,
                year: bus.year,
                companyId: bus.companyId,
                isActive: bus.isActive ?? true,
                createdAt: new Date(bus.createdAt),
                updatedAt: new Date()
              },
              update: {
                plateNumber: bus.plateNumber,
                model: bus.model,
                capacity: bus.capacity,
                color: bus.color,
                year: bus.year,
                companyId: bus.companyId,
                isActive: bus.isActive,
                updatedAt: new Date()
              }
            });
            results.buses++;
          } catch (e: any) {
            results.errors.push(`Bus ${bus.id}: ${e.message}`);
          }
        }
      }

      // 5. Import Routes
      if (data.routes && Array.isArray(data.routes)) {
        for (const route of data.routes) {
          try {
            await tx.route.upsert({
              where: { id: route.id },
              create: {
                id: route.id,
                name: route.name,
                origin: route.origin,
                destination: route.destination,
                distance: route.distance,
                estimatedTime: route.estimatedTime,
                companyId: route.companyId,
                createdAt: new Date(route.createdAt),
                updatedAt: new Date()
              },
              update: {
                name: route.name,
                origin: route.origin,
                destination: route.destination,
                distance: route.distance,
                estimatedTime: route.estimatedTime,
                companyId: route.companyId,
                updatedAt: new Date()
              }
            });
            results.routes++;
          } catch (e: any) {
            results.errors.push(`Route ${route.id}: ${e.message}`);
          }
        }
      }

      // 6. Import QR Batches
      if (data.qrBatches && Array.isArray(data.qrBatches)) {
        for (const batch of data.qrBatches) {
          try {
            await tx.qRBatch.upsert({
              where: { id: batch.id },
              create: {
                id: batch.id,
                batchCode: batch.batchCode,
                quantity: batch.quantity,
                activatedCount: batch.activatedCount || 0,
                status: batch.status || 'PENDING',
                companyId: batch.companyId,
                createdAt: new Date(batch.createdAt)
              },
              update: {
                batchCode: batch.batchCode,
                quantity: batch.quantity,
                activatedCount: batch.activatedCount,
                status: batch.status,
                companyId: batch.companyId
              }
            });
            results.qrBatches++;
          } catch (e: any) {
            results.errors.push(`QRBatch ${batch.id}: ${e.message}`);
          }
        }
      }

      // 7. Import Subscriptions
      if (data.subscriptions && Array.isArray(data.subscriptions)) {
        for (const sub of data.subscriptions) {
          try {
            await tx.subscription.upsert({
              where: { id: sub.id },
              create: {
                id: sub.id,
                planType: sub.planType,
                monthlyFee: sub.monthlyFee || 0,
                stickerFee: sub.stickerFee || 200,
                activatedStickers: sub.activatedStickers || 0,
                startDate: new Date(sub.startDate),
                endDate: sub.endDate ? new Date(sub.endDate) : new Date(),
                status: sub.status || 'ACTIVE',
                companyId: sub.companyId,
                createdAt: new Date(sub.createdAt),
                updatedAt: new Date()
              },
              update: {
                planType: sub.planType,
                monthlyFee: sub.monthlyFee,
                stickerFee: sub.stickerFee,
                activatedStickers: sub.activatedStickers,
                startDate: new Date(sub.startDate),
                endDate: sub.endDate ? new Date(sub.endDate) : new Date(),
                status: sub.status,
                companyId: sub.companyId,
                updatedAt: new Date()
              }
            });
            results.subscriptions++;
          } catch (e: any) {
            results.errors.push(`Subscription ${sub.id}: ${e.message}`);
          }
        }
      }

      // 8. Import Trips
      if (data.trips && Array.isArray(data.trips)) {
        for (const trip of data.trips) {
          try {
            await tx.trip.upsert({
              where: { id: trip.id },
              create: {
                id: trip.id,
                trackingCode: trip.trackingCode,
                status: trip.status || 'SCHEDULED',
                departureTime: trip.departureTime ? new Date(trip.departureTime) : new Date(),
                arrivalTime: trip.arrivalTime ? new Date(trip.arrivalTime) : null,
                actualDeparture: trip.actualDeparture ? new Date(trip.actualDeparture) : null,
                actualArrival: trip.actualArrival ? new Date(trip.actualArrival) : null,
                passengers: trip.passengers || 0,
                currentLat: trip.currentLat,
                currentLng: trip.currentLng,
                notes: trip.notes,
                routeId: trip.routeId,
                busId: trip.busId,
                driverId: trip.driverId,
                companyId: trip.companyId,
                createdAt: new Date(trip.createdAt),
                updatedAt: new Date()
              },
              update: {
                trackingCode: trip.trackingCode,
                status: trip.status,
                departureTime: trip.departureTime ? new Date(trip.departureTime) : new Date(),
                arrivalTime: trip.arrivalTime ? new Date(trip.arrivalTime) : null,
                actualDeparture: trip.actualDeparture ? new Date(trip.actualDeparture) : null,
                actualArrival: trip.actualArrival ? new Date(trip.actualArrival) : null,
                passengers: trip.passengers,
                currentLat: trip.currentLat,
                currentLng: trip.currentLng,
                notes: trip.notes,
                routeId: trip.routeId,
                busId: trip.busId,
                driverId: trip.driverId,
                companyId: trip.companyId,
                updatedAt: new Date()
              }
            });
            results.trips++;
          } catch (e: any) {
            results.errors.push(`Trip ${trip.id}: ${e.message}`);
          }
        }
      }

      // 9. Import Packages
      if (data.packages && Array.isArray(data.packages)) {
        for (const pkg of data.packages) {
          try {
            await tx.package.upsert({
              where: { id: pkg.id },
              create: {
                id: pkg.id,
                qrCode: pkg.qrCode,
                status: pkg.status || 'NON_ACTIVE',
                senderName: pkg.senderName,
                senderPhone: pkg.senderPhone,
                recipientName: pkg.recipientName,
                recipientPhone: pkg.recipientPhone,
                recipientWhatsapp: pkg.recipientWhatsapp,
                description: pkg.description,
                weight: pkg.weight,
                price: pkg.price,
                photo: pkg.photo,
                pickupCode: pkg.pickupCode,
                activatedAt: pkg.activatedAt ? new Date(pkg.activatedAt) : null,
                tripId: pkg.tripId,
                companyId: pkg.companyId,
                batchId: pkg.batchId,
                createdAt: new Date(pkg.createdAt),
                updatedAt: new Date()
              },
              update: {
                qrCode: pkg.qrCode,
                status: pkg.status,
                senderName: pkg.senderName,
                senderPhone: pkg.senderPhone,
                recipientName: pkg.recipientName,
                recipientPhone: pkg.recipientPhone,
                recipientWhatsapp: pkg.recipientWhatsapp,
                description: pkg.description,
                weight: pkg.weight,
                price: pkg.price,
                photo: pkg.photo,
                pickupCode: pkg.pickupCode,
                activatedAt: pkg.activatedAt ? new Date(pkg.activatedAt) : null,
                tripId: pkg.tripId,
                companyId: pkg.companyId,
                batchId: pkg.batchId,
                updatedAt: new Date()
              }
            });
            results.packages++;
          } catch (e: any) {
            results.errors.push(`Package ${pkg.id}: ${e.message}`);
          }
        }
      }

      // 10. Import Trip Scans
      if (data.tripScans && Array.isArray(data.tripScans)) {
        for (const scan of data.tripScans) {
          try {
            await tx.tripScan.upsert({
              where: { id: scan.id },
              create: {
                id: scan.id,
                type: scan.type,
                timestamp: new Date(scan.timestamp),
                latitude: scan.latitude,
                longitude: scan.longitude,
                notes: scan.notes,
                tripId: scan.tripId,
                createdAt: new Date(scan.createdAt)
              },
              update: {
                type: scan.type,
                timestamp: new Date(scan.timestamp),
                latitude: scan.latitude,
                longitude: scan.longitude,
                notes: scan.notes,
                tripId: scan.tripId
              }
            });
            results.tripScans++;
          } catch (e: any) {
            results.errors.push(`TripScan ${scan.id}: ${e.message}`);
          }
        }
      }

      // 11. Import Settings
      if (data.settings && Array.isArray(data.settings)) {
        for (const setting of data.settings) {
          try {
            await tx.settings.upsert({
              where: { id: setting.id },
              create: {
                id: setting.id,
                stickerPrice: setting.stickerPrice || 200,
                busOnlyPrice: setting.busOnlyPrice || 50000,
                colisOnlyPrice: setting.colisOnlyPrice || 30000,
                packCompletPrice: setting.packCompletPrice || 70000
              },
              update: {
                stickerPrice: setting.stickerPrice,
                busOnlyPrice: setting.busOnlyPrice,
                colisOnlyPrice: setting.colisOnlyPrice,
                packCompletPrice: setting.packCompletPrice
              }
            });
            results.settings++;
          } catch (e: any) {
            results.errors.push(`Settings ${setting.id}: ${e.message}`);
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Sauvegarde restaurée avec succès !',
      results,
      backupDate: body.metadata.exportedAt
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur lors de la restauration des données',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
