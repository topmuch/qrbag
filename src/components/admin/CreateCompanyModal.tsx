'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const countries = [
  'Côte d\'Ivoire',
  'Burkina Faso',
  'Mali',
  'Sénégal',
  'Ghana',
  'Bénin',
  'Togo',
  'Niger',
  'Guinée',
  'Cameroun'
];

const plans = [
  { value: 'BUS_ONLY', label: 'Bus Seul - 50 000 FCFA/mois', color: '#5DADE2' },
  { value: 'COLIS_ONLY', label: 'Colis Seul - 30 000 FCFA/mois', color: '#58D68D' },
  { value: 'PACK_COMPLET', label: 'Pack Complet - 70 000 FCFA/mois', color: '#9B59B6' }
];

export default function CreateCompanyModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: CreateCompanyModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    country: 'Côte d\'Ivoire',
    planType: 'PACK_COMPLET'
  });

  const getPlanPrice = (planType: string) => {
    switch (planType) {
      case 'BUS_ONLY': return '50 000 FCFA';
      case 'COLIS_ONLY': return '30 000 FCFA';
      case 'PACK_COMPLET': return '70 000 FCFA';
      default: return '70 000 FCFA';
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'BUS_ONLY': return '#5DADE2';
      case 'COLIS_ONLY': return '#58D68D';
      case 'PACK_COMPLET': return '#9B59B6';
      default: return '#FF9F40';
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.country) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setFormData({
          name: '',
          email: '',
          phone: '',
          city: '',
          country: 'Côte d\'Ivoire',
          planType: 'PACK_COMPLET'
        });
      }
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <div className="w-8 h-8 rounded-lg bg-[#5DADE2]/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#5DADE2]" />
            </div>
            Nouvelle Compagnie
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Créez une nouvelle compagnie de transport
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700">Nom de la compagnie *</Label>
            <Input
              id="name"
              placeholder="Ex: Transport Express Sénégal"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border-gray-200 focus:border-[#FF9F40] focus:ring-[#FF9F40]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-gray-200 focus:border-[#FF9F40] focus:ring-[#FF9F40]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700">Téléphone</Label>
              <Input
                id="phone"
                placeholder="+221 77 000 00 00"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-gray-200 focus:border-[#FF9F40] focus:ring-[#FF9F40]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-gray-700">Ville</Label>
              <Input
                id="city"
                placeholder="Dakar"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="border-gray-200 focus:border-[#FF9F40] focus:ring-[#FF9F40]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="text-gray-700">Pays</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger className="border-gray-200 focus:border-[#FF9F40]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan" className="text-gray-700">Forfait</Label>
            <Select
              value={formData.planType}
              onValueChange={(value) => setFormData({ ...formData, planType: value })}
            >
              <SelectTrigger className="border-gray-200 focus:border-[#FF9F40]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    <span style={{ color: plan.color }}>●</span> {plan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div 
            className="rounded-lg p-4 border"
            style={{ 
              backgroundColor: `${getPlanColor(formData.planType)}10`,
              borderColor: `${getPlanColor(formData.planType)}30`
            }}
          >
            <h4 className="font-medium text-gray-900 mb-2">Abonnement mensuel</h4>
            <p 
              className="text-2xl font-bold"
              style={{ color: getPlanColor(formData.planType) }}
            >
              {getPlanPrice(formData.planType)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              + 200 FCFA par sticker activé
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-gray-200">
            Annuler
          </Button>
          <Button
            className="bg-[#FF9F40] hover:bg-[#E67E00] text-white"
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.email}
          >
            {loading ? 'Création...' : '✓ Créer la compagnie'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
