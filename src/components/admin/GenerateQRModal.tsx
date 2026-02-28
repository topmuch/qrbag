'use client';

import { useState } from 'react';
import { QrCode, Wand2, Check, Copy } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    companyId: preselectedCompanyId || '',
    quantity: 100
  });

  const handleGenerate = async () => {
    if (!formData.companyId || formData.quantity < 1) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/qr-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedCodes(data.codes);
      }
    } catch (error) {
      console.error('Error generating QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAllCodes = () => {
    navigator.clipboard.writeText(generatedCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setGeneratedCodes([]);
    setFormData({
      companyId: preselectedCompanyId || '',
      quantity: 100
    });
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
              <div className="space-y-2">
                <Label htmlFor="company" className="text-gray-700">Compagnie</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-gray-700">Quantité</Label>
                <Select
                  value={String(formData.quantity)}
                  onValueChange={(value) => setFormData({ ...formData, quantity: Number(value) })}
                >
                  <SelectTrigger className="border-gray-200 focus:border-[#FF9F40]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 stickers</SelectItem>
                    <SelectItem value="100">100 stickers</SelectItem>
                    <SelectItem value="200">200 stickers</SelectItem>
                    <SelectItem value="500">500 stickers</SelectItem>
                    <SelectItem value="1000">1000 stickers</SelectItem>
                  </SelectContent>
                </Select>
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
                className="bg-[#FF9F40] hover:bg-[#E67E00] text-white"
                onClick={handleGenerate}
                disabled={loading || !formData.companyId}
              >
                {loading ? (
                  'Génération...'
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
                  {generatedCodes.slice(0, 20).map((code, index) => (
                    <div key={index} className="text-gray-700">
                      {code}
                    </div>
                  ))}
                  {generatedCodes.length > 20 && (
                    <div className="col-span-2 text-center text-gray-500 py-2">
                      ... et {generatedCodes.length - 20} autres codes
                    </div>
                  )}
                </div>
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
  );
}
