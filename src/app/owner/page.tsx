'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, AlertCircle, Bus, Package, 
  QrCode, Users, Settings, Bell,
  Plus, ChevronLeft, ChevronRight, Truck,
  DollarSign, BarChart3, Activity, Calendar, Clock,
  Search, MapPin, User, X, Menu,
  CheckCircle2, AlertTriangle, Route, LogOut, Trash2, Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast, Toaster } from 'sonner';
import CreateTripModal from '@/components/owner/CreateTripModal';
import CreateDriverModal from '@/components/owner/CreateDriverModal';
import CreateBusModal from '@/components/owner/CreateBusModal';
import CreateRouteModal from '@/components/owner/CreateRouteModal';
import RouteCard from '@/components/owner/RouteCard';
import TripDetailsModal from '@/components/owner/TripDetailsModal';
import OwnerTripsMonitoring from '@/components/owner/OwnerTripsMonitoring';
import SettingsModal from '@/components/admin/SettingsModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DashboardData {
  company: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    city?: string;
    country?: string;
    subscription?: {
      planType: string;
      monthlyFee: number;
      activatedStickers: number;
      status: string;
    };
  };
  owner: {
    id: string;
    name: string;
    email: string;
  };
  stats: {
    totalBuses: number;
    activeBuses: number;
    busesInRoute: number;
    totalDrivers: number;
    activeDrivers: number;
    activeTrips: number;
    scheduledTrips: number;
    packagesActive: number;
    packagesInTransit: number;
    packagesDelivered: number;
    monthlyRevenue: number;
    subscriptionRevenue: number;
    stickerRevenue: number;
    totalStickers: number;
    activatedStickers: number;
    activationRate: number;
  };
  buses: any[];
  drivers: any[];
  routes: any[];
  activeTrips: any[];
  scheduledTrips: any[];
  qrBatches: any[];
  packages?: any[];
}

// Sidebar navigation items
const navItems = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
  { id: 'trips', label: 'Voyages', icon: Truck },
  { id: 'packages', label: 'Colis', icon: Package },
  { id: 'drivers', label: 'Chauffeurs', icon: Users },
  { id: 'buses', label: 'Bus', icon: Bus },
  { id: 'routes', label: 'Routes', icon: Route },
  { id: 'reports', label: 'Rapports', icon: BarChart3 },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

// Page titles
const pageTitles: Record<string, string> = {
  overview: 'Tableau de bord',
  trips: 'Gestion des Voyages',
  packages: 'Gestion des Colis',
  drivers: 'Gestion des Chauffeurs',
  buses: 'Gestion de la Flotte',
  routes: 'Gestion des Routes',
  reports: 'Rapports & Statistiques',
  settings: 'Paramètres',
};

// Notifications simulées
const mockNotifications = [
  { id: 1, type: 'alert', title: 'Retard détecté', message: 'Bus CI-5678-AB a 30 min de retard', time: '10 min', icon: AlertTriangle },
  { id: 2, type: 'info', title: 'Nouveau colis', message: '5 nouveaux colis activés ce matin', time: '1h', icon: Package },
  { id: 3, type: 'success', title: 'Voyage terminé', message: 'Abidjan-Yamoussoukro arrivé à destination', time: '2h', icon: CheckCircle2 },
];

export default function OwnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState('Tous');
  const [packageStatusFilter, setPackageStatusFilter] = useState('ALL');
  
  // Modal states
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [showCreateDriver, setShowCreateDriver] = useState(false);
  const [showCreateBus, setShowCreateBus] = useState(false);
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/owner/dashboard');
      if (!response.ok) throw new Error('Erreur lors du chargement des données');
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle navigation
  const handleNavClick = (navId: string) => {
    setActiveNav(navId);
    setMobileMenuOpen(false);
    setSearchQuery(''); // Reset search on nav change
    if (navId === 'settings') {
      setShowSettings(true);
    }
  };

  // Handle logout
  const handleLogout = () => {
    toast.success('Déconnexion réussie');
    // In production: redirect to login page
    window.location.href = '/';
  };

  // Circular Progress Component
  const CircularProgress = ({ value, size = 80, strokeWidth = 8, color = '#10B981', label }: {
    value: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    label: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="text-center">
        <div className="relative inline-block" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" />
            <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" 
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-800">{value}%</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">{label}</p>
      </div>
    );
  };

  // KPI Card Component
  const KPICard = ({ title, value, subtitle, icon: Icon, bgColor, iconColor, trend, trendUp = true }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    bgColor: string;
    iconColor: string;
    trend?: string;
    trendUp?: boolean;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${iconColor}20` }}>
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
        </div>
        {trend && (
          <span className={cn("text-xs font-medium px-2 py-1 rounded-full", trendUp ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </motion.div>
  );

  // Trip Card Component
  const TripCard = ({ trip, isActive = false }: { trip: any; isActive?: boolean }) => (
    <Card className={cn(
      "shadow-sm border cursor-pointer hover:shadow-md transition-shadow",
      isActive ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
    )} onClick={() => setSelectedTripId(trip.id)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isActive ? "bg-green-500" : "bg-blue-500"
            )}>
              {isActive ? <Truck className="w-5 h-5 text-white" /> : <Clock className="w-5 h-5 text-white" />}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{trip.route?.name || 'Route inconnue'}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                {trip.bus && (
                  <span className="flex items-center gap-1">
                    <Bus className="w-4 h-4" /> {trip.bus.plateNumber}
                  </span>
                )}
                {trip.driver && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" /> {trip.driver.name}
                  </span>
                )}
              </div>
              {isActive && trip.actualDeparture && (
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  Départ : {new Date(trip.actualDeparture).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-600">{trip.passengers} passagers</span>
              {trip.packagesCount > 0 && (
                <Badge className="bg-orange-100 text-orange-700 text-xs">{trip.packagesCount} colis</Badge>
              )}
            </div>
            <Badge className={cn(
              "text-xs",
              isActive ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
            )}>
              {isActive ? 'En cours' : 'Programmé'}
            </Badge>
            {!isActive && trip.departureTime && (
              <p className="text-sm font-medium text-gray-900 mt-1">
                {new Date(trip.departureTime).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Filter drivers based on search
  const filteredDrivers = data?.drivers.filter((driver: any) =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.licenseNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Filter buses based on search
  const filteredBuses = data?.buses.filter((bus: any) =>
    bus.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bus.model?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Filter routes based on search
  const filteredRoutes = data?.routes.filter((route: any) =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.destination.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Filter trips based on status
  const allTrips = [...(data?.activeTrips || []), ...(data?.scheduledTrips || [])];
  const filteredTrips = allTrips.filter((trip: any) => {
    if (tripStatusFilter === 'Tous') return true;
    if (tripStatusFilter === 'En cours') return trip.status === 'IN_PROGRESS';
    if (tripStatusFilter === 'Programmés') return trip.status === 'SCHEDULED';
    if (tripStatusFilter === 'Terminés') return trip.status === 'COMPLETED';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#10B981] animate-spin" />
        <span className="ml-3 text-gray-600">Chargement...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchData} className="bg-[#10B981] hover:bg-[#059669]">Réessayer</Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex">
      <Toaster position="top-right" richColors />
      
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: sidebarCollapsed ? 80 : 260,
          x: mobileMenuOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -260 : 0)
        }}
        className={cn(
          "fixed left-0 top-0 bottom-0 bg-[#1E293B] text-white z-50 flex flex-col shadow-xl",
          "lg:translate-x-0 transition-transform duration-300"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
                <Bus className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">{data.company.name}</span>
                <Badge className="ml-2 bg-[#10B981]/20 text-[#10B981] text-[10px]">Owner</Badge>
              </div>
            </div>
          )}
          {sidebarCollapsed && !mobileMenuOpen && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center mx-auto">
              <Bus className="w-5 h-5 text-white" />
            </div>
          )}
          <button className="lg:hidden p-2 hover:bg-white/10 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                    isActive ? 'bg-[#10B981] text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {(!sidebarCollapsed || mobileMenuOpen) && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className={cn("flex items-center gap-3 mb-3", sidebarCollapsed && !mobileMenuOpen && "justify-center")}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold">{data.owner.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
            </div>
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{data.owner.name}</p>
                <p className="text-xs text-gray-400 truncate">Propriétaire</p>
              </div>
            )}
          </div>
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <Button 
              variant="ghost" 
              className="w-full text-gray-400 hover:text-white hover:bg-white/10 justify-start"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut className="w-4 h-4 mr-2" /> Déconnexion
            </Button>
          )}
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-white shadow-lg items-center justify-center text-gray-600 hover:text-[#10B981] transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 80 : 260 }}
        className="flex-1 flex flex-col min-h-screen lg:ml-0"
      >
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">{pageTitles[activeNav] || 'Tableau de bord'}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              </Button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <Badge className="bg-red-100 text-red-600">3 nouvelles</Badge>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {mockNotifications.map((notif) => {
                        const Icon = notif.icon;
                        return (
                          <div key={notif.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                            <div className="flex gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                notif.type === 'alert' ? 'bg-yellow-100' :
                                notif.type === 'success' ? 'bg-green-100' : 'bg-blue-100'
                              )}>
                                <Icon className={cn(
                                  "w-5 h-5",
                                  notif.type === 'alert' ? 'text-yellow-600' :
                                  notif.type === 'success' ? 'text-green-600' : 'text-blue-600'
                                )} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                <p className="text-xs text-gray-500">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <Button variant="outline" size="sm" onClick={fetchData} className="text-gray-600 hidden sm:flex">
              <RefreshCw className="w-4 h-4 mr-2" />Actualiser
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            {/* OVERVIEW PAGE */}
            {activeNav === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard 
                    title="Bus" 
                    value={data.stats.totalBuses} 
                    subtitle={`${data.stats.busesInRoute} en route`} 
                    icon={Bus} 
                    bgColor="#F0FDF4" 
                    iconColor="#10B981" 
                  />
                  <KPICard 
                    title="Chauffeurs" 
                    value={data.stats.totalDrivers} 
                    subtitle={`${data.stats.activeDrivers} actifs`} 
                    icon={Users} 
                    bgColor="#EFF6FF" 
                    iconColor="#3B82F6" 
                  />
                  <KPICard 
                    title="Colis actifs" 
                    value={data.stats.packagesActive} 
                    subtitle={`${data.stats.packagesInTransit} en transit`} 
                    icon={Package} 
                    bgColor="#FFFBEB" 
                    iconColor="#F59E0B" 
                  />
                  <KPICard 
                    title="Revenus/mois" 
                    value={`${(data.stats.monthlyRevenue / 1000).toFixed(1)}k FCFA`} 
                    subtitle="Abonnements + stickers"
                    icon={DollarSign}
                    bgColor="#F5F3FF"
                    iconColor="#8B5CF6"
                    trend="+8%"
                  />
                </div>

                {/* Performance & Chart Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
                      <div className="flex items-center justify-around">
                        <CircularProgress value={data.stats.activationRate} color="#F59E0B" label="Activation" />
                        <CircularProgress value={85} color="#3B82F6" label="Satisfaction" />
                        <CircularProgress value={92} color="#10B981" label="Livraison" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm border border-gray-100 lg:col-span-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Répartition des Colis</h3>
                        <Badge className="bg-gray-100 text-gray-600">Ce mois</Badge>
                      </div>
                      <div className="flex items-end justify-around h-48 gap-2 sm:gap-4">
                        {[
                          { label: 'Actifs', value: data.stats.packagesActive - data.stats.packagesInTransit, color: '#10B981' },
                          { label: 'En transit', value: data.stats.packagesInTransit, color: '#3B82F6' },
                          { label: 'Livrés', value: data.stats.packagesDelivered, color: '#8B5CF6' },
                          { label: 'En attente', value: data.stats.totalStickers - data.stats.activatedStickers, color: '#E5E7EB' },
                        ].map((item, i) => {
                          const values = [
                            data.stats.packagesActive - data.stats.packagesInTransit,
                            data.stats.packagesInTransit,
                            data.stats.packagesDelivered,
                            data.stats.totalStickers - data.stats.activatedStickers
                          ];
                          const maxValue = Math.max(...values, 1);
                          const height = Math.max((item.value / maxValue) * 150, 20);
                          return (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1">
                              <span className="text-sm font-bold text-gray-900">{item.value}</span>
                              <motion.div initial={{ height: 0 }} animate={{ height }} className="w-full max-w-16 rounded-t-lg" style={{ backgroundColor: item.color }} />
                              <span className="text-xs text-gray-500 text-center leading-tight">{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Active Trips */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Voyages en cours</h3>
                    <Button className="bg-[#10B981] hover:bg-[#059669] text-white" onClick={() => setShowCreateTrip(true)}>
                      <Plus className="w-4 h-4 mr-2" />Nouveau voyage
                    </Button>
                  </div>
                  {data.activeTrips.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {data.activeTrips.map((trip) => (
                        <TripCard key={trip.id} trip={trip} isActive={true} />
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-gray-50 border border-gray-200">
                      <CardContent className="p-8 text-center">
                        <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Aucun voyage en cours</p>
                        <Button className="bg-[#10B981] hover:bg-[#059669] text-white" onClick={() => setShowCreateTrip(true)}>
                          <Plus className="w-4 h-4 mr-2" />Créer un voyage
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Scheduled Trips */}
                {data.scheduledTrips.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Voyages programmés</h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {data.scheduledTrips.map((trip) => (
                        <TripCard key={trip.id} trip={trip} isActive={false} />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TRIPS PAGE */}
            {activeNav === 'trips' && (
              <motion.div key="trips" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <OwnerTripsMonitoring 
                  companyId={data.company.id}
                  onCreateTrip={() => setShowCreateTrip(true)}
                />
              </motion.div>
            )}

            {/* DRIVERS PAGE */}
            {activeNav === 'drivers' && (
              <motion.div key="drivers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Rechercher un chauffeur..." 
                      className="pl-10 border-gray-200" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white" onClick={() => setShowCreateDriver(true)}>
                    <Plus className="w-4 h-4 mr-2" />Ajouter
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDrivers.map((driver: any) => (
                    <Card key={driver.id} className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white font-bold">
                            {driver.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{driver.name}</p>
                            <p className="text-sm text-gray-500 truncate">{driver.email}</p>
                          </div>
                          <Badge className={driver.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                            {driver.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Permis</span>
                            <span className="text-gray-900">{driver.licenseNumber || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Expiration</span>
                            <span className="text-gray-900">
                              {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString('fr-FR') : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Téléphone</span>
                            <span className="text-gray-900">{driver.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredDrivers.length === 0 && (
                  <Card className="bg-gray-50 border border-gray-200">
                    <CardContent className="p-8 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun chauffeur trouvé</p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* BUSES PAGE */}
            {activeNav === 'buses' && (
              <motion.div key="buses" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Rechercher un bus (immatriculation)..." 
                      className="pl-10 border-gray-200" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button className="bg-[#10B981] hover:bg-[#059669] text-white" onClick={() => setShowCreateBus(true)}>
                    <Plus className="w-4 h-4 mr-2" />Ajouter
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBuses.map((bus: any) => (
                    <Card key={bus.id} className={cn(
                      "shadow-sm border cursor-pointer hover:shadow-md transition-shadow",
                      bus.inTrip ? "bg-green-50 border-green-200" : "bg-white border-gray-100"
                    )}>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            bus.inTrip ? "bg-green-500" : "bg-gray-200"
                          )}>
                            <Bus className={cn("w-6 h-6", bus.inTrip ? "text-white" : "text-gray-500")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">{bus.plateNumber}</p>
                            <p className="text-sm text-gray-500 truncate">{bus.model || 'N/A'}</p>
                          </div>
                          <Badge className={cn(
                            "ml-auto",
                            bus.inTrip ? "bg-green-100 text-green-700" : 
                            bus.isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                          )}>
                            {bus.inTrip ? 'En route' : bus.isActive ? 'Disponible' : 'Inactif'}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Capacité</span>
                            <span className="text-gray-900">{bus.capacity || 'N/A'} places</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Couleur</span>
                            <span className="text-gray-900">{bus.color || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Année</span>
                            <span className="text-gray-900">{bus.year || 'N/A'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredBuses.length === 0 && (
                  <Card className="bg-gray-50 border border-gray-200">
                    <CardContent className="p-8 text-center">
                      <Bus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun bus trouvé</p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* ROUTES PAGE */}
            {activeNav === 'routes' && (
              <motion.div key="routes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Gestion des Routes</h2>
                    <p className="text-sm text-gray-500">
                      Configurez vos itinéraires avec checkpoints (Départ, Pauses, Arrivée)
                    </p>
                  </div>
                  <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white" onClick={() => setShowCreateRoute(true)}>
                    <Plus className="w-4 h-4 mr-2" />Nouvelle route
                  </Button>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="Rechercher une route..." 
                    className="pl-10 border-gray-200" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Routes Grid */}
                {filteredRoutes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRoutes.map((route: any) => (
                      <RouteCard 
                        key={route.id} 
                        route={route}
                        onRefresh={fetchData}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-gray-50 border border-gray-200">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                        <Route className="w-8 h-8 text-purple-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Aucune route configurée</h3>
                      <p className="text-gray-500 mb-4">
                        Créez votre première route pour commencer à planifier des voyages
                      </p>
                      <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white" onClick={() => setShowCreateRoute(true)}>
                        <Plus className="w-4 h-4 mr-2" />Créer une route
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Helper Card */}
                {filteredRoutes.length > 0 && (
                  <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600">💡</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Configuration des checkpoints</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Chaque route doit avoir un point de départ et d'arrivée. Ajoutez des pauses intermédiaires 
                            (repos, repas, carburant) pour un meilleur suivi des voyages.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* PACKAGES PAGE */}
            {activeNav === 'packages' && (
              <motion.div key="packages" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Rechercher un colis (QR code, destinataire)..." 
                      className="pl-10 border-gray-200" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    {['ALL', 'ACTIVE', 'IN_TRANSIT', 'DELIVERED'].map((status) => (
                      <Button 
                        key={status} 
                        variant={packageStatusFilter === status ? 'default' : 'outline'}
                        className={packageStatusFilter === status ? 'bg-[#10B981] text-white' : ''}
                        onClick={() => setPackageStatusFilter(status)}
                      >
                        {status === 'ALL' ? 'Tous' : 
                         status === 'ACTIVE' ? 'Actifs' :
                         status === 'IN_TRANSIT' ? 'En transit' : 'Livrés'}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-5 text-center">
                      <p className="text-3xl font-bold text-[#10B981]">{data.stats.packagesActive}</p>
                      <p className="text-sm text-gray-500">Colis actifs</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-5 text-center">
                      <p className="text-3xl font-bold text-[#3B82F6]">{data.stats.packagesInTransit}</p>
                      <p className="text-sm text-gray-500">En transit</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-5 text-center">
                      <p className="text-3xl font-bold text-[#8B5CF6]">{data.stats.packagesDelivered}</p>
                      <p className="text-sm text-gray-500">Livrés</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-5 text-center">
                      <p className="text-3xl font-bold text-[#F59E0B]">{data.stats.activationRate}%</p>
                      <p className="text-sm text-gray-500">Taux activation</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white shadow-sm border border-gray-100">
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Liste détaillée des colis à venir</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* REPORTS PAGE */}
            {activeNav === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button variant="default" className="bg-[#10B981] text-white">Ce mois</Button>
                    <Button variant="outline">Ce trimestre</Button>
                    <Button variant="outline">Cette année</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des revenus</h3>
                      <div className="h-64 flex items-end justify-around gap-2">
                        {[65, 45, 80, 55, 90, 70, 85].map((val, i) => (
                          <div key={i} className="flex flex-col items-center gap-2">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: val * 2 }}
                              className="w-8 rounded-t bg-gradient-to-t from-[#10B981] to-[#059669]"
                            />
                            <span className="text-xs text-gray-500">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i]}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques générales</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Voyages ce mois</span>
                          <span className="font-bold text-gray-900">12</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Colis livrés</span>
                          <span className="font-bold text-gray-900">{data.stats.packagesDelivered}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Taux de satisfaction</span>
                          <span className="font-bold text-[#10B981]">85%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Revenus totaux</span>
                          <span className="font-bold text-gray-900">{data.stats.monthlyRevenue.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* SETTINGS PAGE */}
            {activeNav === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <Card className="bg-white shadow-sm border border-gray-100">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres de la compagnie</h3>
                    <Button className="bg-[#10B981] hover:bg-[#059669] text-white" onClick={() => setShowSettings(true)}>
                      <Settings className="w-4 h-4 mr-2" />Ouvrir les paramètres
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.main>

      {/* Modals */}
      <CreateTripModal 
        isOpen={showCreateTrip} 
        onClose={() => setShowCreateTrip(false)} 
        buses={data.buses.filter(b => !b.inTrip)} 
        drivers={data.drivers.filter(d => d.isActive)} 
        routes={data.routes}
        companyId={data.company.id}
        onSuccess={() => {
          toast.success('Voyage créé avec succès');
          fetchData();
        }}
      />
      <CreateDriverModal 
        isOpen={showCreateDriver} 
        onClose={() => setShowCreateDriver(false)} 
        companyId={data.company.id}
        onSuccess={() => {
          toast.success('Chauffeur créé avec succès');
          fetchData();
        }}
      />
      <CreateBusModal 
        isOpen={showCreateBus} 
        onClose={() => setShowCreateBus(false)} 
        companyId={data.company.id}
        onSuccess={() => {
          toast.success('Bus créé avec succès');
          fetchData();
        }}
      />
      <CreateRouteModal 
        isOpen={showCreateRoute} 
        onClose={() => setShowCreateRoute(false)} 
        companyId={data.company.id}
        onSuccess={() => {
          toast.success('Route créée avec succès');
          fetchData();
        }}
      />
      <TripDetailsModal 
        isOpen={!!selectedTripId} 
        onClose={() => setSelectedTripId(null)} 
        tripId={selectedTripId} 
      />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600">
              Déconnexion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
