'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bus, Bell, Settings, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SuperAdminHeaderProps {
  onSettingsClick: () => void;
  notificationCount?: number;
}

export default function SuperAdminHeader({ 
  onSettingsClick, 
  notificationCount = 0 
}: SuperAdminHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-white border-b shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-orange flex items-center justify-center">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">
                QR<span className="text-[#FF8C00]">Bag</span>
              </span>
              <Badge variant="outline" className="text-xs bg-orange-50 text-[#FF8C00] border-[#FF8C00]">
                Admin
              </Badge>
            </div>
            <div className="hidden sm:block text-gray-400 mx-2">|</div>
            <span className="hidden sm:block text-sm text-gray-600">Super Admin</span>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </Button>

            {/* Logout */}
            <Button
              variant="outline"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600"
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
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white border-t"
        >
          <div className="px-4 py-4 space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start"
            >
              <Bell className="w-5 h-5 mr-3" />
              Notifications
              {notificationCount > 0 && (
                <Badge className="ml-auto bg-red-500">{notificationCount}</Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                onSettingsClick();
                setIsMobileMenuOpen(false);
              }}
            >
              <Settings className="w-5 h-5 mr-3" />
              Paramètres
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Déconnexion
            </Button>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
