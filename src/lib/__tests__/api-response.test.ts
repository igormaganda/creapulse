// ============================================
// Tests for src/lib/api-response.ts
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock NextResponse.json to return a plain object we can inspect
const mockJson = vi.fn()
vi.mock('next/server', () => ({
  NextResponse: {
    json: (...args: unknown[]) => {
      mockJson(...args)
      // Return a minimal Response-like object with status
      const body = args[0]
      const options = args[1] as { status?: number } | undefined
      return {
        _body: body,
        status: options?.status ?? 200,
      }
    },
  },
}))

// Import after mocks are set up
import {
  success,
  error,
  Errors,
  ErrorCode,
  handleApiError,
  getTokenFromHeader,
} from '@/lib/api-response'

describe('api-response', () => {
  beforeEach(() => {
    mockJson.mockClear()
  })

  describe('success()', () => {
    it('returns correct shape with data', () => {
      const data = { id: 1, name: 'test' }
      const result = success(data)

      expect(result.status).toBe(200)
      const body = result._body
      expect(body.success).toBe(true)
      expect(body.data).toEqual(data)
      expect(body.timestamp).toBeDefined()
      expect(typeof body.timestamp).toBe('string')
    })

    it('includes message when provided', () => {
      const result = success({}, 'Operation successful')
      expect(result._body.message).toBe('Operation successful')
    })

    it('omits message when not provided', () => {
      const result = success({})
      expect(result._body.message).toBeUndefined()
    })

    it('accepts custom status code', () => {
      const result = success({ created: true }, 'Created', 201)
      expect(result.status).toBe(201)
    })

    it('timestamp is a valid ISO string', () => {
      const result = success({})
      expect(new Date(result._body.timestamp).toISOString()).toBe(result._body.timestamp)
    })
  })

  describe('error()', () => {
    it('returns correct error shape', () => {
      const result = error('VALIDATION_ERROR', 'Invalid input', 400)

      expect(result.status).toBe(400)
      const body = result._body
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(body.error.message).toBe('Invalid input')
      expect(body.timestamp).toBeDefined()
    })

    it('includes details when provided', () => {
      const details = { field: 'email', reason: 'invalid format' }
      const result = error('VALIDATION_ERROR', 'Validation failed', 422, details)

      expect(result._body.error.details).toEqual(details)
    })

    it('omits details when not provided', () => {
      const result = error('INTERNAL_ERROR', 'Server error', 500)
      expect(result._body.error.details).toBeUndefined()
    })
  })

  describe('Errors helpers', () => {
    it('Errors.unauthorized() returns 401 with UNAUTHORIZED code', () => {
      const result = Errors.unauthorized()
      expect(result.status).toBe(401)
      expect(result._body.success).toBe(false)
      expect(result._body.error.code).toBe(ErrorCode.UNAUTHORIZED)
      expect(result._body.error.message).toBe('Authentication required')
    })

    it('Errors.unauthorized() accepts custom message', () => {
      const result = Errors.unauthorized('Token missing')
      expect(result._body.error.message).toBe('Token missing')
    })

    it('Errors.validation() returns 422 with VALIDATION_ERROR code', () => {
      const details = [{ field: 'email', message: 'Required' }]
      const result = Errors.validation(details)
      expect(result.status).toBe(422)
      expect(result._body.error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(result._body.error.details).toEqual(details)
    })

    it('Errors.notFound() returns 404 with NOT_FOUND code', () => {
      const result = Errors.notFound('User')
      expect(result.status).toBe(404)
      expect(result._body.error.code).toBe(ErrorCode.NOT_FOUND)
      expect(result._body.error.message).toBe('User not found')
    })

    it('Errors.invalidCredentials() returns 401', () => {
      const result = Errors.invalidCredentials()
      expect(result.status).toBe(401)
      expect(result._body.error.code).toBe(ErrorCode.INVALID_CREDENTIALS)
    })

    it('Errors.forbidden() returns 403', () => {
      const result = Errors.forbidden()
      expect(result.status).toBe(403)
      expect(result._body.error.code).toBe(ErrorCode.FORBIDDEN)
    })

    it('Errors.emailExists() returns 409', () => {
      const result = Errors.emailExists()
      expect(result.status).toBe(409)
      expect(result._body.error.code).toBe(ErrorCode.EMAIL_EXISTS)
    })

    it('Errors.userNotFound() returns 404', () => {
      const result = Errors.userNotFound()
      expect(result.status).toBe(404)
      expect(result._body.error.code).toBe(ErrorCode.USER_NOT_FOUND)
    })

    it('Errors.internal() returns 500', () => {
      const result = Errors.internal()
      expect(result.status).toBe(500)
      expect(result._body.error.code).toBe(ErrorCode.INTERNAL_ERROR)
    })
  })

  describe('handleApiError()', () => {
    it('handles generic Error in non-production', () => {
      const origEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const err = new Error('Something went wrong')
      const result = handleApiError(err)
      expect(result.status).toBe(500)
      expect(result._body.error.code).toBe('INTERNAL_ERROR')
      expect(result._body.error.message).toBe('Something went wrong')

      process.env.NODE_ENV = origEnv
    })

    it('handles generic Error in production (sanitized)', () => {
      const origEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const err = new Error('Secret details')
      const result = handleApiError(err)
      expect(result.status).toBe(500)
      expect(result._body.error.message).toBe('An unexpected error occurred')

      process.env.NODE_ENV = origEnv
    })

    it('handles Zod validation errors', () => {
      const zodErr = {
        issues: [
          { path: ['email'], message: 'Invalid email' },
          { path: ['name'], message: 'Required' },
        ],
      }
      const result = handleApiError(zodErr)
      expect(result.status).toBe(422)
      expect(result._body.error.code).toBe('VALIDATION_ERROR')
      expect(result._body.error.details).toEqual([
        { field: 'email', message: 'Invalid email' },
        { field: 'name', message: 'Required' },
      ])
    })

    it('handles Prisma P2002 unique constraint error', () => {
      const prismaErr = { code: 'P2002', meta: { target: 'email' } }
      const result = handleApiError(prismaErr)
      expect(result.status).toBe(409)
      expect(result._body.error.code).toBe('VALIDATION_ERROR')
    })

    it('handles Prisma P2025 not found error', () => {
      const prismaErr = { code: 'P2025' }
      const result = handleApiError(prismaErr)
      expect(result.status).toBe(404)
      expect(result._body.error.code).toBe('NOT_FOUND')
    })

    it('handles non-Error unknown values', () => {
      const result = handleApiError('string error')
      expect(result.status).toBe(500)
      expect(result._body.error.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('getTokenFromHeader()', () => {
    it('extracts Bearer token from Authorization header', () => {
      const request = new Request('http://localhost', {
        headers: { Authorization: 'Bearer abc123token' },
      })
      expect(getTokenFromHeader(request)).toBe('abc123token')
    })

    it('returns null when no Authorization header', () => {
      const request = new Request('http://localhost')
      expect(getTokenFromHeader(request)).toBeNull()
    })

    it('returns null when Authorization header is not Bearer', () => {
      const request = new Request('http://localhost', {
        headers: { Authorization: 'Basic abc123' },
      })
      expect(getTokenFromHeader(request)).toBeNull()
    })

    it('extracts session from cookie', () => {
      const request = new Request('http://localhost', {
        headers: { Cookie: 'session=mytoken123; other=value' },
      })
      expect(getTokenFromHeader(request)).toBe('mytoken123')
    })

    it('prefers Bearer token over cookie', () => {
      const request = new Request('http://localhost', {
        headers: {
          Authorization: 'Bearer bearer-token',
          Cookie: 'session=cookie-token',
        },
      })
      expect(getTokenFromHeader(request)).toBe('bearer-token')
    })
  })
})
