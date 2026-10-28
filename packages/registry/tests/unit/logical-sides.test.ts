import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

const root = join(import.meta.dirname, '../..')

const PHYSICAL_SIDE: Record<string, string[]> = {
  'ui/drawer/DrawerContent.vue': ['left-0', 'right-0'],
  'ui/sheet/SheetContent.vue': ['left-0', 'right-0'],
  // Card digits stay left-to-right in a right-to-left form, where start means left, so the number aligns right to sit with its label.
  'ui/payment-card/PaymentCardNumber.vue': ['text-right'],
  'ui/carousel/carousel.example.vue': ['left-auto'],
  // reka moves the indicator by the trigger's offsetLeft, a distance from the left in either direction.
  'ui/navigation-menu/NavigationMenuIndicator.vue': ['left-0'],
}

const PHYSICAL_SIDE_RECIPES = ['sheet-content', 'drawer-content']

const PHYSICAL = /^-?(?:(?:left|right|[mp][lr])-(?:\d|\[|auto|full|px)|text-(?:left|right)$|(?:rounded|border)-[lr](?:-|$))/
const LEGACY_INSET = /^-?(?:start|end)-(?:\d|\[|auto|full|px)/
const CENTRED = 'left-1/2'
const DIRECTIONAL_ICON = /<IconPlaceholder\b[^>]*lucide="(?:Chevrons?(?:Left|Right)|Arrow(?:Left|Right))Icon"[^>]*>/g

const files = ['ui', 'templates', 'sections'].flatMap((group) =>
  readdirSync(join(root, group))
    .map((item) => `${group}/${item}`)
    .flatMap((dir) =>
      readdirSync(join(root, dir))
        .filter((file) => file.endsWith('.vue'))
        .map((file) => `${dir}/${file}`),
    ),
)

const utilities = (source: string) => source.split(/[\s"'`,]+/).map((token) => token.split(':').pop()!)

describe('the registry follows the reading direction', () => {
  it('places, pads and rounds by start and end, so a right-to-left page mirrors', () => {
    const found = files.flatMap((file) => {
      const allowed = PHYSICAL_SIDE[file] ?? []
      // left-1/2 with -translate-x-1/2 centres, which reads the same both ways; without it, it places by the left.
      return readFileSync(join(root, file), 'utf8')
        .split(/["'`]/)
        .flatMap((classes) => utilities(classes).filter((utility) => utility !== CENTRED || !utilities(classes).includes('-translate-x-1/2')))
        .filter((utility) => PHYSICAL.test(utility) && !allowed.includes(utility))
        .map((utility) => `${file}: ${utility}`)
    })
    expect(found).toEqual([])
  })

  it('names logical insets the way Tailwind canonicalises them, inset-s and inset-e', () => {
    const found = files.flatMap((file) =>
      utilities(readFileSync(join(root, file), 'utf8'))
        .filter((utility) => LEGACY_INSET.test(utility))
        .map((utility) => `${file}: ${utility}`),
    )
    expect(found).toEqual([])
  })

  it('flips arrows that point along the line', () => {
    const found = files.flatMap((file) => [...readFileSync(join(root, file), 'utf8').matchAll(DIRECTIONAL_ICON)].filter((icon) => !icon[0].includes('rtl:')).map(() => file))
    expect(found).toEqual([])
  })

  it('aligns, spaces and borders recipes by start and end', () => {
    const { flat, trees } = readRegistryRecipes(root)
    const names = [...new Set([...Object.keys(flat), ...Object.keys(trees)])]
    const found = names.filter((name) => {
      const recipe = JSON.stringify([flat[name], trees[name]])
      return /"textAlign":"(?:left|right)"|"(?:padding|margin)(?:Left|Right)"/.test(recipe) || (!PHYSICAL_SIDE_RECIPES.includes(name) && /"border(?:Left|Right)"/.test(recipe))
    })
    expect(found).toEqual([])
  })
})
