'use client'

import DOMPurify from 'dompurify'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'

/* ─── shadcn/ui components ─── */
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

/* ─── Lucide icons ─── */
import {
  Lightbulb,
  Rocket,
  TrendingUp,
  Users,
  MapPin,
  Search,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Star,
  CheckCircle2,
  Shield,
  Zap,
  Target,
  BarChart3,
  Briefcase,
  Globe,
  BookOpen,
  Calculator,
  FileText,
  Award,
  Heart,
  MessageCircle,
  Mail,
  Phone,
  Menu,
  X,
  Sparkles,
  Building2,
  GraduationCap,
  Handshake,
  Bell,
  Monitor,
  Clock,
  ExternalLink,
  LogOut,
  UserCircle,
  ShieldCheck,
} from 'lucide-react'

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

/* ═══════════════════════════════════════════════════════════
   Animation variants for framer-motion scroll reveals
   ═══════════════════════════════════════════════════════════ */
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

/* ═══════════════════════════════════════════════════════════
   Animated counter hook
   ═══════════════════════════════════════════════════════════ */
function useCountUp(target: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(!startOnView)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!startOnView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [startOnView])

  useEffect(() => {
    if (!started) return
    let rafId: number
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      }
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [started, target, duration])

  return { count, ref }
}

/* ═══════════════════════════════════════════════════════════
   SECTION 1 — NAVBAR + AUTH STATE
   ═══════════════════════════════════════════════════════════ */
type AuthUser = { firstName: string; lastName: string; email: string } | null

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
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
    { label: 'Réseau', href: '#reseau' },
    { label: 'Actualités', href: '#actualites' },
    { label: 'Tarifs', href: '#cta' },
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
            <span className="hidden text-xs text-muted-foreground sm:inline">
              GIDEF Île-de-France
            </span>
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

            <a href="#reseau">
              <Button variant="ghost" className="text-sm font-medium">
                Trouver mon agence GIDEF
              </Button>
            </a>

            {navLinks.slice(0, 3).map((link) => (
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
                <Button
                  size="sm"
                  className="text-sm"
                  onClick={() => setRegisterOpen(true)}
                >
                  S&apos;inscrire
                </Button>
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
                <SheetDescription>GIDEF Île-de-France</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 pt-2">
                <a href="#besoin" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Mon Besoin
                  </Button>
                </a>
                <a href="#reseau" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Trouver mon agence GIDEF
                  </Button>
                </a>
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
                    <Button
                      className="w-full"
                      onClick={() => {
                        setMobileOpen(false)
                        setRegisterOpen(true)
                      }}
                    >
                      S&apos;inscrire
                    </Button>
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
   SECTION 2 — HERO
   ═══════════════════════════════════════════════════════════ */
function HeroSection() {
  const stat1 = useCountUp(50000, 2200)
  const stat2 = useCountUp(60, 1800)
  const stat3 = useCountUp(150, 2000)
  const stat4 = useCountUp(1900, 2400)

  return (
    <section className="gradient-hero overflow-hidden pt-[120px] pb-12 md:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — text */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center lg:text-left"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-teal-100 text-primary hover:bg-teal-100 dark:bg-teal-900/40">
                <Sparkles className="mr-1 h-3 w-3" />
                Nouveau : IA intégrée à tous vos outils
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Accompagnement de l&apos;<span className="text-gradient-teal">idée</span> jusqu&apos;à{' '}
              <span className="text-gradient-accent">l&apos;entreprise</span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-muted-foreground sm:text-xl"
            >
              Le bureau virtuel qui accompagne 50 000 créateurs par an.
              Structurez, financez et lancez votre projet avec confiance.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
            >
              <Button size="lg" className="gap-2 text-base font-semibold" onClick={() => setRegisterOpen(true)}>
                Commencer mon parcours
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="gap-2 text-base" onClick={() => document.getElementById('outils')?.scrollIntoView({ behavior: 'smooth' })}>
                Découvrir les outils
                <Search className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Right — illustration placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative mx-auto aspect-square max-w-md rounded-3xl gradient-teal p-1">
              <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl bg-card p-8">
                {/* Floating cards composition */}
                <div className="relative h-full w-full">
                  {/* Card 1 — top-left */}
                  <div className="animate-float absolute -top-2 left-0 rounded-2xl border border-teal-100 bg-white p-4 shadow-lg dark:bg-slate-800/80 dark:border-teal-900/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/40">
                        <Calculator className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">CreaSim</p>
                        <p className="text-xs text-muted-foreground">+23% rentabilité</p>
                      </div>
                    </div>
                  </div>
                  {/* Card 2 — top-right */}
                  <div
                    className="animate-float absolute -top-2 right-0 rounded-2xl border border-amber-100 bg-white p-4 shadow-lg dark:bg-slate-800/80 dark:border-amber-900/30"
                    style={{ animationDelay: '0.5s' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                        <Award className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Passeport</p>
                        <p className="text-xs text-muted-foreground">Certifié</p>
                      </div>
                    </div>
                  </div>
                  {/* Card 3 — bottom-left */}
                  <div
                    className="animate-float absolute bottom-16 left-4 rounded-2xl border border-coral-100 bg-white p-4 shadow-lg dark:bg-slate-800/80 dark:border-coral-900/30"
                    style={{ animationDelay: '1s' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-50 dark:bg-coral-900/20">
                        <FileText className="h-5 w-5 text-coral-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Business Plan</p>
                        <p className="text-xs text-muted-foreground">IA Générée</p>
                      </div>
                    </div>
                  </div>
                  {/* Card 4 — center bottom */}
                  <div
                    className="animate-float absolute bottom-0 right-4 rounded-2xl border border-teal-100 bg-white p-5 shadow-lg dark:bg-slate-800/80 dark:border-teal-900/30"
                    style={{ animationDelay: '1.5s' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/40">
                        <Rocket className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Entreprise créée !</p>
                        <div className="mt-1 flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Central pulse circle */}
                  <div className="animate-pulse-glow absolute top-1/2 left-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/30">
                    <Briefcase className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-8"
        >
          {[
            { ref: stat1.ref, count: stat1.count, suffix: '', label: 'accompagnés' },
            { ref: stat2.ref, count: stat2.count, suffix: '', label: 'agences GIDEF' },
            { ref: stat3.ref, count: stat3.count, suffix: '', label: 'conseillers' },
            { ref: stat4.ref, count: stat4.count, suffix: '', label: 'entreprises créées' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              ref={stat.ref}
              variants={fadeInUp}
              className="text-center"
            >
              <p className="text-3xl font-extrabold text-primary sm:text-4xl">
                {stat.count.toLocaleString('fr-FR')}
                {stat.suffix}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 3 — MON BESOIN
   ═══════════════════════════════════════════════════════════ */
const besoinCards = [
  {
    icon: Lightbulb,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-500',
    title: 'Je découvre une idée',
    description:
      'Vous avez un projet en tête ? Explorez votre idée, testez sa viabilité et validez votre marché avec nos outils de diagnostic.',
    borderColor: 'hover:border-amber-400',
  },
  {
    icon: Rocket,
    iconBg: 'bg-teal-100 dark:bg-teal-900/40',
    iconColor: 'text-primary',
    title: 'Je crée mon entreprise',
    description:
      'De la structuration juridique au business plan, suivez chaque étape pour immatriculer votre société en toute sérénité.',
    borderColor: 'hover:border-primary',
  },
  {
    icon: TrendingUp,
    iconBg: 'bg-coral-50 dark:bg-coral-900/20',
    iconColor: 'text-coral-500',
    title: 'Je développe mon activité',
    description:
      'Votre entreprise est lancée ? Accompagnez votre croissance avec nos outils marketing, financier et de réseau.',
    borderColor: 'hover:border-coral-400',
  },
]

function BesoinSection() {
  return (
    <section id="besoin" className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="text-center"
        >
          <Badge variant="secondary" className="mb-3">
            <Target className="mr-1 h-3 w-3" />
            Par où commencer ?
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Quel est <span className="text-gradient-teal">votre besoin</span> ?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            CreaPulse s&apos;adapte à chaque étape de votre parcours entrepreneurial
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {besoinCards.map((card) => (
            <motion.div key={card.title} variants={scaleIn}>
              <Card
                className={`group cursor-pointer border-2 border-transparent bg-card transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${card.borderColor}`}
              >
                <CardHeader className="pb-3">
                  <div
                    className={`mb-2 flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconBg}`}
                  >
                    <card.icon className={`h-7 w-7 ${card.iconColor}`} />
                  </div>
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {card.description}
                  </CardDescription>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Commencer
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 4 — PARCOURS VISUEL
   ═══════════════════════════════════════════════════════════ */
const parcoursSteps = [
  {
    icon: Lightbulb,
    step: '01',
    title: 'Idée & Vision',
    subtitle: 'Définissez votre projet',
    tools: '6 outils',
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    ring: 'ring-amber-200 dark:ring-amber-800',
  },
  {
    icon: Target,
    step: '02',
    title: 'Structurer',
    subtitle: 'Modélisez votre activité',
    tools: '10 outils',
    color: 'bg-teal-100 text-primary dark:bg-teal-900/40 dark:text-teal-300',
    ring: 'ring-teal-200 dark:ring-teal-800',
  },
  {
    icon: Calculator,
    step: '03',
    title: 'Financer',
    subtitle: 'Sécurisez votre plan',
    tools: '8 outils',
    color: 'bg-coral-50 text-coral-500 dark:bg-coral-900/20 dark:text-coral-400',
    ring: 'ring-coral-200 dark:ring-coral-800',
  },
  {
    icon: Rocket,
    step: '04',
    title: 'Lancer',
    subtitle: 'Immatriculez et développez',
    tools: '6 outils',
    color: 'bg-teal-100 text-primary dark:bg-teal-900/40 dark:text-teal-300',
    ring: 'ring-teal-200 dark:ring-teal-800',
  },
]

function ParcoursSection() {
  return (
    <section id="parcours" className="bg-muted/50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="text-center"
        >
          <Badge variant="secondary" className="mb-3">
            <Rocket className="mr-1 h-3 w-3" />
            Guide étape par étape
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Votre parcours <span className="text-gradient-teal">entrepreneurial</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Un chemin structuré en 4 phases pour passer de l&apos;idée à l&apos;entreprise
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="relative mt-12"
        >
          {/* Desktop: horizontal connected steps */}
          <div className="hidden lg:flex lg:items-start lg:justify-between">
            {parcoursSteps.map((step, i) => (
              <motion.div key={step.step} variants={fadeInUp} className="relative flex flex-1 items-start">
                {/* Step card */}
                <div className="flex w-full max-w-[260px] flex-col items-center text-center">
                  {/* Step number + icon */}
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-full ${step.color} ring-4 ${step.ring} transition-transform hover:scale-110`}
                  >
                    <step.icon className="h-9 w-9" />
                  </div>
                  <span className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Étape {step.step}
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.subtitle}</p>
                  <Badge variant="secondary" className="mt-3">
                    {step.tools}
                  </Badge>
                </div>
                {/* Connector line (not on last item) */}
                {i < parcoursSteps.length - 1 && (
                  <div className="absolute top-10 right-0 left-0 z-0 translate-x-1/2">
                    <div className="h-0.5 w-full bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />
                    <ChevronRight className="absolute -top-2.5 right-0 h-5 w-5 text-primary/50" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Mobile: vertical connected steps */}
          <div className="flex flex-col gap-6 lg:hidden">
            {parcoursSteps.map((step, i) => (
              <motion.div key={step.step} variants={fadeInUp}>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${step.color} ring-4 ${step.ring}`}
                    >
                      <step.icon className="h-6 w-6" />
                    </div>
                    {i < parcoursSteps.length - 1 && (
                      <div className="h-12 w-0.5 bg-gradient-to-b from-primary/40 to-primary/10" />
                    )}
                  </div>
                  <div className="pb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Étape {step.step}
                    </span>
                    <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.subtitle}</p>
                    <Badge variant="secondary" className="mt-2">
                      {step.tools}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 5 — OUTILS PHARES
   ═══════════════════════════════════════════════════════════ */
const outilsCards = [
  {
    icon: Calculator,
    title: 'CreaSim',
    description: 'Simulateur financier interactif',
    details: 'Estimez vos charges, revenus et rentabilité en quelques clics.',
    gradient: 'from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-900/10',
    iconColor: 'text-primary',
  },
  {
    icon: FileText,
    title: 'Business Plan IA',
    description: 'Éditeur intelligent 22 sections',
    details: 'Générez un business plan professionnel avec l\'aide de l\'IA.',
    gradient: 'from-coral-50 to-amber-50 dark:from-coral-900/10 dark:to-amber-900/10',
    iconColor: 'text-coral-500',
  },
  {
    icon: Award,
    title: 'Passeport Entrepreneurial',
    description: 'Certifiez votre parcours',
    details: 'Obtenez une certification reconnue par les partenaires financiers.',
    gradient: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10',
    iconColor: 'text-amber-500',
  },
  {
    icon: Sparkles,
    title: 'IA Marketing',
    description: 'Stratégie communication auto',
    details: 'Planifiez et optimisez votre stratégie marketing grâce à l\'IA.',
    gradient: 'from-teal-50 to-coral-50 dark:from-teal-900/10 dark:to-coral-900/10',
    iconColor: 'text-primary',
  },
]

function OutilsSection() {
  return (
    <section id="outils" className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="text-center"
        >
          <Badge variant="secondary" className="mb-3">
            <Zap className="mr-1 h-3 w-3" />
            Outils puissants
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Vos outils de{' '}
            <span className="text-gradient-teal">création d&apos;entreprise</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Des outils conçus pour vous accompagner à chaque étape
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {outilsCards.map((outil) => (
            <motion.div key={outil.title} variants={scaleIn}>
              <Card className="group h-full overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className={`h-2 bg-gradient-to-r ${outil.gradient}`} />
                <CardHeader className="pb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                    <outil.icon className={`h-6 w-6 ${outil.iconColor}`} />
                  </div>
                  <CardTitle className="mt-2 text-lg">{outil.title}</CardTitle>
                  <CardDescription className="text-sm font-medium">
                    {outil.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{outil.details}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Essayer
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 6 — TEMOIGNAGES (carousel)
   ═══════════════════════════════════════════════════════════ */
const temoignages = [
  {
    initials: 'MD',
    name: 'Marie D.',
    city: 'Créteil',
    quote:
      "CreaPulse m'a permis de structurer mon projet de boulangerie en 3 mois. Le simulateur financier m'a donné confiance pour me lancer.",
    rating: 5,
  },
  {
    initials: 'TL',
    name: 'Thomas L.',
    city: 'Nanterre',
    quote:
      "Le Business Plan IA est incroyable. En quelques heures, j'avais un document professionnel que ma banque a validé.",
    rating: 5,
  },
  {
    initials: 'SM',
    name: 'Sophie M.',
    city: 'Paris',
    quote:
      "L'accompagnement personnalisé et les outils de diagnostic m'ont aidé à trouver mon réseau GIDEF local.",
    rating: 5,
  },
]

function TemoignagesSection() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return
    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }
    api.on('select', handleSelect)
    return () => {
      api.off('select', handleSelect)
    }
  }, [api])

  // Auto-play
  useEffect(() => {
    if (!api) return
    const interval = setInterval(() => {
      api.scrollNext()
    }, 5000)
    return () => clearInterval(interval)
  }, [api])

  return (
    <section className="bg-muted/50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="text-center"
        >
          <Badge variant="secondary" className="mb-3">
            <Heart className="mr-1 h-3 w-3" />
            Témoignages
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ils ont créé leur entreprise avec{' '}
            <span className="text-gradient-teal">CreaPulse</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="mx-auto mt-12 max-w-3xl"
        >
          <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
            <CarouselContent>
              {temoignages.map((temoignage, i) => (
                <CarouselItem key={i}>
                  <Card className="border-0 bg-card shadow-lg">
                    <CardContent className="p-6 sm:p-8">
                      {/* Stars */}
                      <div className="mb-4 flex gap-1">
                        {[...Array(temoignage.rating)].map((_, j) => (
                          <Star
                            key={j}
                            className="h-4 w-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                      {/* Quote */}
                      <blockquote className="text-base leading-relaxed text-foreground sm:text-lg">
                        &ldquo;{temoignage.quote}&rdquo;
                      </blockquote>
                      {/* Author */}
                      <div className="mt-6 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          {temoignage.initials}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{temoignage.name}</p>
                          <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {temoignage.city}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 sm:-left-12" />
            <CarouselNext className="right-0 top-1/2 -translate-y-1/2 translate-x-1/2 sm:-right-12" />
          </Carousel>

          {/* Dots */}
          <div className="mt-6 flex justify-center gap-2">
            {temoignages.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 bg-primary' : 'w-2 bg-primary/30'
                }`}
                aria-label={`Aller au temoignage ${i + 1}`}
              />
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Défilement automatique toutes les 5 secondes
          </p>
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 7 — RESEAU GIDEF
   ═══════════════════════════════════════════════════════════ */
const gidefCards = [
  {
    name: 'GIDEF Paris',
    address: '15 rue de la Paix, 75002 Paris',
    hours: '09:00 - 18:00',
    phone: '01 42 XX XX XX',
  },
  {
    name: 'GIDEF Creteil',
    address: '8 avenue de Paris, 94000 Creteil',
    hours: '09:00 - 17:30',
    phone: '01 43 XX XX XX',
  },
  {
    name: 'GIDEF Nanterre',
    address: '24 rue Victor Hugo, 92000 Nanterre',
    hours: '09:00 - 18:00',
    phone: '01 47 XX XX XX',
  },
]

function ReseauGIDEFSection() {
  const [searchCode, setSearchCode] = useState('')

  return (
    <section id="reseau" className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="text-center"
        >
          <Badge variant="secondary" className="mb-3">
            <MapPin className="mr-1 h-3 w-3" />
            Réseau GIDEF
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Trouvez votre agence GIDEF{' '}
            <span className="text-gradient-teal">la plus proche</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            60 agences en Île-de-France pour un accompagnement de proximité
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          className="mx-auto mt-10 flex max-w-md gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Code postal..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Rechercher
          </Button>
        </motion.div>

        {/* GIDEF cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {gidefCards.map((gidef) => (
            <motion.div key={gidef.name} variants={scaleIn}>
              <Card className="h-full transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/40">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{gidef.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {gidef.address}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0 text-primary" />
                    {gidef.hours}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0 text-primary" />
                    {gidef.phone}
                  </div>
                  <Button variant="outline" size="sm" className="mt-4 w-full gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Contacter
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 8 — ACTUALITES (dynamic, fetched from API)
   ═══════════════════════════════════════════════════════════ */

const ARTICLE_CATEGORIES = ['Tous', 'Financement', 'Juridique', 'Marketing', 'Île-de-France', 'Inspiration', 'Outils numériques', 'Événements'] as const
type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  imageGradient: string | null
  authorName: string
  authorRole: string
  isFeatured: boolean
  readTime: number
  viewCount: number
  publishedAt: string
}

function ActualitesSection() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<ArticleCategory>('Tous')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [articleOpen, setArticleOpen] = useState(false)

  const fetchArticles = useCallback(async (cat: ArticleCategory, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '9' })
      if (cat !== 'Tous') params.set('category', cat)
      const res = await fetch(`/api/articles?${params}`)
      const data = await res.json()
      if (data.success) {
        setArticles(data.data.articles)
        setTotalPages(data.data.pagination.totalPages)
        setPage(p)
      }
    } catch {
      setArticles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchArticles(category, 1) }, [category, fetchArticles])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <section id="actualites" className="bg-muted/50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="text-center"
        >
          <Badge variant="secondary" className="mb-3">
            <BookOpen className="mr-1 h-3 w-3" />
            Actualités
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Actualités{' '}
            <span className="text-gradient-teal">entrepreneuriales</span>
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Suivez les dernières tendances et actualités pour créateurs d&apos;entreprise
          </p>
        </motion.div>

        {/* Category tabs */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {ARTICLE_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => fetchArticles(cat, 1)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Articles grid */}
        {loading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <CardHeader className="pb-2">
                  <Skeleton className="mb-2 h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="text-muted-foreground">Aucun article dans cette catégorie pour le moment.</p>
          </div>
        ) : (
          <>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer}
              className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {articles.map((article) => (
                <motion.div key={article.id} variants={scaleIn}>
                  <Card
                    className="group h-full cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    onClick={() => { setSelectedArticle(article); setArticleOpen(true) }}
                  >
                    <div
                      className={`flex h-36 items-center justify-center bg-gradient-to-br ${article.imageGradient || 'from-teal-600 to-teal-400'}`}
                    >
                      <BookOpen className="h-14 w-14 text-white/70" />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-fit text-xs">
                          {article.category}
                        </Badge>
                        {article.isFeatured && (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40">
                            <Star className="mr-0.5 h-2.5 w-2.5" />
                            À la une
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="mt-1 text-base leading-snug line-clamp-2">
                        {article.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(article.publishedAt)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {article.readTime} min
                        </span>
                      </div>
                      <div className="mt-3 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Lire l&apos;article
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Load more */}
            {page < totalPages && (
              <div className="mt-10 text-center">
                <Button variant="outline" onClick={() => fetchArticles(category, page + 1)}>
                  Voir plus d&apos;articles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Article reader sheet */}
        <Sheet open={articleOpen} onOpenChange={setArticleOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            {selectedArticle && (
              <>
                <SheetHeader>
                  <SheetTitle className="pr-4 text-lg leading-snug">
                    {selectedArticle.title}
                  </SheetTitle>
                  <SheetDescription className="pr-4">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge variant="secondary">{selectedArticle.category}</Badge>
                      <span>{formatDate(selectedArticle.publishedAt)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{selectedArticle.readTime} min de lecture</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Par {selectedArticle.authorName} — {selectedArticle.authorRole}</p>
                  </SheetDescription>
                </SheetHeader>
                <div className="px-6 pb-8 prose prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li]:text-muted-foreground [&_p]:text-muted-foreground [&_a]:text-primary [&_a]:underline">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedArticle.content || '') }} />
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 9 — PARTENAIRES
   ═══════════════════════════════════════════════════════════ */
const partenaires = [
  'BPI France',
  'France Travail',
  'Région Île-de-France',
  'CCI Île-de-France',
  'Banque Populaire',
]

function PartenairesSection() {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          className="text-center"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Nos partenaires de confiance
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {partenaires.map((nom) => (
              <div
                key={nom}
                className="flex h-14 items-center rounded-xl border border-border bg-card px-6 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:text-primary"
              >
                <Handshake className="mr-2 h-4 w-4" />
                {nom}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 10 — CTA FINAL
   ═══════════════════════════════════════════════════════════ */
function CtaFinalSection() {
  return (
    <section id="cta" className="relative overflow-hidden py-12 md:py-16">
      {/* Background */}
      <div className="gradient-teal absolute inset-0" />
      {/* Decorative circles */}
      <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-white/5" />
      <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-white/5" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
        className="relative mx-auto max-w-3xl px-4 text-center sm:px-6"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
        >
          Prêt à créer votre entreprise ?
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="mt-4 text-lg text-white/80"
        >
          Rejoignez les 50 000 entrepreneurs qui nous font confiance. Commencez gratuitement.
        </motion.p>
        <motion.div
          variants={fadeInUp}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          <Button
            size="lg"
            className="gap-2 bg-white text-primary font-semibold hover:bg-white/90"
          >
            Commencer gratuitement
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 border-white/40 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white"
          >
            Demander une démo
            <MessageCircle className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 11 — FOOTER
   ═══════════════════════════════════════════════════════════ */
const footerColumns = [
  {
    title: 'Solution',
    links: [
      { label: 'Parcours', href: '#parcours' },
      { label: 'Outils', href: '#outils' },
      { label: 'Tarifs', href: '#cta' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Blog', href: '#actualites' },
      { label: 'Guides', href: '#' },
      { label: 'FAQ', href: '#' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'A propos', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'CGU', href: '#' },
      { label: 'Confidentialite', href: '#' },
      { label: 'Cookies', href: '#' },
    ],
  },
]

function FooterSection() {
  const [email, setEmail] = useState('')

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">CreaPulse</span>
            </div>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Le bureau virtuel pour les entrepreneurs. Accompagné par le réseau GIDEF
              Île-de-France.
            </p>

            {/* Newsletter */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-foreground">Newsletter</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="max-w-[220px]"
                />
                <Button size="sm" onClick={() => toast.success('Merci ! Vous êtes inscrit(e) à la newsletter.')}>S&apos;abonner</Button>
              </div>
            </div>

            {/* Social icons */}
            <div className="mt-6 flex gap-3">
              {[
                { icon: Globe, label: 'LinkedIn' },
                { icon: MessageCircle, label: 'Facebook' },
                { icon: Heart, label: 'Instagram' },
              ].map((social) => (
                <button
                  key={social.label}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <social.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <p className="mb-3 text-sm font-semibold text-foreground">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      onClick={link.href === '#' ? (e) => { e.preventDefault(); toast.info('Page en cours de construction') } : undefined}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; 2025 CreaPulse - GIDEF Île-de-France. Tous droits réservés.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            Données sécurisées
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE — assembles all sections
   ═══════════════════════════════════════════════════════════ */
export default function Home() {
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

      {/* Section 1 — Sticky Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* Section 2 — Hero */}
        <HeroSection />

        {/* Section 3 — Mon Besoin */}
        <BesoinSection />

        {/* Section 4 — Parcours Visuel */}
        <ParcoursSection />

        {/* Section 5 — Outils Phares */}
        <OutilsSection />

        {/* Section 6 — Temoignages */}
        <TemoignagesSection />

        {/* Section 7 — Reseau GIDEF */}
        <ReseauGIDEFSection />

        {/* Section 8 — Actualites */}
        <ActualitesSection />

        {/* Section 9 — Partenaires */}
        <PartenairesSection />

        {/* Section 10 — CTA Final */}
        <CtaFinalSection />
      </main>

      {/* Section 11 — Footer */}
      <FooterSection />
    </div>
  )
}
