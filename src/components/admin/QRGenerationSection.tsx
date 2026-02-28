'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Wand2, Copy, Check, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface QRGenerationSectionProps {
  stats: {
    totalStickers: number;
    activatedStickers: number;
    stickerRevenue: number;
  };
  onGenerateClick: () => void;
}

export default function QRGenerationSection({ 
  stats,
  onGenerateClick 
}: QRGenerationSectionProps) {
  const activationRate = stats.totalStickers > 0 
    ? Math.round((stats.activatedStickers / stats.totalStickers) * 100) 
    : 0;

  const inStock = stats.totalStickers - stats.activatedStickers;

  const statCards = [
    { label: 'QR générés', value: stats.totalStickers, color: 'text-gray-900' },
    { label: 'QR activés', value: stats.activatedStickers, color: 'text-green-600' },
    { label: 'En stock', value: inStock, color: 'text-blue-600' },
    { label: 'Revenus stickers', value: `${stats.stickerRevenue.toLocaleString()} FCFA`, color: 'text-orange-600' },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF8C00] flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Génération de QR Codes</CardTitle>
              <p className="text-sm text-gray-500">Gérez les lots de stickers pour les colis</p>
            </div>
          </div>
          <Button
            className="bg-[#FF8C00] hover:bg-[#E67E00] text-white"
            onClick={onGenerateClick}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Générer des QR Codes
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 rounded-lg p-4 text-center"
            >
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Taux d'activation</span>
            <span className="text-[#FF8C00] font-bold">{activationRate}%</span>
          </div>
          <Progress value={activationRate} className="h-3" />
          <p className="text-xs text-gray-500 text-right">
            {stats.activatedStickers} / {stats.totalStickers} stickers activés
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
