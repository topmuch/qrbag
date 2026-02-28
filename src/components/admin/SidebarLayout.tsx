'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus, LayoutDashboard, Building2, QrCode, CreditCard, 
  Users, Settings, LogOut, Bell, ChevronLeft, ChevronRight,
  Package, TrendingUp, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { 
    label: 'Tableau de bord', 
    icon: LayoutDashboard, 
    href: '/admin',
    color: '#FF8C00'
  },
  { 
    label: 'Compagnies', 
    icon: Building2, 
    href: '/admin/companies',
    color: '#3B82F6'
  },
  { 
    label: 'QR Codes', 
    icon: QrCode, 
    href: '/admin/qr-codes',
    color: '#10B981'
  },
  { 
    label: 'Abonnements', 
    icon: CreditCard, 
    href: '/admin/subscriptions',
    color: '#8B5CF6'
  },
  { 
    label: 'Utilisateurs', 
    icon: Users, 
    href: '/admin/users',
    color: '#EC4899'
  },
  { 
    label: 'Statistiques', 
    icon: BarChart3, 
    href: '/admin/statistics',
    color: '#06B6D4'
  },
  { 
    label: 'Paramètres', 
    icon: Settings, 
    href: '/admin/settings',
    color: '#6B7280'
  },
];

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0D0D14] flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 bottom-0 z-50 sidebar-dark border-r border-white/5 flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          <Link href="/admin" className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF8C00] to-[#FFA500] flex items-center justify-center shadow-lg glow-orange"
            >
              <Bus className="w-6 h-6 text-white" />
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-lg font-bold text-white">
                    QR<span className="text-[#FF9F1C]">Bag</span>
                  </span>
                  <Badge className="text-[10px] bg-[#FF8C00]/20 text-[#FF9F1C] border-[#FF8C00]/30">
                    Admin
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <motion.div
                  key={item.href}
                  onHoverStart={() => setHoveredItem(item.href)}
                  onHoverEnd={() => setHoveredItem(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                      isActive
                        ? 'bg-gradient-to-r from-[#FF8C00]/20 to-transparent border-l-[3px] border-[#FF8C00]'
                        : 'hover:bg-white/5 border-l-[3px] border-transparent'
                    )}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                        isActive
                          ? 'bg-[#FF8C00]/20'
                          : 'bg-white/5 group-hover:bg-white/10'
                      )}
                      style={{
                        boxShadow: isActive ? `0 0 20px ${item.color}30` : 'none'
                      }}
                    >
                      <Icon 
                        className="w-5 h-5" 
                        style={{ color: isActive ? item.color : '#9CA3AF' }}
                      />
                    </motion.div>
                    
                    <AnimatePresence>
                      {(!collapsed || hoveredItem === item.href) && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            'text-sm font-medium whitespace-nowrap overflow-hidden',
                            isActive ? 'text-white' : 'text-gray-400'
                          )}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-white/5">
          <button
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-gray-400 hover:bg-white/5 transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium"
                >
                  Déconnexion
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#1E1E2E] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#FF8C00] transition-all"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{ marginLeft: collapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 flex flex-col"
      >
        {/* Top Header */}
        <header className="h-16 bg-[#0D0D14]/80 backdrop-blur-lg border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white">
              Super Admin
            </h1>
            <Badge className="bg-[#FF8C00]/20 text-[#FF9F1C] border-[#FF8C00]/30">
              En ligne
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10"
            >
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            {/* User Avatar */}
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF8C00] to-[#FFA500] flex items-center justify-center">
                <span className="text-sm font-bold text-white">SA</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">Super Admin</p>
                <p className="text-xs text-gray-500">admin@qrbag.com</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
