// ============================================
// CreaPulse V2 — CSRF Validation Helper
// Implements double-submit cookie pattern validation.
// The CSRF token is set as a non-httpOnly cookie by middleware
// and must be sent as X-CSRF-Token header on state-changing requests.
// ============================================

import { NextRequest } from 'next/server'

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Uses a simple constant-time algorithm.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Validate CSRF token using the double-submit cookie pattern.
 *
 * Reads the csrf_token from the cookie and compares it with
 * the X-CSRF-Token header. If they match, the request is legitimate.
 *
 * @returns true if CSRF token is valid, false otherwise
 */
export function validateCsrf(request: NextRequest): boolean {
  const cookieToken = request.cookies.get('csrf_token')?.value
  const headerToken = request.headers.get('X-CSRF-Token')

  if (!cookieToken || !headerToken) {
    return false
  }

  return timingSafeEqual(cookieToken, headerToken)
}
