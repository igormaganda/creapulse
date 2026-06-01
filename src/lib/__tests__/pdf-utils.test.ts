// ============================================
// Tests for src/lib/pdf-utils.ts (pure utility functions)
// ============================================

import { describe, it, expect, vi } from 'vitest'

// We only test the pure utility functions that don't need PDFKit.
// Import the format/spacing helpers directly.

// Mock fs and pdfkit before import to prevent side effects
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  default: {
    readFileSync: vi.fn(),
  },
}))

vi.mock('pdfkit', () => ({
  default: vi.fn(),
}))

// Mock import.meta.url for the fs patch
vi.mock('path', async (importOriginal) => {
  const actual = await importOriginal<typeof import('path')>()
  return {
    ...actual,
    dirname: actual.dirname,
  }
})

import {
  formatCurrency,
  formatPercent,
  formatDate,
  scoreBar,
  addSpacing,
  checkNewPage,
  COLORS,
} from '@/lib/pdf-utils'

describe('pdf-utils', () => {
  describe('formatCurrency()', () => {
    it('returns "—" for null', () => {
      expect(formatCurrency(null)).toBe('—')
    })

    it('returns "—" for undefined', () => {
      expect(formatCurrency(undefined)).toBe('—')
    })

    it('formats 0 as "0 €"', () => {
      expect(formatCurrency(0)).toContain('0')
    })

    it('formats positive numbers with EUR currency', () => {
      const result = formatCurrency(1500)
      expect(result).toContain('1')
      expect(result).toContain('500')
      // French locale formats
      expect(result).toMatch(/€|euros/i)
    })

    it('formats large numbers', () => {
      const result = formatCurrency(1000000)
      expect(result).toContain('1')
      expect(result).toContain('000')
    })

    it('formats negative numbers', () => {
      const result = formatCurrency(-500)
      expect(result).toContain('500')
    })

    it('formats decimals (rounded to whole euros)', () => {
      const result = formatCurrency(1234.56)
      // Should not contain decimal points since maxFractionDigits=0
      expect(result).not.toContain('.')
      expect(result).toContain('1')
    })
  })

  describe('formatPercent()', () => {
    it('returns "—" for null', () => {
      expect(formatPercent(null)).toBe('—')
    })

    it('returns "—" for undefined', () => {
      expect(formatPercent(undefined)).toBe('—')
    })

    it('formats 0 as "0.0 %"', () => {
      expect(formatPercent(0)).toBe('0.0 %')
    })

    it('formats 50 as "50.0 %"', () => {
      expect(formatPercent(50)).toBe('50.0 %')
    })

    it('formats 100 as "100.0 %"', () => {
      expect(formatPercent(100)).toBe('100.0 %')
    })

    it('formats decimal values with 1 decimal place', () => {
      expect(formatPercent(33.333)).toBe('33.3 %')
    })

    it('formats negative values', () => {
      expect(formatPercent(-10.5)).toBe('-10.5 %')
    })
  })

  describe('formatDate()', () => {
    it('returns "—" for null', () => {
      expect(formatDate(null)).toBe('—')
    })

    it('returns "—" for undefined', () => {
      expect(formatDate(undefined)).toBe('—')
    })

    it('returns "—" for empty string', () => {
      expect(formatDate('')).toBe('—')
    })

    it('formats a Date object', () => {
      const date = new Date(2024, 5, 15) // June 15, 2024
      const result = formatDate(date)
      expect(result).toContain('15')
      expect(result).toContain('06')
      expect(result).toContain('2024')
    })

    it('formats an ISO string', () => {
      const result = formatDate('2024-12-25T10:30:00.000Z')
      // French format: 25/12/2024
      expect(result).toContain('25')
      expect(result).toContain('12')
      expect(result).toContain('2024')
    })

    it('formats a date-only string', () => {
      const result = formatDate('2024-01-05')
      expect(result).toContain('05')
      expect(result).toContain('01')
      expect(result).toContain('2024')
    })
  })

  describe('scoreBar()', () => {
    it('returns full bar for max score', () => {
      const bar = scoreBar(10, 10, 10)
      expect(bar).toBe('[██████████] 10.0/10')
    })

    it('returns empty bar for zero score', () => {
      const bar = scoreBar(0, 10, 10)
      expect(bar).toBe('[░░░░░░░░░░] 0.0/10')
    })

    it('returns half-filled bar for half score', () => {
      const bar = scoreBar(5, 10, 10)
      const filled = (bar.match(/█/g) || []).length
      const empty = (bar.match(/░/g) || []).length
      expect(filled).toBe(5)
      expect(empty).toBe(5)
    })

    it('clamps scores above max', () => {
      const bar = scoreBar(15, 10, 10)
      expect(bar).toBe('[██████████] 15.0/10')
    })

    it('clamps negative scores', () => {
      const bar = scoreBar(-5, 10, 10)
      expect(bar).toBe('[░░░░░░░░░░] -5.0/10')
    })

    it('uses custom barWidth', () => {
      const bar = scoreBar(5, 10, 20)
      const filled = (bar.match(/█/g) || []).length
      const empty = (bar.match(/░/g) || []).length
      expect(filled).toBe(10)
      expect(empty).toBe(10)
    })

    it('contains score text after bar', () => {
      const bar = scoreBar(7.5, 10)
      expect(bar).toContain('7.5/10')
    })
  })

  describe('COLORS constant', () => {
    it('contains expected color keys', () => {
      expect(COLORS.primary).toBe('#00838F')
      expect(COLORS.dark).toBe('#1a1a1a')
      expect(COLORS.white).toBe('#FFFFFF')
      expect(COLORS.success).toBe('#2E7D32')
      expect(COLORS.warning).toBe('#F57F17')
      expect(COLORS.danger).toBe('#C62828')
    })
  })

  describe('addSpacing()', () => {
    it('is a function', () => {
      expect(typeof addSpacing).toBe('function')
    })
  })

  describe('checkNewPage()', () => {
    it('is a function', () => {
      expect(typeof checkNewPage).toBe('function')
    })
  })
})
