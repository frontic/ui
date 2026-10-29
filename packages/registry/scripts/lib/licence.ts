import { readFileSync } from 'node:fs'
import type { SourceItem } from './items'

const OWN = ['SPDX-License-Identifier: FSL-1.1-MIT', 'Frontic UI © Frontic · ui.frontic.com/license']
const DERIVED = ['SPDX-License-Identifier: FSL-1.1-MIT AND MIT', 'Frontic UI © Frontic · Portions © 2023 unovue (shadcn-vue, MIT) · ui.frontic.com/license']

const upstream = JSON.parse(readFileSync(new URL('../../upstream.json', import.meta.url), 'utf8')) as { items: string[]; renamed: Record<string, string> }

/** A ui item whose name, or the name it was renamed from, shadcn-vue's ui folder holds at the commit the base items come from. */
export const isDerived = (item: Pick<SourceItem, 'name' | 'tier'>) => item.tier === 'ui' && upstream.items.includes(upstream.renamed[item.name] ?? item.name)

const comment = (file: string, text: string) => (file.endsWith('.vue') ? `<!-- ${text} -->` : `// ${text}`)

/** The lines every served file of the item opens with: its licence, then its copyright, shadcn-vue's too where the item derives from it. */
export function licenceLines(item: Pick<SourceItem, 'name' | 'tier'>, file: string): string[] {
  return (isDerived(item) ? DERIVED : OWN).map((text) => comment(file, text))
}

/** A file's text without its licence lines, wherever they stand. */
export const withoutLicence = (text: string) => text.replace(/^(?:<!-- |\/\/ )(?:SPDX-License-Identifier: |Frontic UI © |Portions derived from shadcn-vue ).*\n/gm, '')
