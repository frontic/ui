import { afterEach, describe, expect, it, vi } from 'vitest'
import { exampleDeps, getExamples, getIconMap, getIndex, getItem, REGISTRY_URL, search } from '../src'

const badge = {
  name: 'badge',
  type: 'registry:ui',
  description: 'A small label',
  files: [
    { path: 'components/ui/badge/Badge.vue', type: 'registry:ui', content: '<template />' },
    { path: 'components/ui/badge/badge.example.vue', type: 'registry:example', content: '<demo />' },
  ],
  recipes: {
    badge: {
      base: { rounded: '{rounded.full}', icon: { size: '{spacing.3}' } },
      variants: { variant: { primary: { extends: 'solid-fill' }, outline: { textColor: '{colors.foreground}' } }, size: { sm: { height: '{spacing.5}' } } },
      defaults: { variant: 'primary', size: 'sm' },
    },
  },
  library: {
    recipes: {
      'solid-fill': { backgroundColor: '{colors.primary}', opacity: '{opacity.100}', hover: { opacity: '{opacity.90}' }, checked: { backgroundColor: '{colors.active}' } },
    },
  },
}
const serve = (routes: Record<string, unknown>) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => (url in routes ? new Response(JSON.stringify(routes[url])) : new Response('{}', { status: 404 }))),
  )

afterEach(() => vi.unstubAllGlobals())

describe('the registry client', () => {
  it('reads the v1 registry, the only path the registry serves', () => {
    expect(REGISTRY_URL).toBe('https://registry.ui.frontic.com/v1')
  })

  it('reads the index and an item from the contract base, its component tree and state blocks included', async () => {
    serve({ [`${REGISTRY_URL}/index.json`]: { items: [{ name: 'badge', type: 'registry:ui' }] }, [`${REGISTRY_URL}/badge.json`]: badge })
    expect(await getIndex()).toEqual([{ name: 'badge', type: 'registry:ui' }])
    const item = await getItem('badge')
    expect(item?.recipes).toEqual(badge.recipes)
    expect(item?.library).toEqual(badge.library)
  })

  it('reads the items an example uses, leaving out one the registry lacks', async () => {
    const example = '<script setup lang="ts">\nimport { Badge } from \'.\'\nimport { Button } from \'@library/components/ui/button\'\nimport { Field } from "@library/components/ui/field"\n</script>'
    const dialog = { ...badge, name: 'dialog', files: [{ path: 'components/ui/dialog/dialog.example.vue', type: 'registry:example', content: example }] }
    serve({ [`${REGISTRY_URL}/button.json`]: { ...badge, name: 'button' } })
    expect((await exampleDeps(dialog as never)).map((item) => item.name)).toEqual(['button'])
  })

  it('answers null for a missing item and never fetches an unsafe name', async () => {
    serve({})
    expect(await getItem('nope')).toBeNull()
    expect(await getItem('../x')).toBeNull()
    expect(await getItem('index')).toBeNull()
    expect(await getItem('registry')).toBeNull()
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
  })

  it('throws naming the URL on a 5xx or a malformed item', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('x', { status: 503 })),
    )
    await expect(getItem('badge')).rejects.toThrow(`${REGISTRY_URL}/badge.json`)
    serve({ [`${REGISTRY_URL}/badge.json`]: { ...badge, files: [] } })
    await expect(getItem('badge')).rejects.toThrow()
  })

  it('refuses recipes the contract says would not render', async () => {
    serve({ [`${REGISTRY_URL}/badge.json`]: { ...badge, library: { recipes: { 'solid-fill': { hover: { hover: { opacity: '{opacity.100}' } } } } } } })
    await expect(getItem('badge')).rejects.toThrow(/a state inside a state/)
    serve({ [`${REGISTRY_URL}/badge.json`]: { ...badge, recipes: { badge: { ...badge.recipes.badge, variants: { variant: { primary: { extends: 'missing' } } } } } } })
    await expect(getItem('badge')).rejects.toThrow(/extends: missing is not a flat recipe/)
  })

  it("returns an item's examples, and null for an item the registry lacks", async () => {
    serve({ [`${REGISTRY_URL}/badge.json`]: badge })
    expect((await getExamples('badge'))?.map((f) => f.content)).toEqual(['<demo />'])
    expect(await getExamples('nothing')).toBeNull()
  })

  it('searches names and descriptions, filtered and paged', async () => {
    serve({
      [`${REGISTRY_URL}/index.json`]: {
        items: [
          { name: 'badge', type: 'registry:ui', description: 'A small label' },
          { name: 'hero', type: 'registry:component' },
        ],
      },
    })
    expect((await search('label')).items.map((i) => i.name)).toEqual(['badge'])
    expect((await search('', { type: 'registry:component' })).items.map((i) => i.name)).toEqual(['hero'])
    expect((await search('', { limit: 1 })).pagination).toEqual({ total: 2, offset: 0, limit: 1, hasMore: true })
  })

  it('returns every match for a query, not only the first ten', async () => {
    serve({ [`${REGISTRY_URL}/index.json`]: { items: Array.from({ length: 25 }, (_, i) => ({ name: `card-${i}`, type: 'registry:ui' })) } })
    expect((await search('card')).pagination.total).toBe(25)
  })

  it('reads the icon map and refuses a row missing a library', async () => {
    const row = { lucide: 'StarIcon', tabler: 'IconStar', hugeicons: 'StarIcon', phosphor: 'PhStar', remixicon: 'RiStarLine' }
    serve({ [`${REGISTRY_URL}/icons/index.json`]: { StarIcon: row } })
    expect(await getIconMap()).toEqual({ StarIcon: row })
    serve({ [`${REGISTRY_URL}/icons/index.json`]: { StarIcon: { lucide: 'StarIcon' } } })
    await expect(getIconMap()).rejects.toThrow()
  })

  it('takes another base', async () => {
    serve({ 'https://registry.example.test/v1/badge.json': badge })
    expect(await getItem('badge', { baseUrl: 'https://registry.example.test/v1/' })).not.toBeNull()
  })

  it('reads through the Cache API when given a Worker context', async () => {
    const store = new Map<string, Response>()
    vi.stubGlobal('caches', {
      default: {
        match: async (r: Request) => store.get(r.url)?.clone(),
        put: async (r: Request, res: Response) => void store.set(r.url, res),
      },
    })
    serve({ [`${REGISTRY_URL}/badge.json`]: badge })
    const pending: Promise<unknown>[] = []
    const ctx = { waitUntil: (p: Promise<unknown>) => void pending.push(p) }
    await getItem('badge', { ctx })
    expect(pending).toHaveLength(1)
    await Promise.all(pending)
    expect(await getItem('badge', { ctx })).not.toBeNull()
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    expect([...store.values()][0]?.headers.get('Cache-Control')).toBe('public, max-age=3600')
  })

  it('never reads an entry an earlier reader cached, even one that still parses', async () => {
    const stale = { ...badge, recipes: undefined, library: undefined, shared: badge.library.recipes }
    const store = new Map<string, Response>([[`${REGISTRY_URL}/badge.json`, new Response(JSON.stringify(stale))]])
    vi.stubGlobal('caches', {
      default: {
        match: async (r: Request) => store.get(r.url)?.clone(),
        put: async (r: Request, res: Response) => void store.set(r.url, res),
      },
    })
    serve({ [`${REGISTRY_URL}/badge.json`]: badge })
    const item = await getItem('badge', { ctx: { waitUntil: () => {} } })
    expect(item?.library).toEqual(badge.library)
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
  })

  it('refetches once when the cached entry no longer parses, and caches the fresh one in its place', async () => {
    const stale = { ...badge, library: undefined, shared: badge.library.recipes }
    const store = new Map<string, Response>()
    const puts: string[] = []
    vi.stubGlobal('caches', {
      default: {
        match: async (r: Request) => (store.get(r.url) ?? new Response(JSON.stringify(stale))).clone(),
        put: async (r: Request, res: Response) => void (puts.push(r.url), store.set(r.url, res)),
      },
    })
    serve({ [`${REGISTRY_URL}/badge.json`]: badge })
    const pending: Promise<unknown>[] = []
    const ctx = { waitUntil: (p: Promise<unknown>) => void pending.push(p) }
    expect((await getItem('badge', { ctx }))?.library).toEqual(badge.library)
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    await Promise.all(pending)
    expect(puts).toHaveLength(1)
    expect(await store.get(puts[0]!)?.clone().json()).toEqual(badge)
  })

  it('throws when the network answer fails to parse too', async () => {
    const store = new Map<string, Response>()
    vi.stubGlobal('caches', { default: { match: async (r: Request) => store.get(r.url)?.clone(), put: async (r: Request, res: Response) => void store.set(r.url, res) } })
    serve({ [`${REGISTRY_URL}/badge.json`]: { ...badge, files: [] } })
    await expect(getItem('badge', { ctx: { waitUntil: () => {} } })).rejects.toThrow()
    expect(store.size).toBe(0)
  })
})

describe('the cache key', () => {
  it('differs between readers of different shapes, and is stable for one', async () => {
    const { cacheKey, shapeVersion } = await import('../src/client')
    const { z } = await import('zod')
    const url = `${REGISTRY_URL}/badge.json`
    const old = shapeVersion([z.object({ name: z.string(), shared: z.record(z.string(), z.unknown()).optional() })])
    const current = shapeVersion([z.object({ name: z.string(), library: z.object({ recipes: z.record(z.string(), z.unknown()) }).optional() })])
    expect(old).not.toBe(current)
    expect(cacheKey(url, old)).not.toBe(cacheKey(url, current))
    expect(cacheKey(url, current)).toBe(cacheKey(url, current))
    expect(cacheKey(url, current)).not.toBe(url)
  })
})

describe('item types', () => {
  it('reads lib and composable items', async () => {
    const { itemSchema } = await import('../src')
    for (const [type, folder] of [
      ['registry:lib', 'lib'],
      ['registry:composable', 'composables'],
    ] as const) {
      const item = { name: 'format', type, files: [{ path: `${folder}/format.ts`, type, content: 'export {}\n' }] }
      expect(itemSchema.parse(item).type).toBe(type)
    }
  })
})
