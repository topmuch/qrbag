import type { Subscription, Package } from '@prisma/client';

/**
 * Format a number as currency (FCFA)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

/**
 * Format a number with spaces as thousands separator
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Generate a unique QR code
 */
export function generateQRCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'QR-';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique batch code
 */
export function generateBatchCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'BATCH-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique tracking code
 */
export function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TRK-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculate total revenue from subscriptions and packages
 */
export function calculateRevenue(
  subscriptions: Subscription[],
  packages: Package[]
): number {
  // Monthly subscription revenue
  const subscriptionRevenue = subscriptions
    .filter(s => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + s.monthlyFee, 0);

  // Sticker activation revenue
  const stickerRevenue = subscriptions
    .filter(s => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + (s.activatedStickers * s.stickerFee), 0);

  return subscriptionRevenue + stickerRevenue;
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a date with time for display
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Get relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return formatDate(d);
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Trip status
    SCHEDULED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-orange-100 text-orange-700',
    PAUSED: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    // Package status
    NON_ACTIVE: 'bg-gray-100 text-gray-700',
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    IN_TRANSIT: 'bg-blue-100 text-blue-700',
    DELIVERED: 'bg-green-100 text-green-700',
    // Batch status
    PENDING: 'bg-yellow-100 text-yellow-700',
    DELIVERED: 'bg-blue-100 text-blue-700',
    ACTIVE: 'bg-green-100 text-green-700',
    // Subscription status
    ACTIVE: 'bg-green-100 text-green-700',
    EXPIRED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

/**
 * Get plan type label
 */
export function getPlanLabel(planType: string): string {
  const labels: Record<string, string> = {
    BUS_ONLY: 'Bus Seul',
    COLIS_ONLY: 'Colis Seul',
    PACK_COMPLET: 'Pack Complet',
  };
  return labels[planType] || planType;
}

/**
 * Get status label
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    // Trip status
    SCHEDULED: 'Programmé',
    IN_PROGRESS: 'En cours',
    PAUSED: 'En pause',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
    // Package status
    NON_ACTIVE: 'Non activé',
    ACTIVE: 'Actif',
    IN_TRANSIT: 'En transit',
    DELIVERED: 'Livré',
    // Batch status
    PENDING: 'En attente',
    DELIVERED: 'Livré',
    // Subscription status
    ACTIVE: 'Actif',
    EXPIRED: 'Expiré',
    CANCELLED: 'Annulé',
  };
  return labels[status] || status;
}

/**
 * Generate a random pickup code
 */
export function generatePickupCode(): string {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
