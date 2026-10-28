import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  buildMappingFromRecords,
  findDuplicateCanonicals,
  findUncovered,
  GENERATABLE_LIBRARIES,
  incompleteRows,
  legacyConflicts,
  LIBRARY_EXPORT,
  mergeLegacy,
  type IconMapping,
  type Library,
  type PlaceholderRecord,
} from './build-icons.helpers'
import { parseLucideImports, staticAttribute } from './lib/icon-imports'
import { readSourceItems, sourcePath } from './lib/items'
import type { ServedItem } from './lib/served'

const PLACEHOLDER_RE = /<IconPlaceholder\b([^>]*?)\/?>/g

/** Literal specifiers, so a bundler that inlines this file (the site's Vite config) still resolves them from here. */
const LIBRARY_MODULE: Record<Library, () => Promise<object>> = {
  lucide: () => import('@lucide/vue'),
  tabler: () => import('@tabler/icons-vue'),
  hugeicons: () => import('@hugeicons/core-free-icons'),
  phosphor: () => import('@phosphor-icons/vue'),
  remixicon: () => import('@remixicon/vue'),
}

export function scanPlaceholders(source: string): PlaceholderRecord[] {
  const records: PlaceholderRecord[] = []
  for (const [, attrs] of source.matchAll(PLACEHOLDER_RE)) {
    const record: PlaceholderRecord = {}
    for (const library of GENERATABLE_LIBRARIES) {
      const value = staticAttribute(attrs!, library)
      if (value) record[library] = value
    }
    if (Object.keys(record).length > 0) records.push(record)
  }
  return records
}

export async function validateNames(mapping: IconMapping): Promise<string[]> {
  const exportsByLib = new Map<string, Set<string>>()
  for (const [library, load] of Object.entries(LIBRARY_MODULE)) exportsByLib.set(library, new Set(Object.keys(await load())))
  const errors: string[] = []
  for (const [canonical, entry] of Object.entries(mapping)) {
    for (const [library, name] of Object.entries(entry)) {
      const members = exportsByLib.get(library)
      if (members && !members.has(name)) errors.push(`${canonical}: ${library} export "${name}" not found in ${LIBRARY_EXPORT[library as Library]}`)
    }
  }
  return errors
}

/** Every file of every item is scanned, examples included. */
export async function iconMapFromSource(root: string): Promise<IconMapping> {
  const records = readSourceItems(root).flatMap((item) => Object.entries(item.files).flatMap(([rel, text]) => scanPlaceholders(text).map((record) => ({ ...record, file: sourcePath(item, rel) }))))
  const { mapping: scanned, warnings } = buildMappingFromRecords(records)
  const legacy: IconMapping = JSON.parse(await readFile(join(root, 'icons', 'legacy-mapping.json'), 'utf8'))
  const merged = mergeLegacy(legacy, scanned)
  const duplicates = findDuplicateCanonicals(merged).map((k) => `${k} and ${k}Icon are the same icon; key the row and write lucide="${k}Icon"`)
  const problems = [...warnings, ...legacyConflicts(legacy, scanned), ...duplicates, ...incompleteRows(merged), ...(await validateNames(merged))]
  if (problems.length) throw new Error(`Icon map:\n${problems.join('\n')}`)
  return merged
}

/** Reads what `add` copies: the transform's output and every value import, examples included. */
export function iconCoverageProblems(map: IconMapping, served: ServedItem[]): string[] {
  return served.flatMap((item) =>
    item.files.flatMap((file) =>
      findUncovered(map, parseLucideImports(file.path, file.content)).map(
        (name) => `${name} is imported from @lucide/vue in ${file.path}; give it an IconPlaceholder or a row in icons/legacy-mapping.json`,
      ),
    ),
  )
}
