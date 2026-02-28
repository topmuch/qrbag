'use client';

import { useState } from 'react';
import { Route, MapPin, Ruler, Clock, Plus, Trash2, Coffee, Fuel, Utensils, AlertTriangle, Navigation, GripVertical } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Browser-compatible UUID generator
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface Checkpoint {
  id: string;
  name: string;
  type: 'DEPART' | 'PAUSE' | 'ARRIVAL';
  order: number;
  recommendedDuration?: number;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

interface CreateRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess: () => void;
  editRoute?: any; // For editing existing route
}

const checkpointTypes = [
  { value: 'DEPART', label: 'Départ', icon: Navigation, color: 'bg-green-500', emoji: '🚩' },
  { value: 'PAUSE', label: 'Pause', icon: Coffee, color: 'bg-orange-500', emoji: '⏸️' },
  { value: 'ARRIVAL', label: 'Arrivée', icon: MapPin, color: 'bg-purple-500', emoji: '🏁' },
];

const pauseTypes = [
  { value: 'REPOS', label: 'Repos', icon: Coffee },
  { value: 'REPAS', label: 'Repas', icon: Utensils },
  { value: 'CARBURANT', label: 'Carburant', icon: Fuel },
  { value: 'CONTROLE', label: 'Contrôle', icon: AlertTriangle },
];

export default function CreateRouteModal({
  isOpen,
  onClose,
  companyId,
  onSuccess,
  editRoute
}: CreateRouteModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editRoute?.name || '',
    origin: editRoute?.origin || '',
    destination: editRoute?.destination || '',
    distance: editRoute?.distance || '',
    estimatedTime: editRoute?.estimatedTime || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Checkpoints state - initialize with editRoute checkpoints or defaults
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(() => {
    if (editRoute?.checkpoints && editRoute.checkpoints.length > 0) {
      return editRoute.checkpoints.map((cp: any) => ({
        id: generateId(),
        name: cp.name,
        type: cp.type,
        order: cp.order,
        recommendedDuration: cp.recommendedDuration || undefined,
        latitude: cp.latitude || undefined,
        longitude: cp.longitude || undefined,
        notes: cp.notes || undefined
      }));
    }
    return [
      { id: generateId(), name: '', type: 'DEPART', order: 1, recommendedDuration: 0 },
      { id: generateId(), name: '', type: 'ARRIVAL', order: 2, recommendedDuration: 0 },
    ];
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.length < 3) {
      newErrors.name = 'Le nom de la route est requis (min. 3 caractères)';
    }

    if (!formData.origin || formData.origin.length < 2) {
      newErrors.origin = 'La ville de départ est requise';
    }

    if (!formData.destination || formData.destination.length < 2) {
      newErrors.destination = 'La ville d\'arrivée est requise';
    }

    // Validate checkpoints
    const departCheckpoint = checkpoints.find(c => c.type === 'DEPART');
    const arrivalCheckpoint = checkpoints.find(c => c.type === 'ARRIVAL');

    if (!departCheckpoint?.name) {
      newErrors.checkpoints = 'Le lieu de départ est requis';
    }

    if (!arrivalCheckpoint?.name) {
      newErrors.checkpoints = 'Le lieu d\'arrivée est requis';
    }

    // Validate all pauses have names if they exist
    const pausesWithoutNames = checkpoints.filter(c => c.type === 'PAUSE' && !c.name);
    if (pausesWithoutNames.length > 0) {
      newErrors.checkpoints = 'Toutes les pauses doivent avoir un nom';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addCheckpoint = () => {
    const arrivalIndex = checkpoints.findIndex(c => c.type === 'ARRIVAL');
    const pauseCount = checkpoints.filter(c => c.type === 'PAUSE').length;

    const newCheckpoint: Checkpoint = {
      id: generateId(),
      name: '',
      type: 'PAUSE',
      order: arrivalIndex + 1,
      recommendedDuration: 20,
      notes: 'REPOS'
    };

    const updatedCheckpoints = [...checkpoints];
    updatedCheckpoints.splice(arrivalIndex, 0, newCheckpoint);

    // Reorder all checkpoints
    updatedCheckpoints.forEach((c, i) => c.order = i + 1);
    setCheckpoints(updatedCheckpoints);
  };

  const removeCheckpoint = (id: string) => {
    const checkpoint = checkpoints.find(c => c.id === id);
    if (checkpoint?.type === 'DEPART' || checkpoint?.type === 'ARRIVAL') {
      toast.error('Impossible de supprimer le départ ou l\'arrivée');
      return;
    }

    const updatedCheckpoints = checkpoints.filter(c => c.id !== id);
    updatedCheckpoints.forEach((c, i) => c.order = i + 1);
    setCheckpoints(updatedCheckpoints);
  };

  const updateCheckpoint = (id: string, field: keyof Checkpoint, value: any) => {
    setCheckpoints(checkpoints.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setLoading(true);
    try {
      // Prepare checkpoints data
      const checkpointsData = checkpoints
        .sort((a, b) => a.order - b.order)
        .map((cp, index) => ({
          name: cp.name,
          type: cp.type,
          order: index + 1,
          recommendedDuration: cp.type === 'PAUSE' ? cp.recommendedDuration : null,
          latitude: cp.latitude || null,
          longitude: cp.longitude || null,
          notes: cp.type === 'PAUSE' ? cp.notes : null
        }));

      const url = '/api/routes';
      const method = editRoute ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editRoute?.id,
          ...formData,
          distance: formData.distance ? parseFloat(formData.distance) : null,
          estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
          companyId,
          checkpoints: checkpointsData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la route');
      }

      toast.success(editRoute ? 'Route mise à jour avec succès' : 'Route créée avec succès');
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      origin: '',
      destination: '',
      distance: '',
      estimatedTime: ''
    });
    setCheckpoints([
      { id: generateId(), name: '', type: 'DEPART', order: 1, recommendedDuration: 0 },
      { id: generateId(), name: '', type: 'ARRIVAL', order: 2, recommendedDuration: 0 },
    ]);
    setErrors({});
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

  // Auto-fill checkpoint names from cities
  const autoFillCheckpoints = () => {
    if (formData.origin) {
      const departCheckpoint = checkpoints.find(c => c.type === 'DEPART');
      if (departCheckpoint && !departCheckpoint.name) {
        updateCheckpoint(departCheckpoint.id, 'name', `Gare routière ${formData.origin}`);
      }
    }
    if (formData.destination) {
      const arrivalCheckpoint = checkpoints.find(c => c.type === 'ARRIVAL');
      if (arrivalCheckpoint && !arrivalCheckpoint.name) {
        updateCheckpoint(arrivalCheckpoint.id, 'name', `Gare routière ${formData.destination}`);
      }
    }
  };

  const sortedCheckpoints = [...checkpoints].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-[#8B5CF6]" />
            {editRoute ? 'Modifier la Route' : 'Nouvelle Route avec Checkpoints'}
          </DialogTitle>
          <DialogDescription>
            Configurez une route avec ses checkpoints : départ, pauses et arrivée
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Route Info */}
          <div className="space-y-4 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              Informations de la Route
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Origin */}
              <div className="space-y-2">
                <Label htmlFor="origin" className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  Ville de départ *
                </Label>
                <Input
                  id="origin"
                  type="text"
                  placeholder="Abidjan"
                  value={formData.origin}
                  onChange={(e) => handleChange('origin', e.target.value)}
                  onBlur={() => {
                    autoGenerateName();
                    autoFillCheckpoints();
                  }}
                  className={errors.origin ? 'border-red-500' : ''}
                />
                {errors.origin && <p className="text-xs text-red-500">{errors.origin}</p>}
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500" />
                  Ville d'arrivée *
                </Label>
                <Input
                  id="destination"
                  type="text"
                  placeholder="Yamoussoukro"
                  value={formData.destination}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  onBlur={() => {
                    autoGenerateName();
                    autoFillCheckpoints();
                  }}
                  className={errors.destination ? 'border-red-500' : ''}
                />
                {errors.destination && <p className="text-xs text-red-500">{errors.destination}</p>}
              </div>
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
                />
              </div>

              {/* Estimated Time */}
              <div className="space-y-2">
                <Label htmlFor="estimatedTime" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Durée estimée (min)
                </Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  min="1"
                  placeholder="240"
                  value={formData.estimatedTime}
                  onChange={(e) => handleChange('estimatedTime', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Checkpoints Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Checkpoints du Voyage ({checkpoints.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCheckpoint}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter une pause
              </Button>
            </div>

            {errors.checkpoints && (
              <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{errors.checkpoints}</p>
            )}

            <div className="space-y-3">
              {sortedCheckpoints.map((checkpoint, index) => {
                const typeConfig = checkpointTypes.find(t => t.value === checkpoint.type);
                const TypeIcon = typeConfig?.icon || MapPin;
                const isFirst = index === 0;
                const isLast = index === sortedCheckpoints.length - 1;

                return (
                  <div key={checkpoint.id}>
                    {/* Connection Line */}
                    {index > 0 && (
                      <div className="flex items-center ml-4 mb-2">
                        <div className="w-0.5 h-4 bg-gray-300" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "border-2 rounded-lg p-4 transition-all",
                        checkpoint.type === 'DEPART' && "border-green-300 bg-gradient-to-r from-green-50 to-emerald-50",
                        checkpoint.type === 'PAUSE' && "border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50",
                        checkpoint.type === 'ARRIVAL' && "border-purple-300 bg-gradient-to-r from-purple-50 to-violet-50"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Order Badge */}
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg",
                              typeConfig?.color
                            )}
                          >
                            {typeConfig?.emoji}
                          </div>
                          <span className="text-xs text-gray-500 mt-1">#{index + 1}</span>
                        </div>

                        <div className="flex-1 space-y-3">
                          {/* Type Badge and Actions */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              className={cn(
                                "text-sm py-1",
                                checkpoint.type === 'DEPART' && "bg-green-100 text-green-800",
                                checkpoint.type === 'PAUSE' && "bg-orange-100 text-orange-800",
                                checkpoint.type === 'ARRIVAL' && "bg-purple-100 text-purple-800"
                              )}
                            >
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {typeConfig?.label}
                            </Badge>

                            {checkpoint.type === 'PAUSE' && (
                              <select
                                value={checkpoint.notes || 'REPOS'}
                                onChange={(e) => updateCheckpoint(checkpoint.id, 'notes', e.target.value)}
                                className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
                              >
                                {pauseTypes.map((pt) => (
                                  <option key={pt.value} value={pt.value}>
                                    {pt.icon && <pt.icon className="w-3 h-3 inline mr-1" />}
                                    {pt.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* Name Input */}
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-600 font-medium">
                              Nom du lieu *
                            </Label>
                            <Input
                              placeholder={
                                checkpoint.type === 'DEPART' ? 'Ex: Gare routière Abidjan, Adjamé...' :
                                checkpoint.type === 'PAUSE' ? 'Ex: Station Total, Relais Sikensi...' :
                                'Ex: Gare routière Yamoussoukro...'
                              }
                              value={checkpoint.name}
                              onChange={(e) => updateCheckpoint(checkpoint.id, 'name', e.target.value)}
                              className="bg-white"
                            />
                          </div>

                          {/* Conditional Fields for PAUSE */}
                          {checkpoint.type === 'PAUSE' && (
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Durée (min)</Label>
                                <Input
                                  type="number"
                                  min="5"
                                  step="5"
                                  placeholder="20"
                                  value={checkpoint.recommendedDuration || ''}
                                  onChange={(e) => updateCheckpoint(checkpoint.id, 'recommendedDuration', parseInt(e.target.value) || 0)}
                                  className="h-9 bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Latitude</Label>
                                <Input
                                  type="number"
                                  step="0.0001"
                                  placeholder="5.35"
                                  value={checkpoint.latitude || ''}
                                  onChange={(e) => updateCheckpoint(checkpoint.id, 'latitude', parseFloat(e.target.value) || undefined)}
                                  className="h-9 bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Longitude</Label>
                                <Input
                                  type="number"
                                  step="0.0001"
                                  placeholder="-4.00"
                                  value={checkpoint.longitude || ''}
                                  onChange={(e) => updateCheckpoint(checkpoint.id, 'longitude', parseFloat(e.target.value) || undefined)}
                                  className="h-9 bg-white"
                                />
                              </div>
                            </div>
                          )}

                          {/* GPS for DEPART and ARRIVAL */}
                          {(checkpoint.type === 'DEPART' || checkpoint.type === 'ARRIVAL') && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Latitude (optionnel)</Label>
                                <Input
                                  type="number"
                                  step="0.0001"
                                  placeholder="5.3599"
                                  value={checkpoint.latitude || ''}
                                  onChange={(e) => updateCheckpoint(checkpoint.id, 'latitude', parseFloat(e.target.value) || undefined)}
                                  className="h-9 bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Longitude (optionnel)</Label>
                                <Input
                                  type="number"
                                  step="0.0001"
                                  placeholder="-4.0083"
                                  value={checkpoint.longitude || ''}
                                  onChange={(e) => updateCheckpoint(checkpoint.id, 'longitude', parseFloat(e.target.value) || undefined)}
                                  className="h-9 bg-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Delete Button for PAUSE */}
                        {checkpoint.type === 'PAUSE' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCheckpoint(checkpoint.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Helper Text */}
            <p className="text-xs text-gray-500 flex items-center gap-1">
              💡 Ajoutez des pauses entre le départ et l'arrivée pour définir les étapes du voyage.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {editRoute ? 'Modification...' : 'Création...'}
                </>
              ) : (
                <>
                  ✓ {editRoute ? 'Mettre à jour' : 'Créer la route'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
