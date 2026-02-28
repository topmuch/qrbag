'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TestTube, Copy, Check, Eye, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TestQRCode {
  id: string;
  qrCode: string;
  status: string;
  senderName?: string;
  recipientName?: string;
  activatedAt?: string;
  company?: string;
}

interface QRTestCodesSectionProps {
  nonActiveCodes: TestQRCode[];
  activeCodes: TestQRCode[];
}

export default function QRTestCodesSection({ 
  nonActiveCodes, 
  activeCodes 
}: QRTestCodesSectionProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeItem = ({ code, isActive }: { code: TestQRCode; isActive: boolean }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2 hover:bg-gray-100 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <code className="text-sm font-mono text-gray-800 truncate block">
          {code.qrCode}
        </code>
        {isActive && code.senderName && (
          <p className="text-xs text-gray-500 mt-1">
            {code.senderName} → {code.recipientName}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(code.qrCode)}
        >
          {copiedCode === code.qrCode ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-gray-500" />
          )}
        </Button>
        <Button variant="ghost" size="sm">
          <Eye className="w-4 h-4 text-gray-500" />
        </Button>
      </div>
    </motion.div>
  );

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-xl">
            🧪
          </div>
          <div>
            <CardTitle className="text-lg">QR Codes de Test</CardTitle>
            <p className="text-sm text-gray-500">Codes disponibles pour tester le système</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Non-active codes */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Badge variant="outline" className="bg-gray-100">Non activés</Badge>
              <span className="text-sm text-gray-500">à scanner</span>
            </h4>
            <div className="max-h-64 overflow-y-auto">
              {nonActiveCodes.length > 0 ? (
                nonActiveCodes.map((code) => (
                  <CodeItem key={code.id} code={code} isActive={false} />
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucun code non activé
                </p>
              )}
            </div>
          </div>

          {/* Active codes */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-700">Actifs</Badge>
              <span className="text-sm text-gray-500">déjà en transit</span>
            </h4>
            <div className="max-h-64 overflow-y-auto">
              {activeCodes.length > 0 ? (
                activeCodes.map((code) => (
                  <CodeItem key={code.id} code={code} isActive={true} />
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucun code actif
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">
            Pour activer un code non activé :
          </h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Copiez le code</li>
            <li>Connectez-vous en tant que Chauffeur</li>
            <li>Cliquez "Nouveau Colis" et collez le code</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
