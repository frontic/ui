import { getIconMap, getIndex as clientIndex, getItem, REGISTRY_URL, search as clientSearch, type ClientOptions, type RegistryItem } from '@frontic/registry-client'

export type { IconMap, IndexEntry, RegistryFile, RegistryItem, SearchResults } from '@frontic/registry-client'

/** Where the registry is read from: REGISTRY_URL in the environment, the public registry otherwise. */
export const registryOptions = (): ClientOptions => ({ baseUrl: process.env.REGISTRY_URL || REGISTRY_URL })

export const getIndex = () => clientIndex(registryOptions())
export const search = (query: string, filters: Parameters<typeof clientSearch>[1] = {}) => clientSearch(query, filters, registryOptions())
export const iconMap = () => getIconMap(registryOptions())

/** The named items, in order; every name the registry lacks is reported in one error. */
export async function fetchItems(names: string[]): Promise<RegistryItem[]> {
  const options = registryOptions()
  const fetched = await Promise.all(names.map(async (name) => [name, await getItem(name, options)] as const))
  const missing = fetched.filter(([, item]) => item === null).map(([name]) => name)
  if (missing.length) throw new Error(`Not in the Frontic registry: ${missing.join(', ')}`)
  return fetched.map(([, item]) => item!)
}

/** The named items with every registry dependency they reach, each once, a dependency before whatever depends on it. */
export async function resolveItems(names: string[]): Promise<RegistryItem[]> {
  const items = new Map<string, RegistryItem>()
  let wanted = [...new Set(names)]
  while (wanted.length) {
    for (const item of await fetchItems(wanted)) items.set(item.name, item)
    wanted = [...new Set(wanted.flatMap((name) => items.get(name)!.registryDependencies ?? []))].filter((name) => !items.has(name))
  }
  const ordered: RegistryItem[] = []
  const seen = new Set<string>()
  const visit = (name: string) => {
    if (seen.has(name)) return
    seen.add(name)
    const item = items.get(name)!
    for (const dependency of item.registryDependencies ?? []) visit(dependency)
    ordered.push(item)
  }
  for (const name of names) visit(name)
  return ordered
}
