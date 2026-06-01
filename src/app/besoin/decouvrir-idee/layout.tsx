import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Découvrir une idée — CreaPulse V2 | Echo Entreprendre × GIDEF',
  description:
    'Vous avez une idée de projet mais ne savez pas par où commencer ? CreaPulse vous accompagne pour explorer, valider et structurer votre idée entrepreneuriale grâce à des outils IA.',
  openGraph: {
    title: 'Découvrir une idée entrepreneuriale — CreaPulse V2',
    description:
      'Explorez et validez votre idée de création d\'entreprise avec CreaPulse et le réseau GIDEF Île-de-France.',
    url: 'https://echo4-steel.vercel.app/besoin/decouvrir-idee',
    type: 'website',
  },
}

export default function DecouvrirIdeeLayout({ children }: { children: React.ReactNode }) {
  return children
}
