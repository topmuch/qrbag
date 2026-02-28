'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus, Package, Bell, AlertTriangle, QrCode, Camera, Plus,
  Phone, MessageCircle, CheckCircle2, Clock, MapPin, User,
  Settings, LogOut, X, ChevronRight, Wifi, WifiOff, Send,
  Truck, Navigation, Calendar, Eye, CameraOff, ArrowUpRight,
  TrendingUp, Users, Box, Route, Play, Pause as PauseIcon, Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';
import { toast, Toaster } from 'sonner';

// Import new components
import QRScanner from '@/components/driver/QRScanner';
import NewPackageModal from '@/components/driver/NewPackageModal';

// Types
interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  isActive: boolean;
}

interface Trip {
  id: string;
  trackingCode: string;
  status: string;
  departureTime: string;
  actualDeparture: string | null;
  passengers: number;
  currentLat: number | null;
  currentLng: number | null;
  bus: { plateNumber: string; model: string } | null;
  route: { name: string; origin: string; destination: string } | null;
  scans: Scan[];
  packagesCount: number;
}

interface PackageItem {
  id: string;
  qrCode: string;
  status: string;
  senderName: string | null;
  senderPhone: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientWhatsapp: string | null;
  pickupCode: string | null;
  description: string | null;
  weight: number | null;
  photo: string | null;
  activatedAt: string | null;
  trip: { id: string; route: { name: string } | null } | null;
}

interface Scan {
  id: string;
  type: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
}

// Scan types for checkpoints
const SCAN_TYPES = [
  { id: 'DEPARTURE', label: 'Départ', icon: Play, color: 'from-emerald-500 to-green-600', bgColor: 'bg-emerald-500' },
  { id: 'PAUSE', label: 'Pause', icon: PauseIcon, color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-500' },
  { id: 'RESUME', label: 'Reprise', icon: ArrowUpRight, color: 'from-blue-500 to-indigo-600', bgColor: 'bg-blue-500' },
  { id: 'ARRIVAL', label: 'Arrivée', icon: Flag, color: 'from-violet-500 to-purple-600', bgColor: 'bg-violet-500' },
];

// Stats card component
function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  gradient: string;
  trend?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-lg`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/80 text-sm font-medium">{title}</span>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        {trend && (
          <div className="flex items-center gap-1 text-white/70 text-xs">
            <TrendingUp className="w-3 h-3" />
            <span>{trend}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function DriverApp() {
  // State
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [completedTrips, setCompletedTrips] = useState<Trip[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'home' | 'packages' | 'history' | 'settings'>('home');
  
  // NEW: Scanner and Modal States
  const [showCheckpointScanner, setShowCheckpointScanner] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
  
  // GPS State
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  
  // Form States for checkpoint scan
  const [scanType, setScanType] = useState<string>('DEPARTURE');
  const [scanNotes, setScanNotes] = useState('');
  const [passengerCount, setPassengerCount] = useState('');
  const [isSubmittingScan, setIsSubmittingScan] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/driver/dashboard');
      const data = await response.json();
      setDriver(data.driver);
      setActiveTrip(data.activeTrip);
      setPackages(data.packagesInTransit || []);
      setCompletedTrips(data.completedTrips || []);
    } catch (error) {
      console.error('Fetch error:', error);
      // Use demo data
      setDriver({
        id: 'driver-1',
        name: 'Jean-Baptiste Kouadio',
        email: 'driver@transport-express.ci',
        phone: '+225 07 00 00 02',
        licenseNumber: 'CI-67890-2024',
        isActive: true
      });
      // Demo active trip
      setActiveTrip({
        id: 'trip-demo',
        trackingCode: 'TRK-2024-001',
        status: 'IN_PROGRESS',
        departureTime: new Date().toISOString(),
        actualDeparture: new Date().toISOString(),
        passengers: 42,
        currentLat: 5.3599,
        currentLng: -4.0083,
        bus: { plateNumber: 'AB-1234-CI', model: 'Mercedes Benz' },
        route: { name: 'Abidjan - Yamoussoukro', origin: 'Abidjan', destination: 'Yamoussoukro' },
        scans: [
          { id: '1', type: 'DEPARTURE', timestamp: new Date().toISOString(), latitude: 5.3599, longitude: -4.0083, notes: null }
        ],
        packagesCount: 8
      });
      // Demo packages
      setPackages([
        {
          id: 'pkg-1',
          qrCode: 'QR-2024-001',
          status: 'IN_TRANSIT',
          senderName: 'Kouame Jean',
          senderPhone: '+225 07 00 01 01',
          recipientName: 'Yao Marie',
          recipientPhone: '+225 07 00 02 02',
          recipientWhatsapp: '+225 07 00 02 02',
          pickupCode: '4521',
          description: 'Colis alimentaire',
          weight: 5,
          photo: null,
          activatedAt: new Date().toISOString(),
          trip: { id: 'trip-demo', route: { name: 'Abidjan - Yamoussoukro' } }
        },
        {
          id: 'pkg-2',
          qrCode: 'QR-2024-002',
          status: 'IN_TRANSIT',
          senderName: 'Diallo Amadou',
          senderPhone: '+225 07 00 03 03',
          recipientName: 'Kone Fatou',
          recipientPhone: '+225 07 00 04 04',
          recipientWhatsapp: '+225 07 00 04 04',
          pickupCode: '7832',
          description: 'Vêtements',
          weight: 3,
          photo: null,
          activatedAt: new Date().toISOString(),
          trip: { id: 'trip-demo', route: { name: 'Abidjan - Yamoussoukro' } }
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Get current position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Geolocation error:', err)
      );
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData]);

  // Handle checkpoint scan (from QRScanner)
  const handleCheckpointScan = async (scannedData: string) => {
    if (!activeTrip) {
      toast.error('Aucun voyage actif');
      return;
    }

    setIsSubmittingScan(true);

    try {
      // Get fresh GPS position
      let lat = currentPosition?.lat;
      let lng = currentPosition?.lng;
      
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000
          });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }

      const response = await fetch('/api/driver/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan',
          tripId: activeTrip.id,
          type: scanType,
          latitude: lat,
          longitude: lng,
          notes: scanNotes,
          passengers: passengerCount ? parseInt(passengerCount) : undefined,
          qrData: scannedData
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`✅ ${SCAN_TYPES.find(t => t.id === scanType)?.label} enregistré`);
        setScanNotes('');
        setPassengerCount('');
        fetchData(); // Refresh data
      } else {
        toast.error(data.error || 'Erreur lors du scan');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setIsSubmittingScan(false);
    }
  };

  // Open checkpoint scanner
  const openCheckpointScanner = () => {
    if (!activeTrip) {
      toast.error('Aucun voyage actif. Commencez un voyage d\'abord.');
      return;
    }
    setScanType(getNextScanType());
    setShowCheckpointScanner(true);
  };

  // Handle SOS
  const handleSOS = async () => {
    try {
      const response = await fetch('/api/driver/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driver?.id,
          tripId: activeTrip?.id,
          latitude: currentPosition?.lat,
          longitude: currentPosition?.lng,
          message: 'Urgence - Aide requise'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('🚨 Alerte SOS envoyée');
        setShowSOSConfirm(false);
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi SOS');
    }
  };

  // Handle delivery
  const handleDeliver = async (pickupCode: string) => {
    if (!selectedPackage) return;
    
    try {
      const response = await fetch('/api/driver/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deliver',
          packageId: selectedPackage.id,
          pickupCode
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('✅ Colis livré avec succès');
        setShowDeliveryModal(false);
        setSelectedPackage(null);
        fetchData();
      } else {
        toast.error(data.error || 'Code incorrect');
      }
    } catch (error) {
      toast.error('Erreur lors de la livraison');
    }
  };

  // WhatsApp message
  const openWhatsApp = (pkg: PackageItem) => {
    const phone = pkg.recipientWhatsapp || pkg.recipientPhone;
    if (!phone) return;
    
    const code = pkg.pickupCode || 'XXXX';
    const message = encodeURIComponent(
      `🚌 QRBAG Livraison\n\n` +
      `Bonjour ${pkg.recipientName || 'Client'},\n\n` +
      `Votre colis est ARRIVÉ ! ✅\n\n` +
      `🚌 Bus: ${activeTrip?.bus?.plateNumber || 'N/A'}\n` +
      `📍 Lieu: Gare Routière ${activeTrip?.route?.destination || 'Destination'}\n` +
      `🕒 Horaires: 8h00 - 20h00\n\n` +
      `🔐 VOTRE CODE SECRET: ${code}\n\n` +
      `⚠️ IMPORTANT:\n` +
      `• Présentez ce code pour retirer votre colis\n` +
      `• Ne partagez pas ce code\n` +
      `• Code valable 7 jours\n` +
      `• Pièce d'identité requise\n\n` +
      `Expéditeur: ${pkg.senderName || 'N/A'}\n` +
      `Compagnie: Transport Express CI`
    );
    
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Get next scan type
  const getNextScanType = () => {
    if (!activeTrip) return 'DEPARTURE';
    const scans = activeTrip.scans || [];
    const hasDeparture = scans.some(s => s.type === 'DEPARTURE');
    const hasPause = scans.some(s => s.type === 'PAUSE');
    const hasResume = scans.some(s => s.type === 'RESUME');
    
    if (!hasDeparture) return 'DEPARTURE';
    if (hasPause && !hasResume) return 'RESUME';
    if (hasDeparture && !hasPause) return 'PAUSE';
    if (hasResume) return 'ARRIVAL';
    return 'PAUSE';
  };

  // Format time
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Toaster position="top-center" richColors />
      
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-4">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-bold text-white text-lg">QRBag</span>
                  <div className="flex items-center gap-2">
                    {isOnline ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-emerald-400 font-medium">En ligne</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-xs text-red-400 font-medium">Hors ligne</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10"
                  onClick={() => setShowNotifications(true)}
                >
                  <Bell className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">2</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg shadow-red-500/30"
                  onClick={() => setShowSOSConfirm(true)}
                >
                  <AlertTriangle className="w-5 h-5 text-white" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 px-4 pb-28">
        {activeTab === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Active Trip Card */}
            {activeTrip ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{activeTrip.route?.name || 'Voyage en cours'}</p>
                        <p className="text-sm text-white/60">{activeTrip.bus?.plateNumber}</p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 px-3 py-1">
                      {activeTrip.status === 'IN_PROGRESS' ? 'En cours' : 
                       activeTrip.status === 'PAUSED' ? 'En pause' : activeTrip.status}
                    </Badge>
                  </div>

                  {/* Timeline Progress */}
                  <div className="bg-white/5 rounded-xl p-4 mb-4">
                    <p className="text-xs text-white/50 mb-3 font-medium">Progression du voyage</p>
                    <div className="flex items-center justify-between gap-2">
                      {SCAN_TYPES.map((type) => {
                        const scan = activeTrip.scans?.find((s: Scan) => s.type === type.id);
                        const isDone = !!scan;
                        const isCurrent = type.id === getNextScanType();
                        const Icon = type.icon;
                        
                        return (
                          <div key={type.id} className="flex flex-col items-center flex-1">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                              isDone ? `bg-gradient-to-br ${type.color} shadow-lg` :
                              isCurrent ? "bg-white/20 border-2 border-amber-400 animate-pulse" :
                              "bg-white/10 border border-white/20"
                            )}>
                              {isDone ? (
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              ) : (
                                <Icon className={cn(
                                  "w-4 h-4",
                                  isCurrent ? "text-amber-400" : "text-white/40"
                                )} />
                              )}
                            </div>
                            <span className={cn(
                              "text-xs mt-2 font-medium",
                              isDone || isCurrent ? "text-white" : "text-white/40"
                            )}>{type.label}</span>
                            {scan && (
                              <span className="text-xs text-amber-400 font-medium">{formatTime(scan.timestamp)}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Trip Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <Users className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">{activeTrip.passengers}</p>
                      <p className="text-xs text-white/50">Passagers</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <Package className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-white">{packages.length}</p>
                      <p className="text-xs text-white/50">Colis</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center mx-auto mb-4">
                  <Bus className="w-10 h-10 text-white/50" />
                </div>
                <p className="text-white/70 mb-4">Aucun voyage en cours</p>
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30"
                  onClick={() => toast.info('Contactez votre superviseur pour démarrer un voyage')}
                >
                  <Plus className="w-4 h-4 mr-2" />Démarrer un voyage
                </Button>
              </motion.div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <StatsCard 
                title="Colis livrés" 
                value="12" 
                icon={CheckCircle2}
                gradient="from-emerald-500 to-green-600"
                trend="+3 aujourd'hui"
              />
              <StatsCard 
                title="En transit" 
                value={packages.length} 
                icon={Truck}
                gradient="from-blue-500 to-indigo-600"
              />
            </div>

            {/* Quick Actions - FIXED: Both buttons now work */}
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={openCheckpointScanner}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-left shadow-lg shadow-violet-500/30"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                <QrCode className="w-10 h-10 text-white mb-3" />
                <p className="font-bold text-white text-lg">Scanner</p>
                <p className="text-white/70 text-sm">Checkpoint</p>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPackageModal(true)}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-5 text-left shadow-lg shadow-orange-500/30"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                <Package className="w-10 h-10 text-white mb-3" />
                <p className="font-bold text-white text-lg">Nouveau</p>
                <p className="text-white/70 text-sm">Colis</p>
              </motion.button>
            </div>

            {/* My Packages */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-white text-lg">📦 Mes Colis</h2>
                {packages.length > 0 && (
                  <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {packages.length} en transit
                  </Badge>
                )}
              </div>
              
              {packages.length > 0 ? (
                <div className="space-y-3">
                  {packages.map((pkg, index) => (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{pkg.recipientName}</p>
                            <p className="text-sm text-white/50">{pkg.recipientPhone}</p>
                          </div>
                        </div>
                        <Badge className={cn(
                          "border-0",
                          pkg.status === 'IN_TRANSIT' ? 'bg-blue-500/20 text-blue-400' : 
                          pkg.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-white/10 text-white/60'
                        )}>
                          {pkg.status === 'IN_TRANSIT' ? 'En transit' : 
                           pkg.status === 'ACTIVE' ? 'Actif' : pkg.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="text-white/50">Code retrait:</span>
                        <code className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg font-mono font-bold">
                          ****{(pkg.pickupCode || 'XXXX').slice(-2)}
                        </code>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 bg-transparent border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                          onClick={() => openWhatsApp(pkg)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-0 shadow-lg shadow-emerald-500/20"
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setShowDeliveryModal(true);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Livrer
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <Package className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/50">Aucun colis à bord</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <h2 className="font-bold text-white text-xl">📦 Tous mes colis</h2>
            
            {packages.length > 0 ? (
              <div className="space-y-3">
                {packages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                          <QrCode className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{pkg.recipientName}</p>
                          <p className="text-sm text-white/50">{pkg.description || 'Colis'}</p>
                          <p className="text-xs text-white/30">{pkg.qrCode}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/40" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <Package className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/50 text-lg">Aucun colis</p>
              </div>
            )}
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <h2 className="font-bold text-white text-xl">📋 Historique des voyages</h2>
            
            {completedTrips.length > 0 ? (
              <div className="space-y-3">
                {completedTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-white">{trip.route?.name || 'Voyage'}</p>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Terminé
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/50">
                      <span>{formatTime(trip.actualDeparture)} → {formatTime(trip.actualArrival)}</span>
                      <span>{trip.packagesCount || 0} colis</span>
                    </div>
                    <p className="text-xs text-white/30 mt-1">
                      {trip.bus?.plateNumber} • {trip.passengers} passagers
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/50 text-lg">Aucun voyage terminé</p>
                <p className="text-white/30 text-sm mt-2">Vos voyages terminés apparaîtront ici</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Profile Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-amber-500/30">
                  {driver?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'JD'}
                </div>
                <div>
                  <p className="font-bold text-white text-xl">{driver?.name || 'Chauffeur'}</p>
                  <p className="text-white/50">{driver?.phone}</p>
                  <p className="text-xs text-white/30">Permis: {driver?.licenseNumber}</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isOnline ? (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Wifi className="w-5 h-5 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <WifiOff className="w-5 h-5 text-red-400" />
                    </div>
                  )}
                  <span className="text-white">Statut réseau</span>
                </div>
                <Badge className={cn(
                  "border-0",
                  isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                )}>
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
              <Button variant="ghost" className="w-full justify-start p-5 rounded-none border-b border-white/10 hover:bg-white/5">
                <Settings className="w-5 h-5 mr-3 text-white/50" />
                <span className="text-white">Paramètres de l'application</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start p-5 rounded-none hover:bg-red-500/10 text-red-400 hover:text-red-300">
                <LogOut className="w-5 h-5 mr-3" />
                <span>Déconnexion</span>
              </Button>
            </div>

            {/* App Info */}
            <p className="text-center text-white/30 text-sm">
              QRBag Chauffeur v1.0.0
            </p>
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-4 mb-4">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl px-2 py-2">
            <div className="flex items-center justify-around">
              {[
                { id: 'home', icon: Bus, label: 'Accueil' },
                { id: 'packages', icon: Package, label: 'Colis' },
                { id: 'history', icon: Calendar, label: 'Historique' },
                { id: 'settings', icon: Settings, label: 'Paramètres' },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={cn(
                      "flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-300",
                      isActive 
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30" 
                        : "hover:bg-white/10"
                    )}
                  >
                    <Icon className={cn(
                      "w-6 h-6",
                      isActive ? "text-white" : "text-white/50"
                    )} />
                    <span className={cn(
                      "text-xs mt-1 font-medium",
                      isActive ? "text-white" : "text-white/50"
                    )}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Checkpoint QR Scanner Modal */}
      <QRScanner
        open={showCheckpointScanner}
        onOpenChange={setShowCheckpointScanner}
        onScan={handleCheckpointScan}
        title={`Scanner ${SCAN_TYPES.find(t => t.id === scanType)?.label}`}
        description="Scannez le QR code du checkpoint"
      />

      {/* New Package Modal */}
      <NewPackageModal
        open={showPackageModal}
        onOpenChange={setShowPackageModal}
        tripId={activeTrip?.id || null}
        onSuccess={fetchData}
      />

      {/* Delivery Modal */}
      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="sm:max-w-sm bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Valider la livraison</DialogTitle>
          </DialogHeader>
          
          <DeliveryForm 
            pkg={selectedPackage}
            onDeliver={handleDeliver}
            onCancel={() => setShowDeliveryModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* SOS Confirmation */}
      <AlertDialog open={showSOSConfirm} onOpenChange={setShowSOSConfirm}>
        <AlertDialogContent className="bg-gradient-to-br from-slate-900 via-red-900/30 to-slate-900 border-red-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              🚨 URGENCE SOS
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Envoyer une alerte SOS à votre compagnie et au Super Admin ?
              <div className="mt-3 p-3 bg-white/5 rounded-xl text-sm space-y-2 border border-white/10">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span className="text-white/50">Position GPS:</span>
                  <span className="text-white">
                    {currentPosition ? `${currentPosition.lat.toFixed(4)}, ${currentPosition.lng.toFixed(4)}` : 'Non disponible'}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span className="text-white/50">Chauffeur:</span>
                  <span className="text-white">{driver?.name}</span>
                </p>
                {activeTrip && (
                  <p className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-amber-400" />
                    <span className="text-white/50">Bus:</span>
                    <span className="text-white">{activeTrip.bus?.plateNumber}</span>
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSOS} 
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 border-0 shadow-lg shadow-red-500/30"
            >
              🚨 Envoyer SOS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Delivery Form Component
function DeliveryForm({ pkg, onDeliver, onCancel }: { 
  pkg: PackageItem | null; 
  onDeliver: (code: string) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (code.length !== 4) {
      setError('Le code doit contenir 4 chiffres');
      return;
    }
    onDeliver(code);
  };

  return (
    <div className="space-y-4">
      {pkg && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="font-semibold text-white">{pkg.recipientName}</p>
          <p className="text-sm text-white/50">{pkg.recipientPhone}</p>
          <p className="text-sm text-white/50">{pkg.description}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-white/70">Code de retrait (4 chiffres)</Label>
        <Input
          type="text"
          maxLength={4}
          placeholder="XXXX"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ''));
            setError('');
          }}
          className="text-center text-2xl tracking-widest bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-amber-400 h-14"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <Button 
          variant="outline" 
          className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10"
          onClick={onCancel}
        >
          Annuler
        </Button>
        <Button 
          className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 border-0 shadow-lg shadow-emerald-500/30"
          onClick={handleSubmit}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Confirmer
        </Button>
      </div>
    </div>
  );
}
