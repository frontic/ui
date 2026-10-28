// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput } from '../../ui/number-field'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

describe('a number field step', () => {
  // The step recipe sizes only an icon marked data-icon; an unmarked one renders at its own 24px and makes the step taller than the input.
  it.each(['decrement', 'increment'])('marks its default %s icon, so the recipe sizes it', async (step) => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({
      render: () => h(NumberField, { defaultValue: 1 }, () => h(NumberFieldContent, null, () => [h(NumberFieldDecrement), h(NumberFieldInput), h(NumberFieldIncrement)])),
    })
    app.mount('#app')
    await nextTick()
    expect(document.querySelector(`[data-slot="number-field-${step}"] > [data-icon]`)).not.toBeNull()
  })
})
