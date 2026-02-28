'use client';

import { useState, useEffect } from 'react';
import { QrCode, X, Copy, Check, Download, Printer, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface QRBatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string | null;
}

interface PackageItem {
  id: string;
  qrCode: string;
  status: string;
  activatedAt: string | null;
  senderName: string | null;
  recipientName: string | null;
}

interface BatchDetails {
  id: string;
  batchCode: string;
  quantity: number;
  activatedCount: number;
  status: string;
  createdAt: string;
  company: {
    name: string;
    email: string;
    city: string;
    country: string;
  };
  packages: PackageItem[];
}

export default function QRBatchDetailsModal({
  isOpen,
  onClose,
  batchId
}: QRBatchDetailsModalProps) {
  const [batch, setBatch] = useState<BatchDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (isOpen && batchId) {
      fetchBatchDetails();
    }
  }, [isOpen, batchId]);

  const fetchBatchDetails = async () => {
    if (!batchId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/qr-batches?batchId=${batchId}`);
      if (response.ok) {
        const data = await response.json();
        setBatch(data);
      }
    } catch (error) {
      console.error('Error fetching batch details:', error);
      toast.error('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copié!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const downloadCSV = () => {
    if (!batch) return;
    
    setDownloading(true);
    try {
      // Create CSV content
      const headers = ['Code QR', 'Statut', 'Date Activation', 'Expéditeur', 'Destinataire'];
      const rows = batch.packages.map(pkg => [
        pkg.qrCode,
        pkg.status === 'NON_ACTIVE' ? 'Non activé' : 
        pkg.status === 'ACTIVE' ? 'Actif' : 
        pkg.status === 'IN_TRANSIT' ? 'En transit' : 'Livré',
        pkg.activatedAt ? new Date(pkg.activatedAt).toLocaleDateString('fr-FR') : '-',
        pkg.senderName || '-',
        pkg.recipientName || '-'
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${batch.batchCode}_qr_codes.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Fichier CSV téléchargé!');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  };

  const printStickers = () => {
    if (!batch) return;
    
    setPrinting(true);
    try {
      // Create print window with stickers
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Veuillez autoriser les fenêtres pop-up pour imprimer');
        setPrinting(false);
        return;
      }
      
      const stickersPerPage = 10;
      const pages = Math.ceil(batch.packages.length / stickersPerPage);
      
      let stickersHTML = '';
      batch.packages.forEach((pkg, index) => {
        const statusText = pkg.status === 'NON_ACTIVE' ? "En attente d'activation" : 'Activé';
        stickersHTML += `
          <div class="sticker">
            <div class="sticker-header">
              <div class="company-name">${batch.company.name}</div>
              <div class="qr-label">QR BAG</div>
            </div>
            <div class="qr-code">${pkg.qrCode}</div>
            <div class="sticker-footer">
              <div>Scanner pour suivre votre colis</div>
              <div class="status">${statusText}</div>
            </div>
          </div>
        `;
      });
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Stickers ${batch.batchCode}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 10mm;
            }
            .page {
              display: flex;
              flex-wrap: wrap;
              gap: 5mm;
              page-break-after: always;
            }
            .page:last-child {
              page-break-after: auto;
            }
            .sticker {
              width: 70mm;
              height: 35mm;
              border: 2px solid #333;
              border-radius: 5px;
              padding: 3mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: white;
            }
            .sticker-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #ccc;
              padding-bottom: 2mm;
            }
            .company-name {
              font-size: 10px;
              font-weight: bold;
              color: #333;
            }
            .qr-label {
              font-size: 12px;
              font-weight: bold;
              color: #FF6B00;
            }
            .qr-code {
              font-family: 'Courier New', monospace;
              font-size: 14px;
              font-weight: bold;
              text-align: center;
              padding: 3mm 0;
              color: #000;
              letter-spacing: 1px;
            }
            .sticker-footer {
              font-size: 8px;
              text-align: center;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 2mm;
            }
            .status {
              margin-top: 1mm;
              color: #888;
            }
            @media print {
              body {
                padding: 0;
              }
              .sticker {
                border: 2px solid #000;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            ${stickersHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      toast.success('Fenêtre d\'impression ouverte');
    } catch (error) {
      console.error('Error printing stickers:', error);
      toast.error('Erreur lors de l\'impression');
    } finally {
      setPrinting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'IN_TRANSIT':
        return <Badge className="bg-green-100 text-green-700">Activé</Badge>;
      case 'DELIVERED':
        return <Badge className="bg-blue-100 text-blue-700">Livré</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-500">Non activé</Badge>;
    }
  };

  const activationRate = batch ? (batch.activatedCount / batch.quantity) * 100 : 0;

  if (!batch && !loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            {loading ? 'Chargement...' : batch?.batchCode}
          </DialogTitle>
          <DialogDescription>
            {batch?.company?.name} • Créé le {batch && new Date(batch.createdAt).toLocaleDateString('fr-FR')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">
            Chargement des détails...
          </div>
        ) : batch && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{batch.quantity}</p>
                <p className="text-sm text-gray-500">Total générés</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{batch.activatedCount}</p>
                <p className="text-sm text-gray-500">Activés</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{batch.quantity - batch.activatedCount}</p>
                <p className="text-sm text-gray-500">Restants</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{Math.round(activationRate)}%</p>
                <p className="text-sm text-gray-500">Taux</p>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2 mb-4">
              <Progress value={activationRate} className="h-2" />
            </div>

            {/* QR Codes List */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h4 className="font-medium text-gray-900">Liste des QR codes</h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-gray-500">Code QR</th>
                      <th className="text-center p-3 text-sm font-medium text-gray-500">Statut</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-500">Date activation</th>
                      <th className="text-center p-3 text-sm font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {batch.packages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <code className="text-sm font-mono">{pkg.qrCode}</code>
                        </td>
                        <td className="p-3 text-center">
                          {getStatusBadge(pkg.status)}
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {pkg.activatedAt 
                            ? new Date(pkg.activatedAt).toLocaleDateString('fr-FR')
                            : '-'
                          }
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(pkg.qrCode)}
                          >
                            {copiedCode === pkg.qrCode ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={downloadCSV}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Télécharger CSV
              </Button>
              <Button 
                variant="outline"
                onClick={printStickers}
                disabled={printing}
              >
                {printing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4 mr-2" />
                )}
                Imprimer stickers
              </Button>
              <Button
                className="bg-[#FF8C00] hover:bg-[#E67E00] text-white"
                onClick={onClose}
              >
                Fermer
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
