// ═══════════════════════════════════════════════════════════
// CreaPulse V2 — France Travail API Integration
// OAuth2 token management, API constants, helper functions
// ═══════════════════════════════════════════════════════════

// ─── Types ───────────────────────────────────

interface TokenCache {
  token: string
  expiresAt: number
}

interface PendingTokenRequest {
  promise: Promise<string>
  createdAt: number
}

// ─── FT API Scopes ──────────────────────────

export const FT_SCOPES = {
  OFFRES: 'api_offresdemploiv2',
  AIDES: 'api_aides',
  FORMATIONS: 'api_formations',
  EVENEMENTS: 'api_evenements',
  METIERS: 'api_metiers',
  ENTREPRISES: 'api_infonet',
  STATISTIQUES: 'api_statistiques',
  AGENCES: 'api_agences',
  COMMUNAUTES: 'api_communautes',
  ROME: 'api_rome',
  LBB: 'api_lbbcompanies',
} as const

// ─── FT API Base URLs ───────────────────────

export const FT_API = {
  OFFRES: 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search',
  AIDES: 'https://api.francetravail.io/partenaire/aides/v1/aides',
  FORMATIONS: 'https://api.francetravail.io/partenaire/formations/v1/formations',
  EVENEMENTS: 'https://api.francetravail.io/partenaire/evenements/v1/evenements',
  METIERS: 'https://api.francetravail.io/partenaire/metiers/v1/metiers',
  ENTREPRISES: 'https://api.francetravail.io/partenaire/infonet/v1/entreprises',
  STATISTIQUES: 'https://api.francetravail.io/partenaire/statistiques/v1/statistiques',
  AGENCES: 'https://api.francetravail.io/partenaire/agences/v1/agences',
  COMMUNAUTES: 'https://api.francetravail.io/partenaire/communautes/v1/communautes',
  ROME: 'https://api.francetravail.io/partenaire/rome/v1/metiers',
  LBB: 'https://api.francetravail.io/partenaire/lbbcompanies/v1/entreprises',
} as const

// ─── OAuth2 Configuration ───────────────────

const FT_AUTH_URL = 'https://entreprise.francetravail.io/connexion/oauth2/access_token'

// ─── In-memory Token Cache ───────────────────

const tokenCache = new Map<string, TokenCache>()
const pendingTokenRequests = new Map<string, PendingTokenRequest>()

/**
 * Get a cached or freshly fetched OAuth2 token for the given scope.
 * Tokens are cached per scope with a 60-second buffer before expiration.
 */
export async function getFTToken(scope: string): Promise<string> {
  const now = Date.now()

  // Return cached token if still valid (with 60s buffer)
  const cached = tokenCache.get(scope)
  if (cached && cached.expiresAt > now) {
    return cached.token
  }

  // Check if there's already a pending token fetch for this scope (race condition lock)
  const pending = pendingTokenRequests.get(scope)
  if (pending && now - pending.createdAt < 10_000) {
    return pending.promise
  }

  const clientId = process.env.FT_CLIENT_ID
  const clientSecret = process.env.FT_SECRET

  if (!clientId || !clientSecret) {
    console.error('[FT Token] Identifiants manquants : FT_CLIENT_ID ou FT_SECRET non configurés')
    throw new Error('Service France Travail temporairement indisponible.')
  }

  // Create pending promise to deduplicate concurrent requests
  const tokenPromise = (async () => {
    try {
      const response = await fetch(FT_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope,
        }),
      })

      if (!response.ok) {
        const text = await response.text().catch(() => 'Pas de réponse')
        console.error(`[FT Token] Erreur d'authentification (${response.status}) : ${text}`)
        throw new Error('Service France Travail temporairement indisponible.')
      }

      const data = await response.json()
      const token: string = data.access_token
      const expiresInMs = (data.expires_in ?? 3600) * 1000

      // Cache with 60-second safety buffer
      tokenCache.set(scope, {
        token,
        expiresAt: now + expiresInMs - 60_000,
      })

      return token
    } finally {
      // Always clean up pending entry
      pendingTokenRequests.delete(scope)
    }
  })()

  pendingTokenRequests.set(scope, { promise: tokenPromise, createdAt: now })

  return tokenPromise
}

/**
 * Build standard headers for France Travail API requests.
 */
export function ftHeaders(
  token: string,
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...extra,
  }
}

/**
 * Generic wrapper to fetch any France Travail API endpoint.
 * Handles token retrieval, header construction, retry with exponential backoff, and error logging.
 * - Max 2 retries on network errors or 5xx responses
 * - Delay: 500ms * 2^attempt (500ms, 1000ms)
 * - No retry on 4xx (client errors)
 * Returns the parsed JSON response or throws on failure.
 */
export async function fetchFTAPI<T>(
  url: string,
  scope: string,
  options?: RequestInit,
): Promise<T> {
  const MAX_RETRIES = 2
  const BASE_DELAY_MS = 500

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const token = await getFTToken(scope)
      const headers = ftHeaders(token, options?.headers as Record<string, string> | undefined)

      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const text = await response.text().catch(() => 'Pas de réponse')

        // Don't retry on 4xx client errors
        if (response.status >= 400 && response.status < 500) {
          console.error(`[FT API] Erreur client ${response.status} pour ${url} : ${text}`)
          throw new Error('Erreur lors de la communication avec le service France Travail.')
        }

        // Retry on 5xx or network-level issues (response exists but is server error)
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt)
          console.warn(`[FT API] Erreur ${response.status} pour ${url}, tentative ${attempt + 1}/${MAX_RETRIES + 1}, nouvel essai dans ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        console.error(`[FT API] Erreur ${response.status} pour ${url} après ${MAX_RETRIES + 1} tentatives : ${text}`)
        throw new Error('Erreur lors de la communication avec le service France Travail.')
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T
      }

      return response.json() as Promise<T>
    } catch (err) {
      // Network-level errors (fetch itself failed)
      const isNetworkError = err instanceof TypeError && !('status' in (err as object))
      if (isNetworkError && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt)
        console.warn(`[FT API] Erreur réseau pour ${url}, tentative ${attempt + 1}/${MAX_RETRIES + 1}, nouvel essai dans ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      // Re-throw non-retryable or exhausted errors
      if (err instanceof Error && err.message.includes('France Travail')) {
        throw err
      }
      throw new Error('Erreur lors de la communication avec le service France Travail.')
    }
  }

  // Should not reach here, but satisfy TypeScript
  throw new Error('Erreur lors de la communication avec le service France Travail.')
}

/**
 * Safely call a France Travail API endpoint.
 * Returns null on failure instead of throwing — useful for enrichment pipelines.
 */
export async function safeFetchFTAPI<T>(
  url: string,
  scope: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    return await fetchFTAPI<T>(url, scope, options)
  } catch (err) {
    console.error(`[FT Safe Fetch] ${url}`, err instanceof Error ? err.message : err)
    return null
  }
}

// ─── In-memory Response Cache ──────────────

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const responseCache = new Map<string, CacheEntry<unknown>>()

/**
 * Clean up expired cache entries. Called lazily before cache reads.
 */
function cleanupResponseCache(): void {
  const now = Date.now()
  for (const [key, entry] of responseCache) {
    if (entry.expiresAt <= now) {
      responseCache.delete(key)
    }
  }
}

/**
 * Cached version of safeFetchFTAPI.
 * Caches successful responses in memory with a TTL (default 5 minutes).
 * Cache key = URL + scope. On cache hit, returns immediately without calling the FT API.
 * On cache miss or expiration, calls safeFetchFTAPI and stores the result.
 * Failed calls (null) are NOT cached — they will be retried on next call.
 */
export async function cachedFetchFTAPI<T>(
  url: string,
  scope: string,
  options?: RequestInit,
  ttlMs: number = 300_000,
): Promise<T | null> {
  const cacheKey = `${url}|||${scope}`

  // Lazy cleanup of expired entries
  cleanupResponseCache()

  // Check cache
  const cached = responseCache.get(cacheKey) as CacheEntry<T> | undefined
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  // Fetch fresh data
  const result = await safeFetchFTAPI<T>(url, scope, options)

  // Only cache successful responses
  if (result !== null) {
    responseCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + ttlMs,
    })
  }

  return result
}

/**
 * Build a query string from a filter object, omitting null/undefined values.
 */
export function buildQueryString(filters: Record<string, string | number | boolean | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value))
    }
  }
  const str = params.toString()
  return str ? `?${str}` : ''
}
