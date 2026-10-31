// @vitest-environment happy-dom
import { join } from 'node:path'
import { CalendarDate } from '@internationalized/date'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { readRegistryRecipes } from '../../scripts/lib/recipes'
import { Calendar } from '../../ui/calendar'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

describe('a Calendar', () => {
  it('names the months in its dropdown in the locale it has now, not the one it started with', async () => {
    const locale = ref('en')
    await mount(() => h(Calendar, { locale: locale.value, layout: 'month-and-year', defaultPlaceholder: new CalendarDate(2026, 10, 13) }))
    const month = () => document.querySelector('.fui-calendar-select-label')!.textContent!.trim()
    expect(month()).toBe('Oct')
    locale.value = 'de'
    await nextTick()
    await nextTick()
    expect(month()).toBe('Okt')
  })

  it('shows the month of the first day that can be picked when today cannot', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 31, 12))
    try {
      await mount(() => h(Calendar, { locale: 'en-US', minValue: new CalendarDate(2026, 11, 1) }))
      expect(document.querySelector('[data-slot="calendar-heading"]')!.textContent!.trim()).toBe('November 2026')
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows the month of the last day that can be picked when today is past it', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 1, 12))
    try {
      await mount(() => h(Calendar, { locale: 'en-US', maxValue: new CalendarDate(2026, 10, 31) }))
      expect(document.querySelector('[data-slot="calendar-heading"]')!.textContent!.trim()).toBe('October 2026')
    } finally {
      vi.useRealTimers()
    }
  })

  it('takes its padding from recipes, not from utilities', async () => {
    await mount(() => h(Calendar))
    const root = document.querySelector('[data-slot="calendar"]')!
    const header = document.querySelector('[data-slot="calendar-header"]')!
    expect(root.classList.contains('fui-calendar')).toBe(true)
    expect(header.classList.contains('fui-calendar-header')).toBe(true)
    expect([...root.classList, ...header.classList].filter((c) => /^p[xyt]?-/.test(c))).toEqual([])
  })

  it('sets its weekday header in the brand’s caption style', () => {
    const { flat, trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))
    expect([flat['calendar-weekday']!.typography, flat['calendar-weekday']!.fontSize]).toEqual(['{typography.caption}', undefined])
    for (const tree of ['calendar-head-cell', 'range-calendar-head-cell']) {
      const head = trees[tree]!.base as Record<string, unknown>
      expect([head.extends, head.typography, head.fontSize], tree).toEqual(['calendar-weekday', undefined, undefined])
    }
  })
})
