'use client';

import { motion } from 'framer-motion';
import { Building2, Eye, QrCode, Bus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    stickerFee: number;
    activatedStickers: number;
  } | null;
  stickers: {
    total: number;
    activated: number;
  };
  revenue: number;
}

interface CompaniesTableProps {
  companies: Company[];
  onViewCompany: (companyId: string) => void;
  onGenerateQR: (companyId: string) => void;
  onAddCompany: () => void;
}

const planLabels: Record<string, { label: string; className: string }> = {
  BUS_ONLY: { label: 'Bus Seul', className: 'bg-blue-100 text-blue-700' },
  COLIS_ONLY: { label: 'Colis Seul', className: 'bg-green-100 text-green-700' },
  PACK_COMPLET: { label: 'Pack Complet', className: 'bg-purple-100 text-purple-700' }
};

export default function CompaniesTable({ 
  companies, 
  onViewCompany, 
  onGenerateQR,
  onAddCompany 
}: CompaniesTableProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Compagnies partenaires</CardTitle>
            <p className="text-sm text-gray-500">Gérez toutes les compagnies inscrites</p>
          </div>
          <Button
            className="bg-[#FF8C00] hover:bg-[#E67E00] text-white"
            onClick={onAddCompany}
          >
            + Nouvelle compagnie
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {companies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune compagnie inscrite</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Compagnie</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Forfait</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500">Bus</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500">Chauffeurs</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500">Stickers</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">Revenus</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500">Statut</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {companies.map((company, index) => (
                  <motion.tr
                    key={company.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Company Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FF8C00] flex items-center justify-center text-white font-bold">
                          {getInitials(company.name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{company.name}</p>
                          <p className="text-sm text-gray-500">
                            {company.city}, {company.country}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="p-4">
                      {company.subscription ? (
                        <Badge className={planLabels[company.subscription.planType]?.className || ''}>
                          {planLabels[company.subscription.planType]?.label || company.subscription.planType}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">Non défini</span>
                      )}
                    </td>

                    {/* Buses */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Bus className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{company.busesCount}</span>
                      </div>
                    </td>

                    {/* Drivers */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{company.driversCount}</span>
                      </div>
                    </td>

                    {/* Stickers */}
                    <td className="p-4">
                      <div className="w-24">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{company.stickers.activated}</span>
                          <span>/ {company.stickers.total}</span>
                        </div>
                        <Progress 
                          value={company.stickers.total > 0 ? (company.stickers.activated / company.stickers.total) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="p-4 text-right">
                      <span className="font-semibold text-[#FF8C00]">
                        {company.revenue.toLocaleString()} FCFA
                      </span>
                      <p className="text-xs text-gray-500">/mois</p>
                    </td>

                    {/* Status */}
                    <td className="p-4 text-center">
                      <Badge className={company.isActive ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}>
                        {company.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewCompany(company.id)}
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onGenerateQR(company.id)}
                        >
                          <QrCode className="w-4 h-4 text-gray-500" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
