'use client';

import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Card } from '@/components/ui/card';

// Sample data for charts
const monthlyData = [
  { name: 'Jan', revenus: 85000, colis: 120, bus: 45 },
  { name: 'Fév', revenus: 92000, colis: 145, bus: 52 },
  { name: 'Mar', revenus: 78000, colis: 98, bus: 38 },
  { name: 'Avr', revenus: 105000, colis: 167, bus: 61 },
  { name: 'Mai', revenus: 113400, colis: 180, bus: 67 },
  { name: 'Juin', revenus: 98000, colis: 155, bus: 58 },
];

const subscriptionData = [
  { name: 'Pack Complet', value: 1, color: '#8B5CF6' },
  { name: 'Colis Seul', value: 1, color: '#10B981' },
  { name: 'Bus Seul', value: 0, color: '#3B82F6' },
];

const activationData = [
  { name: 'Activés', value: 69, color: '#34D399' },
  { name: 'Non activés', value: 131, color: '#3A3A4A' },
];

const companyPerformance = [
  { name: 'Transport Express CI', revenus: 75000, colis: 27 },
  { name: 'Savana Voyages', revenus: 38400, colis: 42 },
];

interface ChartSectionProps {
  monthlyRevenue?: number;
}

export default function ChartSection({ monthlyRevenue }: ChartSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-2"
      >
        <Card className="bg-[#1E1E2E] border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Évolution des revenus</h3>
              <p className="text-sm text-gray-500">6 derniers mois</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF8C00]" />
                <span className="text-sm text-gray-400">Revenus</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                <span className="text-sm text-gray-400">Colis</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF8C00" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorColis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6B7280" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#6B7280" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E1E2E', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                  }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#9CA3AF' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenus"
                  stroke="#FF8C00"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenus)"
                />
                <Line
                  type="monotone"
                  dataKey="colis"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Subscription Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-[#1E1E2E] border-white/5 rounded-xl p-6 h-full">
          <h3 className="text-lg font-semibold text-white mb-6">Abonnements</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E1E2E', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {subscriptionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-400">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Activation Rate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-[#1E1E2E] border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Taux d'activation</h3>
          <p className="text-sm text-gray-500 mb-4">Stickers QR Code</p>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#2A2A3A"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#FF8C00"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(69 / 200) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[#FF9F1C]">35%</span>
                <span className="text-xs text-gray-500">69/200</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#34D399]" />
              <span className="text-gray-400">Activés: 69</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#3A3A4A]" />
              <span className="text-gray-400">Restants: 131</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Company Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="lg:col-span-2"
      >
        <Card className="bg-[#1E1E2E] border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Performance par compagnie</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="#6B7280"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#6B7280"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  width={150}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E1E2E', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="revenus" 
                  fill="#FF8C00" 
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
