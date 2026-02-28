'use client';

import { useState, useEffect } from 'react';
import { Settings, Info } from 'lucide-react';
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

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    stickerPrice: 200,
    busOnlyPrice: 50000,
    colisOnlyPrice: 30000,
    packCompletPrice: 70000
  });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          stickerPrice: data.stickerPrice || 200,
          busOnlyPrice: data.busOnlyPrice || 50000,
          colisOnlyPrice: data.colisOnlyPrice || 30000,
          packCompletPrice: data.packCompletPrice || 70000
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Settings className="w-4 h-4 text-gray-600" />
            </div>
            Paramètres
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Configurez les tarifs et paramètres globaux
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pricing Section */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-gray-700">
              <span className="text-lg">$</span>
              Tarification
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stickerPrice" className="text-gray-700">Prix sticker (activation)</Label>
                <div className="flex items-center">
                  <Input
                    id="stickerPrice"
                    type="number"
                    value={settings.stickerPrice}
                    onChange={(e) => setSettings({ ...settings, stickerPrice: Number(e.target.value) })}
                    className="rounded-r-none border-gray-200 focus:border-[#FF9F40]"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r text-sm text-gray-600">
                    FCFA
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="busOnly" className="text-gray-700">Forfait Bus Seul</Label>
                <div className="flex items-center">
                  <Input
                    id="busOnly"
                    type="number"
                    value={settings.busOnlyPrice}
                    onChange={(e) => setSettings({ ...settings, busOnlyPrice: Number(e.target.value) })}
                    className="rounded-r-none border-gray-200 focus:border-[#FF9F40]"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r text-sm text-gray-600">
                    FCFA
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="colisOnly" className="text-gray-700">Forfait Colis Seul</Label>
                <div className="flex items-center">
                  <Input
                    id="colisOnly"
                    type="number"
                    value={settings.colisOnlyPrice}
                    onChange={(e) => setSettings({ ...settings, colisOnlyPrice: Number(e.target.value) })}
                    className="rounded-r-none border-gray-200 focus:border-[#FF9F40]"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r text-sm text-gray-600">
                    FCFA
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="packComplet" className="text-gray-700">Pack Complet</Label>
                <div className="flex items-center">
                  <Input
                    id="packComplet"
                    type="number"
                    value={settings.packCompletPrice}
                    onChange={(e) => setSettings({ ...settings, packCompletPrice: Number(e.target.value) })}
                    className="rounded-r-none border-gray-200 focus:border-[#FF9F40]"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r text-sm text-gray-600">
                    FCFA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System Info Section */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-gray-700">
              <Info className="w-4 h-4" />
              Informations système
            </h4>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Version:</span>
                <span className="font-medium text-gray-900">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Base de données:</span>
                <span className="font-medium text-gray-900">SQLite</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Environnement:</span>
                <span className="font-medium text-gray-900">Développement</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dernière synchronisation:</span>
                <span className="font-medium text-gray-900">
                  {new Date().toLocaleString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-gray-200 text-gray-600">
            Fermer
          </Button>
          <Button
            className="bg-[#FF9F40] hover:bg-[#E67E00] text-white"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Sauvegarde...' : '✓ Sauvegarder'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
