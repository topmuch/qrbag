'use client';

import { motion } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: 'Bus Seul',
    price: '50 000',
    unit: 'FCFA/mois',
    description: 'Pour les compagnies focalisées sur le transport de passagers',
    features: [
      { text: 'Suivi GPS des bus', included: true },
      { text: '4 checkpoints obligatoires', included: true },
      { text: 'Dashboard propriétaire', included: true },
      { text: 'Application chauffeur', included: true },
      { text: 'Historique des trajets', included: true },
      { text: 'Suivi des colis', included: false },
      { text: 'Notifications WhatsApp', included: false },
    ],
    buttonText: 'Choisir Bus Seul',
    highlighted: false,
    extraInfo: null,
  },
  {
    name: 'Colis Seul',
    price: '30 000',
    unit: 'FCFA/mois',
    description: 'Pour les compagnies spécialisées dans la livraison',
    features: [
      { text: 'Suivi des colis par QR code', included: true },
      { text: 'Activation des stickers', included: true },
      { text: 'Notifications WhatsApp', included: true },
      { text: 'Code de retrait sécurisé', included: true },
      { text: 'Dashboard colis', included: true },
      { text: 'Suivi GPS des bus', included: false },
      { text: 'Application chauffeur complète', included: false },
    ],
    buttonText: 'Choisir Colis Seul',
    highlighted: false,
    extraInfo: '+ 200 FCFA/sticker activé',
  },
  {
    name: 'Pack Complet',
    price: '70 000',
    unit: 'FCFA/mois',
    description: 'La solution complète pour maximiser vos revenus',
    features: [
      { text: 'Tout inclus (Bus + Colis)', included: true },
      { text: 'Suivi GPS complet', included: true },
      { text: 'Service de colis intégré', included: true },
      { text: 'Notifications WhatsApp', included: true },
      { text: 'Analytics avancés', included: true },
      { text: 'Support prioritaire', included: true },
    ],
    buttonText: 'Choisir Pack Complet',
    highlighted: true,
    badge: 'Meilleure offre',
    extraInfo: 'Économisez 10 000 FCFA/mois',
    hasExtraStickerFee: true,
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

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-white">
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
            Tarifs
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Des forfaits adaptés à{' '}
            <span className="text-[#FF8C00]">vos besoins</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choisissez le plan qui correspond à votre activité et évoluez à votre rythme
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -8 }}
              className={plan.highlighted ? 'md:-mt-4 md:mb-4' : ''}
            >
              <Card
                className={`h-full relative overflow-hidden transition-shadow duration-300 ${
                  plan.highlighted
                    ? 'border-2 border-[#FF8C00] shadow-xl'
                    : 'border border-gray-200 shadow-lg hover:shadow-xl'
                }`}
              >
                {/* Badge for highlighted plan */}
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-[#FF8C00] text-white">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-500">{plan.unit}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="pb-6">
                  {/* Extra Info */}
                  {plan.extraInfo && (
                    <div className={`text-sm font-medium mb-4 ${plan.highlighted ? 'text-[#10B981]' : 'text-[#FF8C00]'}`}>
                      {plan.extraInfo}
                    </div>
                  )}

                  {/* Features List */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className={`flex items-start gap-3 ${
                          feature.included ? 'text-gray-700' : 'text-gray-400'
                        }`}
                      >
                        {feature.included ? (
                          <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? '' : 'line-through'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? 'bg-[#FF8C00] hover:bg-[#E67E00] text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                    size="lg"
                  >
                    {plan.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600">
            Tous les prix sont hors taxes. Essai gratuit de 14 jours disponible.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
