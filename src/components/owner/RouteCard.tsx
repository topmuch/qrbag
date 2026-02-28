'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, TrendingUp, Navigation, Edit, Trash2, Eye, Coffee, Fuel, Utensils, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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

interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance?: number | null;
  estimatedTime?: number | null;
  checkpoints?: Checkpoint[];
  _count?: {
    trips: number;
  };
  createdAt: string;
}

interface RouteCardProps {
  route: Route;
  onEdit?: () => void;
  onDelete?: () => void;
  onRefresh?: () => void;
}

const pauseTypeIcons: Record<string, any> = {
  REPOS: Coffee,
  REPAS: Utensils,
  CARBURANT: Fuel,
  CONTROLE: AlertTriangle,
};

const pauseTypeLabels: Record<string, string> = {
  REPOS: 'Repos',
  REPAS: 'Repas',
  CARBURANT: 'Carburant',
  CONTROLE: 'Contrôle',
};

export default function RouteCard({ route, onEdit, onDelete, onRefresh }: RouteCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const checkpoints = route.checkpoints || [];
  const departureCheckpoint = checkpoints.find((cp) => cp.type === 'DEPART');
  const arrivalCheckpoint = checkpoints.find((cp) => cp.type === 'ARRIVAL');
  const pauses = checkpoints.filter((cp) => cp.type === 'PAUSE');

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${mins}min`;
  };

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la route "${route.name}" ?`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/routes?id=${route.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      toast.success('Route supprimée avec succès');
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-[#8B5CF6]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{route.name}</h3>
                  <p className="text-sm text-gray-500">
                    {route._count?.trips || 0} voyage{(route._count?.trips || 0) > 1 ? 's' : ''} effectué{(route._count?.trips || 0) > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                  className="text-gray-500 hover:text-[#8B5CF6]"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="text-gray-500 hover:text-blue-600"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Route Info */}
            <div className="flex items-center gap-4 text-sm">
              {route.distance && (
                <div className="flex items-center gap-1 text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>{route.distance} km</span>
                </div>
              )}
              {route.estimatedTime && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(route.estimatedTime)}</span>
                </div>
              )}
            </div>

            {/* Checkpoints Preview */}
            <div className="space-y-2">
              {/* Departure */}
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                  🚩
                </div>
                <span className="font-medium text-gray-900">
                  {departureCheckpoint?.name || route.origin}
                </span>
              </div>

              {/* Pauses (compact view) */}
              {pauses.length > 0 && (
                <div className="pl-6 space-y-1">
                  {pauses.slice(0, 2).map((pause, idx) => {
                    const PauseIcon = pause.notes ? pauseTypeIcons[pause.notes] || Coffee : Coffee;
                    return (
                      <div key={pause.id} className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs">
                          ⏸
                        </div>
                        <span>{pause.name}</span>
                        {pause.recommendedDuration && (
                          <span className="text-xs text-gray-400">
                            ({pause.recommendedDuration} min)
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {pauses.length > 2 && (
                    <span className="text-xs text-gray-400 pl-7">
                      +{pauses.length - 2} autre{(pauses.length - 2) > 1 ? 's' : ''} pause{(pauses.length - 2) > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}

              {/* Arrival */}
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
                  🏁
                </div>
                <span className="font-medium text-gray-900">
                  {arrivalCheckpoint?.name || route.destination}
                </span>
              </div>
            </div>

            {/* Checkpoints Count Badge */}
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {checkpoints.length} checkpoint{checkpoints.length > 1 ? 's' : ''}
              </Badge>
              {pauses.length > 0 && (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  {pauses.length} pause{pauses.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-[#8B5CF6]" />
              {route.name}
            </DialogTitle>
            <DialogDescription>
              Détails de la route et ses checkpoints
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Route Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Ville de départ</p>
                <p className="font-medium">{route.origin}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ville d'arrivée</p>
                <p className="font-medium">{route.destination}</p>
              </div>
              {route.distance && (
                <div>
                  <p className="text-xs text-gray-500">Distance</p>
                  <p className="font-medium">{route.distance} km</p>
                </div>
              )}
              {route.estimatedTime && (
                <div>
                  <p className="text-xs text-gray-500">Durée estimée</p>
                  <p className="font-medium">{formatDuration(route.estimatedTime)}</p>
                </div>
              )}
            </div>

            {/* Checkpoints Timeline */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Checkpoints</h4>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-3 top-6 bottom-6 w-0.5 bg-gray-200" />

                {checkpoints
                  .sort((a, b) => a.order - b.order)
                  .map((checkpoint, index) => {
                    const isDepart = checkpoint.type === 'DEPART';
                    const isArrival = checkpoint.type === 'ARRIVAL';
                    const isPause = checkpoint.type === 'PAUSE';

                    return (
                      <div
                        key={checkpoint.id}
                        className={cn(
                          'relative pl-10 pb-4',
                          index === checkpoints.length - 1 && 'pb-0'
                        )}
                      >
                        {/* Timeline dot */}
                        <div
                          className={cn(
                            'absolute left-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold z-10',
                            isDepart && 'bg-green-500',
                            isPause && 'bg-orange-500',
                            isArrival && 'bg-purple-500'
                          )}
                        >
                          {isDepart ? '🚩' : isArrival ? '🏁' : index}
                        </div>

                        {/* Content */}
                        <div className="bg-white border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={cn(
                                'text-xs',
                                isDepart && 'bg-green-100 text-green-700',
                                isPause && 'bg-orange-100 text-orange-700',
                                isArrival && 'bg-purple-100 text-purple-700'
                              )}
                            >
                              {isDepart ? 'Départ' : isArrival ? 'Arrivée' : 'Pause'}
                            </Badge>
                            {isPause && checkpoint.notes && (
                              <Badge variant="outline" className="text-xs">
                                {pauseTypeLabels[checkpoint.notes] || checkpoint.notes}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-gray-900">{checkpoint.name}</p>
                          {isPause && checkpoint.recommendedDuration && (
                            <p className="text-xs text-gray-500 mt-1">
                              Durée recommandée: {checkpoint.recommendedDuration} min
                            </p>
                          )}
                          {checkpoint.latitude && checkpoint.longitude && (
                            <p className="text-xs text-gray-400 mt-1">
                              📍 {checkpoint.latitude.toFixed(4)}, {checkpoint.longitude.toFixed(4)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDetails(false)}
              >
                Fermer
              </Button>
              <Button
                className="flex-1 bg-[#8B5CF6] hover:bg-[#7C3AED]"
                onClick={() => {
                  setShowDetails(false);
                  onEdit?.();
                }}
              >
                Modifier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
