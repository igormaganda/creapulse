import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Entrepreneuriat — CreaPulse V2 | Horizon Emplois GIDEF',
  description:
    'Testez votre potentiel entrepreneurial : freelance, auto-entrepreneur, création d\'startup. Découvrez si l\'entrepreneuriat est fait pour vous avec le test IA CreaPulse.',
  openGraph: {
    title: 'Entrepreneuriat — CreaPulse V2 | Horizon Emplois',
    description:
      'L\'entrepreneuriat offre une liberté et des revenus sans plafond. Faites le test IA et découvrez votre profil entrepreneurial.',
    url: 'https://echo4-steel.vercel.app/metiers/entrepreneuriat',
    type: 'website',
  },
}

export default function EntrepreneuriatLayout({ children }: { children: React.ReactNode }) {
  return children
}
