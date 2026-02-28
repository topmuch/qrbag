'use client';

import { useState } from 'react';
import { 
  QrCode, Wand2, Loader2, Check, Copy, Download, FileText,
  Building2, Hash, StickyNote, Calculator, AlertCircle, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  email: string;
  city?: string;
  country?: string;
}

interface QRGenerationFormProps {
  companies: Company[];
  onSuccess: () => void;
}

export default function QRGenerationForm({ companies, onSuccess }: QRGenerationFormProps) {
  const [loading, setLoading] = useState(false);
  const [generatedBatch, setGeneratedBatch] = useState<{
    batchCode: string;
    quantity: number;
    codes: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    companyId: '',
    quantity: 100,
    notes: ''
  });

  const handleGenerate = async () => {
    // Validation
    if (!formData.companyId) {
      toast.error('Veuillez sélectionner une compagnie');
      return;
    }

    if (!formData.quantity || formData.quantity < 1) {
      toast.error('La quantité doit être d\'au moins 1');
      return;
    }

    if (formData.quantity > 1000) {
      toast.error('La quantité maximale est de 1000 QR codes');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/qr-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: formData.companyId,
          quantity: formData.quantity,
          notes: formData.notes || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      setGeneratedBatch({
        batchCode: data.batch?.batchCode,
        quantity: data.codes?.length || 0,
        codes: data.codes || []
      });

      toast.success(`${data.codes?.length || 0} QR codes générés avec succès !`, {
        description: `Lot: ${data.batch?.batchCode}`
      });
      
    } catch (error: any) {
      console.error('Error generating QR codes:', error);
      toast.error(error.message || 'Erreur lors de la génération des QR codes');
    } finally {
      setLoading(false);
    }
  };

  const copyAllCodes = () => {
    if (!generatedBatch || generatedBatch.codes.length === 0) return;
    
    navigator.clipboard.writeText(generatedBatch.codes.join('\n'));
    setCopied(true);
    toast.success('Codes copiés dans le presse-papiers !');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCSV = () => {
    if (!generatedBatch || generatedBatch.codes.length === 0) return;
    
    const headers = ['QR Code', 'Statut', 'Date de génération'];
    const rows = generatedBatch.codes.map(code => [
      code,
      'NON_ACTIVE',
      new Date().toLocaleDateString('fr-FR')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedBatch.batchCode}_qr_codes.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Fichier CSV téléchargé !');
  };

  const resetForm = () => {
    setGeneratedBatch(null);
    setFormData({
      companyId: '',
      quantity: 100,
      notes: ''
    });
    onSuccess();
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

  const selectedCompany = companies.find(c => c.id === formData.companyId);

  // After generation - Success view
  if (generatedBatch) {
    return (
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader className="border-b border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-green-800">Génération réussie !</CardTitle>
              <CardDescription className="text-green-600">
                Lot {generatedBatch.batchCode} - {generatedBatch.quantity} QR codes générés
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
              <p className="text-2xl font-bold text-green-600">{generatedBatch.quantity}</p>
              <p className="text-sm text-gray-500">QR générés</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
              <p className="text-2xl font-bold text-[#FF9F40]">{(generatedBatch.quantity * 200).toLocaleString()}</p>
              <p className="text-sm text-gray-500">FCFA potentiel</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
              <p className="text-2xl font-bold text-blue-600">{selectedCompany?.name?.substring(0, 10)}...</p>
              <p className="text-sm text-gray-500">Agence</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
              <p className="text-2xl font-bold text-purple-600">10 jours</p>
              <p className="text-sm text-gray-500">Validité</p>
            </div>
          </div>

          {/* QR Codes Preview */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Aperçu des QR Codes</h4>
              <Badge variant="outline" className="bg-gray-100">
                {generatedBatch.codes.length} codes
              </Badge>
            </div>
            <div className="max-h-40 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                {generatedBatch.codes.slice(0, 30).map((code, index) => (
                  <div key={index} className="bg-gray-50 rounded px-2 py-1 text-gray-700 truncate">
                    {code}
                  </div>
                ))}
                {generatedBatch.codes.length > 30 && (
                  <div className="col-span-2 sm:col-span-3 text-center text-gray-500 py-2">
                    ... et {generatedBatch.codes.length - 30} autres codes
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-gray-200"
              onClick={copyAllCodes}
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Copier tous les codes
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-gray-200"
              onClick={downloadCSV}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger CSV
            </Button>
            <Button 
              className="flex-1 bg-[#FF9F40] hover:bg-[#E67E00] text-white"
              onClick={resetForm}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Terminé
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generation Form
  return (
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF9F40]/10 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-[#FF9F40]" />
          </div>
          <div>
            <CardTitle>Générer de nouveaux QR Codes</CardTitle>
            <CardDescription>
              Créez un lot de stickers pour les colis d&apos;une agence
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Selection */}
        <div className="space-y-2">
          <Label htmlFor="company" className="flex items-center gap-2 text-gray-700">
            <Building2 className="w-4 h-4" />
            Compagnie *
          </Label>
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
                  <div className="flex items-center gap-2">
                    <span>{company.name}</span>
                    {company.city && (
                      <span className="text-gray-400 text-xs">
                        ({company.city})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {companies.length === 0 && (
            <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Aucune compagnie disponible. Créez d&apos;abord une compagnie.
            </div>
          )}
        </div>

        {/* Quantity Selection */}
        <div className="space-y-2">
          <Label htmlFor="quantity" className="flex items-center gap-2 text-gray-700">
            <Hash className="w-4 h-4" />
            Quantité *
          </Label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {quantityOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={formData.quantity === option.value ? 'default' : 'outline'}
                className={formData.quantity === option.value 
                  ? 'bg-[#FF9F40] hover:bg-[#E67E00] text-white' 
                  : 'border-gray-200 hover:border-[#FF9F40] hover:text-[#FF9F40]'
                }
                onClick={() => setFormData({ ...formData, quantity: option.value })}
              >
                {option.value}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={1000}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              placeholder="Ou entrez une quantité personnalisée (1-1000)"
              className="border-gray-200 focus:border-[#FF9F40]"
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">stickers</span>
          </div>
          <p className="text-xs text-gray-500">
            Minimum: 1 • Maximum: 1000 QR codes
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="flex items-center gap-2 text-gray-700">
            <StickyNote className="w-4 h-4" />
            Notes (optionnel)
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Ajouter une note pour ce lot (ex: Commande spéciale, Stock de réserve...)"
            className="border-gray-200 focus:border-[#FF9F40] resize-none"
            rows={2}
          />
        </div>

        {/* Cost Calculator */}
        <div className="bg-gradient-to-r from-[#FF9F40]/5 to-[#FF6B00]/5 rounded-xl p-5 border border-[#FF9F40]/20">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-[#FF9F40]" />
            <h4 className="font-semibold text-gray-900">Estimation du coût</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Prix par activation:</span>
              <span className="font-medium text-gray-900">200 FCFA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Quantité générée:</span>
              <span className="font-medium text-gray-900">{formData.quantity} stickers</span>
            </div>
            <div className="border-t border-[#FF9F40]/20 pt-3 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Revenus potentiels:</span>
              <span className="text-xl font-bold text-[#FF9F40]">
                {(formData.quantity * 200).toLocaleString()} FCFA
              </span>
            </div>
            <p className="text-xs text-gray-500">
              * Revenus générés si tous les QR codes sont activés
            </p>
          </div>
        </div>

        {/* Validity Info */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <QrCode className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-800">Validité des QR Codes</h5>
              <p className="text-sm text-blue-700 mt-1">
                Chaque QR code a une <strong>durée de validité de 10 jours</strong> à partir de son activation.
                Passé ce délai, le QR code expire automatiquement si le colis n&apos;a pas été livré.
              </p>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          className="w-full bg-[#FF9F40] hover:bg-[#E67E00] text-white h-12 text-lg"
          onClick={handleGenerate}
          disabled={loading || !formData.companyId || formData.quantity < 1}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              Générer {formData.quantity} QR Codes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
