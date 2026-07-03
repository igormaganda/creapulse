'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Zap,
  Globe,
  MessageCircle,
  Heart,
  Shield,
} from 'lucide-react'
import { fadeInUp } from './landing-shared'
import Image from 'next/image'

const footerColumns = [
  {
    title: 'Solution',
    links: [
      { label: 'Parcours', href: '#parcours' },
      { label: 'Outils', href: '#outils' },
      { label: 'Documents', href: '#documents' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Blog', href: '/actualites' },
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
      { label: 'CGU', href: '#cgu' },
      { label: 'Confidentialite', href: '#privacy' },
      { label: 'Cookies', href: '#' },
    ],
  },
]

export function FooterSection() {
  const [email, setEmail] = useState('')

  return (
    <footer role="contentinfo" className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <Image src="/images/logo-creapulse.svg" alt="CreaPulse" width={32} height={32} className="h-8 w-8" />
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
                  aria-label="Adresse e-mail pour la newsletter"
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
                      aria-label={link.label === 'CGU' ? 'Consulter les conditions generales d\'utilisation' : link.label === 'Confidentialite' ? 'Consulter la politique de confidentialite' : link.label}
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
