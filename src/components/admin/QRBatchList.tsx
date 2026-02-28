'use client';

import { motion } from 'framer-motion';
import { QrCode, Eye, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

interface QRBatchListProps {
  batches: QRBatch[];
  onViewBatch: (batchId: string) => void;
}

export default function QRBatchList({ batches, onViewBatch }: QRBatchListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-black text-white">ACTIVE</Badge>;
      case 'DELIVERED':
        return <Badge variant="outline" className="border-green-500 text-green-600">LIVRÉ</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-400 text-gray-600">EN ATTENTE</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div>
          <CardTitle className="text-lg">Lots QR Codes générés</CardTitle>
          <p className="text-sm text-gray-500">Cliquez sur un lot pour voir les codes</p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {batches.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <QrCode className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun lot QR généré</p>
          </div>
        ) : (
          <div className="divide-y">
            {batches.map((batch, index) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onViewBatch(batch.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-[#FF8C00]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{batch.batchCode}</span>
                      {getStatusBadge(batch.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Building2 className="w-4 h-4" />
                      {batch.company.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {batch.quantity} stickers
                    </p>
                    <p className="text-sm text-green-600">
                      {batch.activatedCount} activés
                    </p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Eye className="w-4 h-4 text-gray-500" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
