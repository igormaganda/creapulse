'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  Zap,
  HardHat,
  Heart,
  Monitor,
  GraduationCap,
  Rocket,
  Brain,
  Menu,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'

const navItems = [
  { label: 'Métiers du BTP', href: '/metiers/btp', icon: HardHat, color: 'text-amber-600' },
  { label: 'Métiers du Social', href: '/metiers/social', icon: Heart, color: 'text-pink-500' },
  { label: 'Métiers du Numérique', href: '/metiers/numerique', icon: Monitor, color: 'text-primary' },
  { label: 'Formation & Reconversion', href: '/metiers/formation', icon: GraduationCap, color: 'text-emerald-600' },
  { label: 'Entrepreneuriat', href: '/metiers/entrepreneuriat', icon: Rocket, color: 'text-orange-500' },
  { label: 'Fais le Test IA', href: '/metiers/test-ia', icon: Brain, color: 'text-violet-500', badge: true },
]

export function MetiersNavbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full glass-card border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden text-sm sm:inline">Retour</span>
          </Link>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Link href="/" className="flex items-center gap-1.5">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-primary">CreaPulse</span>
          </Link>
          <Badge variant="outline" className="hidden gap-1 border-primary/30 text-[11px] sm:inline-flex">
            <Sparkles className="h-3 w-3 text-primary" />
            Horizon Emplois
          </Badge>
        </div>

        {/* Center nav — desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={`gap-1.5 text-xs font-medium ${isActive ? '' : ''}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? '' : item.color}`} />
                  {item.label}
                  {item.badge && !isActive && (
                    <Badge className="bg-primary text-[9px] px-1 py-0">Nouveau</Badge>
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right side — desktop */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/metiers/test-ia">
            <Button size="sm" className="gap-1.5">
              <Brain className="h-4 w-4" />
              Fais le Test IA
            </Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-1 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Horizon Emplois
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 pt-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        className="w-full justify-start gap-2"
                      >
                        <Icon className={`h-4 w-4 ${isActive ? '' : item.color}`} />
                        {item.label}
                        {item.badge && !isActive && (
                          <Badge className="ml-auto bg-primary text-[9px] px-1 py-0">Nouveau</Badge>
                        )}
                      </Button>
                    </Link>
                  )
                })}
                <Separator className="my-3" />
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Retour à l&apos;accueil
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export function MetiersFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">CreaPulse</span>
            </div>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Plateforme d&apos;orientation augmentée par l&apos;IA. Révèle tes talents et trouve le métier qui te correspond.
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Propulsé par GIDEF Île-de-France
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">Nos parcours métiers</p>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">Besoin d&apos;aide ?</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Trouver mon agence GIDEF</li>
              <li>Nous contacter</li>
              <li>FAQ</li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} CreaPulse - GIDEF Île-de-France. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Mentions légales</span>
            <span>Confidentialité</span>
            <span>Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
