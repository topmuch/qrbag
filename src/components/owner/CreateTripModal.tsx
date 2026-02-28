'use client';

import { useState } from 'react';
import { Bus, User, Route, Calendar, Users, FileText, X, Loader2, AlertCircle, MapPin, Clock, Navigation, Coffee, Fuel, Utensils, AlertTriangle } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast, Toaster } from 'sonner';
import { cn } from '@/lib/utils';

interface Checkpoint {
  id: string;
  name: string;
  type: string;
  order: number;
  recommendedDuration?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

interface RouteWithCheckpoints {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance?: number | null;
  estimatedTime?: number | null;
  checkpoints?: Checkpoint[];
}

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  buses: any[];
  drivers: any[];
  routes: RouteWithCheckpoints[];
  companyId: string;
  onSuccess: () => void;
}

const checkpointTypeStyles: Record<string, { bg: string; text: string; emoji: string }> = {
  DEPART: { bg: 'bg-green-100', text: 'text-green-700', emoji: '🚩' },
  PAUSE: { bg: 'bg-orange-100', text: 'text-orange-700', emoji: '⏸️' },
  ARRIVAL: { bg: 'bg-purple-100', text: 'text-purple-700', emoji: '🏁' },
};

const pauseTypeLabels: Record<string, string> = {
  REPOS: 'Repos',
  REPAS: 'Repas',
  CARBURANT: 'Carburant',
  CONTROLE: 'Contrôle',
};

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
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    busId: '',
    driverId: '',
    routeId: '',
    departureTime: '',
    passengers: '',
    notes: ''
  });

  // Get selected route with checkpoints
  const selectedRoute = routes.find(r => r.id === formData.routeId);
  const routeCheckpoints = selectedRoute?.checkpoints || [];

  const availableBuses = buses.filter(b => b.isActive && !b.inTrip);
  const activeDrivers = drivers.filter(d => d.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.busId) {
      setError('Veuillez sélectionner un bus');
      toast.error('Veuillez sélectionner un bus');
      return;
    }

    if (!formData.driverId) {
      setError('Veuillez sélectionner un chauffeur');
      toast.error('Veuillez sélectionner un chauffeur');
      return;
    }

    if (!formData.routeId) {
      setError('Veuillez sélectionner une route');
      toast.error('Veuillez sélectionner une route');
      return;
    }

    if (!formData.departureTime) {
      setError('Veuillez sélectionner une date et heure de départ');
      toast.error('Veuillez sélectionner une date et heure de départ');
      return;
    }

    setError(null);
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

      const data = await response.json();

      if (response.ok) {
        toast.success('Voyage créé avec succès !', {
          description: `Route: ${selectedRoute?.name || 'N/A'}`
        });
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
      } else {
        setError(data.error || 'Erreur lors de la création');
        toast.error(data.error || 'Erreur lors de la création du voyage');
      }
    } catch (error: any) {
      console.error('Error creating trip:', error);
      setError('Erreur de connexion');
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${mins}min`;
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                <Bus className="w-4 h-4 text-[#10B981]" />
              </div>
              Nouveau Voyage
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Créez un nouveau trajet en sélectionnant une route avec ses checkpoints
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Route Selection - IMPORTANT: Show first */}
            <div className="space-y-3">
              <Label htmlFor="route" className="flex items-center gap-2 text-gray-700 font-medium">
                <Route className="w-4 h-4" /> Route *
              </Label>
              <Select
                value={formData.routeId}
                onValueChange={(value) => setFormData({ ...formData, routeId: value })}
              >
                <SelectTrigger className="border-gray-200 focus:border-[#10B981] focus:ring-[#10B981]">
                  <SelectValue placeholder="Sélectionner une route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      <div className="flex items-center gap-2">
                        <span>{route.name}</span>
                        {route.distance && (
                          <span className="text-gray-400">({route.distance} km)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {routes.length === 0 && (
                <p className="text-xs text-orange-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Aucune route configurée. Créez d'abord une route dans la section Routes.
                </p>
              )}
            </div>

            {/* Selected Route Checkpoints Display */}
            {selectedRoute && routeCheckpoints.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-blue-600" />
                      Checkpoints de la route
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      {selectedRoute.distance && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {selectedRoute.distance} km
                        </span>
                      )}
                      {selectedRoute.estimatedTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(selectedRoute.estimatedTime)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {routeCheckpoints
                      .sort((a, b) => a.order - b.order)
                      .map((checkpoint, index) => {
                        const styles = checkpointTypeStyles[checkpoint.type] || checkpointTypeStyles.PAUSE;
                        const isPause = checkpoint.type === 'PAUSE';

                        return (
                          <div
                            key={checkpoint.id}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-lg",
                              styles.bg
                            )}
                          >
                            <span className="text-lg">{styles.emoji}</span>
                            <div className="flex-1">
                              <span className={cn("font-medium", styles.text)}>
                                {checkpoint.name}
                              </span>
                              {isPause && checkpoint.notes && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {pauseTypeLabels[checkpoint.notes] || checkpoint.notes}
                                </Badge>
                              )}
                            </div>
                            {isPause && checkpoint.recommendedDuration && (
                              <span className="text-xs text-gray-500">
                                ({checkpoint.recommendedDuration} min)
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Total pauses info */}
                  {routeCheckpoints.some(cp => cp.type === 'PAUSE') && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Coffee className="w-3 h-3" />
                      {routeCheckpoints.filter(cp => cp.type === 'PAUSE').length} pause(s) prévue(s)
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Bus and Driver Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Bus Selection */}
              <div className="space-y-2">
                <Label htmlFor="bus" className="flex items-center gap-2 text-gray-700">
                  <Bus className="w-4 h-4" /> Bus *
                </Label>
                <Select
                  value={formData.busId}
                  onValueChange={(value) => setFormData({ ...formData, busId: value })}
                >
                  <SelectTrigger className="border-gray-200 focus:border-[#10B981]">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBuses.map((bus) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        <div className="flex items-center gap-2">
                          <span>{bus.plateNumber}</span>
                          {bus.model && <span className="text-gray-400">- {bus.model}</span>}
                        </div>
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
                <Label htmlFor="driver" className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4" /> Chauffeur *
                </Label>
                <Select
                  value={formData.driverId}
                  onValueChange={(value) => setFormData({ ...formData, driverId: value })}
                >
                  <SelectTrigger className="border-gray-200 focus:border-[#10B981]">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        <div className="flex items-center gap-2">
                          <span>{driver.name}</span>
                          {driver.licenseNumber && (
                            <span className="text-gray-400">({driver.licenseNumber})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeDrivers.length === 0 && (
                  <p className="text-xs text-orange-500">Aucun chauffeur actif</p>
                )}
              </div>
            </div>

            {/* Departure Time and Passengers Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Departure Time */}
              <div className="space-y-2">
                <Label htmlFor="departureTime" className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" /> Date et heure de départ *
                </Label>
                <Input
                  id="departureTime"
                  type="datetime-local"
                  value={formData.departureTime}
                  onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                  className="border-gray-200 focus:border-[#10B981] focus:ring-[#10B981]"
                  required
                />
              </div>

              {/* Passengers */}
              <div className="space-y-2">
                <Label htmlFor="passengers" className="flex items-center gap-2 text-gray-700">
                  <Users className="w-4 h-4" /> Passagers prévus
                </Label>
                <Input
                  id="passengers"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.passengers}
                  onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
                  className="border-gray-200 focus:border-[#10B981] focus:ring-[#10B981]"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2 text-gray-700">
                <FileText className="w-4 h-4" /> Notes (optionnel)
              </Label>
              <Textarea
                id="notes"
                placeholder="Informations supplémentaires sur ce voyage..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="border-gray-200 focus:border-[#10B981] focus:ring-[#10B981] resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-gray-200"
                onClick={handleClose}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white"
                disabled={loading || !formData.busId || !formData.driverId || !formData.routeId || !formData.departureTime}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    ✓ Créer le voyage
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
