import { ICON_ATTRIBUTES } from './lib/icon-imports'

export type Library = (typeof ICON_ATTRIBUTES)[number]
export const GENERATABLE_LIBRARIES: Library[] = [...ICON_ATTRIBUTES]
export type PlaceholderRecord = Partial<Record<Library, string>> & { file?: string }
export type IconMapping = Record<string, Record<string, string>>

// keep in sync with ICON_LIBRARIES in the stack's apps/library-core/src/icons.mjs
export const LIBRARY_EXPORT: Record<Library, string> = {
  lucide: '@lucide/vue',
  tabler: '@tabler/icons-vue',
  hugeicons: '@hugeicons/core-free-icons',
  phosphor: '@phosphor-icons/vue',
  remixicon: '@remixicon/vue',
}

/** A placeholder's Phosphor alias (`CheckCircleIcon`) to the raw export the map serves (`PhCheckCircle`). */
export function deriveRawPhosphor(alias: string): string {
  return `Ph${alias.replace(/Icon$/, '')}`
}

export function buildMappingFromRecords(records: PlaceholderRecord[]): { mapping: IconMapping; usage: Record<Library, Set<string>>; warnings: string[] } {
  const mapping: IconMapping = {}
  const usage = Object.fromEntries(GENERATABLE_LIBRARIES.map((l) => [l, new Set<string>()])) as Record<Library, Set<string>>
  const warnings: string[] = []
  const firstSeen = new Map<string, { raw: string; file?: string }>()
  const at = (file?: string) => (file ? ` in ${file}` : '')
  for (const record of records) {
    const canonical = record.lucide
    if (!canonical) {
      warnings.push('IconPlaceholder without a lucide prop')
      continue
    }
    const entry = (mapping[canonical] ??= {})
    for (const library of GENERATABLE_LIBRARIES) {
      const raw = record[library]
      if (!raw) continue
      usage[library].add(raw)
      const value = library === 'phosphor' ? deriveRawPhosphor(raw) : raw
      if (entry[library] && entry[library] !== value) {
        const first = firstSeen.get(`${canonical} ${library}`)!
        warnings.push(`${canonical} fails: ${library} "${first.raw}"${at(first.file)}, "${raw}"${at(record.file)}; make the placeholders agree`)
        continue
      }
      if (!entry[library]) firstSeen.set(`${canonical} ${library}`, { raw, file: record.file })
      entry[library] = value
    }
  }
  return { mapping, usage, warnings }
}

const scannedKeyOf = (canonical: string, scanned: IconMapping) => (canonical in scanned ? canonical : `${canonical}Icon` in scanned ? `${canonical}Icon` : undefined)

/** A legacy row keeps its key and fills only what no placeholder names, matched by exact key or the `+Icon` bridge; the rest follow sorted. */
export function mergeLegacy(legacy: IconMapping, scanned: IconMapping): IconMapping {
  const output: IconMapping = {}
  const remaining: IconMapping = { ...scanned }
  for (const [canonical, legacyEntry] of Object.entries(legacy)) {
    const entry: Record<string, string> = { ...legacyEntry }
    const scannedKey = scannedKeyOf(canonical, remaining)
    if (scannedKey) {
      for (const library of GENERATABLE_LIBRARIES) if (library !== 'lucide' && remaining[scannedKey]![library]) entry[library] = remaining[scannedKey]![library]!
      delete remaining[scannedKey]
    }
    output[canonical] = entry
  }
  for (const canonical of Object.keys(remaining).sort()) {
    const entry: Record<string, string> = {}
    for (const library of GENERATABLE_LIBRARIES) if (remaining[canonical]![library]) entry[library] = remaining[canonical]![library]!
    output[canonical] = entry
  }
  return output
}

/** The served map holds one answer per key, so a placeholder may not name another icon than its legacy row. */
export function legacyConflicts(legacy: IconMapping, scanned: IconMapping): string[] {
  return Object.entries(legacy).flatMap(([canonical, legacyEntry]) => {
    const scannedKey = scannedKeyOf(canonical, scanned)
    if (!scannedKey) return []
    return GENERATABLE_LIBRARIES.filter((l) => l !== 'lucide' && legacyEntry[l] && scanned[scannedKey]![l] && legacyEntry[l] !== scanned[scannedKey]![l]).map(
      (l) => `${scannedKey}: the placeholder names ${l} "${scanned[scannedKey]![l]}", the legacy row ${canonical} names "${legacyEntry[l]}"`,
    )
  })
}

/** A used name matches if it, its `Icon`-stripped form or its `+Icon` form is a key. */
export function findUncovered(mapping: IconMapping, usedLucide: string[]): string[] {
  const has = (n: string) => n in mapping || n.replace(/Icon$/, '') in mapping || `${n}Icon` in mapping
  return [...new Set(usedLucide)].filter((n) => !has(n)).sort()
}

export function findDuplicateCanonicals(mapping: IconMapping): string[] {
  return Object.keys(mapping)
    .filter((k) => !k.endsWith('Icon') && `${k}Icon` in mapping)
    .sort()
}

/** The stack's transform needs a name for every library a project can pick. */
export function incompleteRows(mapping: IconMapping): string[] {
  return Object.keys(mapping)
    .sort()
    .flatMap((key) => {
      const missing = GENERATABLE_LIBRARIES.filter((l) => !mapping[key]![l])
      return missing.length ? [`${key}: no ${missing.join(', ')} name`] : []
    })
}
