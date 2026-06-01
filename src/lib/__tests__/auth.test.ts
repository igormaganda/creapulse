// @vitest-environment node
// ============================================
// Tests for src/lib/auth.ts
// ============================================

import { describe, it, expect, vi } from 'vitest'

// Mock @prisma/client — only need the UserRole type
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}))

import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  verifyToken,
  checkRole,
  hasMinRole,
  createSessionCookie,
  createClearSessionCookie,
  AuthError,
} from '@/lib/auth'




describe('auth', () => {
  describe('hashPassword()', () => {
    it('returns a bcrypt hash that differs from the plaintext', async () => {
      const hash = await hashPassword('mypassword123')
      expect(hash).not.toBe('mypassword123')
      expect(hash).toBeTruthy()
    })

    it('produces different hashes for the same password (salt)', async () => {
      const hash1 = await hashPassword('samepassword')
      const hash2 = await hashPassword('samepassword')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword()', () => {
    it('returns true for correct password', async () => {
      const hash = await hashPassword('correct-password')
      expect(await verifyPassword('correct-password', hash)).toBe(true)
    })

    it('returns false for incorrect password', async () => {
      const hash = await hashPassword('correct-password')
      expect(await verifyPassword('wrong-password', hash)).toBe(false)
    })

    it('returns false for empty password', async () => {
      const hash = await hashPassword('correct-password')
      expect(await verifyPassword('', hash)).toBe(false)
    })
  })

  describe('createAccessToken() + verifyToken()', () => {
    it('creates a token and verifies it successfully', async () => {
      const payload = {
        userId: 'user-001',
        tenantId: 'tenant-001',
        email: 'test@example.com',
        role: 'BENEFICIARY' as UserRole,
      }
      const token = await createAccessToken(payload)
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')

      const decoded = await verifyToken(token)
      expect(decoded.userId).toBe('user-001')
      expect(decoded.tenantId).toBe('tenant-001')
      expect(decoded.email).toBe('test@example.com')
      expect(decoded.role).toBe('BENEFICIARY')
      expect(decoded.iat).toBeDefined()
      expect(decoded.exp).toBeDefined()
    })

    it('throws AuthError for invalid token', async () => {
      await expect(verifyToken('invalid-token-string')).rejects.toThrow(AuthError)
    })

    it('throws AuthError for tampered token', async () => {
      const payload = {
        userId: 'user-001',
        tenantId: 'tenant-001',
        email: 'test@example.com',
        role: 'BENEFICIARY' as UserRole,
      }
      const token = await createAccessToken(payload)
      // Tamper with the token
      const tampered = token.slice(0, -5) + 'XXXXX'
      await expect(verifyToken(tampered)).rejects.toThrow(AuthError)
    })

    it('preserves different roles', async () => {
      for (const role of ['ADMIN', 'COUNSELOR', 'BENEFICIARY'] as UserRole[]) {
        const payload = {
          userId: 'user-001',
          tenantId: 'tenant-001',
          email: 'test@example.com',
          role,
        }
        const token = await createAccessToken(payload)
        const decoded = await verifyToken(token)
        expect(decoded.role).toBe(role)
      }
    })
  })

  describe('checkRole()', () => {
    it('returns authorized:true when role is allowed', () => {
      const result = checkRole('BENEFICIARY' as UserRole, ['BENEFICIARY', 'COUNSELOR'] as UserRole[])
      expect(result.authorized).toBe(true)
    })

    it('returns authorized:false with reason when role is not allowed', () => {
      const result = checkRole('BENEFICIARY' as UserRole, ['ADMIN', 'COUNSELOR'] as UserRole[])
      expect(result.authorized).toBe(false)
      expect(result.reason).toContain('BENEFICIARY')
    })
  })

  describe('hasMinRole()', () => {
    it('ADMIN has min role of ADMIN', () => {
      expect(hasMinRole('ADMIN' as UserRole, 'ADMIN' as UserRole)).toBe(true)
    })

    it('ADMIN has min role of COUNSELOR', () => {
      expect(hasMinRole('ADMIN' as UserRole, 'COUNSELOR' as UserRole)).toBe(true)
    })

    it('COUNSELOR has min role of COUNSELOR', () => {
      expect(hasMinRole('COUNSELOR' as UserRole, 'COUNSELOR' as UserRole)).toBe(true)
    })

    it('COUNSELOR does NOT have min role of ADMIN', () => {
      expect(hasMinRole('COUNSELOR' as UserRole, 'ADMIN' as UserRole)).toBe(false)
    })

    it('BENEFICIARY does NOT have min role of COUNSELOR', () => {
      expect(hasMinRole('BENEFICIARY' as UserRole, 'COUNSELOR' as UserRole)).toBe(false)
    })

    it('BENEFICIARY has min role of BENEFICIARY', () => {
      expect(hasMinRole('BENEFICIARY' as UserRole, 'BENEFICIARY' as UserRole)).toBe(true)
    })
  })

  describe('createSessionCookie()', () => {
    it('returns a cookie string with session token', () => {
      const cookie = createSessionCookie('my-token-123')
      expect(cookie).toContain('session=my-token-123')
      expect(cookie).toContain('HttpOnly')
      expect(cookie).toContain('Secure')
      expect(cookie).toContain('SameSite=Lax')
    })
  })

  describe('createClearSessionCookie()', () => {
    it('returns a cookie string that clears session', () => {
      const cookie = createClearSessionCookie()
      expect(cookie).toContain('session=')
      expect(cookie).toContain('Max-Age=0')
    })
  })

  describe('AuthError', () => {
    it('is an instance of Error', () => {
      const err = new AuthError('test')
      expect(err).toBeInstanceOf(Error)
    })

    it('has code and statusCode properties', () => {
      const err = new AuthError('test', 'TOKEN_EXPIRED', 401)
      expect(err.message).toBe('test')
      expect(err.code).toBe('TOKEN_EXPIRED')
      expect(err.statusCode).toBe(401)
      expect(err.name).toBe('AuthError')
    })

    it('has default code UNAUTHORIZED and statusCode 401', () => {
      const err = new AuthError('auth required')
      expect(err.code).toBe('UNAUTHORIZED')
      expect(err.statusCode).toBe(401)
    })
  })
})
