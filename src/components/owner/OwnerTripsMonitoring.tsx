'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Bus, MapPin, Clock, User, Package, RefreshCw, 
  Filter, ChevronRight, Play, Pause, CheckCircle2, AlertTriangle,
  Calendar, Navigation, XCircle, Phone, AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import OwnerTripDetailsModal from './OwnerTripDetailsModal';

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

interface Trip {
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
  pauseDuration: number;
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
  checkpoints: {
    departure: { completed: boolean; timestamp: string | null };
    pause: { completed: boolean; timestamp: string | null };
    resume: { completed: boolean; timestamp: string | null };
    arrival: { completed: boolean; timestamp: string | null };
  };
}

interface OwnerTripsMonitoringProps {
  companyId: string;
  onCreateTrip?: () => void;
}

export default function OwnerTripsMonitoring({ companyId, onCreateTrip }: OwnerTripsMonitoringProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    status: 'all',
    date: 'today',
  });

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('companyId', companyId);
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('date', filters.date);

      const response = await fetch(`/api/trips/monitoring?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setTrips(result.trips || []);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, filters]);

  useEffect(() => {
    fetchTrips();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTrips, 30000);
    return () => clearInterval(interval);
  }, [fetchTrips]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
      'SCHEDULED': { label: 'Planifié', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Calendar },
      'IN_PROGRESS': { label: 'En route', color: 'text-green-700', bgColor: 'bg-green-100', icon: Play },
      'PAUSED': { label: 'En pause', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: Pause },
      'COMPLETED': { label: 'Terminé', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: CheckCircle2 },
      'CANCELLED': { label: 'Annulé', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
    };
    return configs[status] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100', icon: AlertCircle };
  };

  const getAlertSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'LOW': 'bg-yellow-50 border-yellow-200 text-yellow-800',
      'MEDIUM': 'bg-orange-50 border-orange-200 text-orange-800',
      'HIGH': 'bg-red-50 border-red-200 text-red-800',
      'CRITICAL': 'bg-red-100 border-red-300 text-red-900',
    };
    return colors[severity] || colors['LOW'];
  };

  const handleViewDetails = (tripId: string) => {
    setSelectedTripId(tripId);
    setModalOpen(true);
  };

  // Summary stats
  const summary = {
    total: trips.length,
    inProgress: trips.filter(t => t.status === 'IN_PROGRESS').length,
    paused: trips.filter(t => t.status === 'PAUSED').length,
    scheduled: trips.filter(t => t.status === 'SCHEDULED').length,
    completed: trips.filter(t => t.status === 'COMPLETED').length,
    totalAlerts: trips.reduce((sum, t) => sum + t.alerts.length, 0),
  };

  if (loading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-[#10B981] animate-spin" />
        <span className="ml-3 text-gray-600">Chargement des voyages...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{summary.total}</p>
            <p className="text-xs text-blue-600">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{summary.inProgress}</p>
            <p className="text-xs text-green-600">En route</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-orange-700">{summary.paused}</p>
            <p className="text-xs text-orange-600">En pause</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-purple-700">{summary.scheduled}</p>
            <p className="text-xs text-purple-600">Planifiés</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-gray-700">{summary.completed}</p>
            <p className="text-xs text-gray-600">Terminés</p>
          </CardContent>
        </Card>
        <Card className={cn(
          "border",
          summary.totalAlerts > 0 
            ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200" 
            : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
        )}>
          <CardContent className="p-3 text-center">
            <p className={cn(
              "text-2xl font-bold",
              summary.totalAlerts > 0 ? "text-red-700" : "text-gray-400"
            )}>
              {summary.totalAlerts}
            </p>
            <p className={cn(
              "text-xs",
              summary.totalAlerts > 0 ? "text-red-600" : "text-gray-500"
            )}>
              Alertes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <Select 
            value={filters.status} 
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger className="w-40 border-gray-200">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="SCHEDULED">Planifiés</SelectItem>
              <SelectItem value="IN_PROGRESS">En route</SelectItem>
              <SelectItem value="PAUSED">En pause</SelectItem>
              <SelectItem value="COMPLETED">Terminés</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.date} 
            onValueChange={(value) => setFilters({ ...filters, date: value })}
          >
            <SelectTrigger className="w-36 border-gray-200">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchTrips}
            className="border-gray-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          
          {onCreateTrip && (
            <Button 
              size="sm"
              className="bg-[#10B981] hover:bg-[#059669] text-white"
              onClick={onCreateTrip}
            >
              + Nouveau voyage
            </Button>
          )}
        </div>
      </div>

      {/* Trips List */}
      {trips.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="py-12 text-center">
            <Bus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun voyage</h3>
            <p className="text-gray-500 mb-4">Créez votre premier voyage pour commencer.</p>
            {onCreateTrip && (
              <Button 
                className="bg-[#10B981] hover:bg-[#059669] text-white"
                onClick={onCreateTrip}
              >
                + Créer un voyage
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trips.map((trip) => {
            const statusConfig = getStatusConfig(trip.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card 
                key={trip.id} 
                className={cn(
                  "border hover:shadow-lg transition-all cursor-pointer",
                  trip.alerts.length > 0 && trip.alerts.some(a => a.severity === 'HIGH') 
                    ? "border-red-200 bg-red-50/30" 
                    : "border-gray-200 bg-white"
                )}
                onClick={() => handleViewDetails(trip.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          trip.status === 'IN_PROGRESS' ? "bg-green-500" :
                          trip.status === 'PAUSED' ? "bg-orange-500" :
                          trip.status === 'COMPLETED' ? "bg-gray-500" : "bg-blue-500"
                        )}>
                          <StatusIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {trip.route.origin} → {trip.route.destination}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {trip.route.distance ? `${trip.route.distance} km` : ''} • {trip.trackingCode}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusConfig.bgColor + ' ' + statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Info */}
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 flex items-center gap-1">
                          <Bus className="w-3 h-3" />
                        </p>
                        <p className="font-medium text-gray-900">{trip.bus.plateNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                        </p>
                        <p className="font-medium text-gray-900">{trip.driver.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 flex items-center gap-1">
                          <Package className="w-3 h-3" />
                        </p>
                        <p className="font-medium text-gray-900">{trip.packagesCount} colis</p>
                      </div>
                      <div>
                        <p className="text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                        </p>
                        <p className="font-medium text-gray-900">
                          {trip.departureTime ? format(new Date(trip.departureTime), 'HH:mm', { locale: fr }) : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Pause Duration */}
                    {trip.status === 'PAUSED' && trip.pauseDuration > 0 && (
                      <div className={cn(
                        "p-2 rounded flex items-center gap-2 text-sm",
                        trip.pauseDuration > 120 ? "bg-red-100 text-red-700" :
                        trip.pauseDuration > 20 ? "bg-orange-100 text-orange-700" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        <Pause className="w-4 h-4" />
                        En pause depuis {trip.pauseDuration} min
                        {trip.pauseDuration > 20 && (
                          <AlertTriangle className="w-4 h-4 ml-auto" />
                        )}
                      </div>
                    )}

                    {/* Checkpoints Progress */}
                    <div className="flex items-center gap-1 text-xs">
                      {[
                        { key: 'departure', icon: '🚀', label: 'Départ' },
                        { key: 'pause', icon: '⏸️', label: 'Pause' },
                        { key: 'resume', icon: '▶️', label: 'Reprise' },
                        { key: 'arrival', icon: '🏁', label: 'Arrivée' },
                      ].map((cp, idx) => {
                        const checkpoint = trip.checkpoints[cp.key as keyof typeof trip.checkpoints];
                        return (
                          <div 
                            key={cp.key}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded",
                              checkpoint?.completed ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400"
                            )}
                          >
                            <span>{cp.icon}</span>
                            <span className="hidden sm:inline">{cp.label}</span>
                            {idx < 3 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Alerts */}
                    {trip.alerts.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {trip.alerts.slice(0, 2).map((alert, idx) => (
                          <div 
                            key={idx}
                            className={cn("px-2 py-1 rounded text-xs border flex items-center gap-1", getAlertSeverityColor(alert.severity))}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {alert.message}
                          </div>
                        ))}
                        {trip.alerts.length > 2 && (
                          <Badge className="bg-gray-100 text-gray-600">
                            +{trip.alerts.length - 2} alertes
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <span>
                        {trip.lastScan ? (
                          <>
                            <Clock className="w-3 h-3 inline mr-1" />
                            MAJ: {formatDistanceToNow(new Date(trip.lastScan.timestamp), { addSuffix: true, locale: fr })}
                          </>
                        ) : 'Aucun scan'}
                      </span>
                      <Button variant="ghost" size="sm" className="text-[#10B981] h-7">
                        Détails <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Trip Details Modal */}
      {selectedTripId && (
        <OwnerTripDetailsModal
          tripId={selectedTripId}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onRefresh={fetchTrips}
        />
      )}
    </div>
  );
}
