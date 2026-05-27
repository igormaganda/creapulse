// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail / ROME
// Proxy GET : annuaire des métiers ROME
// ═══════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { success, Errors } from '@/lib/api-response'
import { FT_API, FT_SCOPES, fetchFTAPI, buildQueryString } from '@/lib/france-travail'
import { withFTAuth, validateFTPagination } from '@/lib/ft-guard'
import type { FTAuthContext } from '@/lib/ft-guard'
import { z } from 'zod'

const romeQuerySchema = z.object({
  code: z.string().max(10).optional(),
  motsCles: z.string().max(200).optional(),
  page: z.string().optional(),
  per_page: z.string().optional(),
})

async function handleGET(request: NextRequest, _ctx: FTAuthContext) {
  const { searchParams } = new URL(request.url)

  const parsed = romeQuerySchema.safeParse({
    code: searchParams.get('code') || undefined,
    motsCles: searchParams.get('motsCles') || undefined,
    page: searchParams.get('page') || undefined,
    per_page: searchParams.get('per_page') || undefined,
  })

  if (!parsed.success) {
    return Errors.validation(
      parsed.error.issues.map((i) => ({ champ: i.path.join('.'), message: i.message })),
      'Paramètres de recherche invalides.',
    )
  }

  const pagination = validateFTPagination({
    page: parsed.data.page,
    per_page: parsed.data.per_page,
  })

  // If a specific code is provided, fetch by code
  if (parsed.data.code) {
    const url = `${FT_API.ROME}/${encodeURIComponent(parsed.data.code)}`
    const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.ROME)
    return success(data, 'Fiche métier ROME récupérée')
  }

  // Otherwise search by keywords
  const filters = {
    motsCles: parsed.data.motsCles,
    page: String(pagination.page),
    per_page: String(pagination.per_page ?? 20),
  }

  const qs = buildQueryString(filters)
  const url = `${FT_API.ROME}${qs}`

  const data = await fetchFTAPI<Record<string, unknown>>(url, FT_SCOPES.ROME)

  return success(data, 'Métiers ROME récupérés avec succès')
}

export const GET = withFTAuth(handleGET, 'GET')
