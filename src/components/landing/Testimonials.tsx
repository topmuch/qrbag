'use client';

import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const testimonials = [
  {
    quote: 'QRBag a transformé notre façon de travailler. Nos clients peuvent suivre leurs colis en temps réel, ce qui a considérablement réduit les appels de suivi.',
    author: 'Kouassi Yao',
    role: 'Directeur',
    company: 'Transport Express CI',
    location: 'Abidjan, Côte d\'Ivoire',
    initials: 'KY',
    rating: 5,
  },
  {
    quote: 'Le système de checkpoints GPS nous permet de mieux gérer nos chauffeurs et réduire les retards. La transparence est totale pour nos passagers.',
    author: 'Amadou Koné',
    role: 'Gérant',
    company: 'Savana Voyages',
    location: 'Ouagadougou, Burkina Faso',
    initials: 'AK',
    rating: 5,
  },
  {
    quote: 'Depuis que nous utilisons QRBag, nos revenus liés aux colis ont augmenté de 40%. Le système est simple et nos chauffeurs l\'ont adopté rapidement.',
    author: 'Fatou Diallo',
    role: 'Directrice des opérations',
    company: 'Trans Africa Express',
    location: 'Dakar, Sénégal',
    initials: 'FD',
    rating: 5,
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

export default function Testimonials() {
  return (
    <section className="py-20 md:py-28 bg-gray-50">
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
            Témoignages
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ils nous font{' '}
            <span className="text-[#FF8C00]">confiance</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez ce que nos clients disent de QRBag
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -8 }}
            >
              <Card className="h-full bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  {/* Quote Icon */}
                  <div className="mb-4">
                    <Quote className="w-8 h-8 text-[#FF8C00]/30" />
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-[#FF8C00] text-[#FF8C00]"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4 pt-4 border-t">
                    <Avatar className="w-12 h-12 bg-[#FF8C00]">
                      <AvatarFallback className="bg-[#FF8C00] text-white font-semibold">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {testimonial.author}
                      </p>
                      <p className="text-sm text-gray-600">
                        {testimonial.role}, {testimonial.company}
                      </p>
                      <p className="text-xs text-gray-500">
                        {testimonial.location}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
