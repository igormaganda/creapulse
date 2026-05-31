import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Métiers du Social — CreaPulse V2 | Horizon Emplois GIDEF',
  description:
    'Explorez les métiers du social en Île-de-France : éducateur spécialisé, AESH, assistant social, médiateur… Test IA pour identifier la carrière humaine qui vous correspond.',
  openGraph: {
    title: 'Métiers du Social — CreaPulse V2 | Horizon Emplois',
    description:
      'Des carrières humaines avec de vraies perspectives. Passez le test IA et découvrez quel métier du social est fait pour vous.',
    url: 'https://echo4-steel.vercel.app/metiers/social',
    type: 'website',
  },
}

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return children
}
