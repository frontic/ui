import { REGISTRY_URL } from '@frontic/registry-client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchItems, iconMap, registryOptions, resolveItems } from '@/src/registry'

const item = (name: string, registryDependencies: string[] = []) => ({
  name,
  type: 'registry:ui',
  files: [{ path: `components/ui/${name}/X.vue`, type: 'registry:ui', content: '<template />' }],
  ...(registryDependencies.length ? { registryDependencies } : {}),
})

const serve = (base: string, items: ReturnType<typeof item>[]) => {
  const routes = Object.fromEntries(items.map((i) => [`${base}/${i.name}.json`, i]))
  const fetch = vi.fn(async (url: string) => (url in routes ? new Response(JSON.stringify(routes[url])) : new Response('{}', { status: 404 })))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('the registry', () => {
  it('reads from REGISTRY_URL when the environment sets it', () => {
    expect(registryOptions()).toEqual({ baseUrl: REGISTRY_URL })
    vi.stubEnv('REGISTRY_URL', 'http://localhost:3333/v1')
    expect(registryOptions()).toEqual({ baseUrl: 'http://localhost:3333/v1' })
  })

  it('reports every unknown name in one error', async () => {
    serve(REGISTRY_URL, [item('button')])
    await expect(fetchItems(['button', 'nope', 'Button'])).rejects.toThrow('Not in the Frontic registry: nope, Button')
    expect((await fetchItems(['button'])).map((i) => i.name)).toEqual(['button'])
  })

  it('resolves the closure with dependencies first, each item once', async () => {
    const fetch = serve(REGISTRY_URL, [item('card', ['button', 'separator']), item('button', ['separator']), item('separator'), item('field')])
    const names = (await resolveItems(['card', 'button', 'field', 'card'])).map((i) => i.name)
    expect(names).toEqual(['separator', 'button', 'card', 'field'])
    expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/button.json'))).toHaveLength(1)
  })

  it('names a dependency the registry lacks', async () => {
    serve(REGISTRY_URL, [item('card', ['ghost'])])
    await expect(resolveItems(['card'])).rejects.toThrow('Not in the Frontic registry: ghost')
  })

  it('reads the icon map', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ CheckIcon: { lucide: 'CheckIcon', tabler: 'IconCheck', hugeicons: 'Tick02Icon', phosphor: 'PhCheck', remixicon: 'RiCheckLine' } }))),
    )
    expect((await iconMap()).CheckIcon?.tabler).toBe('IconCheck')
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(`${REGISTRY_URL}/icons/index.json`)
  })
})
