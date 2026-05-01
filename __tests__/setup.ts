import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { TextEncoder, TextDecoder } from 'util'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local for real service credentials
config({ path: resolve(process.cwd(), '.env.local') })

// Polyfill TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder

// Mock server-only module (used for compile-time checks, not runtime)
vi.mock('server-only', () => ({}))

// Set test environment - only set fallbacks if not already defined
// @ts-expect-error NODE_ENV is read-only in types but writable at runtime
process.env.NODE_ENV = 'test'

// Mock next/headers for server component tests
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}))
