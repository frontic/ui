// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { Stepper, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger } from '../../ui/stepper'
import StepperDemo from '../../ui/stepper/stepper.example.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

const classes = (slot: string) => document.querySelector(`[data-slot="${slot}"]`)!.getAttribute('class')!.split(' ')

const twoSteps = (props: Record<string, unknown> = {}) =>
  h(Stepper, props, () =>
    [1, 2].map((step) =>
      h(StepperItem, { step }, () => [h(StepperTrigger, () => [h(StepperIndicator, () => String(step)), h(StepperTitle, () => `Step ${step}`)]), step === 1 ? h(StepperSeparator) : null]),
    ),
  )

describe('a stepper', () => {
  it('marks a horizontal row by default and a vertical column when asked', async () => {
    await mount(() => twoSteps())
    const root = document.querySelector('[data-slot="stepper"]')!
    expect([root.hasAttribute('data-horizontal'), root.hasAttribute('data-vertical')]).toEqual([true, false])
    app!.unmount()
    await mount(() => twoSteps({ orientation: 'vertical' }))
    const column = document.querySelector('[data-slot="stepper"]')!
    expect([column.hasAttribute('data-horizontal'), column.hasAttribute('data-vertical')]).toEqual([false, true])
  })

  it('stacks steps with the text beside the indicator and runs an unbroken line from circle to circle when vertical', async () => {
    await mount(() => twoSteps({ orientation: 'vertical' }))
    expect(classes('stepper')).toEqual(expect.arrayContaining(['group/stepper', 'data-vertical:flex-col']))
    expect(classes('stepper-item')).toEqual(expect.arrayContaining(['group-data-vertical/stepper:relative', 'group-data-vertical/stepper:has-[[data-slot=stepper-separator]]:pb-3']))
    expect(classes('stepper-trigger')).toEqual(expect.arrayContaining(['group-data-vertical/stepper:grid-cols-1', 'group-data-vertical/stepper:auto-cols-min']))
    expect(classes('stepper-indicator')).toEqual(expect.arrayContaining(['group-data-vertical/stepper:col-end-1', 'group-data-vertical/stepper:row-span-2']))
    expect(classes('stepper-title')).toContain('group-data-vertical/stepper:col-start-1')
    expect(classes('stepper-separator')).toEqual(expect.arrayContaining(['group-data-vertical/stepper:absolute', 'group-data-vertical/stepper:top-5', 'group-data-vertical/stepper:h-full']))
  })

  it('draws a step the user cannot reach at full strength, so its circle stays legible', async () => {
    await mount(() =>
      h(Stepper, { modelValue: 1 }, () =>
        [1, 2].map((step) => h(StepperItem, { step, disabled: step === 2 }, () => [h(StepperTrigger, () => h(StepperIndicator, () => String(step))), step === 1 ? h(StepperSeparator) : null])),
      ),
    )
    expect(document.querySelectorAll('[data-slot="stepper-item"][data-disabled]')).toHaveLength(1)
    expect(document.querySelectorAll('[class*="fui-disabled"]')).toHaveLength(0)
  })

  it('mutes upcoming titles and weights the current one', async () => {
    await mount(() => twoSteps({ modelValue: 1 }))
    expect([...document.querySelectorAll('[data-slot="stepper-title"]')].map((title) => title.classList.contains('fui-stepper-title-active'))).toEqual([true, false])
    expect(document.querySelectorAll('.fui-stepper-title-inactive')).toHaveLength(1)
  })

  it('fills the line after a done step only, and fills the next one when the user moves on', async () => {
    const step = ref(2)
    const fills = () => [...document.querySelectorAll('[data-slot="stepper-separator-fill"]')].map((fill) => fill.hasAttribute('data-filled'))
    await mount(() =>
      h(Stepper, { modelValue: step.value }, () =>
        [1, 2, 3].map((n) => h(StepperItem, { step: n }, () => [h(StepperTrigger, () => h(StepperIndicator, () => String(n))), n < 3 ? h(StepperSeparator) : null])),
      ),
    )
    expect(fills()).toEqual([true, false])
    step.value = 3
    await nextTick()
    expect(fills()).toEqual([true, true])
  })

  it('names only the current step and says where the user is when the row is narrow', async () => {
    await mount(() => twoSteps({ modelValue: 2, statusLabel: (step: number, total: number) => `${step}/${total}` }))
    const titles = [...document.querySelectorAll('[data-slot="stepper-title"]')]
    expect(titles.map((title) => title.hasAttribute('data-current'))).toEqual([false, true])
    expect(document.querySelector('[data-slot="stepper-status"]')!.textContent!.trim()).toBe('2/2')
  })

  it('leaves the status out of a vertical stepper, which names every step', async () => {
    await mount(() => twoSteps({ orientation: 'vertical' }))
    expect(document.querySelector('[data-slot="stepper-status"]')).toBeNull()
  })
})

describe('the stepper demo', () => {
  it('is a checkout at payment: cart and address done with a check, review upcoming', async () => {
    await mount(() => h(StepperDemo))
    const items = [...document.querySelectorAll('[data-slot="stepper-item"]')]
    expect(items.map((item) => item.getAttribute('data-state'))).toEqual(['completed', 'completed', 'active', 'inactive'])
    expect(items.map((item) => item.querySelector('[data-slot="stepper-title"]')!.textContent)).toEqual(['Cart', 'Address', 'Payment', 'Review'])
    expect(items.map((item) => item.querySelector('[data-slot="stepper-indicator"] [data-icon]') !== null)).toEqual([true, true, false, false])
    expect(document.querySelector('[data-slot="stepper-status"]')!.textContent!.trim()).toBe('Step 3 of 4')
  })
})
