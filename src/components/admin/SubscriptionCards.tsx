'use client';

import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SubscriptionStats {
  planType: string;
  count: number;
  revenue: number;
}

interface SubscriptionCardsProps {
  subscriptions: SubscriptionStats[];
}

const planConfig: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string; 
  price: string;
  features: string[];
}> = {
  BUS_ONLY: {
    label: 'Bus Seul',
    color: 'bg-blue-100 text-blue-700',
    bgColor: 'bg-blue-50',
    price: '50 000 FCFA/mois',
    features: ['Suivi GPS des bus', '4 checkpoints', 'Dashboard propriétaire']
  },
  COLIS_ONLY: {
    label: 'Colis Seul',
    color: 'bg-green-100 text-green-700',
    bgColor: 'bg-green-50',
    price: '30 000 FCFA/mois + stickers',
    features: ['Suivi colis QR code', 'Notifications WhatsApp', 'Code de retrait']
  },
  PACK_COMPLET: {
    label: 'Pack Complet',
    color: 'bg-purple-100 text-purple-700',
    bgColor: 'bg-purple-50',
    price: '70 000 FCFA/mois + stickers',
    features: ['Tout inclus (Bus + Colis)', 'Analytics avancés', 'Support prioritaire']
  }
};

export default function SubscriptionCards({ subscriptions }: SubscriptionCardsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {Object.entries(planConfig).map(([planType, config], index) => {
        const stat = subscriptions.find(s => s.planType === planType) || { count: 0, revenue: 0 };
        
        return (
          <motion.div
            key={planType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`h-full ${config.bgColor} border-0`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Badge className={config.color}>
                    {config.label}
                  </Badge>
                  <span className="text-2xl font-bold text-gray-900">
                    {stat.count}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">{config.price}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    Revenus: {stat.revenue.toLocaleString()} FCFA
                  </p>
                </div>

                <div className="space-y-1">
                  {config.features.map((feature, i) => (
                    <p key={i} className="text-xs text-gray-500">
                      • {feature}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
