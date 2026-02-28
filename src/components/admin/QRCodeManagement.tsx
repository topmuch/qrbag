'use client';

import { useState } from 'react';
import { QrCode, Building2, Bus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QRGenerationForm from './QRGenerationForm';
import AgenciesList from './AgenciesList';
import TripsMonitoring from './TripsMonitoring';

interface Company {
  id: string;
  name: string;
  email: string;
  city?: string;
  country?: string;
}

interface QRCodeManagementProps {
  companies: Company[];
  onDataChange: () => void;
}

export default function QRCodeManagement({ companies, onDataChange }: QRCodeManagementProps) {
  const [activeTab, setActiveTab] = useState('agencies');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des QR Codes</h2>
          <p className="text-gray-500 text-sm mt-1">
            Générez et gérez les QR codes par agence partenaire
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="agencies" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Agences</span>
          </TabsTrigger>
          <TabsTrigger 
            value="generation"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Génération</span>
          </TabsTrigger>
          <TabsTrigger 
            value="trips"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
          >
            <Bus className="w-4 h-4" />
            <span className="hidden sm:inline">Voyages</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agencies" className="mt-6">
          <AgenciesList 
            companies={companies} 
            onViewQRCodes={(companyId) => {
              // Handle view QR codes for specific company
            }}
          />
        </TabsContent>

        <TabsContent value="generation" className="mt-6">
          <QRGenerationForm 
            companies={companies}
            onSuccess={() => {
              onDataChange();
              setActiveTab('agencies'); // Rediriger vers l'onglet Agences après génération
            }}
          />
        </TabsContent>

        <TabsContent value="trips" className="mt-6">
          <TripsMonitoring companies={companies} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
