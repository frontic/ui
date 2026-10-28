import fuzzysort from 'fuzzysort'
import { z } from 'zod'
import { exampleItems, examplesOf, REGISTRY_URL } from './api'
import { iconMapSchema, indexSchema, itemSchema, type IconMap, type IndexEntry, type RegistryFile, type RegistryItem, type SearchResults } from './schemas'

const NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const SERVED_FILES = new Set(['index', 'registry'])

export interface ClientOptions {
  baseUrl?: string
  /** A Worker's ExecutionContext: responses go through the Cache API. */
  ctx?: { waitUntil(promise: Promise<unknown>): void }
}

type CfCache = { match(r: Request): Promise<Response | undefined>; put(r: Request, res: Response): Promise<void> }

const base = (options: ClientOptions = {}) => (options.baseUrl ?? REGISTRY_URL).replace(/\/+$/, '')

/** A fingerprint of the shape the given schemas read: a reader whose schemas change gets a new one. */
export function shapeVersion(schemas: z.ZodType[]): string {
  const text = JSON.stringify(schemas.map((schema) => z.toJSONSchema(schema, { unrepresentable: 'any' })))
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193)
  return (hash >>> 0).toString(36)
}

export function cacheKey(url: string, version: string): string {
  const key = new URL(url)
  key.searchParams.set('fui-shape', version)
  return key.href
}

let readerShape: string | undefined
const readerVersion = () => (readerShape ??= shapeVersion([itemSchema, indexSchema, iconMapSchema]))

const json = async (response: Response, url: string): Promise<unknown> => {
  try {
    return await response.json()
  } catch (error) {
    throw new Error(`The Frontic registry at ${url} answered with no JSON`, { cause: error })
  }
}

// A cached entry that no longer parses (the registry changed shape under it) is refetched once and replaced.
async function read<T>(path: string, schema: z.ZodType<T>, options: ClientOptions = {}): Promise<T | null> {
  const url = `${base(options)}/${path}`
  const { ctx } = options
  const cache = ctx ? (globalThis as { caches?: { default?: CfCache } }).caches?.default : undefined
  const key = cache ? new Request(cacheKey(url, readerVersion())) : undefined
  const cached = cache && key ? await cache.match(key) : undefined
  if (cached) {
    const parsed = schema.safeParse(await cached.json().catch(() => undefined))
    if (parsed.success) return parsed.data
  }
  const response = await fetch(url)
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Could not read the Frontic registry at ${url}: HTTP ${response.status}`)
  const data = schema.parse(await json(response.clone(), url))
  if (ctx && cache && key) {
    const headers = new Headers(response.headers)
    headers.set('Cache-Control', 'public, max-age=3600')
    ctx.waitUntil(cache.put(key, new Response(response.body, { headers })))
  }
  return data
}

async function required<T>(path: string, schema: z.ZodType<T>, options?: ClientOptions): Promise<T> {
  const data = await read(path, schema, options)
  if (data === null) throw new Error(`The Frontic registry has no ${path} at ${base(options)}`)
  return data
}

export async function getIndex(options?: ClientOptions): Promise<IndexEntry[]> {
  return (await required('index.json', indexSchema, options)).items
}

export async function getItem(name: string, options?: ClientOptions): Promise<RegistryItem | null> {
  if (!NAME.test(name) || name.length > 128 || SERVED_FILES.has(name)) return null
  return read(`${name}.json`, itemSchema, options)
}

/** An item's examples, the main one first; `null` when the registry has no such item. */
export async function getExamples(name: string, options?: ClientOptions): Promise<RegistryFile[] | null> {
  const item = await getItem(name, options)
  return item ? examplesOf(item) : null
}

/** The items an item's main example uses, as itemMarkdown takes them; one that cannot be read is left out, so it costs only its own API section. */
export async function exampleDeps(item: Pick<RegistryItem, 'name' | 'files'>, options?: ClientOptions): Promise<RegistryItem[]> {
  const deps = await Promise.all(exampleItems(item).map((name) => getItem(name, options).catch(() => null)))
  return deps.flatMap((dep) => dep ?? [])
}

export async function search(query: string, filters: { type?: RegistryItem['type']; limit?: number; offset?: number } = {}, options?: ClientOptions): Promise<SearchResults> {
  let items = (await getIndex(options)).filter((item) => !filters.type || item.type === filters.type)
  if (query.trim()) items = fuzzysort.go(query, fuzzysort.snapshot(items, { keys: ['name', 'description'] }), { threshold: 0, limit: 0 }).map((r) => r.obj)
  const offset = filters.offset ?? 0
  const limit = filters.limit ?? items.length
  return { pagination: { total: items.length, offset, limit, hasMore: offset + limit < items.length }, items: items.slice(offset, offset + limit) }
}

export async function getIconMap(options?: ClientOptions): Promise<IconMap> {
  return required('icons/index.json', iconMapSchema, options)
}
