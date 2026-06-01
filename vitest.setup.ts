import '@testing-library/jest-dom/vitest'

// Set NEXTAUTH_SECRET before any module that reads it at import time
if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
  process.env.NEXTAUTH_SECRET = 'test-secret-key-that-is-at-least-32-characters-long!'
}
