import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderBaseCss, stylePresetPath } from '@frontic/library-contract/brand'
import { compile } from 'tailwindcss'
import { describe, expect, it } from 'vitest'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

const root = join(import.meta.dirname, '../..')
const source = (file: string) => readFileSync(join(root, 'ui', file), 'utf8')

// A size container has no content width: in a shrink-to-fit parent (a popover, a centred stage) the calendar collapses to its padding.
describe('calendar width', () => {
  it.each(['calendar/Calendar.vue', 'range-calendar/RangeCalendar.vue'])('%s is never a size container', (file) => {
    expect(source(file)).not.toMatch(/@container|@sm:/)
  })

  // The months sit in a wrapping row; a month as wide as the row pushes the next one below however much room there is.
  it.each(['calendar/CalendarGrid.vue', 'range-calendar/RangeCalendarGrid.vue'])('%s takes its own width, so two months fit side by side', (file) => {
    expect(source(file)).not.toMatch(/\bw-full\b/)
  })

  // A column parent may stretch the calendar; the header centres the month name, so the months centre too.
  it.each(['calendar/Calendar.vue', 'range-calendar/RangeCalendar.vue'])('%s centres its months under its header', (file) => {
    expect(source(file)).toMatch(/class="mt-4 flex flex-wrap justify-center gap-4"/)
  })

  // The example's two calendars wrap below each other in a narrow card; a row that starts them at the left leaves the card's right half empty.
  it('the example centres its calendars when they wrap', () => {
    expect(source('calendar/calendar.example.vue')).toMatch(/<template>\s*<div class="flex flex-wrap items-start justify-center gap-8">/)
  })

  // The popover's recipe gives it a width; a fixed one holds one month, so a second month wraps below it.
  it('the date picker popover takes the width of the months it shows', async () => {
    const recipes = readRegistryRecipes(root)
    expect(recipes.trees['date-picker-content']!.base).toHaveProperty('width', 'auto')
    const classes = /class="([^"]*)"/.exec(source('date-picker/DatePickerContent.vue'))![1]!.split(/\s+/)
    expect(classes).toContain('fui-date-picker-content')
    const base = renderBaseCss(JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')), recipes, { scope: 'project' }).replace(/^@import[^;]*;\n?/gm, '')
    const css = (await compile(`${base}\n@tailwind utilities;\n`)).build(['fui-popover-content', ...classes])
    const widths = [...css.matchAll(/^\s*\.(\S+) \{[^}]*?\bwidth: ([^;]+);/gm)].map(([, selector, width]) => `${selector}: ${width}`)
    expect(widths.at(-1)).toBe('fui-date-picker-content: var(--fui-date-picker-content-width)')
    expect(widths).toContain('fui-popover-content: var(--fui-popover-content-width)')
    expect(base).toContain('--fui-date-picker-content-width: auto;')
  })
})
