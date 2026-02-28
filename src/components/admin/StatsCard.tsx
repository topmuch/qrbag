'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleColor?: string;
  borderColor?: string;
  iconBg?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function StatsCard({
  icon: Icon,
  title,
  value,
  subtitle,
  subtitleColor = 'text-gray-600',
  borderColor = '#3B82F6',
  iconBg = 'bg-blue-100',
  trend,
  trendValue
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="p-6 h-full transition-shadow duration-300 hover:shadow-lg"
        style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">
              {title}
            </p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              {value}
            </p>
            {subtitle && (
              <p className={`text-sm ${subtitleColor}`}>
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}
          >
            <Icon className="w-6 h-6 text-gray-700" />
          </div>
        </div>
        {trend && trendValue && (
          <div className="mt-3 flex items-center gap-1">
            {trend === 'up' && (
              <span className="text-green-500 text-sm">↗ {trendValue}</span>
            )}
            {trend === 'down' && (
              <span className="text-red-500 text-sm">↘ {trendValue}</span>
            )}
            {trend === 'neutral' && (
              <span className="text-gray-500 text-sm">{trendValue}</span>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
