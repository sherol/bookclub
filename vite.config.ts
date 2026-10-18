import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'

// For browser tests only: swap Google sign-in for a stand-in module.
function swapAuth(file: string | undefined): Plugin | null {
  if (!file) return null
  return {
    name: 'swap-auth',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      return resolved?.id.endsWith('/src/google/auth.ts') ? file : null
    },
  }
}

// GitHub Pages serves the site from /<repo-name>/.
export default defineConfig({
  base: '/bookclub/',
  plugins: [react(), swapAuth(process.env.BOOKCLUB_TEST_AUTH)],
  test: { environment: 'jsdom', globals: true },
})
