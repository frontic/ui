import { fileURLToPath } from 'node:url'

/** The `@frontic/source` library code typechecks against. */
export const SOURCE_SHIM = fileURLToPath(new URL('./source-shim.d.ts', import.meta.url))

/** `@assets/*` imports, typed as the URL the build gives them. */
export const ASSETS_SHIM = fileURLToPath(new URL('./assets-shim.d.ts', import.meta.url))
