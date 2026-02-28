'use client';

import { motion } from 'framer-motion';
import { Bus, Package, Smartphone, BarChart3, MapPin, QrCode, MessageSquare, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Bus,
    title: 'Suivi en temps réel',
    description: '4 checkpoints obligatoires (Départ, Pause, Reprise, Arrivée) avec géolocalisation GPS',
    tags: ['GPS', 'Checkpoints', 'Timeline'],
    iconBg: 'bg-[#FF8C00]',
    tagVariant: 'default' as const,
  },
  {
    icon: Package,
    title: 'Service de colis sécurisé',
    description: 'Stickers QR codes uniques, activation par le chauffeur, code de retrait à 4 chiffres',
    tags: ['QR Code', 'WhatsApp', 'Sécurité'],
    iconBg: 'bg-[#10B981]',
    tagVariant: 'success' as const,
  },
  {
    icon: Smartphone,
    title: 'Notifications WhatsApp',
    description: 'Alertes automatiques aux destinataires à l\'arrivée des colis avec code secret',
    tags: ['WhatsApp', 'Automatisation', 'SMS'],
    iconBg: 'bg-[#3B82F6]',
    tagVariant: 'info' as const,
  },
  {
    icon: BarChart3,
    title: 'Tableaux de bord complets',
    description: 'Statistiques en temps réel, historique des trajets, rapports de performance',
    tags: ['Analytics', 'Rapports', 'KPIs'],
    iconBg: 'bg-[#8B5CF6]',
    tagVariant: 'secondary' as const,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 text-[#FF8C00] border-[#FF8C00]">
            Fonctionnalités
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tout ce dont vous avez besoin pour{' '}
            <span className="text-[#FF8C00]">gérer votre flotte</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Une suite complète d&apos;outils pour moderniser votre entreprise de transport
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                className="group"
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <CardContent className="p-6">
                    {/* Icon */}
                    <div className={`w-14 h-14 ${feature.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {feature.tags.map((tag, tagIndex) => (
                        <Badge
                          key={tagIndex}
                          variant="secondary"
                          className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Additional Features Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 grid md:grid-cols-3 gap-8"
        >
          {[
            { icon: MapPin, title: 'Géolocalisation précise', description: 'GPS haute précision pour suivre chaque véhicule' },
            { icon: QrCode, title: 'QR Codes uniques', description: 'Chaque colis possède son identifiant unique' },
            { icon: TrendingUp, title: 'Analyses avancées', description: 'Optimisez vos trajets avec nos insights' },
          ].map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div key={index} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#FFF7ED] flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-5 h-5 text-[#FF8C00]" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
