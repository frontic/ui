import { defineConfig } from 'vitest/config'

// vue-tsc and the Tailwind design system take seconds per run.
export default defineConfig({ test: { testTimeout: 120_000 } })
