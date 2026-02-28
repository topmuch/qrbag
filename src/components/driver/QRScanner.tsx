'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Keyboard, Loader2, Flashlight, FlashlightOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast, Toaster } from 'sonner';

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: string) => void;
  title?: string;
  description?: string;
}

export default function QRScanner({
  open,
  onOpenChange,
  onScan,
  title = "Scanner un QR Code",
  description = "Placez le QR code dans le cadre"
}: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerIdRef = useRef<string>(`qr-reader-${Date.now()}`);

  // Stop scanner function
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (error) {
        console.log('Scanner cleanup error:', error);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setTorchEnabled(false);
  }, []);

  // Start scanner
  const startScanner = useCallback(async () => {
    setIsLoading(true);
    setCameraError(null);
    setHasPermission(null);

    try {
      // Request camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);

      // Get available cameras
      const cameras = await Html5Qrcode.getCameras();
      
      if (!cameras || cameras.length === 0) {
        throw new Error('Aucune caméra détectée sur cet appareil');
      }

      // Prefer back camera
      const backCamera = cameras.find(cam => 
        cam.label.toLowerCase().includes('back') ||
        cam.label.toLowerCase().includes('rear') ||
        cam.label.toLowerCase().includes('arrière') ||
        cam.label.toLowerCase().includes('environment')
      ) || cameras[0];

      // Generate unique container ID
      containerIdRef.current = `qr-reader-${Date.now()}`;
      
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const container = document.getElementById(containerIdRef.current);
      if (!container) {
        throw new Error('Container non trouvé');
      }

      // Create scanner instance
      scannerRef.current = new Html5Qrcode(containerIdRef.current);

      // Start scanning
      await scannerRef.current.start(
        backCamera.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR code detected!
          toast.success('QR Code détecté !');
          onScan(decodedText);
          stopScanner();
          onOpenChange(false);
        },
        () => {
          // Ignore scan errors (normal during scanning)
        }
      );

      setIsScanning(true);
      setCameraError(null);
      
    } catch (error: any) {
      console.error('Camera error:', error);
      
      let errorMessage = 'Impossible d\'accéder à la caméra';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Permission caméra refusée. Veuillez autoriser l\'accès à la caméra dans les paramètres.';
        setHasPermission(false);
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Aucune caméra trouvée sur cet appareil';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Caméra déjà utilisée par une autre application';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setCameraError(errorMessage);
      setManualMode(true);
    } finally {
      setIsLoading(false);
    }
  }, [onScan, onOpenChange, stopScanner]);

  // Handle manual code submission
  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      onOpenChange(false);
      setManualCode('');
      toast.success('Code validé');
    } else {
      toast.error('Veuillez entrer un code');
    }
  };

  // Open/close effects
  useEffect(() => {
    if (open) {
      setManualCode('');
      setCameraError(null);
      setManualMode(false);
      setHasPermission(null);
      
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        startScanner();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [open, startScanner, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleClose = async () => {
    await stopScanner();
    setManualCode('');
    setManualMode(false);
    setCameraError(null);
    setHasPermission(null);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <>
      <Toaster position="top-center" richColors />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md mx-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/20"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-lg">{title}</h2>
                    <p className="text-white/50 text-sm">{description}</p>
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
            </div>

            {/* Scanner Area */}
            <div className="p-4 space-y-4">
              {/* Camera Permission Denied Warning */}
              {hasPermission === false && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium text-sm">Permission requise</p>
                      <p className="text-red-300/70 text-xs mt-1">
                        Pour scanner des QR codes, vous devez autoriser l'accès à la caméra dans les paramètres de votre navigateur.
                      </p>
                  </div>
                  </div>
                </div>
              )}

              {!manualMode ? (
                <div className="relative">
                  {/* Camera View */}
                  <div 
                    id={containerIdRef.current}
                    className="relative rounded-2xl overflow-hidden bg-black"
                    style={{ minHeight: '300px' }}
                  >
                    {/* Loading Overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                        <div className="text-center">
                          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-3" />
                          <p className="text-white/70 text-sm">Initialisation de la caméra...</p>
                          <p className="text-white/40 text-xs mt-1">Autorisez l'accès si demandé</p>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {cameraError && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 z-10">
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <p className="text-white/70 text-sm mb-4">{cameraError}</p>
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Button 
                            onClick={startScanner}
                            variant="outline"
                            size="sm"
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            Réessayer
                          </Button>
                          <Button 
                            onClick={() => setManualMode(true)}
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                          >
                            Mode manuel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scanning Frame Overlay */}
                  {isScanning && !cameraError && !isLoading && (
                    <div className="absolute inset-0 pointer-events-none z-20">
                      {/* Corner markers */}
                      <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
                      <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
                      <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
                      <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />
                      
                      {/* Center guide box */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-amber-400/30 rounded-xl" />
                      
                      {/* Scanning line animation */}
                      <motion.div
                        animate={{ y: [0, 160, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-10 right-10 top-12 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Instructions when scanning */}
                {isScanning && !cameraError && (
                  <p className="text-center text-white/50 text-sm">
                    Placez le QR code dans le cadre
                  </p>
                )}
              </div>
              ) : (
                /* Manual Input Mode */
                <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2 text-white/70 mb-3">
                    <Keyboard className="w-5 h-5" />
                    <span className="text-sm">Entrée manuelle du code</span>
                  </div>
                  
                  <Input
                    placeholder="QR-PKG-XXXX-XXXXXX"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 text-center text-lg tracking-wide h-14 focus:border-amber-400"
                    autoFocus
                  />
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setManualMode(false)}
                      className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Scanner
                    </Button>
                    <Button
                      onClick={handleManualSubmit}
                      disabled={!manualCode.trim()}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                    >
                      Valider
                    </Button>
                  </div>
                </div>
              )}

              {/* Toggle Manual Mode Button */}
              {!manualMode && !cameraError && !isLoading && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-900 px-3 text-white/50">ou</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setManualMode(true)}
                    className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
                  >
                    <Keyboard className="w-4 h-4 mr-2" />
                    Entrer le code manuellement
                  </Button>
                </>
              )}
            </div>

            {/* Help */}
            <div className="px-4 pb-4">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-white/40 text-xs text-center">
                  💡 Utilisez le mode manuel si la caméra ne fonctionne pas
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
