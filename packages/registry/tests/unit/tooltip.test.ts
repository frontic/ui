// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import TooltipDemo from '../../ui/tooltip/tooltip.example.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
  await nextTick()
}
afterEach(() => app?.unmount())

describe('the tooltip demo', () => {
  it('names its wishlist button with the words its tooltip shows, and hides the arrow from screen readers', async () => {
    await mount(() => h(TooltipDemo))
    const trigger = document.querySelector('[data-slot="tooltip-trigger"]')!
    const content = document.querySelector('[data-slot="tooltip-content"]')!
    expect(trigger.getAttribute('aria-label')).toBe('Save to wishlist')
    expect(document.querySelector('[role="tooltip"]')!.textContent).toBe('Save to wishlist')
    expect(content.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
  })
})
