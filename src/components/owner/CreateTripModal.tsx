'use client';

import { useState } from 'react';
import { Bus, User, Route, Calendar, Users, FileText, X } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  buses: any[];
  drivers: any[];
  routes: any[];
  companyId: string;
  onSuccess: () => void;
}

export default function CreateTripModal({
  isOpen,
  onClose,
  buses,
  drivers,
  routes,
  companyId,
  onSuccess
}: CreateTripModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    busId: '',
    driverId: '',
    routeId: '',
    departureTime: '',
    passengers: '',
    notes: ''
  });

  const availableBuses = buses.filter(b => b.isActive && !b.inTrip);
  const activeDrivers = drivers.filter(d => d.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.busId || !formData.driverId || !formData.routeId || !formData.departureTime) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busId: formData.busId,
          driverId: formData.driverId,
          routeId: formData.routeId,
          departureTime: new Date(formData.departureTime).toISOString(),
          passengers: parseInt(formData.passengers) || 0,
          notes: formData.notes,
          companyId
        })
      });

      if (response.ok) {
        setFormData({
          busId: '',
          driverId: '',
          routeId: '',
          departureTime: '',
          passengers: '',
          notes: ''
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error creating trip:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-[#10B981]" />
            Nouveau Voyage
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau trajet pour votre compagnie
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Bus Selection */}
          <div className="space-y-2">
            <Label htmlFor="bus" className="flex items-center gap-2">
              <Bus className="w-4 h-4" /> Bus *
            </Label>
            <Select value={formData.busId} onValueChange={(value) => setFormData({...formData, busId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un bus" />
              </SelectTrigger>
              <SelectContent>
                {availableBuses.map((bus) => (
                  <SelectItem key={bus.id} value={bus.id}>
                    {bus.plateNumber} - {bus.model} ({bus.capacity} places)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableBuses.length === 0 && (
              <p className="text-xs text-orange-500">Aucun bus disponible</p>
            )}
          </div>

          {/* Driver Selection */}
          <div className="space-y-2">
            <Label htmlFor="driver" className="flex items-center gap-2">
              <User className="w-4 h-4" /> Chauffeur *
            </Label>
            <Select value={formData.driverId} onValueChange={(value) => setFormData({...formData, driverId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un chauffeur" />
              </SelectTrigger>
              <SelectContent>
                {activeDrivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name} - {driver.licenseNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Route Selection */}
          <div className="space-y-2">
            <Label htmlFor="route" className="flex items-center gap-2">
              <Route className="w-4 h-4" /> Route *
            </Label>
            <Select value={formData.routeId} onValueChange={(value) => setFormData({...formData, routeId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une route" />
              </SelectTrigger>
              <SelectContent>
                {routes.map((route) => (
                  <SelectItem key={route.id} value={route.id}>
                    {route.name} ({route.distance} km - {route.estimatedTime ? Math.floor(route.estimatedTime / 60) : 0}h)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Departure Time */}
          <div className="space-y-2">
            <Label htmlFor="departureTime" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Date et heure de départ *
            </Label>
            <Input
              id="departureTime"
              type="datetime-local"
              value={formData.departureTime}
              onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
              required
            />
          </div>

          {/* Passengers */}
          <div className="space-y-2">
            <Label htmlFor="passengers" className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Nombre de passagers prévus
            </Label>
            <Input
              id="passengers"
              type="number"
              min="0"
              placeholder="0"
              value={formData.passengers}
              onChange={(e) => setFormData({...formData, passengers: e.target.value})}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> Notes (optionnel)
            </Label>
            <Textarea
              id="notes"
              placeholder="Informations supplémentaires..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white"
              disabled={loading || !formData.busId || !formData.driverId || !formData.routeId || !formData.departureTime}
            >
              {loading ? 'Création...' : '✓ Créer le voyage'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
