'use client';

import { motion } from 'framer-motion';
import { QrCode, Wand2, Download, Printer, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface QRGenerationSectionModernProps {
  stats: {
    totalStickers: number;
    activatedStickers: number;
    stickerRevenue: number;
  };
  onGenerateClick: () => void;
}

export default function QRGenerationSectionModern({
  stats,
  onGenerateClick
}: QRGenerationSectionModernProps) {
  const activationRate = stats.totalStickers > 0
    ? Math.round((stats.activatedStickers / stats.totalStickers) * 100)
    : 0;

  const inStock = stats.totalStickers - stats.activatedStickers;

  const statCards = [
    { 
      label: 'QR générés', 
      value: stats.totalStickers, 
      color: '#3B82F6',
      bgGradient: 'from-[#3B82F6]/20 to-[#3B82F6]/5'
    },
    { 
      label: 'QR activés', 
      value: stats.activatedStickers, 
      color: '#34D399',
      bgGradient: 'from-[#10B981]/20 to-[#10B981]/5'
    },
    { 
      label: 'En stock', 
      value: inStock, 
      color: '#60A5FA',
      bgGradient: 'from-[#8B5CF6]/20 to-[#8B5CF6]/5'
    },
    { 
      label: 'Revenus stickers', 
      value: `${stats.stickerRevenue.toLocaleString()} FCFA`, 
      color: '#FF9F1C',
      bgGradient: 'from-[#FF8C00]/20 to-[#FF8C00]/5',
      isPrice: true
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="bg-[#1E1E2E] border-white/5 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[#FF8C00]/10 via-[#FF8C00]/5 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF8C00] to-[#FFA500] flex items-center justify-center shadow-lg shadow-[#FF8C00]/20"
              >
                <QrCode className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Génération de QR Codes
                </h2>
                <p className="text-sm text-gray-500">
                  Gérez les lots de stickers pour les colis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button
                className="bg-gradient-to-r from-[#FF8C00] to-[#FFA500] hover:from-[#E67E00] hover:to-[#FF8C00] text-white shadow-lg shadow-[#FF8C00]/20"
                onClick={onGenerateClick}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Générer des QR Codes
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`
                  relative overflow-hidden rounded-xl p-4
                  bg-gradient-to-br ${stat.bgGradient}
                  border border-white/5
                `}
              >
                {/* Decorative element */}
                <div 
                  className="absolute -right-2 -top-2 w-16 h-16 rounded-full opacity-20"
                  style={{ backgroundColor: stat.color }}
                />
                
                <p className={`text-2xl font-bold mb-1 ${stat.isPrice ? 'text-lg' : ''}`} style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Progress Section */}
          <div className="bg-[#181825] rounded-xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FF8C00]/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#FF9F1C]" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Taux d'activation</h4>
                  <p className="text-xs text-gray-500">Progression globale</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-[#FF9F1C]">{activationRate}%</span>
                <p className="text-xs text-gray-500">{stats.activatedStickers} / {stats.totalStickers}</p>
              </div>
            </div>

            {/* Custom Progress Bar */}
            <div className="relative h-4 bg-[#2A2A3A] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activationRate}%` }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#FF8C00] to-[#FFB84D]"
              />
              {/* Animated shimmer */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{ left: `${activationRate - 25}%` }}
              />
            </div>

            {/* Stats below progress */}
            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#34D399]" />
                  <span className="text-gray-400">Activés</span>
                  <span className="text-white font-medium">{stats.activatedStickers}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#3A3A4A]" />
                  <span className="text-gray-400">Restants</span>
                  <span className="text-white font-medium">{inStock}</span>
                </div>
              </div>
              <div className="text-gray-500">
                Potentiel: <span className="text-[#FF9F1C] font-medium">{(inStock * 200).toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
