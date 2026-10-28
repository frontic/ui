import { describe, expect, it } from 'vitest'
import { addCommand, buildPrompt, exampleItems, exampleNpmPackages, exampleSlug, examplesOf, itemMarkdown, reExportsOnly, TIERS, tierOf, type ItemApi, type RegistryItem } from '../src'
import { exampleUsage } from '../src/api'

const example = `<script setup lang="ts">
import { Badge } from '.'
import { Field } from '@library/components/ui/field'
import { CartSummary } from '@library/components/sections/cart-summary'
import { cn } from '@library/lib/utils'
import { useCart } from '@library/composables/use-cart'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Badge variant="new" v-bind="$attrs">New</Badge>
</template>
`
const api: ItemApi = {
  install: 'npx @frontic/ui add badge',
  parts: [
    {
      name: 'Badge',
      description: 'Labels a product with a short status.',
      element: 'span',
      file: 'Badge.vue',
      slot: 'badge',
      props: [
        { name: 'variant', type: "'primary' | 'new'", required: false, default: "'primary'", description: 'How the badge | looks' },
        { name: 'tone', type: 'Tone', required: false, description: 'The colour.\n\nOne of:\n- `soft`\n- `bold`' },
      ],
      events: [{ name: 'dismiss', type: '[reason: string]', description: 'Fires when the badge is dismissed.' }],
      slots: [{ name: 'default' }, { name: 'icon', type: '{ size: number; }', description: 'Replaces the icon.' }],
      dataAttributes: [
        { name: 'data-disabled', description: 'Present while disabled.' },
        { name: 'data-state', values: ['open', 'closed'], description: 'The state.' },
      ],
      cssVariables: [{ name: '--badge-width', description: 'The width.' }],
      styling: [{ recipe: 'badge-label', families: ['link-foreground'] }],
    },
  ],
}
const badge: RegistryItem & { api: ItemApi } = {
  name: 'badge',
  type: 'registry:ui',
  title: 'Badge',
  description: 'A small label',
  files: [
    { path: 'components/ui/badge/Badge.vue', type: 'registry:ui', content: '<template><span data-slot="badge" /></template>' },
    { path: 'components/ui/badge/badge.example.vue', type: 'registry:example', content: example },
    { path: 'components/ui/badge/index.ts', type: 'registry:ui', content: "export { default as Badge } from './Badge.vue'\n" },
  ],
  recipes: { badge: { base: {} } },
  api,
}

describe('an item as markdown', () => {
  const md = itemMarkdown(badge)

  it('opens with front matter for tools, then the title, the description and the install command', () => {
    expect(
      md.startsWith(
        '---\nname: badge\ntitle: Badge\nurl: https://ui.frontic.com/components/ui/badge.md\ntier: ui\ninstall: npx @frontic/ui add badge\nfiles:\n  - components/ui/badge/Badge.vue\n  - components/ui/badge/index.ts\n---\n\n# Badge\n\nA small label\n\n## Install\n\n```sh\nnpx @frontic/ui add badge\n```',
      ),
    ).toBe(true)
  })

  it('quotes a front matter value YAML would not read plain, such as a scoped package', () => {
    expect(itemMarkdown({ ...badge, dependencies: ['@internationalized/date', 'reka-ui'] })).toContain('dependencies:\n  - "@internationalized/date"\n  - reka-ui\n')
  })

  it('links every other file at the origin it is given', () => {
    const local = itemMarkdown(badge, { origin: 'http://localhost:4700' })
    expect(local).toContain('url: http://localhost:4700/components/ui/badge.md')
    expect(local).toContain('(http://localhost:4700/components/ui/badge/badge.json#badge)')
    expect(local).not.toContain('https://ui.frontic.com')
  })

  it('shows the main example as a project writes it: imported from where the CLI installs it, without the frame plumbing', () => {
    const usage = md.slice(md.indexOf('## Examples'), md.indexOf('## API reference'))
    expect(usage).toContain("import { Badge } from '@/components/ui/badge'")
    expect(usage).toContain("import { Field } from '@/components/ui/field'")
    expect(usage).toContain("import { CartSummary } from '@/components/sections/cart-summary'")
    expect(usage).toContain("import { cn } from '@/lib/utils'")
    expect(usage).toContain("import { useCart } from '@/composables/use-cart'")
    expect(usage).not.toContain('@library/')
    expect(usage).toContain('<Badge variant="new">New</Badge>')
    expect(usage).not.toMatch(/inheritAttrs|\$attrs/)
  })

  it('puts the main example first, picked by its path, and names further examples by slug', () => {
    const sale = { path: 'components/ui/badge/badge.sale.example.vue', type: 'registry:example' as const, content: '<template><Badge>Sale</Badge></template>' }
    const item = { ...badge, files: [sale, ...badge.files] }
    expect(examplesOf(item).map((f) => f.path)).toEqual(['components/ui/badge/badge.example.vue', 'components/ui/badge/badge.sale.example.vue'])
    const text = itemMarkdown(item)
    const section = text.slice(text.indexOf('## Examples'), text.indexOf('## API reference'))
    expect(section).toContain('<Badge variant="new">New</Badge>')
    expect(section).not.toContain('Sale</Badge>')
    expect(section).toContain('More examples: `sale` (`components/ui/badge/badge.sale.example.vue`).')
    expect(exampleSlug(item, sale.path)).toBe('sale')
    expect(exampleSlug(item, 'components/ui/badge/badge.example.vue')).toBe('main')
  })

  it('tables each part, escaping pipes', () => {
    expect(md).toContain("| `variant` | `'primary' \\| 'new'` | `'primary'` | How the badge \\| looks |")
    expect(md).toContain('`data-slot="badge"` · `Badge.vue`')
  })

  it('keeps paragraphs and list items apart inside a table cell', () => {
    expect(md).toContain('| `tone` | `Tone` |  | The colour.<br><br>One of:<br>- `soft`<br>- `bold` |')
  })

  it('tables events with payload and description, and slots with slot props and description, a plain default slot left out', () => {
    expect(md).toContain('| Event | Payload | Description |\n| --- | --- | --- |\n| `dismiss` | `reason: string` | Fires when the badge is dismissed. |')
    expect(md).toContain('| Slot | Slot props | Description |\n| --- | --- | --- |\n| `icon` | `{ size: number; }` | Replaces the icon. |')
    expect(md).not.toContain('| `default` |  |')
  })

  it('tables the data attributes with their values', () => {
    expect(md).toContain("| Data attribute | Values | Description |\n| --- | --- | --- |\n| `data-disabled` |  | Present while disabled. |\n| `data-state` | `'open' \\| 'closed'` | The state. |")
  })

  it('tables the CSS variables', () => {
    expect(md).toContain('| CSS variable | Description |\n| --- | --- |\n| `--badge-width` | The width. |')
  })

  it('opens each part with its purpose and the element it renders', () => {
    expect(md).toContain('### Badge\n\nLabels a product with a short status. Renders a `<span>`.')
  })

  it('says per part which shared recipes its recipe extends, linked to their recipe files, and what changing them does', () => {
    expect(md).toContain('Styling: `badge-label`, which extends [`link-foreground`](https://ui.frontic.com/recipes/link-foreground.json). Change it there and every part that extends it follows.')
    expect(md).not.toContain('Family:')
  })

  it('links each recipe in the styling table and names the states it styles', () => {
    const styled = itemMarkdown({ ...badge, api: { ...api, states: ['hover', 'focus', 'disabled'] } })
    expect(styled).toContain('| `default` | [`badge`](https://ui.frontic.com/components/ui/badge/badge.json#badge) |')
    expect(styled).toContain('States with a look of their own: hover, focus and disabled.')
  })

  it('opens the styling with the recipe file a project edits and the URL it is served at', () => {
    const named = itemMarkdown({ ...badge, recipes: { badge: { base: {} } } })
    expect(named).toContain(
      "## Styling\n\nRecipes: in the component's manifest, `components/ui/badge/badge.json`, beside its files (served at https://ui.frontic.com/components/ui/badge/badge.json).\n",
    )
    expect(itemMarkdown({ ...badge, recipes: {}, composes: ['focus-ring'] })).not.toContain('Recipes: in')
  })

  it('names the shared recipes the item extends, each with the other items that use it, and what each part composes', () => {
    const others = (names: string[]) => names.map((name) => ({ name, title: name, path: `components/ui/${name}` }))
    const shared = itemMarkdown({
      ...badge,
      recipes: { badge: { composes: ['focus-ring'], base: {} } },
      api: {
        ...api,
        sharedRecipes: [
          { recipe: 'panel', composed: false, alsoIn: [] },
          { recipe: 'surface-inset', composed: false, alsoIn: others(['dialog', 'alert-dialog']) },
          { recipe: 'focus-ring', composed: true, alsoIn: others(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8']) },
        ],
      },
    })
    expect(shared).toContain(
      'Extends: [`panel`](https://ui.frontic.com/recipes/panel.json) (no other item), [`surface-inset`](https://ui.frontic.com/recipes/surface-inset.json) (also `dialog` and `alert-dialog`).\n',
    )
    expect(shared).toContain('`Badge` composes [`focus-ring`](https://ui.frontic.com/recipes/focus-ring.json).\n')
    expect(shared).not.toContain('Composes:')
    expect(shared).not.toContain('| `focus-ring` |')
  })

  it('links an item’s own trees in its manifest at /components/<tier>/<item>/<item>.json#<recipe>, and each recipe a part composes at /recipes/<name>.json under that part', () => {
    const named = itemMarkdown({ ...badge, recipes: { badge: { base: {} }, 'badge-label': { composes: ['focus-ring'], base: {} } } })
    expect(named).toContain('| `label` | [`badge-label`](https://ui.frontic.com/components/ui/badge/badge.json#badge-label) |')
    expect(named).toContain('`BadgeLabel` composes [`focus-ring`](https://ui.frontic.com/recipes/focus-ring.json).\n')
    expect(named).not.toContain('| `focus-ring` |')
    expect(named).not.toContain('DESIGN.md#')
  })

  it('shows an alias type with its members, but not the class prop’s, which every part shares', () => {
    const typed = itemMarkdown({
      ...badge,
      api: {
        ...api,
        parts: [
          {
            ...api.parts[0]!,
            props: [
              { name: 'size', type: 'BadgeSize', fullType: "'sm' | 'md'", required: false },
              { name: 'class', type: 'ClassValue', fullType: 'string | null', required: false },
            ],
          },
        ],
      },
    })
    expect(typed).toContain("| `size` | `BadgeSize`: `'sm' \\| 'md'` |")
    expect(typed).toContain('| `class` | `ClassValue` |')
  })

  it('links what it is built from and what uses it, and nests its parts under Anatomy before the API', () => {
    const linked = itemMarkdown({
      ...badge,
      api: {
        ...api,
        anatomy: '<Badge>\n  <BadgeIcon />\n</Badge>',
        builtFrom: [{ name: 'format', title: 'Format', path: 'lib/format' }],
        usedBy: [{ name: 'cart-summary', title: 'Cart Summary', path: 'components/sections/cart-summary' }],
      },
    })
    expect(linked).toContain('Built from: [Format](https://ui.frontic.com/lib/format.md)')
    expect(linked).toContain('Used by: [Cart Summary](https://ui.frontic.com/components/sections/cart-summary.md)')
    expect(linked.indexOf('## Anatomy\n\n```vue\n<Badge>\n  <BadgeIcon />\n</Badge>\n```')).toBeLessThan(linked.indexOf('## API reference'))
  })

  it('lists its other exports under the import a project writes, grouped by where they come from', () => {
    const exported = itemMarkdown({
      ...badge,
      api: {
        ...api,
        exports: [
          { name: 'formatPrice', type: false, from: { name: 'format', title: 'Format', path: 'lib/format' } },
          { name: 'PriceType', type: true, from: { name: 'format', title: 'Format', path: 'lib/format' } },
          { name: 'BadgeSize', type: true, definition: "type BadgeSize = 'sm' | 'md'" },
          { name: 'BadgeOptions', type: true, definition: 'interface BadgeOptions {\n  size: BadgeSize\n}' },
          { name: 'toast', type: false, package: 'vue-sonner' },
        ],
      },
    })
    const section = exported.slice(exported.indexOf('## Exports'), exported.indexOf('## Styling'))
    expect(section).toContain("import { formatPrice, type PriceType, type BadgeSize, type BadgeOptions, toast } from '@/components/ui/badge'")
    expect(section).toContain('- `formatPrice`, `PriceType`: from [Format](https://ui.frontic.com/lib/format.md)\n')
    expect(section).toContain("- `BadgeSize`: `'sm' \\| 'md'`\n- `BadgeOptions`: below\n- `toast`: from `vue-sonner`")
    expect(section).toContain('```ts\ninterface BadgeOptions {\n  size: BadgeSize\n}\n```')
    expect(exported).not.toContain('## Types')
  })

  it('ends with the API of the items its example uses, without their source', () => {
    const field: RegistryItem & { api: ItemApi } = {
      ...badge,
      name: 'field',
      title: 'Field',
      files: [{ path: 'components/ui/field/Field.vue', type: 'registry:ui', content: '<template />' }],
      api: { install: 'npx @frontic/ui add field', parts: [{ ...api.parts[0]!, name: 'Field', file: 'Field.vue' }] },
    }
    const withDeps = itemMarkdown(badge, { deps: [field] })
    const tail = withDeps.slice(withDeps.indexOf('## API of the items the example uses'))
    expect(withDeps.indexOf('## Source')).toBeLessThan(withDeps.indexOf('## API of the items the example uses'))
    expect(tail).toContain('### Field\n\n[Full docs](https://ui.frontic.com/components/ui/field.md) · `npx @frontic/ui add field`\n\n#### Field\n')
    expect(tail).not.toContain('Field.vue`\n\n```vue')
  })

  it('names the items its example uses that add leaves out, with the command that adds them', () => {
    expect(itemMarkdown({ ...badge, registryDependencies: ['field'] })).toContain('The example also uses `cart-summary`, which `add badge` leaves out: `npx @frontic/ui add cart-summary`.')
    expect(itemMarkdown({ ...badge, registryDependencies: ['field', 'cart-summary'] })).not.toContain('The example also uses')
  })

  it('names the npm packages its example imports that add leaves out, with the command that installs them', () => {
    const imports =
      "import { z } from 'zod/v4'\nimport { useDebounceFn } from '@vueuse/core'\nimport { HeartIcon } from '@lucide/vue'\nimport { ref } from 'vue'\nimport { IconPlaceholder } from '@registry/icon-placeholder'\n"
    const form = {
      ...badge,
      dependencies: ['@vueuse/core@14.0.0-beta.1'],
      files: badge.files.map((f) => (f.type === 'registry:example' ? { ...f, content: example.replace('<script setup lang="ts">\n', `<script setup lang="ts">\n${imports}`) } : f)),
    }
    expect(exampleNpmPackages(form)).toEqual(['zod'])
    expect(itemMarkdown(form)).toContain('The example also imports the npm package `zod`, which `add badge` leaves out: `npm install zod`.')
    expect(itemMarkdown({ ...form, dependencies: ['@vueuse/core', 'zod'] })).not.toContain('The example also imports')
    expect(itemMarkdown(badge)).not.toContain('The example also imports')
  })

  it('names the items an example imports besides the item itself', () => {
    expect(exampleItems(badge)).toEqual(['field', 'cart-summary'])
  })

  it('ends with the source of every file the CLI installs, the examples and the barrel left out', () => {
    expect(md).toContain('## Source\n\n`components/ui/badge/Badge.vue`')
    expect(md.slice(md.indexOf('## Source'))).not.toContain('badge.example.vue')
    expect(md.slice(md.indexOf('## Source'))).not.toContain('badge/index.ts')
  })

  it('shows a barrel that declares something, and leaves out one that only re-exports', () => {
    const barrel = "/** How large the badge is. */\nexport type BadgeSize = 'sm' | 'md'\nexport { default as Badge } from './Badge.vue'\n"
    const declaring = itemMarkdown({ ...badge, files: badge.files.map((f) => (f.path.endsWith('index.ts') ? { ...f, content: barrel } : f)) })
    expect(declaring.slice(declaring.indexOf('## Source'))).toContain('`components/ui/badge/index.ts`')
    expect(reExportsOnly("export {\n  default as Badge,\n  type BadgeProps,\n} from './Badge.vue'\nexport * from './types'\n")).toBe(true)
    expect(reExportsOnly(barrel)).toBe(false)
  })
})

describe('an example as a project writes it', () => {
  it('wraps an import the install alias pushes past 80 columns, one name per line, and leaves a short one', () => {
    const source = "import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '.'\nimport { Badge } from '.'\n"
    expect(exampleUsage('components/ui/accordion/accordion.example.vue', source)).toBe(
      "import {\n  Accordion,\n  AccordionContent,\n  AccordionItem,\n  AccordionTrigger,\n} from '@/components/ui/accordion'\nimport { Badge } from '@/components/ui/accordion'\n",
    )
    expect(exampleUsage('components/sections/promo-code/promo-code.example.vue', "import { PromoCode, type AppliedDiscount } from '.'")).toBe(
      "import {\n  PromoCode,\n  type AppliedDiscount,\n} from '@/components/sections/promo-code'",
    )
  })
})

describe('the agent prompt', () => {
  it('points the agent at the MCP, the items and the install command, around the goal', () => {
    const prompt = buildPrompt({ items: ['badge'], goal: 'a sale banner' })
    expect(prompt.split('\n')[0]).toBe('Build a sale banner with Frontic UI.')
    expect(prompt).toContain('`frontic-ui` MCP server (https://mcp.ui.frontic.com/mcp)')
    expect(prompt).toContain('`get_item_docs` with `badge`')
    expect(prompt).toContain(addCommand(['badge']))
  })
})

describe('tiers', () => {
  it('are named for the folders add installs to, and map both ways to every registry type', () => {
    expect(Object.keys(TIERS)).toEqual(['ui', 'sections', 'templates', 'lib', 'composables'])
    for (const [tier, type] of Object.entries(TIERS)) expect(tierOf(type)).toBe(tier)
    expect(tierOf('registry:example')).toBeUndefined()
  })
})
