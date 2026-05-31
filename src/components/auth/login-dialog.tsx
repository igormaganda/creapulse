'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, Zap, GraduationCap, ShieldCheck, Shield, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/lib/zustand/store'
import { useConseillerStore } from '@/components/conseiller/conseiller-store'
import { useAdminCentreStore } from '@/components/admin-centre/admin-centre-store'
import { useAdminPlateformeStore } from '@/components/admin-plateforme/admin-plateforme-store'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToRegister: () => void
  onLoginSuccess: (user: { firstName: string; lastName: string; email: string }) => void
}

export function LoginDialog({
  open,
  onOpenChange,
  onSwitchToRegister,
  onLoginSuccess,
}: LoginDialogProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Veuillez saisir votre adresse e-mail')
      return
    }
    if (!password) {
      toast.error('Veuillez saisir votre mot de passe')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error?.message || data.error || 'Identifiants incorrects')
        return
      }

      if (data.success && data.data) {
        // Store token and user in auth store
        const { user: userData, accessToken } = data.data
        if (accessToken) {
          useAuthStore.getState().login(accessToken, {
            id: userData.id || 'unknown',
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role || 'BENEFICIARY',
            avatarUrl: userData.avatarUrl || null,
          })
        }
        toast.success(`Bienvenue ${userData.firstName || ''} !`)
        onLoginSuccess(userData)
      } else {
        // Fallback for old API format
        toast.success(`Bienvenue ${data.user.firstName || ''} !`)
        onLoginSuccess(data.user)
      }
      onOpenChange(false)
      setEmail('')
      setPassword('')
    } catch {
      toast.error('Une erreur est survenue. Veuillez reessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card sm:max-w-md" aria-label="Connexion">
        <DialogHeader className="pb-2">
          {/* Logo header */}
          <div className="mx-auto mb-2 flex items-center gap-2 sm:mx-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-teal">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">CreaPulse</span>
          </div>
          <DialogTitle className="text-center text-2xl sm:text-left">
            Connexion
          </DialogTitle>
          <DialogDescription className="text-center sm:text-left">
            Connectez-vous à votre espace entrepreneur
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="login-email">Adresse e-mail</Label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
                autoComplete="email"
                autoFocus
                required
                aria-required="true"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Mot de passe</Label>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => toast.info('Contactez votre agence GIDEF pour reinitialiser votre mot de passe.')}
                aria-label="Mot de passe oublie"
              >
                Mot de passe oublie ?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-16"
                disabled={loading}
                autoComplete="current-password"
                required
                aria-required="true"
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>

        {/* Terms notice */}
        <p className="text-xs leading-relaxed text-muted-foreground">
          En vous connectant, vous acceptez nos{' '}
          <a
            href="#cgu"
            className="font-medium text-primary hover:underline"
            aria-label="Consulter les conditions d'utilisation"
            onClick={(e) => {
              e.preventDefault()
              onOpenChange(false)
              window.location.hash = 'cgu'
            }}
          >
            conditions d&apos;utilisation
          </a>{' '}
          et notre{' '}
          <a
            href="#privacy"
            className="font-medium text-primary hover:underline"
            aria-label="Consulter la politique de confidentialite"
            onClick={(e) => {
              e.preventDefault()
              onOpenChange(false)
              window.location.hash = 'privacy'
            }}
          >
            politique de confidentialite
          </a>
          .
        </p>

        {/* Switch to register — masqué temporairement
        <Separator className="my-2" />
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{' '}
          <button
            type="button"
            className="font-semibold text-primary hover:underline"
            onClick={() => {
              onOpenChange(false)
              onSwitchToRegister()
            }}
          >
            Créer un compte
          </button>
        </p>
        */}

        {/* Admin / Staff access */}
        <Accordion type="single" collapsible className="mt-2">
          <AccordionItem value="admin" className="border-b-0">
            <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Accès conseiller & administration
                <ChevronDown className="h-3 w-3" />
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => {
                    onOpenChange(false)
                    useConseillerStore.getState().openConseiller()
                  }}
                >
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Espace Conseiller
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => {
                    onOpenChange(false)
                    useAdminCentreStore.getState().openAdminCentre()
                  }}
                >
                  <ShieldCheck className="h-4 w-4 text-[#FF6B35]" />
                  Admin Centre
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => {
                    onOpenChange(false)
                    useAdminPlateformeStore.getState().openAdminPlateforme()
                  }}
                >
                  <Shield className="h-4 w-4 text-[#FFB74D]" />
                  Super Admin
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  )
}
