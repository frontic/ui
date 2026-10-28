import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { readSourceItems } from '../../scripts/lib/items'
import { parseLucideImports, sourceIconProblems } from '../../scripts/lib/icon-imports'

const star = 'lucide="StarIcon" tabler="IconStar" hugeicons="StarIcon" phosphor="StarIcon" remixicon="RiStarLine"'
const script = (code: string) => `<script setup lang="ts">\n${code}\n</script>\n`
const placeholderImport = script("import { IconPlaceholder } from '@registry/icon-placeholder'")

describe('parseLucideImports', () => {
  it('resolves aliases and type modifiers to the exported name', () => {
    expect(parseLucideImports('a.ts', `import { CheckIcon, type XIcon, Loader2Icon as Spinner } from "@lucide/vue"`)).toEqual(['CheckIcon', 'XIcon', 'Loader2Icon'])
    expect(parseLucideImports('a.ts', `import { Primitive } from 'reka-ui'`)).toEqual([])
  })

  it('reads import statements only, not comments, strings or the template', () => {
    const text = script(`// import { XIcon } from '@lucide/vue'\nconst hint = "import { YIcon } from '@lucide/vue'"`) + `<p>import { ZIcon } from '@lucide/vue'</p>`
    expect(parseLucideImports('A.vue', text)).toEqual([])
  })
})

describe('sourceIconProblems', () => {
  it('accepts a full static placeholder and a suffixed value import', () => {
    expect(sourceIconProblems('A.vue', `${placeholderImport}<IconPlaceholder ${star} class="size-4" />`)).toEqual([])
    expect(sourceIconProblems('A.vue', script(`import { TruckIcon as Truck } from '@lucide/vue'`))).toEqual([])
  })

  it('refuses lucide-vue-next, a namespace import and an unsuffixed import', () => {
    expect(sourceIconProblems('A.vue', script(`import { X } from 'lucide-vue-next'`))).toHaveLength(1)
    expect(sourceIconProblems('A.vue', script(`import * as icons from '@lucide/vue'`))).toHaveLength(1)
    expect(sourceIconProblems('A.vue', script(`import { ChevronDown } from '@lucide/vue'`))).toEqual(['A.vue imports ChevronDown; import ChevronDownIcon'])
  })

  it('refuses a placeholder the transform would skip or the map would key twice', () => {
    expect(sourceIconProblems('A.vue', `${placeholderImport}<IconPlaceholder ${star.replace('lucide="StarIcon"', ':lucide="name"')} />`).join('\n')).toMatch(/static lucide/)
    expect(sourceIconProblems('A.vue', `${placeholderImport}<IconPlaceholder ${star.replace(' remixicon="RiStarLine"', '')} />`)).toEqual(['A.vue: IconPlaceholder StarIcon has no remixicon name'])
    expect(sourceIconProblems('A.vue', `${placeholderImport}<IconPlaceholder ${star.replace('"StarIcon" tabler', '"Star" tabler')} />`).join('\n')).toMatch(/StarIcon/)
    expect(sourceIconProblems('A.vue', `${script(`import { IconPlaceholder as Icon } from '@registry/icon-placeholder'`)}<Icon ${star} />`)).toHaveLength(1)
    expect(sourceIconProblems('A.vue', `<IconPlaceholder ${star} />`)).toEqual(['A.vue uses IconPlaceholder; import { IconPlaceholder } from "@registry/icon-placeholder"'])
  })

  it('ignores an import that is commented out or only text', () => {
    expect(sourceIconProblems('A.vue', script(`// import { X } from 'lucide-vue-next'\nconst s = "from 'lucide-vue-next'"`))).toEqual([])
  })

  it('holds for every item in the source tree', () => {
    const root = join(import.meta.dirname, '../..')
    const problems = readSourceItems(root).flatMap((item) => Object.entries(item.files).flatMap(([file, text]) => sourceIconProblems(`${item.tier}/${item.name}/${file}`, text)))
    expect(problems).toEqual([])
  })
})
