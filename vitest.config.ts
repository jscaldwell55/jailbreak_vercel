import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    // Use node environment for server-side tests
    environmentMatchGlobs: [
      ['__tests__/unit/lib/**', 'node'],
      ['__tests__/integration/**', 'node'],
      ['tests/integration/**', 'node'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'lib/**/*.ts',
        'hooks/**/*.ts',
        'components/**/*.tsx',
        'app/api/**/*.ts',
        'middleware.ts'
      ],
      exclude: [
        'node_modules',
        '__tests__'
      ]
    },
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'server-only': path.resolve(__dirname, './__tests__/mocks/server-only.ts'),
    },
  },
})
