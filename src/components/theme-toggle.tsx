'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/* ─── Theme Toggle Component ─── */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useHasMounted()
  const [open, setOpen] = useState(false)

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Changer le theme">
        <span className="h-4 w-4" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'
  const tooltipText = isDark ? 'Mode clair' : 'Mode sombre'

  const iconVariants = {
    light: { rotate: 0, scale: 1 },
    dark: { rotate: 180, scale: 1 },
  }

  return (
    <TooltipProvider delayDuration={300}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 cursor-pointer"
                aria-label={tooltipText}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isDark ? (
                    <motion.div
                      key="moon"
                      initial={{ rotate: -90, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      exit={{ rotate: 90, scale: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <Moon className="h-4 w-4 text-foreground" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="sun"
                      initial={{ rotate: 90, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      exit={{ rotate: -90, scale: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <Sun className="h-4 w-4 text-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {tooltipText}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem
            className={`gap-2 cursor-pointer ${theme === 'light' ? 'bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' : ''}`}
            onClick={() => {
              setTheme('light')
              setOpen(false)
            }}
          >
            <Sun className="h-4 w-4" />
            <span className="text-sm">Clair</span>
            {theme === 'light' && (
              <motion.div
                layoutId="theme-indicator"
                className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-600 dark:bg-teal-400"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            className={`gap-2 cursor-pointer ${theme === 'dark' ? 'bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' : ''}`}
            onClick={() => {
              setTheme('dark')
              setOpen(false)
            }}
          >
            <Moon className="h-4 w-4" />
            <span className="text-sm">Sombre</span>
            {theme === 'dark' && (
              <motion.div
                layoutId="theme-indicator"
                className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-600 dark:bg-teal-400"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            className={`gap-2 cursor-pointer ${theme === 'system' ? 'bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' : ''}`}
            onClick={() => {
              setTheme('system')
              setOpen(false)
            }}
          >
            <Monitor className="h-4 w-4" />
            <span className="text-sm">Systeme</span>
            {theme === 'system' && (
              <motion.div
                layoutId="theme-indicator"
                className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-600 dark:bg-teal-400"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}

/* ─── Mobile Theme Toggle (simple toggle, no dropdown) ─── */
export function ThemeToggleMobile() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useHasMounted()

  if (!mounted) {
    return null
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon-mobile"
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 90, scale: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <Moon className="h-4 w-4" />
          </motion.div>
        ) : (
          <motion.div
            key="sun-mobile"
            initial={{ rotate: 90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: -90, scale: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <Sun className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  )
}
