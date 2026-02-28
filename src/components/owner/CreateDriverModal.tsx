'use client';

import { useState } from 'react';
import { User, Mail, Phone, CreditCard, Calendar, Lock, X } from 'lucide-react';
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
import { toast } from 'sonner';

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess: () => void;
}

export default function CreateDriverModal({
  isOpen,
  onClose,
  companyId,
  onSuccess
}: CreateDriverModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!/^\+?\d{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    if (formData.licenseNumber.length < 3) {
      newErrors.licenseNumber = 'Numéro de permis requis';
    }

    if (!formData.licenseExpiry) {
      newErrors.licenseExpiry = 'Date d\'expiration requise';
    } else if (new Date(formData.licenseExpiry) < new Date()) {
      newErrors.licenseExpiry = 'La date d\'expiration doit être future';
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          companyId
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Chauffeur créé avec succès');
        setFormData({
          name: '',
          email: '',
          phone: '',
          licenseNumber: '',
          licenseExpiry: '',
          password: ''
        });
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur lors de la création du chauffeur');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#3B82F6]" />
            Nouveau Chauffeur
          </DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau chauffeur à votre compagnie
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" /> Nom complet *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Jean-Baptiste Kouadio"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="driver@transport-express.ci"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> Téléphone *
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+225 07 00 00 00"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>

          {/* License Number */}
          <div className="space-y-2">
            <Label htmlFor="licenseNumber" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Numéro de permis *
            </Label>
            <Input
              id="licenseNumber"
              type="text"
              placeholder="CI-67890-2024"
              value={formData.licenseNumber}
              onChange={(e) => handleChange('licenseNumber', e.target.value)}
              className={errors.licenseNumber ? 'border-red-500' : ''}
            />
            {errors.licenseNumber && <p className="text-xs text-red-500">{errors.licenseNumber}</p>}
          </div>

          {/* License Expiry */}
          <div className="space-y-2">
            <Label htmlFor="licenseExpiry" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Date d'expiration du permis *
            </Label>
            <Input
              id="licenseExpiry"
              type="date"
              value={formData.licenseExpiry}
              onChange={(e) => handleChange('licenseExpiry', e.target.value)}
              className={errors.licenseExpiry ? 'border-red-500' : ''}
            />
            {errors.licenseExpiry && <p className="text-xs text-red-500">{errors.licenseExpiry}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" /> Mot de passe *
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 8 caractères"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer le chauffeur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
