// ============================================
// CreaPulse V2 — Standardized API Response Factory
// ============================================

import { NextResponse } from 'next/server'
import type { z } from 'zod'

// ─── Types ───────────────────────────────────

export type ApiSuccess<T> = {
  success: true
  data: T
  message?: string
  timestamp: string
}

export type ApiError = {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
  timestamp: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── Standard error codes ────────────────────

export const ErrorCode = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_INACTIVE: 'USER_INACTIVE',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELDS: 'MISSING_FIELDS',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode]

// ─── Response helpers ────────────────────────

function timestamp(): string {
  return new Date().toISOString()
}

/**
 * Create a success response
 */
export function success<T>(
  data: T,
  message?: string,
  status: number = 200,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
      timestamp: timestamp(),
    },
    { status },
  )
}

/**
 * Create an error response
 */
export function error(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown,
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      timestamp: timestamp(),
    },
    { status },
  )
}

/**
 * Common error responses
 */
export const Errors = {
  unauthorized: (message = 'Authentication required') =>
    error(ErrorCode.UNAUTHORIZED, message, 401),

  invalidCredentials: (message = 'Invalid email or password') =>
    error(ErrorCode.INVALID_CREDENTIALS, message, 401),

  forbidden: (message = 'Insufficient permissions') =>
    error(ErrorCode.FORBIDDEN, message, 403),

  notFound: (resource = 'Resource') =>
    error(ErrorCode.NOT_FOUND, `${resource} not found`, 404),

  validation: (details: unknown, message = 'Validation failed') =>
    error(ErrorCode.VALIDATION_ERROR, message, 422, details),

  emailExists: () =>
    error(ErrorCode.EMAIL_EXISTS, 'An account with this email already exists', 409),

  userNotFound: () =>
    error(ErrorCode.USER_NOT_FOUND, 'User not found', 404),

  userInactive: () =>
    error(ErrorCode.USER_INACTIVE, 'Account is inactive', 403),

  internal: (message = 'An unexpected error occurred') =>
    error(ErrorCode.INTERNAL_ERROR, message, 500),

  database: (message = 'Database operation failed') =>
    error(ErrorCode.DATABASE_ERROR, message, 500),

  tooManyRequests: (message = 'Too many requests') =>
    error(ErrorCode.RATE_LIMITED, message, 429),

  badRequest: (message = 'Bad request') =>
    error(ErrorCode.INVALID_INPUT, message, 400),

  unprocessableEntity: (message = 'Unprocessable entity') =>
    error(ErrorCode.VALIDATION_ERROR, message, 422),
}

/**
 * Handle unknown errors in API routes (catch-all)
 */
export function handleApiError(err: unknown): NextResponse<ApiError> {
  // Log error without exposing sensitive details to console
  const errorMessage = err instanceof Error ? err.message : 'Unknown error'
  const errorStack = err instanceof Error ? err.stack : undefined
  console.error('[API Error]', errorMessage)
  if (errorStack) {
    // Log stack only in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Stack]', errorStack)
    }
  }

  // Zod validation error
  if (err && typeof err === 'object' && 'issues' in err) {
    const zodErr = err as z.ZodError
    return Errors.validation(
      zodErr.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    )
  }

  // Prisma known errors
  if (err && typeof err === 'object' && 'code' in err) {
    const prismaErr = err as { code: string; meta?: Record<string, unknown> }
    switch (prismaErr.code) {
      case 'P2002':
        return error(
          ErrorCode.VALIDATION_ERROR,
          'A record with this value already exists',
          409,
          process.env.NODE_ENV === 'development' ? prismaErr.meta : undefined,
        )
      case 'P2025':
        return Errors.notFound('Record')
      case 'P2003':
        return error(ErrorCode.VALIDATION_ERROR, 'Related record not found', 400,
          process.env.NODE_ENV === 'development' ? prismaErr.meta : undefined,
        )
    }
  }

  // Generic error with message (sanitize — don't expose raw error details to client)
  if (err instanceof Error) {
    // In production, don't expose internal error messages
    if (process.env.NODE_ENV === 'production') {
      return Errors.internal('An unexpected error occurred')
    }
    return Errors.internal(err.message)
  }

  return Errors.internal()
}

/**
 * Extract JWT token from Authorization header
 */
export function getTokenFromHeader(request: Request): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7)

  // Try session cookie
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(/session=([^;]+)/)
  if (match) return match[1]

  return null
}
