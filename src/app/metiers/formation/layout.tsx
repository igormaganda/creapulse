import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Formation & Reconversion — CreaPulse V2 | Horizon Emplois GIDEF',
  description:
    'Découvrez les formations et financements pour votre reconversion professionnelle : CPF, Pôle Emploi, Région IDF, alternance. Test IA pour identifier la formation adaptée à votre profil.',
  openGraph: {
    title: 'Formation & Reconversion — CreaPulse V2 | Horizon Emplois',
    description:
      'Des formations qualifiantes et des dispositifs de financement pour réussir votre reconversion. Test IA gratuit pour trouver la bonne voie.',
    url: 'https://creapulse.echo-entreprendre.fr/metiers/formation',
    type: 'website',
  },
}

export default function FormationLayout({ children }: { children: React.ReactNode }) {
  return children
}
