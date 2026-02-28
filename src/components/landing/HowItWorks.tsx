'use client';

import { motion } from 'framer-motion';
import { Package, QrCode, Scan, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const steps = [
  {
    number: '01',
    icon: Package,
    title: 'Choisissez votre forfait',
    description: 'Sélectionnez Bus Seul, Colis Seul ou Pack Complet selon vos besoins',
    color: '#FF8C00',
  },
  {
    number: '02',
    icon: QrCode,
    title: 'Recevez vos QR codes',
    description: 'Le Super Admin génère vos stickers QR codes et active votre compte',
    color: '#10B981',
  },
  {
    number: '03',
    icon: Scan,
    title: 'Commencez à tracker',
    description: 'Vos chauffeurs scannent aux checkpoints et activent les colis',
    color: '#3B82F6',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function HowItWorks() {
  return (
    <section id="about" className="py-20 md:py-28 bg-gray-50">
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
            Comment ça marche
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Mise en place en{' '}
            <span className="text-[#FF8C00]">3 étapes simples</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Démarrez rapidement et commencez à suivre votre flotte en quelques jours
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 relative"
        >
          {/* Connection Lines - Desktop Only */}
          <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-[#FF8C00] via-[#10B981] to-[#3B82F6] -translate-y-1/2" />

          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <motion.div
                key={index}
                variants={stepVariants}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                  {/* Step Number */}
                  <div
                    className="absolute -top-4 left-8 px-3 py-1 rounded-full text-white font-bold text-sm"
                    style={{ backgroundColor: step.color }}
                  >
                    Étape {step.number}
                  </div>

                  {/* Icon */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mt-4"
                    style={{ backgroundColor: `${step.color}15` }}
                  >
                    <IconComponent
                      className="w-8 h-8"
                      style={{ color: step.color }}
                    />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Arrow - Mobile Only */}
                  {index < steps.length - 1 && (
                    <div className="md:hidden flex justify-center mt-6">
                      <ArrowRight className="w-6 h-6 text-gray-300 rotate-90" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 mb-4">
            Prêt à démarrer ? Notre équipe vous accompagne dans la mise en place.
          </p>
          <button
            onClick={() => {
              const element = document.querySelector('#pricing');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 text-[#FF8C00] font-semibold hover:underline"
          >
            Voir les tarifs
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
