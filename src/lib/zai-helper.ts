// ============================================
// CreaPulse V2 — Shared ZAI Helper
// Wraps z-ai-web-dev-sdk calls with proper error handling
// All AI API routes should use this instead of direct ZAI.create()
// ============================================

import ZAI from 'z-ai-web-dev-sdk'

// ─── Types ──────────────────────────────────

export interface ZAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ZAIOptions {
  model?: string
  temperature?: number
  max_tokens?: number
}

export interface ZAIResult {
  success: true
  content: string
  raw: string | null
}

export interface ZAIFailure {
  success: false
  reason: 'sdk_init' | 'ai_call' | 'empty_response'
  error: string
}

export type ZAIResponse = ZAIResult | ZAIFailure

// ─── Default model ──────────────────────────

const DEFAULT_MODEL = 'claude-sonnet-4-20250514'

// ─── Main helper ────────────────────────────

/**
 * Call the LLM via z-ai-web-dev-sdk with full error handling.
 * NEVER throws — always returns a ZAIResponse object.
 *
 * Usage:
 *   const result = await callZAI([
 *     { role: 'system', content: 'Tu es un expert...' },
 *     { role: 'user', content: 'Génère...' },
 *   ])
 *   if (!result.success) {
 *     // Handle gracefully — result.reason tells you why
 *   }
 *   const text = result.content
 */
export async function callZAI(
  messages: ZAIMessage[],
  options?: ZAIOptions,
): Promise<ZAIResponse> {
  // Step 1: Initialize SDK
  let zai: Awaited<ReturnType<typeof ZAI.create>> | null = null
  try {
    zai = await ZAI.create()
  } catch (sdkErr) {
    const errMsg = sdkErr instanceof Error ? sdkErr.message : 'Unknown SDK error'
    console.error('[ZAI Helper] ZAI.create() failed:', errMsg)
    return {
      success: false,
      reason: 'sdk_init',
      error: errMsg,
    }
  }

  // Step 2: Call the model
  try {
    const completion = await zai.chat.completions.create({
      model: options?.model || DEFAULT_MODEL,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 1000,
    })

    const raw = completion.choices?.[0]?.message?.content || ''

    if (!raw.trim()) {
      return {
        success: false,
        reason: 'empty_response',
        error: 'Le modèle a retourné une réponse vide.',
      }
    }

    return {
      success: true,
      content: raw.trim(),
      raw,
    }
  } catch (aiErr) {
    const errMsg = aiErr instanceof Error ? aiErr.message : 'Unknown AI error'
    console.error('[ZAI Helper] AI call failed:', errMsg)
    return {
      success: false,
      reason: 'ai_call',
      error: errMsg,
    }
  }
}

// ─── Convenience: parse JSON from AI response ──

/**
 * Parse JSON from an AI response, handling markdown code blocks.
 * Returns null if parsing fails.
 */
export function parseJSONFromAI<T = unknown>(text: string): T | null {
  // Try direct parse
  try {
    const parsed = JSON.parse(text)
    if (typeof parsed === 'object' && parsed !== null) return parsed as T
  } catch {}

  // Try matching JSON block (handles ```json ... ```)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (typeof parsed === 'object' && parsed !== null) return parsed as T
    } catch {}
  }

  // Try matching JSON array
  const arrayMatch = text.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0])
      if (Array.isArray(parsed)) return parsed as T
    } catch {}
  }

  return null
}

// ─── Convenience: user-friendly French error messages ──

export function getZAIErrorMessage(result: ZAIFailure): string {
  switch (result.reason) {
    case 'sdk_init':
      return 'Service IA temporairement indisponible. Veuillez réessayer dans quelques instants.'
    case 'ai_call':
      return 'Erreur lors de la génération par l\'IA. Veuillez réessayer.'
    case 'empty_response':
      return 'L\'IA n\'a pas pu générer de contenu. Veuillez reformuler votre demande.'
    default:
      return 'Une erreur inattendue est survenue. Veuillez réessayer.'
  }
}

// ─── Service unavailable response helper ────

/**
 * Returns a 503 Service Unavailable JSON response for AI failures.
 * Use this instead of Errors.internal() to avoid 500 status codes.
 */
export function aiUnavailableResponse(message?: string) {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'AI_SERVICE_UNAVAILABLE',
        message: message || 'Service IA temporairement indisponible. Veuillez réessayer dans quelques instants.',
      },
      timestamp: new Date().toISOString(),
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

/**
 * Returns a 422 error response for AI parsing/validation failures.
 */
export function aiErrorResponse(message: string, code = 'AI_GENERATION_ERROR') {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code,
        message,
      },
      timestamp: new Date().toISOString(),
    }),
    {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
