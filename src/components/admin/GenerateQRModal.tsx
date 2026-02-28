'use client';

import { useState } from 'react';
import { QrCode, Wand2, Check, Copy, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast, Toaster } from 'sonner';

interface Company {
  id: string;
  name: string;
}

interface GenerateQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  preselectedCompanyId?: string;
  onSuccess: () => void;
}

export default function GenerateQRModal({
  isOpen,
  onClose,
  companies,
  preselectedCompanyId,
  onSuccess
}: GenerateQRModalProps) {
  const [loading, setLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [customQuantity, setCustomQuantity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyId: preselectedCompanyId || '',
    quantity: 100
  });

  const handleGenerate = async () => {
    // Validation
    if (!formData.companyId) {
      setError('Veuillez sélectionner une compagnie');
      toast.error('Veuillez sélectionner une compagnie');
      return;
    }

    if (!formData.quantity || formData.quantity < 1) {
      setError('La quantité doit être d\'au moins 1');
      toast.error('La quantité doit être d\'au moins 1');
      return;
    }

    if (formData.quantity > 1000) {
      setError('La quantité maximale est de 1000 QR codes');
      toast.error('La quantité maximale est de 1000 QR codes');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/admin/qr-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: formData.companyId,
          quantity: formData.quantity
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      setGeneratedCodes(data.codes || []);
      toast.success(`${data.codes?.length || 0} QR codes générés avec succès !`, {
        description: `Lot: ${data.batch?.batchCode}`
      });
      
    } catch (error: any) {
      console.error('Error generating QR codes:', error);
      setError(error.message);
      toast.error(error.message || 'Erreur lors de la génération des QR codes');
    } finally {
      setLoading(false);
    }
  };

  const copyAllCodes = () => {
    if (generatedCodes.length === 0) return;
    
    navigator.clipboard.writeText(generatedCodes.join('\n'));
    setCopied(true);
    toast.success('Codes copiés dans le presse-papiers !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (!loading) {
      setGeneratedCodes([]);
      setFormData({
        companyId: preselectedCompanyId || '',
        quantity: 100
      });
      setError(null);
      setCustomQuantity(false);
      onSuccess();
      onClose();
    }
  };

  const quantityOptions = [
    { value: 1, label: '1 sticker' },
    { value: 10, label: '10 stickers' },
    { value: 50, label: '50 stickers' },
    { value: 100, label: '100 stickers' },
    { value: 200, label: '200 stickers' },
    { value: 500, label: '500 stickers' },
    { value: 1000, label: '1000 stickers' },
  ];

  return (
    <>
      <Toaster position="top-center" richColors />
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <div className="w-8 h-8 rounded-lg bg-[#FF9F40]/10 flex items-center justify-center">
                <QrCode className="w-4 h-4 text-[#FF9F40]" />
              </div>
              Générer des QR Codes
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Créez un nouveau lot de stickers pour les colis
            </DialogDescription>
          </DialogHeader>

          {generatedCodes.length === 0 ? (
            <>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-gray-700">Compagnie *</Label>
                  <Select
                    value={formData.companyId}
                    onValueChange={(value) => setFormData({ ...formData, companyId: value })}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-[#FF9F40]">
                      <SelectValue placeholder="Sélectionner une compagnie" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {companies.length === 0 && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Aucune compagnie disponible. Créez d'abord une compagnie.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quantity" className="text-gray-700">Quantité *</Label>
                    <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customQuantity}
                        onChange={(e) => setCustomQuantity(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      Quantité personnalisée
                    </label>
                  </div>
                  
                  {customQuantity ? (
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      placeholder="Nombre de stickers (1-1000)"
                      className="border-gray-200 focus:border-[#FF9F40] focus:ring-[#FF9F40]"
                    />
                  ) : (
                    <Select
                      value={String(formData.quantity)}
                      onValueChange={(value) => setFormData({ ...formData, quantity: Number(value) })}
                    >
                      <SelectTrigger className="border-gray-200 focus:border-[#FF9F40]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {quantityOptions.map((option) => (
                          <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-gray-500">
                    Minimum: 1 • Maximum: 1000 QR codes
                  </p>
                </div>

                <div className="bg-[#FF9F40]/5 rounded-lg p-4 border border-[#FF9F40]/20">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Coût d&apos;activation estimé:</span>
                    <span className="font-bold text-[#FF9F40]">
                      {(formData.quantity * 200).toLocaleString()} FCFA
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    (200 FCFA × {formData.quantity} stickers si tous activés)
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose} className="border-gray-200">
                  Annuler
                </Button>
                <Button
                  className="bg-[#FF9F40] hover:bg-[#E67E00] text-white min-w-[120px]"
                  onClick={handleGenerate}
                  disabled={loading || !formData.companyId || formData.quantity < 1}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Générer
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="py-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-green-100 text-green-700">
                    <Check className="w-3 h-3 mr-1" />
                    {generatedCodes.length} codes générés
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAllCodes}
                    className="border-gray-200"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 mr-1 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copier tout
                  </Button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {generatedCodes.slice(0, 50).map((code, index) => (
                      <div key={index} className="text-gray-700 truncate">
                        {code}
                      </div>
                    ))}
                    {generatedCodes.length > 50 && (
                      <div className="col-span-2 text-center text-gray-500 py-2">
                        ... et {generatedCodes.length - 50} autres codes
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Conseil:</strong> Ces codes peuvent être imprimés sur des stickers. 
                    Utilisez la fonction "Copier tout" pour les exporter.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose} className="border-gray-200">
                  Fermer
                </Button>
                <Button
                  className="bg-[#FF9F40] hover:bg-[#E67E00] text-white"
                  onClick={handleClose}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Terminé
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
