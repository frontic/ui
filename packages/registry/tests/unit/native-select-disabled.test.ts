import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import NativeSelect from '../../ui/native-select/NativeSelect.vue'

const wrapperClass = async () => {
  const html = await renderToString(h(NativeSelect, null, () => [h('option', { value: 'a' }, 'A'), h('option', { value: 'b', disabled: true }, 'B')]))
  return /<div class="([^"]*)"[^>]*data-slot="native-select-wrapper"/.exec(html)![1]!
}

describe('NativeSelect', () => {
  it('dims only when the select is disabled, not when one of its options is', async () => {
    const classes = (await wrapperClass()).split(' ')
    expect(classes).toContain('has-[select:disabled]:fui-disabled')
    expect(classes).not.toContain('has-disabled:fui-disabled')
  })
})
