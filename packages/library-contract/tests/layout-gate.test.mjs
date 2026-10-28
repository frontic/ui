import { describe, expect, it } from 'vitest'
import { isRelational, layoutGate, RELATIONAL_VARIANTS } from '../src/layout-gate.mjs'

const gate = (template) => layoutGate(`<template>\n  ${template}\n</template>\n`, 'X.vue')

describe('the layout gate', () => {
  it('flags a layout utility beside props.class, and leaves position alone', () => {
    expect(gate(`<div :class="['flex items-center relative', props.class]" />`).map((f) => f.utility)).toEqual(['flex', 'items-center'])
    expect(gate(`<div :class="['data-open:flex', props.class]" />`)).toHaveLength(1)
  })

  it('names the file, the line, the utility and the recipe property that holds it', () => {
    expect(gate(`<div :class="['grid-cols-3 @md:col-span-full gap-2 w-full text-center', props.class]" />`)).toEqual([
      { file: 'X.vue', line: 2, utility: 'grid-cols-3', property: 'gridColumns' },
      { file: 'X.vue', line: 2, utility: '@md:col-span-full', property: 'gridColumn' },
      { file: 'X.vue', line: 2, utility: 'gap-2', property: 'gap' },
      { file: 'X.vue', line: 2, utility: 'w-full', property: 'width' },
      { file: 'X.vue', line: 2, utility: 'text-center', property: 'textAlign' },
    ])
  })

  it('reads every string in the binding, behind a state, a group or a container step', () => {
    const found = gate(`<div :class="[open ? 'hidden' : 'grid', 'group-hover:justify-between aria-expanded:shrink-0', props.class]" />`)
    expect(found.map((f) => [f.utility, f.property])).toEqual([
      ['hidden', 'display'],
      ['grid', 'display'],
      ['group-hover:justify-between', 'justifyContent'],
      ['aria-expanded:shrink-0', 'flexShrink'],
    ])
  })

  it('leaves a binding without props.class, colours, text styles and arbitrary content alone', () => {
    expect(gate(`<div :class="props.class"><i class="flex" :class="cls" /></div>`)).toEqual([])
    expect(gate(`<div :class="['text-muted-foreground text-small bg-accent content-none overflow-hidden', props.class]" />`)).toEqual([])
  })

  it('reads the cva a binding calls, at the line of its string', () => {
    const source = `<script setup lang="ts">\nconst badge = cva('fui-badge inline-flex items-center', {\n  variants: { size: { sm: 'fui-badge-sm', lg: 'gap-2' } },\n})\n</script>\n<template>\n  <span :class="[badge({ size }), props.class]" />\n  <i :class="[badge({ size: 'sm' }), props.class]" />\n</template>\n`
    expect(layoutGate(source, 'B.vue')).toEqual([
      { file: 'B.vue', line: 2, utility: 'inline-flex', property: 'display' },
      { file: 'B.vue', line: 2, utility: 'items-center', property: 'alignItems' },
      { file: 'B.vue', line: 3, utility: 'gap-2', property: 'gap' },
    ])
  })

  it('reads every class binding that carries props.class, whatever prop it binds', () => {
    expect(gate(`<PinInput :container-class="normalizeClass(['flex items-center gap-2 has-disabled:fui-disabled', props.class])" />`).map((f) => f.utility)).toEqual(['flex', 'items-center', 'gap-2'])
    expect(gate(`<Popup v-bind:content-class="['w-full', props.class]" :contentClass="['grid', props.class]" />`).map((f) => f.utility)).toEqual(['w-full', 'grid'])
    expect(gate(`<Popup :class="props.class" :content-class="['w-full', cls]" />`)).toEqual([])
  })

  it('reads the class on the root of a part whose caller’s class falls through to it', () => {
    expect(gate(`<span class="flex items-center gap-1.5 text-muted-foreground"><slot /></span>`)).toEqual([
      { file: 'X.vue', line: 2, utility: 'flex', property: 'display' },
      { file: 'X.vue', line: 2, utility: 'items-center', property: 'alignItems' },
      { file: 'X.vue', line: 2, utility: 'gap-1.5', property: 'gap' },
    ])
    expect(gate(`<!-- a comment -->\n  <SelectValue v-bind="forwarded" :data-open="a > b" class="ms-auto w-auto"><i class="flex" /></SelectValue>`).map((f) => [f.line, f.utility])).toEqual([
      [3, 'ms-auto'],
      [3, 'w-auto'],
    ])
    expect(gate(`<div :class="['grid', open && 'hidden']" />`).map((f) => f.utility)).toEqual(['grid', 'hidden'])
    expect(gate(`<Popup :content-class="['w-full', cls]" />`)).toEqual([])
  })

  it('reads every root of a v-if chain, which renders one root', () => {
    expect(gate(`<a v-if="href" class="flex" /><button v-else class="grid" />`).map((f) => f.utility)).toEqual(['flex', 'grid'])
  })

  it('leaves the root alone where no class falls through: a part that binds props.class, sets inheritAttrs false or renders several roots', () => {
    expect(gate(`<div class="flex"><i :class="props.class" /></div>`)).toEqual([])
    expect(layoutGate(`<script setup lang="ts">\ndefineOptions({ inheritAttrs: false })\n</script>\n<template>\n  <div class="flex" />\n</template>\n`, 'X.vue')).toEqual([])
    expect(layoutGate(`<script lang="ts">\nexport default {\n  inheritAttrs: false,\n}\n</script>\n<template>\n  <div class="flex" />\n</template>\n`, 'X.vue')).toEqual([])
    expect(gate(`<div class="flex" />\n  <span class="grid" />`)).toEqual([])
    expect(gate(`<slot class="flex" />`)).toEqual([])
  })

  it.each([
    '*:data-icon:size-4',
    '**:data-icon:size-3',
    'has-[>textarea]:h-auto',
    'not-has-[>img]:pt-4',
    'group-has-[[data-slot=item-description]]/item:items-start',
    'peer-has-checked:hidden',
    '[&>ul]:flex',
    '[&_svg]:size-4',
    'in-data-open:flex',
    'not-in-data-collapsible-icon:group-has-[[data-sidebar=menu-action]]/menu-item:pe-8',
    'group-data-collapsible-icon:[&>[data-sidebar=group-label]]:mt-0',
    'has-[>[data-variant=outline]]:[&>[role=combobox]]:w-full',
  ])('skips %s: it styles a descendant or reads one, which no recipe block reaches', (utility) => {
    expect(gate(`<div :class="['${utility}', props.class]" />`)).toEqual([])
  })

  it('holds a utility behind its own state, a group’s state or a container step, which are not relational', () => {
    expect(gate(`<div :class="['data-vertical:flex-col group-data-vertical/tabs:w-full @md:gap-2 first:-ms-0.5 hover:flex', props.class]" />`).map((f) => f.utility)).toEqual([
      'data-vertical:flex-col',
      'group-data-vertical/tabs:w-full',
      '@md:gap-2',
      'first:-ms-0.5',
      'hover:flex',
    ])
  })

  it('names the variants it skips', () => {
    expect(Object.isFrozen(RELATIONAL_VARIANTS)).toBe(true)
    expect(['*', '**', 'has-[>a]', 'group-has-[>a]/x', 'peer-has-checked', '[&>a]', 'in-data-open', 'not-in-data-open'].every(isRelational)).toBe(true)
    expect(['data-open', 'group-data-open/x', 'hover', '@md', 'first', 'file', 'inset-0'].some(isRelational)).toBe(false)
  })
})
