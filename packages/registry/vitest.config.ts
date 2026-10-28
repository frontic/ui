import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@registry/icon-placeholder': here('./icon-placeholder/index.ts'),
      '@library/components/': here('./'),
      '@library/lib/': here('./lib/'),
      '@library/composables/': here('./composables/'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/{unit,integration,private}/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['scripts/**/*.ts'],
    },
  },
})
