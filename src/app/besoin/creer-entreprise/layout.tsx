import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Créer mon entreprise — CreaPulse V2 | Echo Entreprendre × GIDEF',
  description:
    'Lancez votre entreprise avec un accompagnement sur mesure : business plan IA, simulateurs financiers, pitch deck et démarches d\'immatriculation avec CreaPulse.',
  openGraph: {
    title: 'Créer mon entreprise — CreaPulse V2',
    description:
      'De l\'idée à l\'immatriculation, CreaPulse est votre co-pilot entrepreneurial pour lancer votre activité sereinement.',
    url: 'https://echo4-steel.vercel.app/besoin/creer-entreprise',
    type: 'website',
  },
}

export default function CreerEntrepriseLayout({ children }: { children: React.ReactNode }) {
  return children
}
