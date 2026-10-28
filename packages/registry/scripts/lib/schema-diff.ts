// SPDX-License-Identifier: FSL-1.1-MIT
type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

export interface SchemaDiff {
  added: { path: string; value: string }[]
  removed: { path: string; value: string }[]
  changed: { path: string; before: string; after: string }[]
  /** Paths whose description alone changed. */
  described: string[]
}

const isObject = (node: Json): node is { [key: string]: Json } => !!node && typeof node === 'object' && !Array.isArray(node)
const pointer = (key: string) => key.replaceAll('~', '~0').replaceAll('/', '~1')

// Each leaf by its JSON pointer. An array of objects (allOf, oneOf) is walked by index; an array of scalars (enum, required) is one leaf,
// so an extended enum reads as one change. An empty object is a leaf too, so a field that empties or appears empty shows.
function leaves(node: Json, path = '', out = new Map<string, string>()) {
  if (isObject(node) && Object.keys(node).length) for (const [key, value] of Object.entries(node)) leaves(value, `${path}/${pointer(key)}`, out)
  else if (Array.isArray(node) && node.length && node.every(isObject)) node.forEach((value, index) => leaves(value, `${path}/${index}`, out))
  else out.set(path, JSON.stringify(node))
  return out
}

/** What a newer JSON schema adds, removes and changes against an older one, path by path, sorted. */
export function schemaDiff(before: Json, after: Json): SchemaDiff {
  const old = leaves(before)
  const next = leaves(after)
  const diff: SchemaDiff = { added: [], removed: [], changed: [], described: [] }
  for (const path of [...new Set([...old.keys(), ...next.keys()])].sort()) {
    const was = old.get(path)
    const is = next.get(path)
    if (was === undefined) diff.added.push({ path, value: is! })
    else if (is === undefined) diff.removed.push({ path, value: was })
    else if (was === is) continue
    else if (path.endsWith('/description')) diff.described.push(path)
    else diff.changed.push({ path, before: was, after: is })
  }
  return diff
}

const cell = (text: string) => `\`${text.length > 120 ? `${text.slice(0, 117)}...` : text}\``.replaceAll('|', '\\|')

/** The diff as Markdown for a pull request body. */
export function schemaDiffMarkdown({ added, removed, changed, described }: SchemaDiff): string {
  if (!added.length && !removed.length && !changed.length && !described.length) return 'No field changes.'
  const rows = [
    ...removed.map(({ path, value }) => `| removed | ${cell(path)} | ${cell(value)} | |`),
    ...changed.map(({ path, before, after }) => `| changed | ${cell(path)} | ${cell(before)} | ${cell(after)} |`),
    ...added.map(({ path, value }) => `| added | ${cell(path)} | | ${cell(value)} |`),
  ]
  const table = rows.length ? ['| | Path | Before | After |', '|---|---|---|---|', ...rows].join('\n') : ''
  const words = described.length ? `Descriptions reworded: ${described.map(cell).join(', ')}.` : ''
  return [table, words].filter(Boolean).join('\n\n')
}
