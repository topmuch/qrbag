'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, QrCode, User, Phone, Camera, Package, CheckCircle2, 
  Loader2, MessageCircle, ArrowLeft, ArrowRight, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import QRScanner from './QRScanner';

interface NewPackageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string | null;
  onSuccess: () => void;
}

interface FormData {
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  recipientWhatsapp: string;
  description: string;
  weight: string;
  price: string;
}

const initialFormData: FormData = {
  senderName: '',
  senderPhone: '',
  recipientName: '',
  recipientPhone: '',
  recipientWhatsapp: '',
  description: '',
  weight: '',
  price: ''
};

export default function NewPackageModal({
  open,
  onOpenChange,
  tripId,
  onSuccess
}: NewPackageModalProps) {
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pickupCode, setPickupCode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle QR scan result
  const handleQRScan = (data: string) => {
    setQrCode(data);
    setShowScanner(false);
    setStep(2);
    toast.success('QR Code scanné avec succès');
  };

  // Handle manual QR code input
  const handleManualQRSubmit = () => {
    if (qrCode.trim()) {
      setStep(2);
      toast.success('Code validé');
    } else {
      toast.error('Veuillez entrer un code QR');
    }
  };

  // Handle photo capture/selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La photo ne doit pas dépasser 5MB');
        return;
      }
      
      setPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form step
  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (stepNumber === 2) {
      if (!formData.senderName.trim()) {
        newErrors.senderName = 'Nom de l\'expéditeur requis';
      }
      if (!formData.senderPhone.trim()) {
        newErrors.senderPhone = 'Téléphone de l\'expéditeur requis';
      }
      if (!formData.recipientName.trim()) {
        newErrors.recipientName = 'Nom du destinataire requis';
      }
      if (!formData.recipientPhone.trim()) {
        newErrors.recipientPhone = 'Téléphone du destinataire requis';
      }
      if (!photo) {
        newErrors.photo = 'Photo du colis obligatoire';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(2)) return;
    
    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('qrCode', qrCode);
      if (tripId) {
        formDataToSend.append('tripId', tripId);
      }
      formDataToSend.append('senderName', formData.senderName);
      formDataToSend.append('senderPhone', formData.senderPhone);
      formDataToSend.append('recipientName', formData.recipientName);
      formDataToSend.append('recipientPhone', formData.recipientPhone);
      formDataToSend.append('recipientWhatsapp', formData.recipientWhatsapp || formData.recipientPhone);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('weight', formData.weight || '0');
      formDataToSend.append('price', formData.price || '0');
      
      if (photo) {
        formDataToSend.append('photo', photo);
      }

      const response = await fetch('/api/driver/packages/activate', {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();
      
      if (result.success) {
        setPickupCode(result.pickupCode);
        setStep(4);
        toast.success('Colis activé avec succès !');
        onSuccess();
      } else {
        toast.error(result.error || 'Erreur lors de l\'activation');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Send WhatsApp notification
  const sendWhatsApp = () => {
    const message = `📦 QRBAG Livraison

Bonjour ${formData.recipientName},

Votre colis est ARRIVÉ ! ✅

🔐 CODE SECRET: ${pickupCode}

⚠️ Présentez ce code pour retirer votre colis.
• Code valable 7 jours
• Pièce d'identité requise

Expéditeur: ${formData.senderName}
Compagnie: Transport Express CI`;

    const phone = (formData.recipientWhatsapp || formData.recipientPhone).replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Reset and close
  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setQrCode('');
      setFormData(initialFormData);
      setPhoto(null);
      setPhotoPreview(null);
      setPickupCode('');
      setErrors({});
    }, 300);
  };

  // Next step
  const nextStep = () => {
    if (step === 1) {
      if (qrCode.trim()) {
        setStep(2);
      } else {
        toast.error('Veuillez scanner ou entrer un code QR');
      }
    } else if (step === 2) {
      if (validateStep(2)) {
        setStep(3);
      }
    }
  };

  // Previous step
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-lg bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 border-b border-white/10 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {step > 1 && step < 4 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevStep}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white mr-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">
                    {step === 1 && 'Scanner QR Code'}
                    {step === 2 && 'Informations Colis'}
                    {step === 3 && 'Confirmation'}
                    {step === 4 && 'Colis Activé !'}
                  </h2>
                  <p className="text-white/50 text-sm">Étape {step} sur 4</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4 flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                    s <= step ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-white/10"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5">
            {/* STEP 1: QR Code */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <QrCode className="w-10 h-10 text-violet-400" />
                  </div>
                  <p className="text-white/70 text-sm">
                    Scannez le QR code collé sur le colis ou entrez le code manuellement
                  </p>
                </div>

                {/* Scan Button */}
                <Button
                  onClick={() => setShowScanner(true)}
                  className="w-full h-16 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30"
                >
                  <Camera className="w-6 h-6 mr-3" />
                  Ouvrir la caméra
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-3 text-white/50">ou entrer manuellement</span>
                  </div>
                </div>

                {/* Manual Input */}
                <div className="space-y-3">
                  <Input
                    placeholder="QR-PKG-XXXX-XXXXXX"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualQRSubmit()}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 text-center text-lg tracking-wide h-14 focus:border-amber-400"
                  />
                  <p className="text-white/40 text-xs text-center">
                    Format: QR-PKG-XXXX-XXXXXX
                  </p>
                </div>

                <Button
                  onClick={nextStep}
                  disabled={!qrCode.trim()}
                  className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg font-semibold shadow-lg shadow-amber-500/30"
                >
                  Continuer
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            {/* STEP 2: Package Info */}
            {step === 2 && (
              <div className="space-y-4">
                {/* QR Code Display */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-white/50 text-xs mb-1">QR Code</p>
                  <p className="text-amber-400 font-mono font-semibold">{qrCode}</p>
                </div>

                {/* Sender Info */}
                <div className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400" />
                    Expéditeur
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-white/70 text-xs">Nom complet *</Label>
                      <Input
                        placeholder="Nom"
                        value={formData.senderName}
                        onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                        className={cn(
                          "bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12",
                          errors.senderName && "border-red-500"
                        )}
                      />
                      {errors.senderName && <p className="text-red-400 text-xs">{errors.senderName}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-white/70 text-xs">Téléphone *</Label>
                      <Input
                        placeholder="+225 07 XX XX XX"
                        value={formData.senderPhone}
                        onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                        className={cn(
                          "bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12",
                          errors.senderPhone && "border-red-500"
                        )}
                      />
                      {errors.senderPhone && <p className="text-red-400 text-xs">{errors.senderPhone}</p>}
                    </div>
                  </div>
                </div>

                {/* Recipient Info */}
                <div className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    Destinataire
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-white/70 text-xs">Nom complet *</Label>
                      <Input
                        placeholder="Nom"
                        value={formData.recipientName}
                        onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                        className={cn(
                          "bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12",
                          errors.recipientName && "border-red-500"
                        )}
                      />
                      {errors.recipientName && <p className="text-red-400 text-xs">{errors.recipientName}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-white/70 text-xs">Téléphone *</Label>
                      <Input
                        placeholder="+225 07 XX XX XX"
                        value={formData.recipientPhone}
                        onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                        className={cn(
                          "bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12",
                          errors.recipientPhone && "border-red-500"
                        )}
                      />
                      {errors.recipientPhone && <p className="text-red-400 text-xs">{errors.recipientPhone}</p>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/70 text-xs">WhatsApp (optionnel)</Label>
                    <Input
                      placeholder="+225 07 XX XX XX"
                      value={formData.recipientWhatsapp}
                      onChange={(e) => setFormData({ ...formData, recipientWhatsapp: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12"
                    />
                  </div>
                </div>

                {/* Package Description */}
                <div className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-400" />
                    Description du colis
                  </h3>
                  <Textarea
                    placeholder="Description du contenu..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 resize-none h-20"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-white/70 text-xs">Poids (kg)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-white/70 text-xs">Prix (FCFA)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Photo */}
                <div className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Camera className="w-4 h-4 text-pink-400" />
                    Photo du colis *
                  </h3>
                  
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Aperçu"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setPhoto(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <div className="absolute bottom-2 left-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Photo ajoutée
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                        errors.photo ? "border-red-500 bg-red-500/10" : "border-white/20 hover:border-amber-400 hover:bg-white/5"
                      )}
                    >
                      <ImageIcon className="w-12 h-12 text-white/30 mx-auto mb-3" />
                      <p className="text-white/50 text-sm mb-2">Cliquez pour prendre une photo</p>
                      <p className="text-white/30 text-xs">JPG, PNG • Max 5MB</p>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  {errors.photo && <p className="text-red-400 text-xs">{errors.photo}</p>}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1 h-12 bg-transparent border-white/20 text-white hover:bg-white/10"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/30"
                  >
                    Continuer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Confirmation */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">QR Code</span>
                    <span className="text-amber-400 font-mono">{qrCode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Expéditeur</span>
                    <span className="text-white">{formData.senderName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Téléphone</span>
                    <span className="text-white">{formData.senderPhone}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Destinataire</span>
                    <span className="text-white">{formData.recipientName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Téléphone</span>
                    <span className="text-white">{formData.recipientPhone}</span>
                  </div>
                  {formData.description && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Description</span>
                      <span className="text-white text-right max-w-[60%]">{formData.description}</span>
                    </div>
                  )}
                  {photoPreview && (
                    <div className="pt-2">
                      <img src={photoPreview} alt="Colis" className="w-full h-32 object-cover rounded-lg" />
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1 h-12 bg-transparent border-white/20 text-white hover:bg-white/10"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-emerald-500/30"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Activation...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Activer le colis
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: Success */}
            {step === 4 && (
              <div className="space-y-5 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30"
                >
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Colis activé avec succès !</h3>
                  <p className="text-white/50 text-sm">Code de retrait généré</p>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <p className="text-white/50 text-sm mb-2">Code de retrait</p>
                  <p className="text-4xl font-bold text-amber-400 tracking-widest font-mono">
                    {pickupCode}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={sendWhatsApp}
                    className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg font-semibold shadow-lg shadow-green-500/30"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Envoyer WhatsApp
                  </Button>

                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="w-full h-12 bg-transparent border-white/20 text-white hover:bg-white/10"
                  >
                    Terminé
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* QR Scanner Modal */}
      <QRScanner
        open={showScanner}
        onOpenChange={setShowScanner}
        onScan={handleQRScan}
        title="Scanner QR Code Colis"
        description="Scannez le QR code sur le sticker"
      />
    </AnimatePresence>
  );
}
