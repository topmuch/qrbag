'use client';

import { motion } from 'framer-motion';
import { Building2, Eye, QrCode, Bus, Users, ExternalLink, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Company {
  id: string;
  name: string;
  email: string;
  city?: string;
  country?: string;
  isActive: boolean;
  busesCount: number;
  driversCount: number;
  subscription: {
    planType: string;
    monthlyFee: number;
  } | null;
  stickers: {
    total: number;
    activated: number;
  };
  revenue: number;
}

interface CompaniesSectionModernProps {
  companies: Company[];
  onViewCompany: (id: string) => void;
  onGenerateQR: (id?: string) => void;
  onAddCompany: () => void;
}

const planConfig: Record<string, { label: string; className: string; color: string }> = {
  BUS_ONLY: { label: 'Bus Seul', className: 'bg-[#3B82F6]/20 text-[#60A5FA] border-[#3B82F6]/30', color: '#3B82F6' },
  COLIS_ONLY: { label: 'Colis Seul', className: 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/30', color: '#10B981' },
  PACK_COMPLET: { label: 'Pack Complet', className: 'bg-[#8B5CF6]/20 text-[#A78BFA] border-[#8B5CF6]/30', color: '#8B5CF6' }
};

export default function CompaniesSectionModern({
  companies,
  onViewCompany,
  onGenerateQR,
  onAddCompany
}: CompaniesSectionModernProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="bg-[#1E1E2E] border-white/5 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-12 h-12 rounded-xl bg-[#3B82F6]/20 flex items-center justify-center"
              >
                <Building2 className="w-6 h-6 text-[#60A5FA]" />
              </motion.div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Compagnies partenaires
                </h2>
                <p className="text-sm text-gray-500">
                  {companies.length} compagnies inscrites
                </p>
              </div>
            </div>
            <Button
              className="bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] hover:from-[#2563EB] hover:to-[#3B82F6] text-white"
              onClick={onAddCompany}
            >
              + Nouvelle compagnie
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#181825]">
              <tr>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compagnie
                </th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forfait
                </th>
                <th className="text-center p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bus
                </th>
                <th className="text-center p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chauffeurs
                </th>
                <th className="text-center p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stickers
                </th>
                <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenus
                </th>
                <th className="text-center p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-center p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {companies.map((company, index) => {
                const plan = company.subscription ? planConfig[company.subscription.planType] : null;
                const activationRate = company.stickers.total > 0
                  ? Math.round((company.stickers.activated / company.stickers.total) * 100)
                  : 0;

                return (
                  <motion.tr
                    key={company.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Company Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ 
                            background: `linear-gradient(135deg, ${plan?.color || '#6B7280'}, ${plan?.color || '#6B7280'}CC)` 
                          }}
                        >
                          {getInitials(company.name)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{company.name}</p>
                          <p className="text-sm text-gray-500">
                            {company.city}, {company.country}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="p-4">
                      {plan ? (
                        <Badge className={plan.className}>
                          {plan.label}
                        </Badge>
                      ) : (
                        <span className="text-gray-500 text-sm">Non défini</span>
                      )}
                    </td>

                    {/* Buses */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Bus className="w-4 h-4 text-gray-500" />
                        <span className="text-white font-medium">{company.busesCount}</span>
                      </div>
                    </td>

                    {/* Drivers */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-white font-medium">{company.driversCount}</span>
                      </div>
                    </td>

                    {/* Stickers */}
                    <td className="p-4">
                      <div className="w-24 mx-auto">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">{company.stickers.activated}</span>
                          <span className="text-gray-500">/ {company.stickers.total}</span>
                        </div>
                        <div className="h-2 bg-[#2A2A3A] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${activationRate}%` }}
                            transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: plan?.color || '#6B7280' }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="p-4 text-right">
                      <span className="font-semibold text-[#FF9F1C]">
                        {company.revenue.toLocaleString()} FCFA
                      </span>
                      <p className="text-xs text-gray-500">/mois</p>
                    </td>

                    {/* Status */}
                    <td className="p-4 text-center">
                      <Badge className={
                        company.isActive
                          ? 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/30'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }>
                        {company.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-lg hover:bg-white/5"
                          onClick={() => onViewCompany(company.id)}
                        >
                          <Eye className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-lg hover:bg-white/5"
                          onClick={() => onGenerateQR(company.id)}
                        >
                          <QrCode className="w-4 h-4 text-gray-400" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
