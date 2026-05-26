// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / Statistiques
// Proxy GET : statistiques régionales du marché du travail
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI, buildQueryString } from '@/lib/france-travail'
import { withFTAuth } from '@/lib/ft-guard'
import type { FTAuthContext } from '@/lib/ft-guard'
import { z } from 'zod'

const statistiquesQuerySchema = z.object({
  codeRegion: z.string().regex(/^\d{2}$/).optional(),
  codeDepartement: z.string().regex(/^\d{2,3}$/).optional(),
  codeCommune: z.string().max(10).optional(),
  codeRome: z.string().max(10).optional(),
  type: z.string().max(50).optional(),
  date: z.string().max(30).optional(),
})

async function handleGET(request: NextRequest, _ctx: FTAuthContext) {
  const { searchParams } = new URL(request.url)

  const parsed = statistiquesQuerySchema.safeParse({
    codeRegion: searchParams.get('codeRegion') || undefined,
    codeDepartement: searchParams.get('codeDepartement') || undefined,
    codeCommune: searchParams.get('codeCommune') || undefined,
    codeRome: searchParams.get('codeRome') || undefined,
    type: searchParams.get('type') || undefined,
    date: searchParams.get('date') || undefined,
  })

  if (!parsed.success) {
    return Errors.validation(
      parsed.error.issues.map((i) => ({ champ: i.path.join('.'), message: i.message })),
      'Paramètres de recherche invalides.',
    )
  }

  const filters = {
    codeRegion: parsed.data.codeRegion,
    codeDepartement: parsed.data.codeDepartement,
    codeCommune: parsed.data.codeCommune,
    codeRome: parsed.data.codeRome,
    type: parsed.data.type,
    date: parsed.data.date,
  }

  const qs = buildQueryString(filters)
  const url = `${FT_API.STATISTIQUES}${qs}`

  const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.STATISTIQUES)

  return success(data, 'Statistiques récupérées avec succès')
}

export const GET = withFTAuth(handleGET, 'GET')
