// registryDependencies for each library item, read from the imports of its files.
import { IMPORT, flatFile, importMask, importTarget } from './item.mjs'

const TIER_FOLDER = {
  'registry:ui': 'ui',
  'registry:component': 'sections',
  'registry:block': 'templates',
}
// The item a library-root path lands in: a component's folder, or a lib or composable file with or without `.ts`.
const ITEM_PATH = /^(?:components\/(?:ui|sections|templates)\/[^/]+(?=\/|$)|(?:lib|composables)\/[^/]+?(?=\.ts$|$))/

export class UnknownLibraryImportError extends Error {
  code = 'unknown-library-import'
  constructor(file, specifier) {
    super(`${file} imports ${specifier}, which is no item in registry.json`)
    this.name = 'UnknownLibraryImportError'
  }
}

function itemPath(item) {
  const folder = TIER_FOLDER[item?.type]
  if (folder) return `components/${folder}/${item.name}`
  return flatFile(item)?.replace(/\.ts$/, '') ?? null
}

/** Each item's dependencies, sorted, by name. `texts` maps library-root paths to file
 * contents; a missing file adds nothing. Throws on an import into no item. */
export function registryDependencies(registry, texts) {
  const itemOfPath = new Map()
  for (const item of registry.items ?? []) {
    const path = itemPath(item)
    if (path) itemOfPath.set(path, item.name)
  }
  const result = new Map()
  for (const item of registry.items ?? []) {
    if (!itemPath(item)) continue
    const deps = new Set()
    for (const { path: file } of item.files ?? []) {
      for (const [, , specifier] of importMask(file, texts[file] ?? '').matchAll(IMPORT)) {
        const path = ITEM_PATH.exec(importTarget(file, specifier) ?? '')?.[0]
        if (!path) continue
        const name = itemOfPath.get(path)
        if (name === undefined) throw new UnknownLibraryImportError(file, specifier)
        if (name !== item.name) deps.add(name)
      }
    }
    result.set(item.name, [...deps].sort())
  }
  return result
}
