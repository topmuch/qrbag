'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Bus, MapPin, Clock, User, AlertTriangle, Package, 
  RefreshCw, Filter, ChevronRight, Play, Pause, CheckCircle2,
  Calendar, Building2, XCircle, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import TripDetailsModal from './TripDetailsModal';

interface Alert {
  type: 'PAUSE_TOO_SHORT' | 'PAUSE_TOO_LONG' | 'PAUSE_EXTENDED' | 'DELAY' | 'NO_CHECKPOINT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  tripId: string;
  timestamp: string;
  acknowledged: boolean;
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
  company: {
    id: string;
    name: string;
    city: string | null;
  };
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
  };
  scans: Array<{
    id: string;
    type: string;
    timestamp: string;
    latitude: number | null;
    longitude: number | null;
    notes: string | null;
  }>;
  lastScan: {
    type: string;
    timestamp: string;
  } | null;
  packagesCount: number;
  packages: any[];
  pauseDuration: number;
  alerts: Alert[];
  checkpoints: {
    departure: { completed: boolean; timestamp: string | null };
    pause: { completed: boolean; timestamp: string | null };
    resume: { completed: boolean; timestamp: string | null };
    arrival: { completed: boolean; timestamp: string | null };
  };
}

interface MonitoringData {
  trips: Trip[];
  summary: {
    total: number;
    inProgress: number;
    paused: number;
    scheduled: number;
    totalAlerts: number;
    highPriorityAlerts: number;
  };
}

interface TripsMonitoringProps {
  companies: Array<{ id: string; name: string }>;
}

export default function TripsMonitoring({ companies }: TripsMonitoringProps) {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    companyId: 'all',
    status: 'all',
    date: 'today',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.companyId !== 'all') params.append('companyId', filters.companyId);
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('date', filters.date);

      const response = await fetch(`/api/trips/monitoring?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

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

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-[#FF9F40] animate-spin" />
        <span className="ml-3 text-gray-600">Chargement des voyages...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-700">{data.summary.total}</p>
              <p className="text-sm text-blue-600">Total voyages</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-700">{data.summary.inProgress}</p>
              <p className="text-sm text-green-600">En route</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-orange-700">{data.summary.paused}</p>
              <p className="text-sm text-orange-600">En pause</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-700">{data.summary.scheduled}</p>
              <p className="text-sm text-purple-600">Planifiés</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-700">{data.summary.totalAlerts}</p>
              <p className="text-sm text-yellow-600">Alertes</p>
            </CardContent>
          </Card>
          <Card className={cn(
            "border",
            data.summary.highPriorityAlerts > 0 
              ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200" 
              : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
          )}>
            <CardContent className="p-4 text-center">
              <p className={cn(
                "text-3xl font-bold",
                data.summary.highPriorityAlerts > 0 ? "text-red-700" : "text-gray-400"
              )}>
                {data.summary.highPriorityAlerts}
              </p>
              <p className={cn(
                "text-sm",
                data.summary.highPriorityAlerts > 0 ? "text-red-600" : "text-gray-500"
              )}>
                Priorité haute
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 text-gray-500">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filtres:</span>
            </div>
            
            <div className="flex flex-wrap gap-3 flex-1">
              <Select 
                value={filters.companyId} 
                onValueChange={(value) => setFilters({ ...filters, companyId: value })}
              >
                <SelectTrigger className="w-48 border-gray-200">
                  <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Toutes les agences" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les agences</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-40 border-gray-200">
                  <SelectValue placeholder="Tous statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="SCHEDULED">Planifiés</SelectItem>
                  <SelectItem value="IN_PROGRESS">En route</SelectItem>
                  <SelectItem value="PAUSED">En pause</SelectItem>
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

            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData}
              className="border-gray-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trips List */}
      {data?.trips && data.trips.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="py-12 text-center">
            <Bus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun voyage en cours</h3>
            <p className="text-gray-500">Les voyages planifiés apparaîtront ici.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {data?.trips.map((trip) => {
            const statusConfig = getStatusConfig(trip.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card 
                key={trip.id} 
                className={cn(
                  "border hover:shadow-lg transition-all cursor-pointer",
                  trip.alerts.length > 0 && trip.alerts.some(a => a.severity === 'HIGH') 
                    ? "border-red-200 bg-red-50/30" 
                    : "border-gray-200"
                )}
                onClick={() => handleViewDetails(trip.id)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#FF9F40]/10 flex items-center justify-center">
                          <Bus className="w-6 h-6 text-[#FF9F40]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {trip.route.origin} → {trip.route.destination}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {trip.route.distance ? `${trip.route.distance} km • ` : ''}
                            {trip.route.estimatedTime ? `${trip.route.estimatedTime} min estimées` : ''}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn(statusConfig.bgColor, statusConfig.color, 'font-medium')}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Agence
                        </p>
                        <p className="font-medium text-gray-900">{trip.company.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Chauffeur
                        </p>
                        <p className="font-medium text-gray-900">{trip.driver.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 flex items-center gap-1">
                          <Bus className="w-3 h-3" />
                          Bus
                        </p>
                        <p className="font-medium text-gray-900">{trip.bus.plateNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          Colis
                        </p>
                        <p className="font-medium text-gray-900">{trip.packagesCount} à bord</p>
                      </div>
                    </div>

                    {/* Pause Duration (if paused) */}
                    {trip.status === 'PAUSED' && trip.pauseDuration > 0 && (
                      <div className={cn(
                        "p-3 rounded-lg flex items-center justify-between",
                        trip.pauseDuration > 120 ? "bg-red-50 border border-red-200" :
                        trip.pauseDuration > 20 ? "bg-orange-50 border border-orange-200" :
                        "bg-blue-50 border border-blue-200"
                      )}>
                        <div className="flex items-center gap-2">
                          <Pause className={cn(
                            "w-5 h-5",
                            trip.pauseDuration > 120 ? "text-red-600" :
                            trip.pauseDuration > 20 ? "text-orange-600" :
                            "text-blue-600"
                          )} />
                          <span className={cn(
                            "font-medium",
                            trip.pauseDuration > 120 ? "text-red-700" :
                            trip.pauseDuration > 20 ? "text-orange-700" :
                            "text-blue-700"
                          )}>
                            En pause depuis {trip.pauseDuration} minutes
                          </span>
                        </div>
                        {trip.pauseDuration > 20 && (
                          <Badge className="bg-red-100 text-red-700">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Attention
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Checkpoints Timeline */}
                    <div className="flex items-center gap-2 text-sm">
                      {[
                        { key: 'departure', label: 'Départ', icon: '✅' },
                        { key: 'pause', label: 'Pause', icon: '⏸️' },
                        { key: 'resume', label: 'Reprise', icon: '▶️' },
                        { key: 'arrival', label: 'Arrivée', icon: '🏁' },
                      ].map((checkpoint, idx) => {
                        const cp = trip.checkpoints[checkpoint.key as keyof typeof trip.checkpoints];
                        return (
                          <div 
                            key={checkpoint.key}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded",
                              cp.completed ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400"
                            )}
                          >
                            <span>{checkpoint.icon}</span>
                            <span className="hidden sm:inline">{checkpoint.label}</span>
                            {idx < 3 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Alerts */}
                    {trip.alerts.length > 0 && (
                      <div className="space-y-2">
                        {trip.alerts.map((alert, idx) => (
                          <div 
                            key={idx}
                            className={cn("p-2 rounded border text-sm flex items-start gap-2", getAlertSeverityColor(alert.severity))}
                          >
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{alert.message}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {trip.lastScan ? (
                          <span>
                            Dernière MAJ: {formatDistanceToNow(new Date(trip.lastScan.timestamp), { addSuffix: true, locale: fr })}
                          </span>
                        ) : (
                          <span>Aucun scan enregistré</span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="text-[#FF9F40]">
                        Voir détails
                        <ChevronRight className="w-4 h-4 ml-1" />
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
        <TripDetailsModal
          tripId={selectedTripId}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}
    </div>
  );
}
