import { SelectRoot } from 'reka-ui'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import SelectValue from '../../ui/select/SelectValue.vue'

const render = (slots?: Record<string, () => unknown>) => renderToString(createSSRApp({ render: () => h(SelectRoot, null, { default: () => h(SelectValue, { placeholder: 'Choose size' }, slots) }) }))

describe('SelectValue', () => {
  it('sets an empty select’s placeholder in the placeholder recipe, so it never reads as a chosen value', async () => {
    const html = await render()
    expect(html).toContain('data-placeholder="Choose size"')
    expect(html).toMatch(/<span class="fui-select-value-placeholder">Choose size<\/span>/)
  })
  it('leaves a passed slot unstyled', async () => {
    const html = await render({ default: () => 'Medium' })
    expect(html).toContain('Medium')
    expect(html).not.toContain('fui-select-value-placeholder')
  })
})
