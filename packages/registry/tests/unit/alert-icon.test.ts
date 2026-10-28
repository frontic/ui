// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { createApp, h } from 'vue'
import { Alert, AlertTitle } from '../../ui/alert'

const render = (props: Record<string, unknown>, slots: Record<string, () => unknown> = {}) => {
  const host = document.createElement('div')
  createApp(() => h(Alert, props, { default: () => h(AlertTitle, null, () => 'Saved'), ...slots })).mount(host)
  return host.querySelector('[data-slot="alert"]')!
}
const icons = (alert: Element) => [...alert.querySelectorAll('svg')].map((svg) => [...svg.classList].find((name) => name.startsWith('lucide-'))?.replace(/-icon$/, ''))

describe("an alert's icon", () => {
  it.each([
    ['neutral', 'lucide-bell-ring'],
    ['info', 'lucide-info'],
    ['success', 'lucide-circle-check'],
    ['warning', 'lucide-triangle-alert'],
    ['error', 'lucide-octagon-x'],
  ])('is the state’s own for %s, beside the content as its icon', (variant, icon) => {
    const alert = render({ variant })
    expect(icons(alert)).toEqual([icon])
    expect(alert.querySelector('svg')!.hasAttribute('data-icon')).toBe(true)
  })

  it('is the bell without a variant', () => {
    expect(icons(render({}))).toEqual(['lucide-bell-ring'])
  })

  it('is whatever the icon slot holds instead', () => {
    const alert = render({ variant: 'info' }, { icon: () => h('svg', { class: 'lucide-zap', 'data-icon': '' }) })
    expect(icons(alert)).toEqual(['lucide-zap'])
  })

  it('is left out with icon false', () => {
    expect(icons(render({ variant: 'success', icon: false }))).toEqual([])
  })
})
