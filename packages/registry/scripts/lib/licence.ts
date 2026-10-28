import { readFileSync } from 'node:fs'
import type { SourceItem } from './items'

const SPDX = 'SPDX-License-Identifier: FSL-1.1-MIT'
const NOTICE = 'Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES'

const upstream = JSON.parse(readFileSync(new URL('../../upstream.json', import.meta.url), 'utf8')) as { items: string[]; renamed: Record<string, string> }

/** A ui item whose name, or the name it was renamed from, shadcn-vue's ui folder holds at the commit the base items come from. */
export const isDerived = (item: Pick<SourceItem, 'name' | 'tier'>) => item.tier === 'ui' && upstream.items.includes(upstream.renamed[item.name] ?? item.name)

const comment = (file: string, text: string) => (file.endsWith('.vue') ? `<!-- ${text} -->` : `// ${text}`)

/** The lines every source file of the item opens with: its licence, then the shadcn-vue notice where it derives from it. */
export function licenceLines(item: Pick<SourceItem, 'name' | 'tier'>, file: string): string[] {
  return [comment(file, SPDX), ...(isDerived(item) ? [comment(file, NOTICE)] : [])]
}

/** A file's text without its licence lines, wherever they stand. */
export const withoutLicence = (text: string) => text.replace(/^(?:<!-- |\/\/ )(?:SPDX-License-Identifier: |Portions derived from shadcn-vue ).*\n/gm, '')
