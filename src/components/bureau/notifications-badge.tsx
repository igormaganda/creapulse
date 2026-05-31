// ============================================
// CreaPulse V2 — Notification Badge
// Animated unread-count badge with scale pop
// ============================================

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NotificationsBadgeProps {
  count: number
  className?: string
  /** Max number to display before showing "99+" */
  max?: number
}

/**
 * Animated badge showing unread notification count.
 * Uses a scale-pop entrance animation when count changes
 * (via AnimatePresence key={count}) and hides when count is 0.
 */
export function NotificationsBadge({
  count,
  className,
  max = 99,
}: NotificationsBadgeProps) {
  if (count <= 0) return null

  const displayCount = count > max ? `${max}+` : count

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={count}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 25,
          duration: 0.3,
        }}
        className={cn(
          'absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center',
          'rounded-full border-0 px-1 text-[10px] font-bold leading-none text-white',
          'bg-coral-500 shadow-sm shadow-coral-500/30',
          className,
        )}
        aria-label={`${count} notification${count > 1 ? 's' : ''} non lue${count > 1 ? 's' : ''}`}
      >
        {displayCount}
      </motion.span>
    </AnimatePresence>
  )
}
