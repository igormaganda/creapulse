import { MetiersNavbar, MetiersFooter } from '@/components/metiers/metiers-navbar'

export default function MetiersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <MetiersNavbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <MetiersFooter />
    </div>
  )
}
