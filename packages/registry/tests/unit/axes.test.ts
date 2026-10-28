import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { propNames, variantMatrix } from '../../scripts/lib/axes'

const root = join(import.meta.dirname, '../..')
const file = (path: string) => readFileSync(join(root, path), 'utf8')

describe('variantMatrix', () => {
  it('crosses every value of every axis the main component declares as a prop', () => {
    const { axes, combos, contextAxes } = variantMatrix({ 'Button.vue': file('ui/button/Button.vue') })
    expect(Object.keys(axes)).toEqual(['variant', 'color', 'size'])
    expect(combos).toHaveLength(axes.variant!.length * axes.color!.length * axes.size!.length)
    expect(combos[0]).toEqual({ variant: axes.variant![0], color: axes.color![0], size: axes.size![0] })
    expect(contextAxes).toEqual({})
  })

  it('lists a cva axis no prop declares instead of crossing it', () => {
    const main = `<script setup lang="ts">
const box = cva('fui-box', { variants: { tone: { a: 'x', b: 'y' }, edge: { left: 'l', right: 'r' } } })
defineProps<{ tone?: 'a' | 'b'; flat?: boolean }>()
</script>`
    expect(variantMatrix({ 'Box.vue': main })).toEqual({
      axes: { tone: ['a', 'b'], flat: ['true', 'false'] },
      combos: [
        { tone: 'a', flat: 'true' },
        { tone: 'a', flat: 'false' },
        { tone: 'b', flat: 'true' },
        { tone: 'b', flat: 'false' },
      ],
      contextAxes: { edge: ['left', 'right'] },
    })
  })

  it('reads prop names of any type, through an interface the file names', () => {
    const main = `<script setup lang="ts">
interface Props { variant?: VariantProps<typeof x>['variant']; size?: string }
withDefaults(defineProps<Props & { class?: string }>(), {})
</script>`
    expect([...propNames({ 'X.vue': main })]).toEqual(['variant', 'size', 'class'])
  })
})

describe('variantMatrix over an interface the barrel declares', () => {
  it("reads Sidebar's props from its index.ts and lists only the derived axes", () => {
    const { axes, contextAxes } = variantMatrix({ 'Sidebar.vue': file('ui/sidebar/Sidebar.vue') }, { 'index.ts': file('ui/sidebar/index.ts') })
    expect(Object.keys(axes)).toContain('variant')
    expect(Object.keys(contextAxes).sort()).toEqual(['edge', 'width'])
  })
})

describe('variantMatrix over a literal union a prop names', () => {
  it('crosses the values of an alias declared in the file or in the files it is given', () => {
    const main = `<script setup lang="ts">
type Tone = 'calm' | 'loud'
defineProps<{ tone?: Tone; edge?: Edge; size?: Unknown }>()
</script>`
    const { axes } = variantMatrix({ 'Box.vue': main }, { 'keys.ts': `export type Edge = 'left' | 'right'\nexport type Mixed = 'a' | number` })
    expect(axes).toEqual({ tone: ['calm', 'loud'], edge: ['left', 'right'] })
  })

  it("shows radio-accordion's plain and outline variants, typed through its keys.ts", () => {
    const { axes } = variantMatrix({ 'RadioAccordion.vue': file('ui/radio-accordion/RadioAccordion.vue') }, { 'keys.ts': file('ui/radio-accordion/keys.ts') })
    expect(axes).toEqual({ variant: ['plain', 'outline'] })
  })
})
