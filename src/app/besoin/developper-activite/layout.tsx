import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Développer mon activité — CreaPulse V2 | Echo Entreprendre × GIDEF',
  description:
    'Accélérez la croissance de votre entreprise avec CreaPulse : pilotage stratégique, programme Tremplin, certifications, réseautage et mentorat pour passer à l\'échelle.',
  openGraph: {
    title: 'Développer mon activité — CreaPulse V2',
    description:
      'Passez à la vitesse supérieure grâce aux outils de pilotage, au réseau GIDEF et au programme Tremplin de CreaPulse.',
    url: 'https://creapulse.echo-entreprendre.fr/besoin/developper-activite',
    type: 'website',
  },
}

export default function DevelopperActiviteLayout({ children }: { children: React.ReactNode }) {
  return children
}
