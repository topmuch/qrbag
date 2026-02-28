'use client';

import { motion } from 'framer-motion';
import { CreditCard, Check, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SubscriptionStats {
  planType: string;
  count: number;
  revenue: number;
}

interface SubscriptionsSectionModernProps {
  subscriptions: SubscriptionStats[];
}

const planConfig: Record<string, {
  label: string;
  color: string;
  bgGradient: string;
  iconBg: string;
  price: string;
  features: string[];
}> = {
  BUS_ONLY: {
    label: 'Bus Seul',
    color: '#3B82F6',
    bgGradient: 'from-[#3B82F6]/10 to-[#3B82F6]/5',
    iconBg: 'bg-gradient-to-br from-[#3B82F6] to-[#60A5FA]',
    price: '50 000 FCFA/mois',
    features: ['Suivi GPS des bus', '4 checkpoints', 'Dashboard propriétaire', 'Application chauffeur']
  },
  COLIS_ONLY: {
    label: 'Colis Seul',
    color: '#10B981',
    bgGradient: 'from-[#10B981]/10 to-[#10B981]/5',
    iconBg: 'bg-gradient-to-br from-[#10B981] to-[#34D399]',
    price: '30 000 FCFA/mois + stickers',
    features: ['Suivi colis QR code', 'Notifications WhatsApp', 'Code de retrait sécurisé', 'Dashboard colis']
  },
  PACK_COMPLET: {
    label: 'Pack Complet',
    color: '#8B5CF6',
    bgGradient: 'from-[#8B5CF6]/10 to-[#8B5CF6]/5',
    iconBg: 'bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA]',
    price: '70 000 FCFA/mois + stickers',
    features: ['Tout inclus (Bus + Colis)', 'Analytics avancés', 'Support prioritaire', 'Revenus optimisés']
  }
};

export default function SubscriptionsSectionModern({
  subscriptions
}: SubscriptionsSectionModernProps) {
  const totalRevenue = subscriptions.reduce((acc, s) => acc + s.revenue, 0);
  const totalCompanies = subscriptions.reduce((acc, s) => acc + s.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-12 h-12 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center"
          >
            <CreditCard className="w-6 h-6 text-[#A78BFA]" />
          </motion.div>
          <div>
            <h2 className="text-xl font-semibold text-white">Abonnements</h2>
            <p className="text-sm text-gray-500">Répartition des forfaits par compagnie</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{totalCompanies}</p>
          <p className="text-sm text-gray-500">compagnies actives</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(planConfig).map(([planType, config], index) => {
          const stat = subscriptions.find(s => s.planType === planType) || { count: 0, revenue: 0 };

          return (
            <motion.div
              key={planType}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className={`
                bg-[#1E1E2E] border border-white/5 rounded-xl overflow-hidden
                bg-gradient-to-br ${config.bgGradient}
              `}>
                {/* Top Accent */}
                <div 
                  className="h-1"
                  style={{ backgroundColor: config.color }}
                />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${config.iconBg} flex items-center justify-center`}>
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <span 
                        className="font-semibold"
                        style={{ color: config.color }}
                      >
                        {config.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{stat.count}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <p className="text-sm text-gray-400 mb-3">{config.price}</p>

                  {/* Revenue */}
                  <div className="bg-[#181825] rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Revenus</span>
                      <div className="flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3 text-[#34D399]" />
                        <span 
                          className="text-lg font-bold"
                          style={{ color: config.color }}
                        >
                          {stat.revenue.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {config.features.slice(0, 3).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5" style={{ color: config.color }} />
                        <span className="text-xs text-gray-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Total Revenue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-6"
      >
        <Card className="bg-gradient-to-r from-[#FF8C00]/10 via-[#8B5CF6]/10 to-[#10B981]/10 border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Revenus mensuels totaux</p>
              <p className="text-3xl font-bold text-gradient-multicolor">{totalRevenue.toLocaleString()} FCFA</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-[#FF9F1C]">{subscriptions.length}</p>
                <p className="text-xs text-gray-500">Plans</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[#34D399]">{totalCompanies}</p>
                <p className="text-xs text-gray-500">Clients</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
