import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Métiers du Numérique — CreaPulse V2 | Horizon Emplois GIDEF',
  description:
    'Les métiers du digital qui recrutent : développeur web, community manager, designer UX, data analyst… Test IA gratuit pour trouver votre voie dans le numérique.',
  openGraph: {
    title: 'Métiers du Numérique — CreaPulse V2 | Horizon Emplois',
    description:
      'Le digital offre des opportunités dans tous les secteurs. Passez le test IA et découvrez quel métier du numérique correspond à votre profil.',
    url: 'https://creapulse.echo-entreprendre.fr/metiers/numerique',
    type: 'website',
  },
}

export default function NumeriqueLayout({ children }: { children: React.ReactNode }) {
  return children
}
