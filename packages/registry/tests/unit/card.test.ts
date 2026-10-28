// @vitest-environment happy-dom
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardImage } from '../../ui/card'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())
const mount = async (props: Record<string, unknown> = {}) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(Card, props, () => [h(CardImage), h(CardHeader, null, () => h(CardAction)), h(CardContent), h(CardFooter)]) })
  app.mount('#app')
  await nextTick()
}
const classes = (slot: string) => [...document.querySelector(`[data-slot="${slot}"]`)!.classList]
const root = join(import.meta.dirname, '../..')
const trees = () => readRegistryRecipes(root).trees

describe('a Card', () => {
  it('is its parts’ container, so their steps read the card’s width', () => {
    expect(trees().card.base).toMatchObject({ contain: 'inline-size' })
  })

  it('wears a raised surface by default and a bare one on request, the axis in its cva', async () => {
    await mount()
    expect(classes('card')).toContain('fui-card-raised')
    expect(document.querySelector('[data-slot="card"]')!.getAttribute('data-surface')).toBe('raised')
    await mount({ surface: 'bare' })
    expect(classes('card')).toContain('fui-card-bare')
    expect(classes('card')).not.toContain('fui-card-raised')
    expect(document.querySelector('[data-slot="card"]')!.getAttribute('data-surface')).toBe('bare')
    expect(readFileSync(join(root, 'ui/card/Card.vue'), 'utf8')).toMatch(/surface: \{\s*raised: 'fui-card-raised',\s*bare: 'fui-card-bare',?\s*\}/)
  })

  it('zeroes its own vertical inset and its header, content and footer sides when bare', () => {
    const bare = trees().card.variants?.surface?.bare as Record<string, unknown>
    expect(bare).toMatchObject({ paddingY: '{spacing.0}' })
    expect(bare.parts).toEqual({
      'card-header': { paddingX: '{spacing.0}' },
      'card-content': { paddingX: '{spacing.0}' },
      'card-footer': { paddingX: '{spacing.0}' },
    })
  })

  it('gives its header, content and footer their sides from recipes', async () => {
    await mount()
    for (const part of ['card-header', 'card-content', 'card-footer']) {
      expect(classes(part), part).toContain(`fui-${part}`)
      expect(
        classes(part).filter((c) => /^p[xytblr]?-|^gap-/.test(c)),
        part,
      ).toEqual([])
    }
  })

  it('drops its top padding when its image comes first, instead of pulling the image up by a copied size', async () => {
    await mount()
    expect(classes('card')).toContain('has-[>[data-slot=card-image]:first-child]:pt-0')
    expect(classes('card-image').filter((c) => /(?:^|:)-?m[ty]?-/.test(c))).toEqual([])
  })

  // Below the header's @sm the action is a row of its own at the start edge, under the description; the two-row column beside the title is the wide layout.
  it('places its action beside the title only once the header is wide enough', async () => {
    await mount()
    expect(classes('card-action').filter((c) => /^(?:col-start|row-span|row-start|justify-self)-/.test(c))).toEqual([])
    expect(trees()['card-action']!.base).toEqual({ alignSelf: 'start', justifySelf: 'start' })
    expect(classes('card-action')).toEqual(
      expect.arrayContaining(['fui-card-action', '@sm/card-header:justify-self-end', '@sm/card-header:col-start-2', '@sm/card-header:row-span-2', '@sm/card-header:row-start-1']),
    )
  })
})

/** Each `<Card` placed inside another element of a section or template: the file, the Card's classes and its parent's. */
function cardPlacements(): { file: string; card: string; parent: string }[] {
  const placements: { file: string; card: string; parent: string }[] = []
  const classOf = (tag: string) => /(?:^|\s):?class="([^"]*)"/.exec(tag)?.[1] ?? ''
  for (const tier of ['sections', 'templates']) {
    for (const item of readdirSync(join(root, tier))) {
      const file = join(tier, item, `${item.replace(/(?:^|-)(\w)/g, (_, c: string) => c.toUpperCase())}.vue`)
      const lines = readFileSync(join(root, file), 'utf8').split('\n')
      lines.forEach((line, i) => {
        const indent = line.search(/\S/)
        if (!/^\s*<Card[\s>]/.test(line) || indent <= 2) return
        const parent =
          lines
            .slice(0, i)
            .reverse()
            .find((above) => above.search(/\S/) < indent && above.search(/\S/) >= 0 && /^\s*<\w/.test(above)) ?? ''
        placements.push({ file, card: classOf(line.trim()), parent: classOf(parent.trim()) })
      })
    }
  }
  return placements
}

describe('a Card placed in a section or template', () => {
  it('is never sized by its content: as a flex row’s child it carries a width, flex-1 or grow for every width the row applies at', () => {
    const placements = cardPlacements()
    expect(placements.length).toBeGreaterThan(0)
    const rowVariants = (classes: string) =>
      classes
        .split(/\s+/)
        .filter((c) => /(?:^|:)flex-row$/.test(c))
        .map((c) => c.slice(0, c.lastIndexOf(':') + 1))
    const sized = (classes: string, variant: string) => classes.split(/\s+/).some((c) => /^(?:[\w@/-]+:)?(?:w-|flex-1$|grow$|basis-)/.test(c) && (c.startsWith(variant) || !c.includes(':')))
    const contentSized = placements.filter(({ card, parent }) => rowVariants(parent).some((variant) => !sized(card, variant)))
    expect(contentSized.map(({ file, card }) => `${file}: <Card class="${card}">`)).toEqual([])
  })
})
