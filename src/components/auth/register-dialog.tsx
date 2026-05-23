'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, User, Zap, CheckCircle2 } from 'lucide-react'

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

interface RegisterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToLogin: () => void
  onRegisterSuccess: (user: { firstName: string; lastName: string; email: string }) => void
}

export function RegisterDialog({
  open,
  onOpenChange,
  onSwitchToLogin,
  onRegisterSuccess,
}: RegisterDialogProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  /* Password strength indicator */
  function getPasswordStrength(pw: string): {
    score: number
    label: string
    color: string
  } {
    if (!pw) return { score: 0, label: '', color: '' }
    let score = 0
    if (pw.length >= 8) score++
    if (pw.length >= 12) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++

    if (score <= 1) return { score, label: 'Faible', color: 'bg-red-500' }
    if (score <= 2) return { score, label: 'Moyen', color: 'bg-amber-500' }
    if (score <= 3) return { score, label: 'Bon', color: 'bg-teal-500' }
    return { score, label: 'Excellent', color: 'bg-green-600' }
  }

  const pwStrength = getPasswordStrength(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!firstName.trim()) {
      toast.error('Veuillez saisir votre prenom')
      return
    }
    if (!lastName.trim()) {
      toast.error('Veuillez saisir votre nom')
      return
    }
    if (!email.trim()) {
      toast.error('Veuillez saisir votre adresse e-mail')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Adresse e-mail invalide')
      return
    }
    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caracteres')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Une erreur est survenue lors de l'inscription")
        return
      }

      toast.success('Compte cree avec succes !')
      onRegisterSuccess(data.user)
      onOpenChange(false)
      setFirstName('')
      setLastName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('Une erreur est survenue. Veuillez reessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card sm:max-w-md max-h-[90vh] overflow-y-auto" aria-label="Creer un compte">
        <DialogHeader className="pb-2">
          {/* Logo header */}
          <div className="mx-auto mb-2 flex items-center gap-2 sm:mx-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-teal">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">CreaPulse</span>
          </div>
          <DialogTitle className="text-center text-2xl sm:text-left">
            Creer un compte
          </DialogTitle>
          <DialogDescription className="text-center sm:text-left">
            Rejoignez CreaPulse et lancez votre projet entrepreneurial
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="register-firstname">Prenom</Label>
              <div className="relative">
                <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="register-firstname"
                  type="text"
                  placeholder="Jean"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  autoComplete="given-name"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-lastname">Nom</Label>
              <div className="relative">
                <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="register-lastname"
                  type="text"
                  placeholder="Dupont"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="register-email">Adresse e-mail</Label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="register-email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="register-password">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-16"
                disabled={loading}
                autoComplete="new-password"
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
            {/* Password strength bar */}
            {password.length > 0 && (
              <div className="space-y-1" role="status" aria-label={`Force du mot de passe : ${pwStrength.label}`}>
                <div className="flex gap-1" role="progressbar" aria-valuenow={pwStrength.score} aria-valuemin={0} aria-valuemax={5}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        level <= pwStrength.score ? pwStrength.color : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Force : <span className="font-medium">{pwStrength.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <Label htmlFor="register-confirm-password">Confirmer le mot de passe</Label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="register-confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repetez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                disabled={loading}
                autoComplete="new-password"
              />
              {confirmPassword.length > 0 && password === confirmPassword && (
                <CheckCircle2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-green-600" />
              )}
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs leading-relaxed text-muted-foreground">
            En creant un compte, vous acceptez nos{' '}
            <span className="font-medium text-primary hover:underline cursor-pointer">
              conditions d&apos;utilisation
            </span>{' '}
            et notre{' '}
            <span className="font-medium text-primary hover:underline cursor-pointer">
              politique de confidentialite
            </span>
            .
          </p>

          {/* Submit */}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creation du compte...
              </>
            ) : (
              <>
                Creer mon compte
              </>
            )}
          </Button>
        </form>

        <Separator className="my-2" />

        {/* Switch to login */}
        <p className="text-center text-sm text-muted-foreground">
          Vous avez deja un compte ?{' '}
          <button
            type="button"
            className="font-semibold text-primary hover:underline"
            onClick={() => {
              onOpenChange(false)
              onSwitchToLogin()
            }}
          >
            Se connecter
          </button>
        </p>
      </DialogContent>
    </Dialog>
  )
}
