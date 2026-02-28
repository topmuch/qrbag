'use client';

import { useState, useEffect } from 'react';
import { 
  Download, Search, Loader2, X, QrCode, Clock, CheckCircle, 
  XCircle, Package, MapPin, Calendar, Filter
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface QRPackage {
  id: string;
  qrCode: string;
  status: string;
  senderName?: string;
  senderPhone?: string;
  recipientName?: string;
  recipientPhone?: string;
  activatedAt?: string;
  validUntil?: string;
  deliveredAt?: string;
  expiredAt?: string;
  createdAt: string;
  trip?: {
    route?: {
      origin: string;
      destination: string;
    };
  };
}

interface AgencyStats {
  id: string;
  name: string;
  email: string;
  city?: string;
  country?: string;
}

interface AgencyQRModalProps {
  agency: AgencyStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AgencyQRModal({ agency, open, onOpenChange }: AgencyQRModalProps) {
  const [packages, setPackages] = useState<QRPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (open && agency) {
      fetchPackages();
    }
  }, [open, agency]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/packages?companyId=${agency.id}`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (pkg: QRPackage) => {
    const now = new Date();
    const validUntil = pkg.validUntil ? new Date(pkg.validUntil) : null;
    
    if (pkg.status === 'DELIVERED') {
      return {
        label: 'Livré',
        color: 'bg-gray-500',
        textColor: 'text-gray-700',
        bgColor: 'bg-gray-100',
        icon: CheckCircle,
      };
    }
    
    if (pkg.status === 'EXPIRED' || (validUntil && validUntil < now)) {
      return {
        label: 'Expiré',
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-100',
        icon: XCircle,
      };
    }
    
    if (pkg.status === 'ACTIVE' || pkg.status === 'IN_TRANSIT') {
      return {
        label: pkg.status === 'IN_TRANSIT' ? 'En transit' : 'Actif',
        color: 'bg-green-500',
        textColor: 'text-green-700',
        bgColor: 'bg-green-100',
        icon: Clock,
      };
    }
    
    return {
      label: 'Non activé',
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-100',
      icon: Package,
    };
  };

  const getValidityText = (pkg: QRPackage) => {
    if (pkg.status === 'DELIVERED') {
      return pkg.deliveredAt 
        ? `Livré le ${format(new Date(pkg.deliveredAt), 'dd/MM/yyyy HH:mm', { locale: fr })}`
        : 'Livré';
    }
    
    if (!pkg.activatedAt || !pkg.validUntil) {
      return '-';
    }
    
    const validUntil = new Date(pkg.validUntil);
    const now = new Date();
    
    if (pkg.status === 'EXPIRED' || validUntil < now) {
      return `Expiré le ${format(validUntil, 'dd/MM HH:mm', { locale: fr })}`;
    }
    
    return `Valide jusqu'au ${format(validUntil, 'dd/MM HH:mm', { locale: fr })}`;
  };

  // Filter packages
  const filteredPackages = packages.filter(pkg => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'NON_ACTIVE' && pkg.status === 'NON_ACTIVE') ||
      (statusFilter === 'ACTIVE' && (pkg.status === 'ACTIVE' || pkg.status === 'IN_TRANSIT')) ||
      (statusFilter === 'DELIVERED' && pkg.status === 'DELIVERED') ||
      (statusFilter === 'EXPIRED' && (pkg.status === 'EXPIRED' || (pkg.validUntil && new Date(pkg.validUntil) < new Date())));
    
    const matchesSearch = pkg.qrCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.recipientName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pkg.senderName?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
  const paginatedPackages = filteredPackages.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Calculate stats
  const stats = {
    total: packages.length,
    activated: packages.filter(p => p.status !== 'NON_ACTIVE').length,
    active: packages.filter(p => p.status === 'ACTIVE' || p.status === 'IN_TRANSIT').length,
    available: packages.filter(p => p.status === 'NON_ACTIVE').length,
    delivered: packages.filter(p => p.status === 'DELIVERED').length,
    expired: packages.filter(p => 
      p.status === 'EXPIRED' || 
      (p.validUntil && new Date(p.validUntil) < new Date())
    ).length,
    revenue: packages.filter(p => p.status !== 'NON_ACTIVE').length * 200,
  };

  const exportToCSV = () => {
    const headers = ['QR Code', 'Statut', 'Activé le', 'Valide jusqu\'au', 'Destinataire', 'Téléphone'];
    const rows = filteredPackages.map(pkg => [
      pkg.qrCode,
      getStatusConfig(pkg).label,
      pkg.activatedAt ? format(new Date(pkg.activatedAt), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-',
      pkg.validUntil ? format(new Date(pkg.validUntil), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-',
      pkg.recipientName || '-',
      pkg.recipientPhone || '-'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-codes-${agency.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="w-8 h-8 rounded-lg bg-[#FF9F40]/10 flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-[#FF9F40]" />
                </div>
                QR Codes - {agency.name}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {agency.city}, {agency.country || 'N/A'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total générés</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-500">Actifs</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.available}</p>
              <p className="text-xs text-gray-500">Disponibles</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.delivered}</p>
              <p className="text-xs text-gray-500">Livrés</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              <p className="text-xs text-gray-500">Expirés</p>
            </div>
            <div className="bg-[#FF9F40]/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-[#FF9F40]">{stats.revenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500">FCFA revenus</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 border-gray-200">
                <Filter className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="NON_ACTIVE">Non activés</SelectItem>
                <SelectItem value="ACTIVE">Actifs</SelectItem>
                <SelectItem value="DELIVERED">Livrés</SelectItem>
                <SelectItem value="EXPIRED">Expirés</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un QR code ou destinataire..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10 border-gray-200"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#FF9F40] animate-spin" />
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-gray-500">QR Code</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-500">Statut</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-500">Activé le</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-500">Validité</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-500">Destinataire</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedPackages.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">
                            Aucun QR code trouvé
                          </td>
                        </tr>
                      ) : (
                        paginatedPackages.map((pkg) => {
                          const statusConfig = getStatusConfig(pkg);
                          const StatusIcon = statusConfig.icon;
                          
                          return (
                            <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                              <td className="p-3">
                                <span className="font-mono text-sm font-medium text-gray-900">
                                  {pkg.qrCode}
                                </span>
                              </td>
                              <td className="p-3">
                                <Badge className={cn(statusConfig.bgColor, statusConfig.textColor, 'font-medium')}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm text-gray-600">
                                {pkg.activatedAt 
                                  ? format(new Date(pkg.activatedAt), 'dd/MM HH:mm', { locale: fr })
                                  : '-'
                                }
                              </td>
                              <td className="p-3 text-sm">
                                <span className={cn(
                                  statusConfig.label === 'Expiré' ? 'text-red-600' : 'text-gray-500'
                                )}>
                                  {getValidityText(pkg)}
                                </span>
                              </td>
                              <td className="p-3 text-sm text-gray-600">
                                {pkg.recipientName || '-'}
                                {pkg.recipientPhone && (
                                  <span className="block text-xs text-gray-400">
                                    {pkg.recipientPhone}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Affichage de {((page - 1) * itemsPerPage) + 1} à {Math.min(page * itemsPerPage, filteredPackages.length)} sur {filteredPackages.length} QR codes
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="border-gray-200"
                    >
                      Précédent
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="border-gray-200"
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
