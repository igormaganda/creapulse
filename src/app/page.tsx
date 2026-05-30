'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

/* ─── shadcn/ui components (for Navbar) ─── */
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

/* ─── Lucide icons (for Navbar) ─── */
import {
  Lightbulb,
  Rocket,
  TrendingUp,
  MapPin,
  ChevronRight,
  LogOut,
  UserCircle,
  Zap,
  Menu,
  Sparkles,
  HardHat,
  Heart,
  Monitor,
  GraduationCap,
  Brain,
} from 'lucide-react'
import Link from 'next/link'

/* ─── Auth dialogs ─── */
import { LoginDialog } from '@/components/auth/login-dialog'
import { RegisterDialog } from '@/components/auth/register-dialog'

/* ─── Theme Toggle ─── */
import { ThemeToggle, ThemeToggleMobile } from '@/components/theme-toggle'

/* ─── Bureau Virtuel (lazy loaded to avoid circular init issues) ─── */
const BureauLayout = dynamic(() => import('@/components/bureau/bureau-layout').then(m => ({ default: m.BureauLayout })), { ssr: false })
import { useBureauStore } from '@/components/bureau/bureau-store'

/* ─── Admin Plateforme (lazy loaded) ─── */
const AdminPlateformeLayout = dynamic(() => import('@/components/admin-plateforme/admin-plateforme-layout').then(m => ({ default: m.AdminPlateformeLayout })), { ssr: false })
import { useAdminPlateformeStore } from '@/components/admin-plateforme/admin-plateforme-store'

/* ─── Admin Centre (lazy loaded) ─── */
const AdminCentreLayout = dynamic(() => import('@/components/admin-centre/admin-centre-layout').then(m => ({ default: m.AdminCentreLayout })), { ssr: false })
import { useAdminCentreStore } from '@/components/admin-centre/admin-centre-store'

/* ─── Conseiller (lazy loaded) ─── */
const ConseillerLayout = dynamic(() => import('@/components/conseiller/conseiller-layout').then(m => ({ default: m.ConseillerLayout })), { ssr: false })
import { useConseillerStore } from '@/components/conseiller/conseiller-store'

/* ─── IA Assistant (lazy loaded — includes react-markdown) ─── */
const IAAssistant = dynamic(() => import('@/components/bureau/ia-assistant').then(m => ({ default: m.IAAssistant })), { ssr: false })

/* ─── Landing page sections ─── */
import { AuthUser } from '@/components/landing/landing-shared'
import { HeroSection } from '@/components/landing/hero-section'
import { BesoinSection } from '@/components/landing/besoin-section'
import { ParcoursSection } from '@/components/landing/parcours-section'
import { OutilsSection } from '@/components/landing/outils-section'
import { PDFShowcaseSection } from '@/components/landing/pdf-showcase-section'
import { TemoignagesSection } from '@/components/landing/temoignages-section'
import { ReseauGIDEFSection } from '@/components/landing/reseau-section'
import { ActualitesSection } from '@/components/landing/actualites-section'
import { PartenairesSection } from '@/components/landing/partenaires-section'
import { CtaFinalSection } from '@/components/landing/cta-section'
import { FooterSection } from '@/components/landing/footer-section'

/* ═══════════════════════════════════════════════════════════
   NAVBAR + AUTH STATE
   ═══════════════════════════════════════════════════════════ */
function Navbar({
  registerOpen,
  setRegisterOpen,
  loginOpen,
  setLoginOpen,
}: {
  registerOpen: boolean
  setRegisterOpen: (open: boolean) => void
  loginOpen: boolean
  setLoginOpen: (open: boolean) => void
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authUser, setAuthUser] = useState<AuthUser>(null)
  const { openBureau, setUserName } = useBureauStore()
  const { openAdminPlateforme } = useAdminPlateformeStore()
  const { openConseiller } = useConseillerStore()

  const handleLoginSuccess = (user: { firstName: string; lastName: string; email: string }) => {
    setAuthUser(user)
    const fullName = `${user.firstName} ${user.lastName}`
    setUserName(fullName)
    openBureau()
  }

  const handleRegisterSuccess = (user: { firstName: string; lastName: string; email: string }) => {
    setAuthUser(user)
    const fullName = `${user.firstName} ${user.lastName}`
    setUserName(fullName)
    openBureau()
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/me', { method: 'DELETE', credentials: 'include' })
    } catch {}
    setAuthUser(null)
    useBureauStore.getState().closeBureau()
  }

  const navLinks = [
    { label: 'Parcours', href: '#parcours' },
    { label: 'Outils', href: '#outils' },
    { label: 'Actualités', href: '#actualites' },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 w-full glass-card border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">CreaPulse</span>
            </div>
            {/* GIDEF Logo */}
            <img
              src="https://www.gidef.org/wp-content/uploads/2019/12/logo-gidef-couleur.svg"
              alt="GIDEF Île-de-France"
              className="hidden h-7 sm:block"
            />
          </div>

          {/* Center nav links — desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {/* Mon Besoin dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 text-sm font-medium">
                  Mon Besoin
                  <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-52">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Je découvre une idée
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Rocket className="h-4 w-4 text-primary" />
                  Je crée mon entreprise
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <TrendingUp className="h-4 w-4 text-coral-500" />
                  Je développe mon activité
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Horizon Emplois dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 text-sm font-medium">
                  <Sparkles className="mr-1 h-3.5 w-3.5 text-primary" />
                  Horizon Emplois
                  <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                  <Link href="/metiers/btp">
                    <HardHat className="h-4 w-4 text-amber-600" />
                    Métiers du BTP
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                  <Link href="/metiers/social">
                    <Heart className="h-4 w-4 text-pink-500" />
                    Métiers du Social
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                  <Link href="/metiers/numerique">
                    <Monitor className="h-4 w-4 text-primary" />
                    Métiers du Numérique
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                  <Link href="/metiers/formation">
                    <GraduationCap className="h-4 w-4 text-emerald-600" />
                    Formation & Reconversion
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                  <Link href="/metiers/entrepreneuriat">
                    <Rocket className="h-4 w-4 text-orange-500" />
                    Entrepreneuriat
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                  <Link href="/metiers/test-ia">
                    <Brain className="h-4 w-4 text-violet-500" />
                    <span className="font-medium">Fais le Test IA</span>
                    <Badge className="bg-primary text-[9px] px-1 py-0 ml-auto">Nouveau</Badge>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <a href="#reseau">
              <Button variant="ghost" className="text-sm font-medium">
                Trouver mon agence GIDEF
              </Button>
            </a>

            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>
                <Button variant="ghost" className="text-sm font-medium">
                  {link.label}
                </Button>
              </a>
            ))}
          </nav>

          {/* Right side — desktop */}
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {authUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {authUser.firstName} {authUser.lastName}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm text-muted-foreground hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-1.5 h-4 w-4" />
                  Se deconnecter
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={() => setLoginOpen(true)}
                >
                  Se connecter
                </Button>
                {/* S'inscrire — masqué temporairement (accessible via login uniquement)
                <Button
                  size="sm"
                  className="text-sm"
                  onClick={() => setRegisterOpen(true)}
                >
                  S&apos;inscrire
                </Button>
                */}
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggleMobile />
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
                  <Zap className="h-5 w-5 text-primary" />
                  CreaPulse
                </SheetTitle>
                <SheetDescription>
                  <span className="flex items-center gap-2">
                    <img
                      src="https://www.gidef.org/wp-content/uploads/2019/12/logo-gidef-couleur.svg"
                      alt="GIDEF"
                      className="h-5"
                    />
                  </span>
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 pt-2">
                <a href="#besoin" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Je découvre une idée
                  </Button>
                </a>
                <a href="#besoin" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Rocket className="h-4 w-4 text-primary" />
                    Je crée mon entreprise
                  </Button>
                </a>
                <a href="#besoin" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <TrendingUp className="h-4 w-4 text-coral-500" />
                    Je développe mon activité
                  </Button>
                </a>
                <a href="#reseau" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Trouver mon agence GIDEF
                  </Button>
                </a>
                <Separator className="my-2" />
                {/* Horizon Emplois mobile items */}
                <div className="space-y-1">
                  <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Horizon Emplois
                  </p>
                  {[
                    { label: 'Métiers du BTP', href: '/metiers/btp', icon: HardHat, color: 'text-amber-600' },
                    { label: 'Métiers du Social', href: '/metiers/social', icon: Heart, color: 'text-pink-500' },
                    { label: 'Métiers du Numérique', href: '/metiers/numerique', icon: Monitor, color: 'text-primary' },
                    { label: 'Formation & Reconversion', href: '/metiers/formation', icon: GraduationCap, color: 'text-emerald-600' },
                    { label: 'Entrepreneuriat', href: '/metiers/entrepreneuriat', icon: Rocket, color: 'text-orange-500' },
                  ].map((item) => (
                    <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                        {item.label}
                      </Button>
                    </a>
                  ))}
                  <a href="/metiers/test-ia" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Brain className="h-4 w-4 text-violet-500" />
                      Fais le Test IA
                      <Badge className="bg-primary text-[9px] px-1 py-0 ml-auto">Nouveau</Badge>
                    </Button>
                  </a>
                </div>
                <Separator className="my-2" />
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      {link.label}
                    </Button>
                  </a>
                ))}
                <Separator className="my-2" />
                {authUser ? (
                  <>
                    <div className="flex items-center gap-2 px-2 py-1">
                      <UserCircle className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">
                        {authUser.firstName} {authUser.lastName}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => {
                        handleLogout()
                        setMobileOpen(false)
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Se deconnecter
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMobileOpen(false)
                        setLoginOpen(true)
                      }}
                    >
                      Se connecter
                    </Button>
                    {/* S'inscrire — masqué temporairement (accessible via login uniquement)
                    <Button
                      className="w-full"
                      onClick={() => {
                        setMobileOpen(false)
                        setRegisterOpen(true)
                      }}
                    >
                      S&apos;inscrire
                    </Button>
                    */}
                  </>
                )}
              </nav>
            </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Auth Dialogs */}
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToRegister={() => setRegisterOpen(true)}
        onLoginSuccess={handleLoginSuccess}
      />
      <RegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSwitchToLogin={() => setLoginOpen(true)}
        onRegisterSuccess={handleRegisterSuccess}
      />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE — assembles all sections
   ═══════════════════════════════════════════════════════════ */
export default function Home() {
  const [registerOpen, setRegisterOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      {/* Bureau Virtuel overlay */}
      <BureauLayout />

      {/* Admin Centre overlay */}
      <AdminCentreLayout />

      {/* Admin Plateforme overlay */}
      <AdminPlateformeLayout />

      {/* Conseiller overlay */}
      <ConseillerLayout />

      {/* IA Assistant — rendered at page root (outside transformed Bureau overlay) */}
      <IAAssistant />

      {/* Sticky Navigation */}
      <Navbar
        registerOpen={registerOpen}
        setRegisterOpen={setRegisterOpen}
        loginOpen={loginOpen}
        setLoginOpen={setLoginOpen}
      />

      <main className="flex-1">
        {/* Hero */}
        <HeroSection onRegisterOpen={() => setLoginOpen(true)} />

        {/* Mon Besoin */}
        <BesoinSection />

        {/* Parcours Visuel */}
        <ParcoursSection />

        {/* Outils Phares */}
        <OutilsSection />

        {/* Documents de Suivi */}
        <PDFShowcaseSection />

        {/* Temoignages */}
        <TemoignagesSection />

        {/* Reseau GIDEF */}
        <ReseauGIDEFSection />

        {/* Actualites */}
        <ActualitesSection />

        {/* Partenaires */}
        <PartenairesSection />

        {/* CTA Final */}
        <CtaFinalSection onRegisterOpen={() => setLoginOpen(true)} />
      </main>

      {/* Footer */}
      <FooterSection />
    </div>
  )
}
