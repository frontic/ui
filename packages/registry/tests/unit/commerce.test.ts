// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { FilterSwitch } from '../../ui/filter'
import { Swatch } from '../../ui/swatch'
import { SwatchGroup, SwatchGroupItem } from '../../ui/swatch-group'

function mount(render: () => unknown) {
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(defineComponent({ setup: () => render }))
  app.mount('#app')
  return app
}

const swatches = () => [...document.querySelectorAll<HTMLButtonElement>('[data-slot="swatch"], [data-slot="swatch-group-item"]')]

afterEach(() => {
  document.body.innerHTML = ''
})

describe('a swatch', () => {
  it('toggles on its own', async () => {
    const pressed = ref(false)
    const app = mount(() => h(Swatch, { hex: '#3b82f6', modelValue: pressed.value, 'onUpdate:modelValue': (v: boolean) => (pressed.value = v) }))
    swatches()[0]!.click()
    await nextTick()
    expect(pressed.value).toBe(true)
    expect(swatches()[0]!.dataset.state).toBe('on')
    app.unmount()
  })

  it('dims once when disabled on its own', () => {
    const app = mount(() => h(Swatch, { hex: '#3b82f6', disabled: true }))
    expect(swatches()[0]!.closest('label')!.hasAttribute('data-disabled')).toBe(false)
    app.unmount()
  })

  it('joins its group: a pick sets the group’s value and the group’s shape and size reach every item', async () => {
    const picked = ref<unknown>('red')
    const app = mount(() =>
      h(SwatchGroup, { type: 'single', shape: 'pill', size: 'sm', modelValue: picked.value, 'onUpdate:modelValue': (v: unknown) => (picked.value = v) }, () => [
        h(SwatchGroupItem, { value: 'red', hex: '#ef4444' }),
        h(SwatchGroupItem, { value: 'blue', hex: '#3b82f6' }),
      ]),
    )
    await nextTick()
    expect(swatches().map((s) => s.dataset.state)).toEqual(['on', 'off'])
    swatches()[1]!.click()
    await nextTick()
    expect(picked.value).toBe('blue')
    expect(swatches().map((s) => s.dataset.state)).toEqual(['off', 'on'])
    for (const s of swatches()) expect(s.classList).toContain('fui-swatch-pill')
    for (const s of swatches()) expect(s.classList).toContain('fui-swatch-sm')
    for (const s of swatches()) expect(s.dataset.slot).toBe('swatch-group-item')
    expect(document.querySelector('[data-slot="swatch-fallback"]')!.className).toContain('fui-swatch-fallback-pill')
    app.unmount()
  })
})

describe('a filter switch', () => {
  it('reports the switch’s new state', async () => {
    const changes: boolean[] = []
    const app = mount(() => h(FilterSwitch, { label: 'In stock', value: false, onChange: (v: boolean) => changes.push(v) }))
    document.querySelector<HTMLButtonElement>('[data-slot="switch"]')!.click()
    await nextTick()
    expect(changes).toEqual([true])
    app.unmount()
  })
})
