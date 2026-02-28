'use client';

import { useState } from 'react';
import { Bus, Hash, Car, Users, Palette, Calendar } from 'lucide-react';
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
import { toast } from 'sonner';

interface CreateBusModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess: () => void;
}

const colorOptions = [
  { value: 'Orange', label: 'Orange' },
  { value: 'Bleu', label: 'Bleu' },
  { value: 'Vert', label: 'Vert' },
  { value: 'Blanc', label: 'Blanc' },
  { value: 'Rouge', label: 'Rouge' },
  { value: 'Jaune', label: 'Jaune' },
  { value: 'Gris', label: 'Gris' },
  { value: 'Noir', label: 'Noir' },
];

export default function CreateBusModal({
  isOpen,
  onClose,
  companyId,
  onSuccess
}: CreateBusModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plateNumber: '',
    model: '',
    capacity: '',
    color: 'Orange',
    year: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.plateNumber || formData.plateNumber.length < 3) {
      newErrors.plateNumber = 'Numéro d\'immatriculation requis';
    }

    if (formData.capacity && (parseInt(formData.capacity) < 1 || parseInt(formData.capacity) > 100)) {
      newErrors.capacity = 'Capacité invalide (1-100)';
    }

    if (formData.year && (parseInt(formData.year) < 1990 || parseInt(formData.year) > new Date().getFullYear() + 1)) {
      newErrors.year = `Année invalide (1990-${new Date().getFullYear() + 1})`;
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
      const response = await fetch('/api/buses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          year: formData.year ? parseInt(formData.year) : null,
          companyId
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Bus créé avec succès');
        setFormData({
          plateNumber: '',
          model: '',
          capacity: '',
          color: 'Orange',
          year: ''
        });
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur lors de la création du bus');
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
            <Bus className="w-5 h-5 text-[#10B981]" />
            Nouveau Bus
          </DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau bus à votre flotte
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Plate Number */}
          <div className="space-y-2">
            <Label htmlFor="plateNumber" className="flex items-center gap-2">
              <Hash className="w-4 h-4" /> Immatriculation *
            </Label>
            <Input
              id="plateNumber"
              type="text"
              placeholder="CI-5678-AB"
              value={formData.plateNumber}
              onChange={(e) => handleChange('plateNumber', e.target.value)}
              className={errors.plateNumber ? 'border-red-500' : ''}
            />
            {errors.plateNumber && <p className="text-xs text-red-500">{errors.plateNumber}</p>}
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model" className="flex items-center gap-2">
              <Car className="w-4 h-4" /> Marque / Modèle
            </Label>
            <Input
              id="model"
              type="text"
              placeholder="Volvo 9700"
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
            />
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity" className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Capacité (places)
            </Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="100"
              placeholder="55"
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', e.target.value)}
              className={errors.capacity ? 'border-red-500' : ''}
            />
            {errors.capacity && <p className="text-xs text-red-500">{errors.capacity}</p>}
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color" className="flex items-center gap-2">
              <Palette className="w-4 h-4" /> Couleur
            </Label>
            <Select value={formData.color} onValueChange={(value) => handleChange('color', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une couleur" />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border" 
                        style={{ 
                          backgroundColor: color.value.toLowerCase(),
                          borderColor: color.value === 'Blanc' ? '#ccc' : 'transparent'
                        }} 
                      />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label htmlFor="year" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Année
            </Label>
            <Input
              id="year"
              type="number"
              min="1990"
              max={new Date().getFullYear() + 1}
              placeholder="2021"
              value={formData.year}
              onChange={(e) => handleChange('year', e.target.value)}
              className={errors.year ? 'border-red-500' : ''}
            />
            {errors.year && <p className="text-xs text-red-500">{errors.year}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer le bus'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
