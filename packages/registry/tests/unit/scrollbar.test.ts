import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderBaseCss, stylePresetPath } from '@frontic/library-contract/brand'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

const root = join(import.meta.dirname, '../..')
const css = renderBaseCss(JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')), readRegistryRecipes(root), { scope: 'project' })
const utility = (name: string) => new RegExp(`@utility fui-${name} \\{[^@]*\\}\\n\\}`).exec(css)?.[0] ?? ''

describe('the scroll lists hide their scrollbar, as the legacy no-scrollbar did', () => {
  for (const name of ['filter-list', 'search-results-viewport', 'sidebar-content']) {
    it(name, () => {
      expect(css).toContain(`--fui-${name}-scrollbar: none;`)
      expect(utility(name)).toContain(`scrollbar-width: var(--fui-${name}-scrollbar);`)
      expect(utility(name)).toContain(`&::-webkit-scrollbar {\n    display: var(--fui-${name}-scrollbar);\n  }`)
    })
  }
})
