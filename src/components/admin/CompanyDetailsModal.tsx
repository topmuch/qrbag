'use client';

import { useState, useEffect } from 'react';
import { Building2, Bus, Users, QrCode, CreditCard, MapPin, Mail, Phone,
  TrendingUp, Calendar, CheckCircle2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CompanyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string | null;
}

interface CompanyDetails {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  isActive: boolean;
  createdAt: string;
  busesCount: number;
  driversCount: number;
  revenue: number;
  subscription: {
    id: string;
    planType: string;
    monthlyFee: number;
    stickerFee: number;
    activatedStickers: number;
    status: string;
  } | null;
  stickers: {
    total: number;
    activated: number;
  };
}

export default function CompanyDetailsModal({
  isOpen,
  onClose,
  companyId
}: CompanyDetailsModalProps) {
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && companyId) {
      fetchCompanyDetails();
    }
  }, [isOpen, companyId]);

  const fetchCompanyDetails = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/companies/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanBadge = (planType: string) => {
    switch (planType) {
      case 'PACK_COMPLET':
        return { label: 'Pack Complet', color: 'bg-purple-100 text-purple-700' };
      case 'COLIS_ONLY':
        return { label: 'Colis Seul', color: 'bg-green-100 text-green-700' };
      case 'BUS_ONLY':
        return { label: 'Bus Seul', color: 'bg-blue-100 text-blue-700' };
      default:
        return { label: planType, color: 'bg-gray-100 text-gray-600' };
    }
  };

  const activationRate = company && company.stickers.total > 0
    ? Math.round((company.stickers.activated / company.stickers.total) * 100)
    : 0;

  if (!company && !loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-gray-900">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF9F40] to-[#FF6B00] flex items-center justify-center text-white font-bold">
              {loading ? '...' : company?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              {loading ? 'Chargement...' : company?.name}
              {company && (
                <Badge className={cn(
                  "ml-2",
                  company.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                )}>
                  {company.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Détails de la compagnie de transport
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">
            Chargement des détails...
          </div>
        ) : company && (
          <div className="space-y-6 py-4">
            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">Email</span>
                </div>
                <p className="text-gray-900 font-medium">{company.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Téléphone</span>
                </div>
                <p className="text-gray-900 font-medium">{company.phone || 'Non renseigné'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Adresse</span>
                </div>
                <p className="text-gray-900 font-medium">
                  {company.address ? `${company.address}, ` : ''}
                  {company.city}, {company.country}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Bus className="w-5 h-5 text-[#5DADE2] mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{company.busesCount}</p>
                <p className="text-xs text-gray-500">Bus</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <Users className="w-5 h-5 text-[#58D68D] mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{company.driversCount}</p>
                <p className="text-xs text-gray-500">Chauffeurs</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <QrCode className="w-5 h-5 text-[#9B59B6] mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{company.stickers.total}</p>
                <p className="text-xs text-gray-500">Stickers</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <TrendingUp className="w-5 h-5 text-[#FF9F40] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#FF9F40]">{(company.revenue / 1000).toFixed(1)}k</p>
                <p className="text-xs text-gray-500">Revenus FCFA</p>
              </div>
            </div>

            {/* Subscription */}
            {company.subscription && (
              <div className="bg-gray-50 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-[#9B59B6]" />
                    <span className="font-medium text-gray-900">Abonnement</span>
                  </div>
                  <Badge className={getPlanBadge(company.subscription.planType).color}>
                    {getPlanBadge(company.subscription.planType).label}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Frais mensuels</p>
                    <p className="text-gray-900 font-bold">{company.subscription.monthlyFee.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Prix/sticker</p>
                    <p className="text-gray-900 font-bold">{company.subscription.stickerFee} FCFA</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Stickers activés</p>
                    <p className="text-gray-900 font-bold">{company.subscription.activatedStickers}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sticker Activation Progress */}
            <div className="bg-gray-50 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Taux d&apos;activation des stickers</span>
                <span className="text-sm font-bold text-[#FF9F40]">{activationRate}%</span>
              </div>
              <Progress value={activationRate} className="h-2" />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{company.stickers.activated} activés</span>
                <span>{company.stickers.total} total</span>
              </div>
            </div>

            {/* Revenue Breakdown */}
            {company.subscription && (
              <div className="bg-gradient-to-r from-[#FF9F40]/5 to-[#FF6B00]/5 rounded-lg p-5 border border-[#FF9F40]/20">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#FF9F40]" />
                  Répartition des revenus
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Abonnement mensuel</p>
                    <p className="text-xl font-bold text-[#9B59B6]">{company.subscription.monthlyFee.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Revenus stickers</p>
                    <p className="text-xl font-bold text-[#FF9F40]">
                      {(company.subscription.activatedStickers * company.subscription.stickerFee).toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total mensuel estimé</span>
                    <span className="text-2xl font-bold text-[#58D68D]">{company.revenue.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Inscrite le {new Date(company.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              {company.subscription && (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Abonnement actif
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={onClose} className="border-gray-200 text-gray-600">
                Fermer
              </Button>
              <Button className="bg-[#FF9F40] hover:bg-[#E67E00] text-white">
                Voir les détails complets
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
