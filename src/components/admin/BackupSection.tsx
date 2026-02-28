'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, Database, AlertCircle, CheckCircle2, Loader2, FileJson, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast, Toaster } from 'sonner';

interface BackupSectionProps {
  onDataChanged?: () => void;
}

export default function BackupSection({ onDataChanged }: BackupSectionProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFile = useRef<File | null>(null);

  // Export data
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const response = await fetch('/api/admin/backup/export');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de l\'export');
      }
      
      // Get the JSON data
      const jsonData = await response.json();
      
      // Verify we have valid data
      if (!jsonData.metadata || !jsonData.data) {
        throw new Error('Format de données invalide');
      }
      
      // Create and download file
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrbag_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      // Show success toast
      toast.success('✅ Sauvegarde téléchargée avec succès !', {
        description: `${jsonData.metadata.counts.companies} compagnies, ${jsonData.metadata.counts.packages} colis exportés`
      });
      
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export', {
        description: error.message || 'Une erreur est survenue'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.name.endsWith('.json')) {
      toast.error('Format invalide', {
        description: 'Veuillez sélectionner un fichier .json'
      });
      return;
    }
    
    pendingFile.current = file;
    setShowConfirmRestore(true);
    
    // Reset input
    e.target.value = '';
  };

  // Confirm and import
  const handleImportConfirm = async () => {
    if (!pendingFile.current) return;
    
    setShowConfirmRestore(false);
    setIsImporting(true);
    setImportResult(null);
    
    try {
      const fileContent = await pendingFile.current.text();
      const jsonData = JSON.parse(fileContent);
      
      // Validate QRBag format
      if (!jsonData.metadata?.appName || jsonData.metadata.appName !== 'QRBag') {
        throw new Error('Ce fichier n\'est pas une sauvegarde QRBag valide');
      }
      
      const response = await fetch('/api/admin/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setImportResult(result);
        toast.success('✅ Données restaurées avec succès !', {
          description: `${result.results.companies} compagnies, ${result.results.packages} colis importés`
        });
        onDataChanged?.();
      } else {
        throw new Error(result.error || 'Erreur lors de l\'import');
      }
      
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Erreur lors de la restauration', {
        description: error.message || 'Une erreur est survenue'
      });
    } finally {
      setIsImporting(false);
      pendingFile.current = null;
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Zone de Sauvegarde</h3>
          <p className="text-gray-500 text-sm">Téléchargez vos données avant de mettre à jour le code !</p>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <Download className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg mb-1">Sauvegarder mes données</h4>
                <p className="text-gray-500 text-sm mb-4">
                  Téléchargez une copie complète de votre base de données au format JSON
                </p>
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Export en cours...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger la sauvegarde (.json)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Upload className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg mb-1">Restaurer une sauvegarde</h4>
                <p className="text-gray-500 text-sm mb-4">
                  Importez un fichier de sauvegarde précédemment exporté
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Restauration...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Restaurer une sauvegarde
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning Card */}
      <Card className="bg-amber-50 border border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">⚠️ Important</p>
              <ul className="text-sm text-amber-700 mt-1 space-y-1">
                <li>• La restauration remplace les données existantes</li>
                <li>• Faites toujours une sauvegarde avant de restaurer</li>
                <li>• Les fichiers de sauvegarde contiennent toutes vos données sensibles</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Result */}
      <AnimatePresence>
        {importResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-green-50 border border-green-200">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-800">Restauration réussie !</p>
                    <p className="text-sm text-green-600">
                      Sauvegarde du {importResult.backupDate ? new Date(importResult.backupDate).toLocaleDateString('fr-FR') : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Compagnies', value: importResult.results?.companies || 0 },
                    { label: 'Utilisateurs', value: importResult.results?.users || 0 },
                    { label: 'Chauffeurs', value: importResult.results?.drivers || 0 },
                    { label: 'Bus', value: importResult.results?.buses || 0 },
                    { label: 'Colis', value: importResult.results?.packages || 0 },
                    { label: 'Voyages', value: importResult.results?.trips || 0 },
                    { label: 'Routes', value: importResult.results?.routes || 0 },
                    { label: 'QR Batches', value: importResult.results?.qrBatches || 0 },
                    { label: 'Abonnements', value: importResult.results?.subscriptions || 0 },
                    { label: 'Scans', value: importResult.results?.tripScans || 0 },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{item.value}</p>
                      <p className="text-xs text-gray-500">{item.label}</p>
                    </div>
                  ))}
                </div>

                {importResult.results?.errors?.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-700 mb-1">
                      {importResult.results.errors.length} erreur(s) lors de l'import
                    </p>
                    <p className="text-xs text-red-600">
                      Certains enregistrements n'ont pas pu être importés. Vérifiez les logs pour plus de détails.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Restore Dialog */}
      <AnimatePresence>
        {showConfirmRestore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
            onClick={() => setShowConfirmRestore(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Confirmer la restauration</h3>
                  <p className="text-gray-500 text-sm">Cette action va remplacer vos données actuelles</p>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  ⚠️ <strong>Attention :</strong> Les données existantes seront mises à jour avec le contenu du fichier de sauvegarde. Cette action est irréversible.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowConfirmRestore(false);
                    pendingFile.current = null;
                  }}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={handleImportConfirm}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Confirmer la restauration
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
