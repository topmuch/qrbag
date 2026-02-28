'use client';

import { motion } from 'framer-motion';
import { Bus, Package, MapPin, Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Hero() {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(#FF8C00 1px, transparent 1px),
            linear-gradient(90deg, #FF8C00 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
        
        {/* Floating Dots */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#FF8C00]/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF8C00]/10 text-[#FF8C00] text-sm font-medium mb-6"
            >
              <span className="flex h-2 w-2 rounded-full bg-[#FF8C00] animate-pulse" />
              Déjà 50+ compagnies nous font confiance
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6"
            >
              Suivez vos{' '}
              <span className="text-gradient-orange">bus et colis</span>{' '}
              en temps réel
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Solution de tracking GPS et QR code pour le transport interurbain en Afrique de l&apos;Ouest. 
              Modernisez votre flotte et rassurez vos clients.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                className="bg-[#FF8C00] hover:bg-[#E67E00] text-white text-lg px-8 py-6"
                onClick={() => scrollToSection('#pricing')}
              >
                Démarrer gratuitement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2"
                onClick={() => scrollToSection('#features')}
              >
                <Play className="mr-2 w-5 h-5" />
                Voir la démo
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Main Illustration Container */}
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Map Background */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] shadow-xl overflow-hidden">
                {/* Map Dots */}
                <div className="absolute inset-0">
                  {[...Array(30)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full bg-[#FF8C00]/30"
                      style={{
                        left: `${10 + Math.random() * 80}%`,
                        top: `${10 + Math.random() * 80}%`,
                      }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    />
                  ))}
                </div>

                {/* Route Lines */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                  <motion.path
                    d="M 50,200 Q 150,100 200,200 T 350,200"
                    fill="none"
                    stroke="#FF8C00"
                    strokeWidth="3"
                    strokeDasharray="10,5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                </svg>
              </div>

              {/* Animated Bus */}
              <motion.div
                className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2"
                animate={{
                  x: [0, 100, 100, 0, 0],
                  y: [0, 0, 100, 100, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <motion.div
                  className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                >
                  <Bus className="w-10 h-10 text-[#FF8C00]" />
                </motion.div>
              </motion.div>

              {/* Animated Package */}
              <motion.div
                className="absolute top-1/2 right-1/4 transform translate-x-1/2 -translate-y-1/2"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  className="w-16 h-16 rounded-xl bg-[#10B981] shadow-lg flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Package className="w-8 h-8 text-white" />
                </motion.div>
              </motion.div>

              {/* Location Pins */}
              <motion.div
                className="absolute bottom-1/4 left-1/3"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="w-12 h-12 rounded-full bg-[#3B82F6] shadow-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
              </motion.div>

              <motion.div
                className="absolute top-1/3 right-1/3"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              >
                <div className="w-10 h-10 rounded-full bg-[#FF8C00] shadow-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
              </motion.div>

              {/* QR Code Badge */}
              <motion.div
                className="absolute bottom-1/3 right-1/4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="px-3 py-2 rounded-lg bg-white shadow-lg border border-gray-100">
                  <div className="w-12 h-12 bg-gray-900 rounded grid grid-cols-3 gap-0.5 p-1">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-sm ${i % 2 === 0 ? 'bg-white' : 'bg-gray-900'}`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" className="w-full">
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
