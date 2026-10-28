// SPDX-License-Identifier: FSL-1.1-MIT
/** Up to two initials from a name's words, upper case; `override` wins when given. */
export function initials(name: string, override?: string): string {
  if (override) return override
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** `template` with each `{key}` replaced by its value; a key `values` lacks stays as written. */
export function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (token, key: string) => (Object.hasOwn(values, key) ? values[key]! : token))
}

/** The first and last result on `page`, 1-based; undefined when there are none. */
export function pageRange(page: number, perPage: number, total: number): { from: number; to: number } | undefined {
  if (total <= 0) return undefined
  const from = (page - 1) * perPage + 1
  return { from, to: Math.min(page * perPage, total) }
}
