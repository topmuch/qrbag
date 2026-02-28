'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Keyboard, Loader2, Flashlight, FlashlightOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stop scanner function
  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (error) {
        console.log('Scanner stop error:', error);
      }
    }
    setIsScanning(false);
    setTorchEnabled(false);
  }, []);

  // Start scanner
  const startScanner = useCallback(async () => {
    if (!containerRef.current) return;
    
    setIsLoading(true);
    setCameraError(null);

    try {
      // Get available cameras
      const cameras = await Html5Qrcode.getCameras();
      
      if (!cameras || cameras.length === 0) {
        setCameraError('Aucune caméra détectée sur cet appareil');
        setManualMode(true);
        setIsLoading(false);
        return;
      }

      // Prefer back camera
      const backCamera = cameras.find(cam => 
        cam.label.toLowerCase().includes('back') ||
        cam.label.toLowerCase().includes('rear') ||
        cam.label.toLowerCase().includes('arrière') ||
        cam.label.toLowerCase().includes('environment')
      ) || cameras[0];

      // Create scanner instance
      const scannerId = 'qr-reader-' + Date.now();
      const scannerContainer = document.getElementById('qr-reader-container');
      
      if (scannerContainer) {
        scannerContainer.id = scannerId;
      }

      scannerRef.current = new Html5Qrcode(scannerId);

      // Start scanning
      await scannerRef.current.start(
        backCamera.id,
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
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
      setCameraError(error.message || 'Impossible d\'accéder à la caméra');
      setManualMode(true);
    } finally {
      setIsLoading(false);
    }
  }, [onScan, onOpenChange, stopScanner]);

  // Toggle torch/flashlight
  const toggleTorch = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        // Note: torch support depends on device capabilities
        const newTorchState = !torchEnabled;
        // Html5Qrcode doesn't have direct torch control, this is device-dependent
        setTorchEnabled(newTorchState);
        toast.info(newTorchState ? 'Flash activé' : 'Flash désactivé');
      } catch (error) {
        console.log('Torch not supported');
      }
    }
  };

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
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
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
    onOpenChange(false);
  };

  if (!open) return null;

  return (
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
            {!manualMode ? (
              <div className="relative">
                {/* Camera View */}
                <div 
                  ref={containerRef}
                  id="qr-reader-container"
                  className="relative rounded-2xl overflow-hidden bg-black"
                  style={{ minHeight: '320px' }}
                >
                  {/* Loading Overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-2" />
                        <p className="text-white/70 text-sm">Initialisation de la caméra...</p>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {cameraError && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4">
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <p className="text-white/70 text-sm mb-3">{cameraError}</p>
                        <div className="flex gap-2 justify-center">
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
                  {isScanning && !cameraError && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Corner markers */}
                      <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
                      <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
                      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
                      <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />
                      
                      {/* Scanning line animation */}
                      <motion.div
                        animate={{ y: [0, 200, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-8 right-8 top-8 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Torch Button */}
                {isScanning && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTorch}
                    className={cn(
                      "absolute top-3 left-3 w-10 h-10 rounded-full",
                      torchEnabled ? "bg-amber-500 text-white" : "bg-black/50 text-white hover:bg-black/70"
                    )}
                  >
                    {torchEnabled ? <Flashlight className="w-5 h-5" /> : <FlashlightOff className="w-5 h-5" />}
                  </Button>
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
                  placeholder="Entrez le code QR (ex: QR-PKG-XXXX-XXXXXX)"
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
            {!manualMode && !cameraError && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-3 text-white/50">ou</span>
                </div>
              </div>
            )}

            {!manualMode && !cameraError && (
              <Button
                variant="outline"
                onClick={() => setManualMode(true)}
                className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                <Keyboard className="w-4 h-4 mr-2" />
                Entrer le code manuellement
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="px-4 pb-4">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-white/50 text-xs text-center">
                📱 Autorisez l'accès à la caméra si demandé
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
