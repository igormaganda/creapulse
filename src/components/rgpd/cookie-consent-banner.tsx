'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

/* ─── Types ─── */
interface ConsentPreferences {
  cookies: boolean      // Cookies techniques (obligatoires)
  analytics: boolean    // Cookies analytiques
  marketing: boolean    // Cookies marketing
}

const DEFAULT_CONSENT: ConsentPreferences = {
  cookies: true,     // always true — required for session
  analytics: true,
  marketing: false,
}

const CONSENT_KEY = 'creapulse_consent_v1'

/* ─── Helpers ─── */
function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveConsent(preferences: ConsentPreferences): void {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(preferences))
}

async function sendConsentToAPI(preferences: ConsentPreferences): Promise<void> {
  try {
    const types = [
      { type: 'COOKIES', status: preferences.cookies ? 'GRANTED' : 'DENIED' },
      { type: 'MARKETING', status: preferences.marketing ? 'GRANTED' : 'DENIED' },
    ]
    for (const item of types) {
      await fetch('/api/rgpd/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          consentType: item.type,
          status: item.status,
          source: 'web',
        }),
      })
    }
  } catch {
    // Silently fail — consent is stored locally
  }
}

/* ─── Banner Component ─── */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState<ConsentPreferences>(DEFAULT_CONSENT)

  useEffect(() => {
    const stored = getStoredConsent()
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = useCallback(() => {
    const allAccepted: ConsentPreferences = {
      cookies: true,
      analytics: true,
      marketing: true,
    }
    saveConsent(allAccepted)
    sendConsentToAPI(allAccepted)
    setVisible(false)
  }, [])

  const handleAcceptSelected = useCallback(() => {
    saveConsent(preferences)
    sendConsentToAPI(preferences)
    setVisible(false)
  }, [preferences])

  const handleRefuseNonEssential = useCallback(() => {
    const minimal: ConsentPreferences = {
      cookies: true,
      analytics: false,
      marketing: false,
    }
    saveConsent(minimal)
    sendConsentToAPI(minimal)
    setVisible(false)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[200] p-4 sm:p-6"
          role="dialog"
          aria-label="Gestionnaire de consentement aux cookies"
          aria-describedby="cookie-consent-description"
        >
          <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-background shadow-2xl backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-start gap-3 p-5 pb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground">
                  Respect de votre vie privée
                </h3>
                <p id="cookie-consent-description" className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Nous utilisons des cookies pour améliorer votre expérience, mesurer l&apos;audience et
                  personnaliser le contenu. Vous pouvez configurer vos préférences ou accepter tous les cookies.
                </p>
              </div>
              <button
                onClick={handleRefuseNonEssential}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Refuser et fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Expandable details */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 space-y-3">
                    <Separator className="opacity-50" />

                    {/* Technical cookies (always enabled) */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Cookies techniques</p>
                        <p className="text-xs text-muted-foreground">
                          Nécessaires au bon fonctionnement du site (authentification, sécurité).
                        </p>
                      </div>
                      <Switch checked={true} disabled aria-label="Cookies techniques (obligatoires)" />
                    </div>

                    {/* Analytics */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Cookies analytiques</p>
                        <p className="text-xs text-muted-foreground">
                          Mesure d&apos;audience anonymisée pour comprendre l&apos;utilisation du site.
                        </p>
                      </div>
                      <Switch
                        checked={preferences.analytics}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({ ...prev, analytics: checked }))
                        }
                        aria-label="Cookies analytiques"
                      />
                    </div>

                    {/* Marketing */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Cookies marketing</p>
                        <p className="text-xs text-muted-foreground">
                          Publicités et contenu personnalisé selon vos centres d&apos;intérêt.
                        </p>
                      </div>
                      <Switch
                        checked={preferences.marketing}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({ ...prev, marketing: checked }))
                        }
                        aria-label="Cookies marketing"
                      />
                    </div>

                    <Separator className="opacity-50" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 px-5 pb-5 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm gap-1.5"
                onClick={() => setShowDetails((v) => !v)}
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Masquer les détails
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Personnaliser
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2 sm:ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={handleRefuseNonEssential}
                >
                  Refuser (sauf essentiel)
                </Button>
                {showDetails && (
                  <Button
                    size="sm"
                    className="text-sm"
                    onClick={handleAcceptSelected}
                  >
                    Accepter la sélection
                  </Button>
                )}
                <Button
                  size="sm"
                  className="text-sm"
                  onClick={handleAcceptAll}
                >
                  Tout accepter
                </Button>
              </div>
            </div>

            {/* Footer link */}
            <div className="border-t border-border/40 px-5 py-2.5 bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                En poursuivant votre navigation, vous acceptez l&apos;utilisation des cookies.
                {' '}Consultez notre politique de confidentialité pour en savoir plus.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
