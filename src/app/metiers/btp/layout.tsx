import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Métiers du BTP — CreaPulse V2 | Horizon Emplois GIDEF',
  description:
    'Découvrez les métiers du BTP qui recrutent en Île-de-France : électricien, plombier, maçon, carreleur… Test IA gratuit pour trouver le métier fait pour vous.',
  openGraph: {
    title: 'Métiers du BTP — CreaPulse V2 | Horizon Emplois',
    description:
      'Des postes vacants dans tous les secteurs du BTP. Passez le test IA et trouvez le métier du bâtiment qui correspond à votre profil.',
    url: 'https://echo4-steel.vercel.app/metiers/btp',
    type: 'website',
  },
}

export default function BtpLayout({ children }: { children: React.ReactNode }) {
  return children
}
