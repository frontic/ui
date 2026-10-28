import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderBaseCss, stylePresetPath } from '@frontic/library-contract/brand'
import { readRegistryRecipes } from '../../scripts/lib/recipes'
import { compile } from 'tailwindcss'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '../..')
const base = renderBaseCss(JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')), readRegistryRecipes(root), { scope: 'project' }).replace(/^@import[^;]*;\n?/gm, '')

describe('the shared focus ring on a transitioned element', () => {
  it('holds the ring’s colour at rest, so a transition grows the ring and steps no colour', async () => {
    const css = (await compile(`${base}\n@tailwind utilities;\n`)).build(['fui-input', 'transition', 'focus-visible:fui-focus-ring'])
    expect(/\.transition \{[^}]*transition-property: [^;]*outline-color/.exec(css), 'bare transition eases the outline colour').not.toBeNull()
    const rest = /:where\(\[class\*='fui-focus-ring'\]\) \{\n\s*outline: 0 solid (.+);/.exec(css)?.[1]
    const focus =
      /\.focus-visible\\:fui-focus-ring \{\n\s*&:focus-visible \{[^}]*?outline-color: (.+);/.exec(css)?.[1] ??
      /\.focus-visible\\:fui-focus-ring:focus-visible \{[^}]*?outline-color: (.+);/.exec(css)?.[1]
    expect(rest).toBeDefined()
    expect(rest).toBe(focus)
  })
})
