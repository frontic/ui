import { ICON_LIBRARY_NAMES } from '@frontic/registry-client'
import { z } from 'zod'
import { checkSchema } from '@/src/check-schema'
import { DEFAULT_LIBRARY, STYLE } from '@/src/constants'

export { CHECK_RULES, DEFAULT_CHECK, type CheckRule, type Severity } from '@/src/check-schema'

// Unknown keys are stripped, so a components.json an older CLI wrote still parses.
export const rawConfigSchema = z.object({
  $schema: z.string().optional().meta({ description: 'The JSON Schema an editor checks this file against.' }),
  style: z.literal(STYLE, { error: `components.json: style must be "${STYLE}"` }).meta({ description: `The registry style the items are built in. Frontic UI has one: ${STYLE}.` }),
  typescript: z.boolean().default(true).meta({ description: 'Install items as TypeScript. Off, `add` strips the types and writes .js files.' }),
  tailwind: z.object({ css: z.string().meta({ description: 'The global stylesheet that imports Tailwind. `init` adds the frontic.css import to it, and `build` writes frontic.css beside it.' }) }).meta({ description: 'Where Tailwind comes into the project.' }),
  iconLibrary: z.enum(ICON_LIBRARY_NAMES).default('lucide').meta({ description: 'The icon set `add` rewrites the items’ icons to.' }),
  aliases: z.object({
    components: z.string().meta({ description: 'Where `add` installs sections and templates, and ui items unless `aliases.ui` is set.' }),
    ui: z.string().optional().meta({ description: 'Where `add` installs ui items; the `ui` folder under `aliases.components` when not set.' }),
    lib: z.string().optional().meta({ description: 'Where `add` installs lib items, the shared code items import; `@/lib` when not set.' }),
    composables: z.string().optional().meta({ description: 'Where `add` installs composable items; `@/composables` when not set.' }),
  }).meta({ description: 'Import paths, resolved through tsconfig, that decide where `add` writes items.' }),
  library: z.string().default(DEFAULT_LIBRARY).meta({ description: 'The folder that holds brand.json, DESIGN.md and recipes/, the shared recipes; each component\'s own recipes sit in its manifest beside its files.' }),
  check: checkSchema.meta({ description: 'What `npx @frontic/ui check` holds the project to.' }),
})

export const configSchema = rawConfigSchema.extend({
  resolvedPaths: z.object({
    cwd: z.string(),
    tailwindCss: z.string(),
    fronticCss: z.string(),
    library: z.string(),
    brand: z.string(),
    design: z.string(),
    recipes: z.string(),
    components: z.string(),
    ui: z.string(),
    lib: z.string(),
    composables: z.string(),
  }),
})

export type RawConfig = z.infer<typeof rawConfigSchema>
export type Config = z.infer<typeof configSchema>
