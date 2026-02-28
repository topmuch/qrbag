'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, MapPin, QrCode, DollarSign, TrendingUp, 
  Package, Loader2, ChevronRight, BarChart3, AlertCircle,
  Clock, CheckCircle, XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import AgencyQRModal from './AgencyQRModal';

interface AgencyStats {
  id: string;
  name: string;
  email: string;
  city?: string;
  country?: string;
  isActive: boolean;
  totalPackages: number;
  activatedPackages: number;
  activePackages: number;
  expiredPackages: number;
  deliveredPackages: number;
  availablePackages: number;
  revenue: number;
  activationRate: number;
}

interface AgenciesListProps {
  companies: any[];
  onViewQRCodes?: (companyId: string) => void;
}

export default function AgenciesList({ companies, onViewQRCodes }: AgenciesListProps) {
  const [agencyStats, setAgencyStats] = useState<AgencyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgency, setSelectedAgency] = useState<AgencyStats | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchAgencyStats();
  }, [companies]);

  const fetchAgencyStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/agencies/stats');
      if (response.ok) {
        const data = await response.json();
        setAgencyStats(data);
      }
    } catch (error) {
      console.error('Error fetching agency stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQRCodes = (agency: AgencyStats) => {
    setSelectedAgency(agency);
    setModalOpen(true);
    onViewQRCodes?.(agency.id);
  };

  // Calculate global stats
  const globalStats = agencyStats.reduce((acc, agency) => ({
    totalAgencies: acc.totalAgencies + 1,
    totalQRGenerated: acc.totalQRGenerated + agency.totalPackages,
    totalQRActivated: acc.totalQRActivated + agency.activatedPackages,
    totalRevenue: acc.totalRevenue + agency.revenue,
    totalExpired: acc.totalExpired + agency.expiredPackages,
  }), {
    totalAgencies: 0,
    totalQRGenerated: 0,
    totalQRActivated: 0,
    totalRevenue: 0,
    totalExpired: 0,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#FF9F40] animate-spin" />
        <span className="ml-3 text-gray-600">Chargement des agences...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Summary */}
      <Card className="bg-gradient-to-r from-[#1E293B] to-[#334155] text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-[#FF9F40]" />
            <h3 className="text-xl font-bold">Résumé Global</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mx-auto mb-3">
                <Building2 className="w-6 h-6 text-[#5DADE2]" />
              </div>
              <p className="text-3xl font-bold">{globalStats.totalAgencies}</p>
              <p className="text-sm text-gray-400">Agences partenaires</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-[#58D68D]" />
              </div>
              <p className="text-3xl font-bold">{globalStats.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-400">FCFA revenus stickers</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-[#FF9F40]" />
              </div>
              <p className="text-3xl font-bold">{globalStats.totalQRActivated}</p>
              <p className="text-sm text-gray-400">QR codes activés</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mx-auto mb-3">
                <XCircle className="w-6 h-6 text-[#E74C3C]" />
              </div>
              <p className="text-3xl font-bold">{globalStats.totalExpired}</p>
              <p className="text-sm text-gray-400">QR codes expirés</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agencies List */}
      {agencyStats.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune agence trouvée</h3>
            <p className="text-gray-500">Créez une compagnie pour commencer à gérer les QR codes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agencyStats.map((agency) => (
            <Card 
              key={agency.id} 
              className={cn(
                "border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer",
                !agency.isActive && "opacity-60"
              )}
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF9F40] to-[#FF6B00] flex items-center justify-center text-white font-bold text-lg">
                      {agency.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{agency.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {agency.city}, {agency.country || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <Badge className={agency.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                    {agency.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <QrCode className="w-4 h-4" />
                      QR Codes
                    </div>
                    <p className="font-semibold text-gray-900">
                      {agency.totalPackages} générés
                    </p>
                    <p className="text-sm text-[#58D68D] font-medium">
                      {agency.activatedPackages} activés
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <DollarSign className="w-4 h-4" />
                      Revenus
                    </div>
                    <p className="font-semibold text-[#FF9F40]">
                      {agency.revenue.toLocaleString()} FCFA
                    </p>
                    <p className="text-xs text-gray-400">
                      200 FCFA × {agency.activatedPackages}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Taux d&apos;activation</span>
                    <span className="font-medium text-gray-900">{agency.activationRate}%</span>
                  </div>
                  <Progress 
                    value={agency.activationRate} 
                    className="h-2 bg-gray-100"
                  />
                </div>

                {/* Status Pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {agency.activePackages > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Clock className="w-3 h-3 mr-1" />
                      {agency.activePackages} actifs
                    </Badge>
                  )}
                  {agency.expiredPackages > 0 && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <XCircle className="w-3 h-3 mr-1" />
                      {agency.expiredPackages} expirés
                    </Badge>
                  )}
                  {agency.deliveredPackages > 0 && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {agency.deliveredPackages} livrés
                    </Badge>
                  )}
                  {agency.availablePackages > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Package className="w-3 h-3 mr-1" />
                      {agency.availablePackages} disponibles
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-[#FF9F40] hover:bg-[#E67E00] text-white"
                    onClick={() => handleViewQRCodes(agency)}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Voir les QR Codes
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-gray-200"
                    onClick={() => handleViewQRCodes(agency)}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Agency QR Modal */}
      {selectedAgency && (
        <AgencyQRModal
          agency={selectedAgency}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}
    </div>
  );
}
