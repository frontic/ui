import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

const { trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))
const variants = trees.badge!.variants!.variant as Record<string, { backgroundColor?: string; textColor?: string }>
const sizes = trees.badge!.variants!.size as Record<string, { typography?: string; fontWeight?: string; letterSpacing?: string }>
const base = trees.badge!.base as { fontWeight?: string; letterSpacing?: string }

describe('a Badge', () => {
  it('fills every variant but neutral with a solid role and its foreground', () => {
    const filled = Object.entries(variants).filter(([name]) => name !== 'neutral')
    for (const [name, { backgroundColor, textColor }] of filled) {
      const role = /^\{colors\.([a-z-]+)\}$/.exec(backgroundColor ?? '')?.[1]
      expect(role, `${name} fills with a solid role`).toBeDefined()
      expect(textColor, name).toBe(`{colors.${role}-foreground}`)
    }
  })

  it('steps its text with its size, keeping its weight and tracking', () => {
    expect(sizes.sm!.typography).toBeUndefined()
    for (const size of ['md', 'lg']) expect([sizes[size]!.typography, sizes[size]!.fontWeight, sizes[size]!.letterSpacing], size).toEqual(['{typography.caption}', base.fontWeight, base.letterSpacing])
  })
})
