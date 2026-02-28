'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, AlertCircle, Building2, Bus, Package, 
  TrendingUp, QrCode, CreditCard, Users, Settings, Bell,
  Plus, Eye, Wand2, ChevronLeft, ChevronRight, Truck,
  CheckCircle2, Clock, TestTube, DollarSign, BarChart3, Activity,
  Search, Filter, Download, FileText, Calendar, Menu, X,
  AlertTriangle, MapPin, Phone, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Modals
import CreateCompanyModal from '@/components/admin/CreateCompanyModal';
import GenerateQRModal from '@/components/admin/GenerateQRModal';
import QRBatchDetailsModal from '@/components/admin/QRBatchDetailsModal';
import SettingsModal from '@/components/admin/SettingsModal';
import CompanyDetailsModal from '@/components/admin/CompanyDetailsModal';

interface DashboardData {
  stats: {
    totalCompanies: number;
    activeCompanies: number;
    totalBuses: number;
    busesInRoute: number;
    totalPackages: number;
    activePackages: number;
    inTransitPackages: number;
    deliveredPackages: number;
    pendingPackages: number;
    monthlyRevenue: number;
    subscriptionRevenue: number;
    stickerRevenue: number;
    totalStickers: number;
    activatedStickers: number;
  };
  companies: any[];
  qrBatches: any[];
  subscriptions: any[];
  testQRCodes: any[];
}

// Sidebar navigation items
const navItems = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
  { id: 'companies', label: 'Compagnies', icon: Building2 },
  { id: 'qrcodes', label: 'QR Codes', icon: QrCode },
  { id: 'subscriptions', label: 'Abonnements', icon: CreditCard },
  { id: 'reports', label: 'Rapports', icon: BarChart3 },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

// Page titles
const pageTitles: Record<string, string> = {
  overview: 'Tableau de bord',
  companies: 'Gestion des Compagnies',
  qrcodes: 'Gestion des QR Codes',
  subscriptions: 'Gestion des Abonnements',
  reports: 'Rapports & Statistiques',
  settings: 'Paramètres',
};

// Notifications simulées
const mockNotifications = [
  { id: 1, type: 'alert', title: 'Retard détecté', message: 'Bus BF-1234-AO a 2h de retard sur Ouaga-Abidjan', time: '10 min', icon: AlertTriangle },
  { id: 2, type: 'sos', title: 'Alerte SOS', message: 'Chauffeur Ibrahim Traoré a déclenché une alerte', time: '25 min', icon: AlertCircle },
  { id: 3, type: 'info', title: 'Nouveau colis', message: '15 nouveaux colis activés ce matin', time: '1h', icon: Package },
];

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Modal states
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showGenerateQR, setShowGenerateQR] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) throw new Error('Erreur lors du chargement des données');
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle navigation - open settings modal when settings is clicked
  const handleNavClick = (navId: string) => {
    setActiveNav(navId);
    if (navId === 'settings') {
      setShowSettings(true);
    }
  };

  const activationRate = data && data.stats.totalStickers > 0
    ? Math.round((data.stats.activatedStickers / data.stats.totalStickers) * 100)
    : 0;

  // Circular Progress Component
  const CircularProgress = ({ value, size = 80, strokeWidth = 8, color = '#FF9F40' }: {
    value: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" 
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-800">{value}%</span>
        </div>
      </div>
    );
  };

  // KPI Card Component
  const KPICard = ({ title, value, subtitle, icon: Icon, color, trend, trendUp = true }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color: string;
    trend?: string;
    trendUp?: boolean;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        {trend && (
          <span className={cn("text-xs font-medium px-2 py-1 rounded-full", trendUp ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </motion.div>
  );

  // Get subscription badge
  const getSubscriptionBadge = (subscription: any) => {
    if (!subscription) return <Badge className="bg-gray-100 text-gray-600">Pas d&apos;abonnement</Badge>;
    switch (subscription.planType) {
      case 'PACK_COMPLET': return <Badge className="bg-purple-100 text-purple-700">Pack Complet</Badge>;
      case 'COLIS_ONLY': return <Badge className="bg-green-100 text-green-700">Colis Seul</Badge>;
      case 'BUS_ONLY': return <Badge className="bg-blue-100 text-blue-700">Bus Seul</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-600">{subscription.planType}</Badge>;
    }
  };

  // Filter companies based on search
  const filteredCompanies = data?.companies.filter((company: any) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.city?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Filter QR batches based on search
  const filteredBatches = data?.qrBatches.filter((batch: any) =>
    batch.batchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.company?.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#FF9F40] animate-spin" />
        <span className="ml-3 text-gray-600">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchData} className="bg-[#FF9F40] hover:bg-[#E67E00]">Réessayer</Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex">
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF9F40] to-[#FF6B00] flex items-center justify-center">
                <Bus className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">QRBag</span>
                <Badge className="ml-2 bg-[#FF9F40]/20 text-[#FF9F40] text-[10px]">Admin</Badge>
              </div>
            </div>
          )}
          {sidebarCollapsed && !mobileMenuOpen && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF9F40] to-[#FF6B00] flex items-center justify-center mx-auto">
              <Bus className="w-5 h-5 text-white" />
            </div>
          )}
          {/* Mobile close button */}
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
                  onClick={() => {
                    handleNavClick(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                    isActive ? 'bg-[#FF9F40] text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
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
          <div className={cn("flex items-center gap-3", sidebarCollapsed && !mobileMenuOpen && "justify-center")}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9F40] to-[#FF6B00] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold">SA</span>
            </div>
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Super Admin</p>
                <p className="text-xs text-gray-400 truncate">admin@qrbag.com</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-white shadow-lg items-center justify-center text-gray-600 hover:text-[#FF9F40] transition-colors"
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
            {/* Mobile menu button */}
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
              
              {/* Notifications Dropdown */}
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
                                notif.type === 'sos' ? 'bg-red-100' : 'bg-blue-100'
                              )}>
                                <Icon className={cn(
                                  "w-5 h-5",
                                  notif.type === 'alert' ? 'text-yellow-600' :
                                  notif.type === 'sos' ? 'text-red-600' : 'text-blue-600'
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
                    <div className="p-3 border-t border-gray-100">
                      <Button variant="ghost" className="w-full text-sm text-gray-600">Voir toutes les notifications</Button>
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
                  <KPICard title="Compagnies" value={data.stats.totalCompanies} subtitle={`${data.stats.activeCompanies} actives`} icon={Building2} color="#5DADE2" />
                  <KPICard title="Bus" value={data.stats.totalBuses} subtitle={`${data.stats.busesInRoute} en route`} icon={Bus} color="#58D68D" />
                  <KPICard title="Colis ce mois" value={data.stats.activatedStickers} subtitle={`${data.stats.inTransitPackages} en transit • ${data.stats.deliveredPackages} livrés`} icon={Package} color="#FF9F40" trend="+12%" />
                  <KPICard title="Revenus/mois" value={`${(data.stats.monthlyRevenue / 1000).toFixed(1)}k FCFA`} subtitle="Abonnements + stickers" icon={DollarSign} color="#9B59B6" trend="+8%" />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
                      <div className="flex items-center justify-around">
                        <div className="text-center">
                          <CircularProgress value={activationRate} color="#FF9F40" />
                          <p className="text-sm text-gray-600 mt-2">Activation</p>
                        </div>
                        <div className="text-center">
                          <CircularProgress value={85} color="#5DADE2" />
                          <p className="text-sm text-gray-600 mt-2">Satisfaction</p>
                        </div>
                        <div className="text-center">
                          <CircularProgress value={92} color="#58D68D" />
                          <p className="text-sm text-gray-600 mt-2">Livraison</p>
                        </div>
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
                          { label: 'Activés (en attente)', value: data.stats.pendingPackages || Math.max(0, data.stats.activatedStickers - data.stats.inTransitPackages - data.stats.deliveredPackages), color: '#58D68D' },
                          { label: 'En transit', value: data.stats.inTransitPackages, color: '#5DADE2' },
                          { label: 'Livrés', value: data.stats.deliveredPackages, color: '#9B59B6' },
                          { label: 'Non activés', value: data.stats.totalStickers - data.stats.activatedStickers, color: '#E5E7EB' },
                        ].map((item, i) => {
                          const values = [
                            data.stats.pendingPackages || Math.max(0, data.stats.activatedStickers - data.stats.inTransitPackages - data.stats.deliveredPackages),
                            data.stats.inTransitPackages,
                            data.stats.deliveredPackages,
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

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-white shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveNav('qrcodes')}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#FF9F40]/10 flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-[#FF9F40]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Générer des QR</p>
                        <p className="text-sm text-gray-500">{data.stats.totalStickers} stickers générés</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveNav('companies')}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#5DADE2]/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-[#5DADE2]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Compagnies</p>
                        <p className="text-sm text-gray-500">{data.companies.length} partenaires</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveNav('subscriptions')}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#9B59B6]/10 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-[#9B59B6]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Abonnements</p>
                        <p className="text-sm text-gray-500">{(data.stats.monthlyRevenue / 1000).toFixed(1)}k FCFA/mois</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveNav('qrcodes')}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#58D68D]/10 flex items-center justify-center">
                        <TestTube className="w-6 h-6 text-[#58D68D]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">QR Codes Test</p>
                        <p className="text-sm text-gray-500">Tester le système</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* COMPANIES PAGE */}
            {activeNav === 'companies' && (
              <motion.div key="companies" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                {/* Search and Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher une compagnie..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-gray-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-gray-200">
                      <Filter className="w-4 h-4 mr-2" />Filtrer
                    </Button>
                    <Button className="bg-[#5DADE2] hover:bg-[#3498DB] text-white" onClick={() => setShowCreateCompany(true)}>
                      <Plus className="w-4 h-4 mr-2" />Nouvelle compagnie
                    </Button>
                  </div>
                </div>

                {/* Companies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCompanies.map((company: any) => (
                    <Card key={company.id} className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCompanyId(company.id)}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF9F40] to-[#FF6B00] flex items-center justify-center text-white font-bold">
                              {company.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{company.name}</p>
                              <p className="text-sm text-gray-500">{company.city}, {company.country}</p>
                            </div>
                          </div>
                          <Badge className={company.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                            {company.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Abonnement</span>
                            {getSubscriptionBadge(company.subscription)}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Revenus</span>
                            <span className="font-bold text-gray-900">{company.revenue.toLocaleString()} FCFA</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Bus / Chauffeurs</span>
                            <span className="text-gray-900">{company.busesCount} / {company.driversCount}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredCompanies.length === 0 && (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune compagnie trouvée</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* QR CODES PAGE */}
            {activeNav === 'qrcodes' && (
              <motion.div key="qrcodes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-5 text-center">
                      <p className="text-3xl font-bold text-[#FF9F40]">{data.stats.totalStickers}</p>
                      <p className="text-sm text-gray-500">QR générés</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-5 text-center">
                      <p className="text-3xl font-bold text-[#58D68D]">{data.stats.activatedStickers}</p>
                      <p className="text-sm text-gray-500">Activés</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-5 text-center">
                      <p className="text-3xl font-bold text-[#5DADE2]">{data.stats.totalStickers - data.stats.activatedStickers}</p>
                      <p className="text-sm text-gray-500">En stock</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-5 text-center">
                      <p className="text-3xl font-bold text-[#9B59B6]">{activationRate}%</p>
                      <p className="text-sm text-gray-500">Taux activation</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Test QR Codes Section */}
                <Card className="bg-gradient-to-r from-[#58D68D]/10 to-[#27AE60]/10 border border-[#58D68D]/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <TestTube className="w-5 h-5 text-[#58D68D]" />
                      <h3 className="text-lg font-semibold text-gray-900">QR Codes de Test</h3>
                      <Badge className="bg-[#58D68D]/20 text-[#27AE60]">Pour développement</Badge>
                    </div>
                    <p className="text-gray-600 mb-4">Utilisez ces codes prédéfinis pour tester le système sans créer de nouvelles données.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {data.testQRCodes?.slice(0, 8).map((qr: any) => (
                        <div key={qr.id} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-mono text-gray-900">{qr.qrCode}</p>
                            <p className="text-xs text-gray-500">{qr.senderName || 'Non activé'}</p>
                          </div>
                          <Badge className={cn(
                            "text-xs",
                            qr.status === 'NON_ACTIVE' ? 'bg-gray-100 text-gray-600' :
                            qr.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                            qr.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                          )}>
                            {qr.status === 'NON_ACTIVE' ? 'Non activé' :
                             qr.status === 'ACTIVE' ? 'Actif' :
                             qr.status === 'IN_TRANSIT' ? 'En transit' : 'Livré'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Generate Button */}
                <Card className="bg-gradient-to-r from-[#FF9F40]/10 to-[#FF6B00]/10 border border-[#FF9F40]/20">
                  <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[#FF9F40] flex items-center justify-center">
                        <Wand2 className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Générer de nouveaux QR Codes</h3>
                        <p className="text-gray-600">Créez un nouveau lot de stickers pour les colis</p>
                      </div>
                    </div>
                    <Button className="bg-[#FF9F40] hover:bg-[#E67E00] text-white w-full sm:w-auto" onClick={() => setShowGenerateQR(true)}>
                      <Plus className="w-4 h-4 mr-2" />Générer
                    </Button>
                  </CardContent>
                </Card>

                {/* Search */}
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Rechercher un lot..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 border-gray-200" />
                  </div>
                </div>

                {/* QR Batches List */}
                <div className="space-y-3">
                  {filteredBatches.map((batch: any) => (
                    <Card key={batch.id} className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedBatchId(batch.id)}>
                      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[#FF9F40]/10 flex items-center justify-center">
                            <QrCode className="w-5 h-5 text-[#FF9F40]" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{batch.batchCode}</p>
                            <p className="text-sm text-gray-500">{batch.company?.name || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                          <div className="text-right flex-1 sm:flex-none">
                            <p className="text-sm text-gray-500">{batch.quantity} stickers</p>
                            <p className="text-sm font-medium text-gray-900">{batch.activatedCount} activés</p>
                          </div>
                          <div className="w-20 sm:w-24">
                            <Progress value={(batch.activatedCount / batch.quantity) * 100} className="h-2" />
                          </div>
                          <Badge className={batch.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                            {batch.status === 'ACTIVE' ? 'Actif' : batch.status}
                          </Badge>
                          <Eye className="w-5 h-5 text-gray-400 hidden sm:block" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SUBSCRIPTIONS PAGE */}
            {activeNav === 'subscriptions' && (
              <motion.div key="subscriptions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                {/* Revenue Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-[#9B59B6]" />
                        <span className="text-gray-500">Revenus totaux</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{data.stats.monthlyRevenue.toLocaleString()} FCFA</p>
                      <p className="text-sm text-green-600 mt-1">+12% ce mois</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-[#FF9F40]" />
                        <span className="text-gray-500">Abonnements</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{data.stats.subscriptionRevenue.toLocaleString()} FCFA</p>
                      <p className="text-sm text-gray-500 mt-1">Revenus fixes</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <QrCode className="w-5 h-5 text-[#58D68D]" />
                        <span className="text-gray-500">Stickers activés</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{data.stats.stickerRevenue.toLocaleString()} FCFA</p>
                      <p className="text-sm text-gray-500 mt-1">{data.stats.activatedStickers} × 200 FCFA</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Subscription Plans */}
                <h3 className="text-lg font-semibold text-gray-900">Forfaits disponibles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {data.subscriptions.map((sub: any) => (
                    <Card key={sub.planType} className="bg-white shadow-sm border border-gray-100">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.planType === 'PACK_COMPLET' ? '#9B59B6' : sub.planType === 'COLIS_ONLY' ? '#58D68D' : '#5DADE2' }} />
                          <Badge className="bg-gray-100 text-gray-600">{sub.count} compagnie(s)</Badge>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">{sub.label}</h4>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{sub.revenue.toLocaleString()} FCFA</p>
                        <p className="text-sm text-gray-500 mb-4">{sub.monthlyFee.toLocaleString()} FCFA/mois</p>
                        <Button variant="outline" className="w-full border-gray-200">Voir détails</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* REPORTS PAGE */}
            {activeNav === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-gray-200">Ce mois</Button>
                    <Button variant="ghost">Ce trimestre</Button>
                    <Button variant="ghost">Cette année</Button>
                  </div>
                  <Button variant="outline" className="border-gray-200">
                    <Download className="w-4 h-4 mr-2" />Exporter
                  </Button>
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
                              className="w-8 rounded-t bg-gradient-to-t from-[#FF9F40] to-[#FF6B00]"
                            />
                            <span className="text-xs text-gray-500">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i]}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance des compagnies</h3>
                      <div className="space-y-4">
                        {data.companies.map((company: any) => (
                          <div key={company.id} className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF9F40] to-[#FF6B00] flex items-center justify-center text-white text-xs font-bold">
                              {company.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{company.name}</p>
                              <Progress value={company.revenue / 1000} className="h-2 mt-1" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">{company.revenue.toLocaleString()} FCFA</span>
                          </div>
                        ))}
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres du système</h3>
                    <p className="text-gray-500">Cliquez sur l&apos;icône Paramètres dans la sidebar pour ouvrir les paramètres.</p>
                    <Button className="mt-4 bg-[#FF9F40] hover:bg-[#E67E00] text-white" onClick={() => setShowSettings(true)}>
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
      <CreateCompanyModal isOpen={showCreateCompany} onClose={() => setShowCreateCompany(false)} onSuccess={fetchData} />
      <GenerateQRModal isOpen={showGenerateQR} onClose={() => setShowGenerateQR(false)} companies={data?.companies || []} onSuccess={fetchData} />
      <QRBatchDetailsModal isOpen={!!selectedBatchId} onClose={() => setSelectedBatchId(null)} batchId={selectedBatchId} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <CompanyDetailsModal isOpen={!!selectedCompanyId} onClose={() => setSelectedCompanyId(null)} companyId={selectedCompanyId} />
    </div>
  );
}
