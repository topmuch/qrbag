'use client';

import { useState } from 'react';
import { Route, MapPin, Ruler, Clock } from 'lucide-react';
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

interface CreateRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess: () => void;
}

export default function CreateRouteModal({
  isOpen,
  onClose,
  companyId,
  onSuccess
}: CreateRouteModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    origin: '',
    destination: '',
    distance: '',
    estimatedTime: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.length < 3) {
      newErrors.name = 'Le nom de la route est requis';
    }

    if (!formData.origin || formData.origin.length < 2) {
      newErrors.origin = 'La ville de départ est requise';
    }

    if (!formData.destination || formData.destination.length < 2) {
      newErrors.destination = 'La ville d\'arrivée est requise';
    }

    if (formData.distance && parseFloat(formData.distance) <= 0) {
      newErrors.distance = 'La distance doit être positive';
    }

    if (formData.estimatedTime && parseInt(formData.estimatedTime) <= 0) {
      newErrors.estimatedTime = 'La durée doit être positive';
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
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          distance: formData.distance ? parseFloat(formData.distance) : null,
          estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
          companyId
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Route créée avec succès');
        setFormData({
          name: '',
          origin: '',
          destination: '',
          distance: '',
          estimatedTime: ''
        });
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur lors de la création de la route');
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

  // Auto-generate route name
  const autoGenerateName = () => {
    if (formData.origin && formData.destination) {
      const name = `${formData.origin} - ${formData.destination}`;
      handleChange('name', name);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-[#8B5CF6]" />
            Nouvelle Route
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle route pour vos voyages
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Origin */}
          <div className="space-y-2">
            <Label htmlFor="origin" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-500" /> Ville de départ *
            </Label>
            <Input
              id="origin"
              type="text"
              placeholder="Abidjan"
              value={formData.origin}
              onChange={(e) => handleChange('origin', e.target.value)}
              onBlur={autoGenerateName}
              className={errors.origin ? 'border-red-500' : ''}
            />
            {errors.origin && <p className="text-xs text-red-500">{errors.origin}</p>}
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <Label htmlFor="destination" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" /> Ville d'arrivée *
            </Label>
            <Input
              id="destination"
              type="text"
              placeholder="Yamoussoukro"
              value={formData.destination}
              onChange={(e) => handleChange('destination', e.target.value)}
              onBlur={autoGenerateName}
              className={errors.destination ? 'border-red-500' : ''}
            />
            {errors.destination && <p className="text-xs text-red-500">{errors.destination}</p>}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Route className="w-4 h-4" /> Nom de la route *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Abidjan - Yamoussoukro"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            <p className="text-xs text-gray-500">Généré automatiquement à partir des villes</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Distance */}
            <div className="space-y-2">
              <Label htmlFor="distance" className="flex items-center gap-2">
                <Ruler className="w-4 h-4" /> Distance (km)
              </Label>
              <Input
                id="distance"
                type="number"
                min="1"
                step="0.1"
                placeholder="250"
                value={formData.distance}
                onChange={(e) => handleChange('distance', e.target.value)}
                className={errors.distance ? 'border-red-500' : ''}
              />
              {errors.distance && <p className="text-xs text-red-500">{errors.distance}</p>}
            </div>

            {/* Estimated Time */}
            <div className="space-y-2">
              <Label htmlFor="estimatedTime" className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> Durée (min)
              </Label>
              <Input
                id="estimatedTime"
                type="number"
                min="1"
                placeholder="240"
                value={formData.estimatedTime}
                onChange={(e) => handleChange('estimatedTime', e.target.value)}
                className={errors.estimatedTime ? 'border-red-500' : ''}
              />
              {errors.estimatedTime && <p className="text-xs text-red-500">{errors.estimatedTime}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer la route'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
