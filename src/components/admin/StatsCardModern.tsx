'use client';

import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  color: 'orange' | 'green' | 'blue' | 'violet' | 'pink' | 'cyan';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  index?: number;
}

const colorConfig = {
  orange: {
    border: 'border-l-[#FF8C00]',
    bg: 'bg-[#FF8C00]/10',
    text: 'text-[#FF9F1C]',
    glow: 'shadow-[0_0_30px_rgba(255,140,0,0.15)]',
    iconBg: 'bg-gradient-to-br from-[#FF8C00] to-[#FFA500]',
    gradient: 'from-[#FF8C00]/5 to-transparent'
  },
  green: {
    border: 'border-l-[#10B981]',
    bg: 'bg-[#10B981]/10',
    text: 'text-[#34D399]',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
    iconBg: 'bg-gradient-to-br from-[#10B981] to-[#34D399]',
    gradient: 'from-[#10B981]/5 to-transparent'
  },
  blue: {
    border: 'border-l-[#3B82F6]',
    bg: 'bg-[#3B82F6]/10',
    text: 'text-[#60A5FA]',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.15)]',
    iconBg: 'bg-gradient-to-br from-[#3B82F6] to-[#60A5FA]',
    gradient: 'from-[#3B82F6]/5 to-transparent'
  },
  violet: {
    border: 'border-l-[#8B5CF6]',
    bg: 'bg-[#8B5CF6]/10',
    text: 'text-[#A78BFA]',
    glow: 'shadow-[0_0_30px_rgba(139,92,246,0.15)]',
    iconBg: 'bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA]',
    gradient: 'from-[#8B5CF6]/5 to-transparent'
  },
  pink: {
    border: 'border-l-[#EC4899]',
    bg: 'bg-[#EC4899]/10',
    text: 'text-[#F472B6]',
    glow: 'shadow-[0_0_30px_rgba(236,72,153,0.15)]',
    iconBg: 'bg-gradient-to-br from-[#EC4899] to-[#F472B6]',
    gradient: 'from-[#EC4899]/5 to-transparent'
  },
  cyan: {
    border: 'border-l-[#06B6D4]',
    bg: 'bg-[#06B6D4]/10',
    text: 'text-[#22D3EE]',
    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]',
    iconBg: 'bg-gradient-to-br from-[#06B6D4] to-[#22D3EE]',
    gradient: 'from-[#06B6D4]/5 to-transparent'
  }
};

export default function StatsCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
  trend,
  trendValue,
  index = 0
}: StatsCardProps) {
  const config = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${config.gradient}
        bg-[#1E1E2E] rounded-xl p-5
        border border-white/5 ${config.border} border-l-4
        ${config.glow}
        transition-all duration-300
      `}
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <Icon className="w-full h-full" />
      </div>

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1 font-medium">
            {title}
          </p>
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
            className={`text-3xl font-bold ${config.text} mb-1`}
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className="text-sm text-gray-500">
              {subtitle}
            </p>
          )}
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' && (
                <TrendingUp className="w-4 h-4 text-[#34D399]" />
              )}
              {trend === 'down' && (
                <TrendingDown className="w-4 h-4 text-[#EF4444]" />
              )}
              <span className={`text-sm ${
                trend === 'up' ? 'text-[#34D399]' : 
                trend === 'down' ? 'text-[#EF4444]' : 
                'text-gray-400'
              }`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>

        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`
            w-12 h-12 rounded-xl ${config.iconBg}
            flex items-center justify-center
            shadow-lg
          `}
        >
          <Icon className="w-6 h-6 text-white" />
        </motion.div>
      </div>
    </motion.div>
  );
}
