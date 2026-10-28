// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Field, type FieldOrientation } from '../../ui/field'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())
const classesOf = async (orientation: FieldOrientation) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(Field, { orientation }, () => h('div')) })
  app.mount('#app')
  await nextTick()
  return [...document.querySelector('[data-slot="field"]')!.classList]
}

// A column Field stretches its children through flexbox; a control that wants to fill it wears w-full itself.
describe('a Field', () => {
  it.each<FieldOrientation>(['vertical', 'horizontal', 'responsive'])('%s declares no width on its children', async (orientation) => {
    const widths = (await classesOf(orientation)).filter((c) => /(?:^|:)\*:w-|\.sr-only\]:w-/.test(c))
    expect(widths).toEqual([])
  })
})
