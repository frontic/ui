import { RadioGroupItem, RadioGroupRoot } from 'reka-ui'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { Field, FieldLabel } from '../../ui/field'

const render = (children: () => unknown) => renderToString(createSSRApp({ render: () => h(RadioGroupRoot, { modelValue: 'a' }, { default: () => h(FieldLabel, null, { default: children }) }) }))
const labelClass = (html: string) => /data-slot="field-label"[^>]*class="([^"]*)"/.exec(html)?.[1] ?? /class="([^"]*)"[^>]*data-slot="field-label"/.exec(html)?.[1]

describe('FieldLabel', () => {
  it('is a choice card when a Field sits in it, server-rendered too', async () => {
    const html = await render(() => h(Field, { orientation: 'horizontal' }, { default: () => [h(RadioGroupItem, { value: 'a' }), 'Plan A'] }))
    expect(labelClass(html)).toContain('fui-field-label-card')
  })

  it('stays a plain label around text', async () => {
    expect(labelClass(await render(() => 'Plan A'))).toContain('fui-field-label-default')
  })
})
