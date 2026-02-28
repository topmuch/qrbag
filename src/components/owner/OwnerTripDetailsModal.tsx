'use client';

import { useState, useEffect } from 'react';
import { 
  Bus, MapPin, Clock, User, Package, Printer,
  CheckCircle2, Pause, Play, Flag, AlertTriangle,
  Phone, Navigation, Calendar, X, RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Checkpoint {
  id: string;
  name: string;
  type: string;
  order: number;
  recommendedDuration: number | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
}

interface TripDetails {
  id: string;
  trackingCode: string;
  status: string;
  departureTime: string;
  actualDeparture: string | null;
  arrivalTime: string | null;
  actualArrival: string | null;
  passengers: number;
  currentLat: number | null;
  currentLng: number | null;
  notes: string | null;
  bus: {
    id: string;
    plateNumber: string;
    model: string | null;
    capacity: number | null;
  };
  driver: {
    id: string;
    name: string;
    phone: string | null;
  };
  route: {
    id: string;
    name: string;
    origin: string;
    destination: string;
    distance: number | null;
    estimatedTime: number | null;
    Checkpoints?: Checkpoint[];
  };
  scans: Array<{
    id: string;
    type: string;
    timestamp: string;
    latitude: number | null;
    longitude: number | null;
    notes: string | null;
  }>;
  packagesCount: number;
  packages: Array<{
    id: string;
    qrCode: string;
    status: string;
    senderName: string | null;
    recipientName: string | null;
    recipientPhone: string | null;
  }>;
}

interface OwnerTripDetailsModalProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

export default function OwnerTripDetailsModal({ 
  tripId, 
  open, 
  onOpenChange,
  onRefresh
}: OwnerTripDetailsModalProps) {
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && tripId) {
      fetchTripDetails();
    }
  }, [open, tripId]);

  const fetchTripDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/trips?tripId=${tripId}`);
      if (response.ok) {
        const data = await response.json();
        setTrip(data);
      }
    } catch (error) {
      console.error('Error fetching trip details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string }> = {
      'SCHEDULED': { label: 'Planifié', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      'IN_PROGRESS': { label: 'En route', color: 'text-green-700', bgColor: 'bg-green-100' },
      'PAUSED': { label: 'En pause', color: 'text-orange-700', bgColor: 'bg-orange-100' },
      'COMPLETED': { label: 'Terminé', color: 'text-gray-700', bgColor: 'bg-gray-100' },
      'CANCELLED': { label: 'Annulé', color: 'text-red-700', bgColor: 'bg-red-100' },
    };
    return configs[status] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
  };

  const getCheckpointConfig = (type: string) => {
    const configs: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
      'DEPART': { label: 'Départ', icon: Navigation, color: 'text-green-600', bgColor: 'bg-green-500' },
      'DEPARTURE': { label: 'Départ', icon: Navigation, color: 'text-green-600', bgColor: 'bg-green-500' },
      'PAUSE': { label: 'Pause', icon: Pause, color: 'text-orange-600', bgColor: 'bg-orange-500' },
      'RESUME': { label: 'Reprise', icon: Play, color: 'text-blue-600', bgColor: 'bg-blue-500' },
      'ARRIVAL': { label: 'Arrivée', icon: Flag, color: 'text-purple-600', bgColor: 'bg-purple-500' },
    };
    return configs[type] || { label: type, icon: CheckCircle2, color: 'text-gray-600', bgColor: 'bg-gray-500' };
  };

  // Get checkpoint status from scans
  const getCheckpointStatus = (checkpointType: string) => {
    if (!trip) return { completed: false, scan: null };
    
    const scan = trip.scans.find(s => s.type === checkpointType);
    return {
      completed: !!scan,
      scan
    };
  };

  // Calculate pause duration
  const calculatePauseDuration = () => {
    if (!trip) return null;
    
    const pauseScan = trip.scans.find(s => s.type === 'PAUSE');
    const resumeScan = trip.scans.find(s => s.type === 'RESUME');
    
    if (pauseScan && !resumeScan && trip.status === 'PAUSED') {
      const duration = Math.floor(
        (new Date().getTime() - new Date(pauseScan.timestamp).getTime()) / 60000
      );
      return { duration, ongoing: true };
    }
    
    if (pauseScan && resumeScan) {
      const duration = Math.floor(
        (new Date(resumeScan.timestamp).getTime() - new Date(pauseScan.timestamp).getTime()) / 60000
      );
      return { duration, ongoing: false };
    }
    
    return null;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-[#10B981] animate-spin" />
            <span className="ml-3 text-gray-600">Chargement...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!trip) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Voyage non trouvé</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const statusConfig = getStatusConfig(trip.status);
  const pauseInfo = calculatePauseDuration();

  // Get checkpoints from route or use defaults
  const checkpoints = trip.route?.Checkpoints || [
    { id: '1', name: trip.route.origin, type: 'DEPARTURE', order: 1, recommendedDuration: null, latitude: null, longitude: null, notes: null },
    { id: '2', name: trip.route.destination, type: 'ARRIVAL', order: 2, recommendedDuration: null, latitude: null, longitude: null, notes: null },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                  <Bus className="w-4 h-4 text-[#10B981]" />
                </div>
                Détails du Voyage
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                {trip.route.origin} → {trip.route.destination}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Code: {trip.trackingCode}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchTripDetails}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              <Badge className={statusConfig.bgColor + ' ' + statusConfig.color}>
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* General Info */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              📋 Informations Générales
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Route
                </p>
                <p className="font-medium text-gray-900">{trip.route.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  Distance
                </p>
                <p className="font-medium text-gray-900">
                  {trip.route.distance ? `${trip.route.distance} km` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Durée estimée
                </p>
                <p className="font-medium text-gray-900">
                  {trip.route.estimatedTime ? `${trip.route.estimatedTime} min` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Date
                </p>
                <p className="font-medium text-gray-900">
                  {format(new Date(trip.departureTime), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          </section>

          {/* Vehicle & Driver */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              🚌 Véhicule & Chauffeur
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Bus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{trip.bus.plateNumber}</p>
                    <p className="text-sm text-gray-500">{trip.bus.model || 'Modèle non spécifié'}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Capacité: <span className="font-medium">{trip.bus.capacity || 'N/A'} places</span>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{trip.driver.name}</p>
                    <p className="text-sm text-gray-500">Chauffeur</p>
                  </div>
                </div>
                {trip.driver.phone && (
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{trip.driver.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Statistics */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              📊 Statistiques
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{trip.passengers}</p>
                <p className="text-xs text-gray-500">Passagers</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{trip.packagesCount}</p>
                <p className="text-xs text-gray-500">Colis</p>
              </div>
              {pauseInfo && (
                <div className={cn(
                  "rounded-lg p-3 text-center",
                  pauseInfo.duration > 120 ? "bg-red-50" : 
                  pauseInfo.duration > 20 ? "bg-orange-50" : "bg-blue-50"
                )}>
                  <p className={cn(
                    "text-2xl font-bold",
                    pauseInfo.duration > 120 ? "text-red-600" : 
                    pauseInfo.duration > 20 ? "text-orange-600" : "text-blue-600"
                  )}>
                    {pauseInfo.duration} min
                  </p>
                  <p className="text-xs text-gray-500">
                    {pauseInfo.ongoing ? 'Pause en cours' : 'Pause totale'}
                  </p>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{trip.scans.length}</p>
                <p className="text-xs text-gray-500">Checkpoints</p>
              </div>
            </div>
          </section>

          {/* Checkpoints Timeline */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              ⏱️ Timeline des Checkpoints
            </h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              
              <div className="space-y-4">
                {checkpoints.sort((a, b) => a.order - b.order).map((checkpoint, idx) => {
                  const config = getCheckpointConfig(checkpoint.type);
                  const Icon = config.icon;
                  const status = getCheckpointStatus(checkpoint.type);
                  
                  return (
                    <div key={checkpoint.id} className="relative pl-10">
                      {/* Dot */}
                      <div className={cn(
                        "absolute left-2 w-5 h-5 rounded-full flex items-center justify-center",
                        status.completed ? config.bgColor : "bg-gray-200"
                      )}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      
                      <div className={cn(
                        "rounded-lg border p-4",
                        status.completed ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn(
                            "font-medium",
                            status.completed ? "text-gray-900" : "text-gray-400"
                          )}>
                            {idx + 1}. {checkpoint.name || config.label}
                          </span>
                          {status.completed ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Complété
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-500">En attente</Badge>
                          )}
                        </div>
                        
                        {status.completed && status.scan ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>
                                {format(new Date(status.scan.timestamp), "dd/MM/yyyy à HH:mm:ss", { locale: fr })}
                              </span>
                            </div>
                            
                            {status.scan.latitude && status.scan.longitude && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>
                                  {status.scan.latitude.toFixed(4)}, {status.scan.longitude.toFixed(4)}
                                </span>
                              </div>
                            )}
                            
                            {status.scan.notes && (
                              <div className="bg-gray-50 rounded p-2 mt-2 text-gray-600">
                                📝 {status.scan.notes}
                              </div>
                            )}
                            
                            {checkpoint.recommendedDuration && checkpoint.type === 'PAUSE' && (
                              <div className="text-xs text-gray-500">
                                Durée recommandée: {checkpoint.recommendedDuration} min
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            En attente du checkpoint...
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Packages */}
          {trip.packages.length > 0 && (
            <section>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                📦 Colis à Bord ({trip.packages.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {trip.packages.map((pkg) => (
                  <div 
                    key={pkg.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-mono text-sm font-medium text-gray-900">{pkg.qrCode}</p>
                        <p className="text-xs text-gray-500">
                          {pkg.recipientName || 'Destinataire non spécifié'}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">{pkg.status}</Badge>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {trip.notes && (
            <section>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                📝 Notes
              </h3>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100 text-gray-700">
                {trip.notes}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
