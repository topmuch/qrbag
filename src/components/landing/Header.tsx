'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onLoginClick: () => void;
}

const navItems = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'À propos', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export default function Header({ onLoginClick }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'FR' | 'EN'>('FR');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <motion.a
            href="#"
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-orange flex items-center justify-center">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              QR<span className="text-[#FF8C00]">Bag</span>
            </span>
          </motion.a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <motion.button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className="text-gray-700 hover:text-[#FF8C00] transition-colors font-medium"
                whileHover={{ y: -2 }}
              >
                {item.label}
              </motion.button>
            ))}
          </nav>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Selector */}
            <motion.button
              className="flex items-center gap-1.5 text-gray-700 hover:text-[#FF8C00] transition-colors"
              whileHover={{ scale: 1.05 }}
              onClick={() => setLanguage(language === 'FR' ? 'EN' : 'FR')}
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">{language}</span>
            </motion.button>

            {/* Login Button */}
            <Button
              variant="outline"
              className="border-[#FF8C00] text-[#FF8C00] hover:bg-[#FF8C00] hover:text-white"
              onClick={onLoginClick}
            >
              Connexion
            </Button>

            {/* CTA Button */}
            <Button
              className="bg-[#FF8C00] hover:bg-[#E67E00] text-white"
              onClick={() => scrollToSection('#pricing')}
            >
              Essai gratuit
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t shadow-lg"
          >
            <div className="px-4 py-6 space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full text-left py-2 text-gray-700 hover:text-[#FF8C00] font-medium"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 border-t space-y-3">
                <button
                  className="flex items-center gap-1.5 text-gray-700"
                  onClick={() => setLanguage(language === 'FR' ? 'EN' : 'FR')}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">{language}</span>
                </button>
                <Button
                  variant="outline"
                  className="w-full border-[#FF8C00] text-[#FF8C00]"
                  onClick={onLoginClick}
                >
                  Connexion
                </Button>
                <Button
                  className="w-full bg-[#FF8C00] hover:bg-[#E67E00] text-white"
                  onClick={() => scrollToSection('#pricing')}
                >
                  Essai gratuit
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
