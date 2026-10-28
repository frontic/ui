import { importMask, importsOf } from '@frontic/library-contract/item'

export const ICON_ATTRIBUTES = ['lucide', 'tabler', 'hugeicons', 'phosphor', 'remixicon'] as const

const LUCIDE_NAMED = /import\s*\{([^}]*)\}\s*from\s*['"]@lucide\/vue['"]/g
const LUCIDE_OTHER = /import\s+(?:\*\s+as\s+\w+|\w+)\s+from\s*['"]@lucide\/vue['"]/
// upstream's PLACEHOLDER_RE, apps/v4/scripts/build-icons.ts:16 at b251d9f
const PLACEHOLDER = /<IconPlaceholder\b([^>]*?)\/?>/g
const PLACEHOLDER_IMPORT = /import\s*\{\s*IconPlaceholder\s*\}\s*from\s*['"]@registry\/icon-placeholder['"]/
const BOUND_LUCIDE = /(?:^|\s)(?::|v-bind:)lucide=/

export const staticAttribute = (attrs: string, name: string) => attrs.match(new RegExp(`(?<![:\\w-])${name}=["']([^"']+)["']`))?.[1]

export function parseLucideImports(file: string, text: string): string[] {
  const names: string[] = []
  for (const match of importMask(file, text).matchAll(LUCIDE_NAMED)) {
    for (const raw of match[1]!.split(',')) {
      const name = raw
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)[0]
        ?.trim()
      if (name) names.push(name)
    }
  }
  return names
}

/** What the upstream transform and map scan need to see in a source file. */
export function sourceIconProblems(file: string, text: string): string[] {
  const problems: string[] = []
  const code = importMask(file, text)
  const specifiers = importsOf(file, text).map((i) => i.specifier)
  if (specifiers.includes('lucide-vue-next')) problems.push(`${file} imports lucide-vue-next; author an IconPlaceholder`)
  if (LUCIDE_OTHER.test(code)) problems.push(`${file} imports @lucide/vue without naming the icons`)
  for (const name of parseLucideImports(file, text)) {
    if (!name.endsWith('Icon')) problems.push(`${file} imports ${name}; import ${name}Icon`)
  }
  // The transform prunes any import whose source mentions icon-placeholder.
  const placeholderImport = PLACEHOLDER_IMPORT.test(code)
  if (specifiers.some((s) => /icon-placeholder/i.test(s)) && !placeholderImport)
    problems.push(`${file} imports IconPlaceholder under another name or path; the transform only rewrites <IconPlaceholder>`)
  const placeholders = [...text.matchAll(PLACEHOLDER)]
  if (placeholders.length && !placeholderImport) problems.push(`${file} uses IconPlaceholder; import { IconPlaceholder } from "@registry/icon-placeholder"`)
  for (const [, attrs] of placeholders) {
    const lucide = staticAttribute(attrs!, 'lucide')
    if (BOUND_LUCIDE.test(attrs!) || !lucide) {
      problems.push(`${file}: an IconPlaceholder without a static lucide name; the transform skips it`)
      continue
    }
    if (!lucide.endsWith('Icon')) problems.push(`${file}: IconPlaceholder lucide="${lucide}"; write ${lucide}Icon`)
    for (const library of ICON_ATTRIBUTES.slice(1)) {
      if (!staticAttribute(attrs!, library)) problems.push(`${file}: IconPlaceholder ${lucide} has no ${library} name`)
    }
  }
  return problems
}
