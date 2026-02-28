'use client';

import { motion } from 'framer-motion';
import { QrCode, Eye, Building2, Calendar, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QRBatch {
  id: string;
  batchCode: string;
  quantity: number;
  activatedCount: number;
  status: string;
  createdAt: string;
  company: {
    name: string;
  };
}

interface QRBatchesSectionModernProps {
  batches: QRBatch[];
  onViewBatch: (id: string) => void;
}

const statusConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  ACTIVE: { label: 'Actif', className: 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/30', dotColor: '#34D399' },
  DELIVERED: { label: 'Livré', className: 'bg-[#3B82F6]/20 text-[#60A5FA] border-[#3B82F6]/30', dotColor: '#60A5FA' },
  PENDING: { label: 'En attente', className: 'bg-[#F59E0B]/20 text-[#FBBF24] border-[#F59E0B]/30', dotColor: '#FBBF24' }
};

export default function QRBatchesSectionModern({
  batches,
  onViewBatch
}: QRBatchesSectionModernProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="bg-[#1E1E2E] border-white/5 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-12 h-12 rounded-xl bg-[#10B981]/20 flex items-center justify-center"
            >
              <QrCode className="w-6 h-6 text-[#34D399]" />
            </motion.div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Lots QR Codes générés
              </h2>
              <p className="text-sm text-gray-500">
                Cliquez sur un lot pour voir les détails
              </p>
            </div>
          </div>
        </div>

        {/* Batch Grid */}
        <div className="p-6">
          {batches.length === 0 ? (
            <div className="text-center py-12">
              <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">Aucun lot QR généré</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batches.map((batch, index) => {
                const status = statusConfig[batch.status] || statusConfig.PENDING;
                const activationRate = batch.quantity > 0
                  ? Math.round((batch.activatedCount / batch.quantity) * 100)
                  : 0;

                return (
                  <motion.div
                    key={batch.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onViewBatch(batch.id)}
                    className="group cursor-pointer"
                  >
                    <div className="bg-[#181825] rounded-xl p-5 border border-white/5 hover:border-[#10B981]/30 transition-all duration-300">
                      {/* Top Row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF8C00] to-[#FFA500] flex items-center justify-center shadow-lg shadow-[#FF8C00]/10">
                            <QrCode className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{batch.batchCode}</h3>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(batch.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                        <Badge className={status.className}>
                          <span 
                            className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse"
                            style={{ backgroundColor: status.dotColor }}
                          />
                          {status.label}
                        </Badge>
                      </div>

                      {/* Company */}
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                        <Building2 className="w-4 h-4" />
                        {batch.company.name}
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-500" />
                          <span className="text-white font-medium">{batch.quantity}</span>
                          <span className="text-gray-500 text-sm">stickers</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#34D399]">{batch.activatedCount} activés</span>
                            <span className="text-gray-500">{activationRate}%</span>
                          </div>
                          <div className="h-1.5 bg-[#2A2A3A] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${activationRate}%` }}
                              transition={{ duration: 0.8, delay: 0.7 + index * 0.1 }}
                              className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Hover Action */}
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          className="w-full bg-white/5 hover:bg-white/10 text-gray-400"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir les détails
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
