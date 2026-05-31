import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Test IA — Horizon Emplois | CreaPulse V2 × GIDEF',
  description:
    'Découvrez le métier fait pour vous grâce à l\'IA. Testez gratuitement votre compatibilité avec 35 métiers dans 5 domaines : BTP, Social, Numérique, Formation et Entrepreneuriat.',
  openGraph: {
    title: 'Test IA — Horizon Emplois | CreaPulse V2',
    description:
      'Quiz IA gratuit : répondez à 7 questions et recevez votre matching personnalisé parmi les métiers qui recrutent en Île-de-France.',
    url: 'https://echo4-steel.vercel.app/metiers/test-ia',
    type: 'website',
  },
}

export default function TestIaLayout({ children }: { children: React.ReactNode }) {
  return children
}
