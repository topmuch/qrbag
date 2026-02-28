'use client';

import { useState, useEffect } from 'react';
import { Bus, User, Route, MapPin, Clock, Package, CheckCircle2, Circle, X, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface TripDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string | null;
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
    model: string;
    capacity: number;
  } | null;
  driver: {
    id: string;
    name: string;
    phone: string;
  } | null;
  route: {
    id: string;
    name: string;
    origin: string;
    destination: string;
    distance: number | null;
    estimatedTime: number | null;
  } | null;
  scans: {
    id: string;
    type: string;
    timestamp: string;
    latitude: number | null;
    longitude: number | null;
    notes: string | null;
  }[];
  packagesCount: number;
  packages?: {
    id: string;
    qrCode: string;
    status: string;
    senderName: string | null;
    recipientName: string | null;
    pickupCode: string | null;
  }[];
}

export default function TripDetailsModal({
  isOpen,
  onClose,
  tripId
}: TripDetailsModalProps) {
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && tripId) {
      fetchTripDetails();
    }
  }, [isOpen, tripId]);

  const fetchTripDetails = async () => {
    if (!tripId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/trips/${tripId}`);
      if (response.ok) {
        const data = await response.json();
        setTrip(data);
      } else {
        // Use demo data if API fails
        setTrip(getDemoTripData());
      }
    } catch (error) {
      console.error('Error fetching trip details:', error);
      setTrip(getDemoTripData());
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Badge className="bg-green-100 text-green-700">En cours</Badge>;
      case 'SCHEDULED':
        return <Badge className="bg-blue-100 text-blue-700">Programmé</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-purple-100 text-purple-700">Terminé</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-700">Annulé</Badge>;
      case 'PAUSED':
        return <Badge className="bg-yellow-100 text-yellow-700">En pause</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600">{status}</Badge>;
    }
  };

  const getScanTypeLabel = (type: string) => {
    switch (type) {
      case 'DEPARTURE': return 'Départ';
      case 'PAUSE': return 'Pause';
      case 'RESUME': return 'Reprise';
      case 'ARRIVAL': return 'Arrivée';
      default: return type;
    }
  };

  const getScanIcon = (type: string, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    return <Circle className="w-5 h-5 text-gray-300" />;
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'En attente';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDemoTripData = (): TripDetails => ({
    id: 'trip-demo',
    trackingCode: 'TRK-A1B2C3',
    status: 'IN_PROGRESS',
    departureTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    actualDeparture: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    arrivalTime: null,
    actualArrival: null,
    passengers: 42,
    currentLat: 6.8276,
    currentLng: -5.2893,
    notes: null,
    bus: { id: 'bus-1', plateNumber: 'CI-5678-AB', model: 'Volvo 9700', capacity: 55 },
    driver: { id: 'driver-1', name: 'Jean-Baptiste Kouadio', phone: '+225 07 00 00 02' },
    route: { id: 'route-1', name: 'Abidjan - Yamoussoukro', origin: 'Abidjan', destination: 'Yamoussoukro', distance: 250, estimatedTime: 240 },
    scans: [
      { id: 'scan-1', type: 'DEPARTURE', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), latitude: 5.3599, longitude: -4.0082, notes: 'Départ à l\'heure' },
      { id: 'scan-2', type: 'PAUSE', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), latitude: 6.5, longitude: -4.5, notes: 'Pause café - Station Total Yamoussoukro' },
      { id: 'scan-3', type: 'RESUME', timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), latitude: 6.5, longitude: -4.5, notes: 'Reprise du voyage' }
    ],
    packagesCount: 2,
    packages: [
      { id: 'pkg-1', qrCode: 'QR-PKG-001-001', status: 'IN_TRANSIT', senderName: 'Client 1', recipientName: 'Destinataire 1', pickupCode: '1234' },
      { id: 'pkg-2', qrCode: 'QR-PKG-001-002', status: 'IN_TRANSIT', senderName: 'Client 2', recipientName: 'Destinataire 2', pickupCode: '5678' }
    ]
  });

  if (!trip && !loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{trip?.route?.name || 'Détails du voyage'}</span>
            {trip && getStatusBadge(trip.status)}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">
            Chargement des détails...
          </div>
        ) : trip && (
          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
              <TabsTrigger value="packages">Colis ({trip.packagesCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              {/* Bus Info */}
              {trip.bus && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Bus className="w-5 h-5 text-[#10B981]" />
                    <span className="font-medium">Bus</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Immatriculation:</span> <span className="font-medium">{trip.bus.plateNumber}</span></div>
                    <div><span className="text-gray-500">Modèle:</span> <span className="font-medium">{trip.bus.model}</span></div>
                    <div><span className="text-gray-500">Capacité:</span> <span className="font-medium">{trip.bus.capacity} places</span></div>
                  </div>
                </div>
              )}

              {/* Driver Info */}
              {trip.driver && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-5 h-5 text-[#3B82F6]" />
                    <span className="font-medium">Chauffeur</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{trip.driver.name}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Phone className="w-3 h-3" />
                        {trip.driver.phone}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Phone className="w-4 h-4 mr-1" /> Appeler
                    </Button>
                  </div>
                </div>
              )}

              {/* Route Info */}
              {trip.route && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Route className="w-5 h-5 text-[#8B5CF6]" />
                    <span className="font-medium">Route</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">De:</span> <span className="font-medium">{trip.route.origin}</span></div>
                    <div><span className="text-gray-500">À:</span> <span className="font-medium">{trip.route.destination}</span></div>
                    <div><span className="text-gray-500">Distance:</span> <span className="font-medium">{trip.route.distance} km</span></div>
                    <div><span className="text-gray-500">Durée estimée:</span> <span className="font-medium">{Math.floor((trip.route.estimatedTime || 0) / 60)}h{(trip.route.estimatedTime || 0) % 60}</span></div>
                  </div>
                </div>
              )}

              {/* Trip Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-[#F59E0B]" />
                  <span className="font-medium">Horaires</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Départ prévu:</span> <span className="font-medium">{formatDateTime(trip.departureTime)}</span></div>
                  <div><span className="text-gray-500">Départ réel:</span> <span className="font-medium">{formatDateTime(trip.actualDeparture)}</span></div>
                  <div><span className="text-gray-500">Arrivée prévue:</span> <span className="font-medium">{formatDateTime(trip.arrivalTime)}</span></div>
                  <div><span className="text-gray-500">Passagers:</span> <span className="font-medium">{trip.passengers}</span></div>
                </div>
              </div>

              {/* Last Known Position */}
              {trip.currentLat && trip.currentLng && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-blue-900">Dernière position connue</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    GPS: {trip.currentLat.toFixed(4)}, {trip.currentLng.toFixed(4)}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    Position enregistrée lors du dernier scan
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="checkpoints" className="mt-4">
              <div className="relative">
                {/* Timeline */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                
                <div className="space-y-4">
                  {['DEPARTURE', 'PAUSE', 'RESUME', 'ARRIVAL'].map((type, index) => {
                    const scan = trip.scans.find(s => s.type === type);
                    const isCompleted = !!scan;
                    
                    return (
                      <div key={type} className="relative flex gap-4 pl-10">
                        <div className="absolute left-2.5 top-1 bg-white">
                          {getScanIcon(type, isCompleted)}
                        </div>
                        
                        <div className={cn(
                          "flex-1 p-4 rounded-lg border",
                          isCompleted ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                        )}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={cn(
                              "font-medium",
                              isCompleted ? "text-green-900" : "text-gray-400"
                            )}>
                              {getScanTypeLabel(type)}
                            </span>
                            {scan && (
                              <span className="text-sm text-gray-500">
                                {formatDateTime(scan.timestamp)}
                              </span>
                            )}
                          </div>
                          
                          {scan ? (
                            <div className="space-y-1 text-sm">
                              {scan.latitude && scan.longitude && (
                                <p className="text-gray-600">
                                  <MapPin className="w-3 h-3 inline mr-1" />
                                  GPS: {scan.latitude.toFixed(4)}, {scan.longitude.toFixed(4)}
                                </p>
                              )}
                              {scan.notes && (
                                <p className="text-gray-500">{scan.notes}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">En attente</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="packages" className="mt-4">
              {trip.packages && trip.packages.length > 0 ? (
                <div className="space-y-3">
                  {trip.packages.map((pkg) => (
                    <div key={pkg.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#F59E0B]" />
                          <code className="text-sm font-mono">{pkg.qrCode}</code>
                        </div>
                        <Badge className={cn(
                          pkg.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' :
                          pkg.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        )}>
                          {pkg.status === 'IN_TRANSIT' ? 'En transit' : 
                           pkg.status === 'DELIVERED' ? 'Livré' : pkg.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-gray-500">De:</span> {pkg.senderName || 'N/A'}</div>
                        <div><span className="text-gray-500">À:</span> {pkg.recipientName || 'N/A'}</div>
                        {pkg.pickupCode && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Code retrait:</span>{' '}
                            <code className="bg-gray-200 px-2 py-0.5 rounded">****{pkg.pickupCode.slice(-4)}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucun colis à bord</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Fermer
          </Button>
          {trip?.status === 'SCHEDULED' && (
            <Button variant="destructive" className="flex-1">
              Annuler le voyage
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
