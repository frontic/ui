// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { NativeSelect, NativeSelectOption } from '../../ui/native-select'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

const mount = async (props: Record<string, unknown> = {}) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({
    render: () =>
      h(NativeSelect, props, () => [
        h(NativeSelectOption, { value: '', disabled: true }, () => 'Select a country'),
        h(NativeSelectOption, { value: 'de' }, () => 'Germany'),
        h(NativeSelectOption, { value: 'ch' }, () => 'Switzerland'),
      ]),
  })
  app.mount('#app')
  await nextTick()
  return document.querySelector('select')!
}

describe('a native select', () => {
  it('marks its empty option as the placeholder until a choice is made', async () => {
    const select = await mount()
    expect(select.hasAttribute('data-placeholder')).toBe(true)
    select.value = 'ch'
    select.dispatchEvent(new Event('change'))
    await nextTick()
    expect(select.hasAttribute('data-placeholder')).toBe(false)
  })

  it('shows a set value as a value, not a placeholder', async () => {
    expect((await mount({ modelValue: 'de' })).hasAttribute('data-placeholder')).toBe(false)
  })

  it('keeps its options in the text colour while the placeholder is muted', async () => {
    const select = await mount()
    expect([...select.options].every((option) => option.classList.contains('fui-native-select-option'))).toBe(true)
  })

  it('renders a wrapper’s data-slot, its own otherwise', async () => {
    expect((await mount({ 'data-slot': 'quantity-select' })).dataset.slot).toBe('quantity-select')
    expect((await mount()).dataset.slot).toBe('native-select')
  })
})
