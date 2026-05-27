import Link from 'next/link'
import { ArrowLeft, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MetiersNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <SearchX className="h-10 w-10 text-primary" />
      </div>
      <h1 className="mb-2 text-3xl font-bold">Catégorie non trouvée</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        La catégorie de métiers que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Button asChild className="gap-2">
        <Link href="/metiers/test-ia">
          <ArrowLeft className="h-4 w-4" />
          Retourner aux tests métiers
        </Link>
      </Button>
    </div>
  )
}
