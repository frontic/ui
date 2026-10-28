// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Checkbox } from '../../ui/checkbox'
import { Field, FieldContent, FieldLabel, FieldTitle } from '../../ui/field'

const classes = async (tree: ReturnType<typeof h>, slot = 'field-label') => {
  const host = document.createElement('div')
  host.innerHTML = await renderToString(tree)
  return [...host.querySelectorAll(`[data-slot="${slot}"]`)].map((label) => label.className.split(' ').includes('fui-field-label-beside'))
}

describe('a FieldLabel', () => {
  it('is set in sentence case beside its checkbox, radio or switch, also inside FieldContent', async () => {
    expect(await classes(h(Field, { orientation: 'horizontal' }, () => [h(Checkbox), h(FieldLabel, null, () => 'All newsletters')]))).toEqual([true])
    expect(await classes(h(Field, { orientation: 'horizontal' }, () => [h(Checkbox), h(FieldContent, null, () => h(FieldLabel, null, () => 'Weekly drops'))]))).toEqual([true])
  })

  it('keeps the uppercase caption above a control, and on a choice card', async () => {
    expect(await classes(h(Field, null, () => h(FieldLabel, null, () => 'Email')))).toEqual([false])
    expect(await classes(h(Field, { orientation: 'responsive' }, () => h(FieldLabel, null, () => 'Email')))).toEqual([false])
    expect(await classes(h(FieldLabel, null, () => h(Field, { orientation: 'horizontal' }, () => [h(Checkbox), h(FieldLabel, null, () => 'Express')])))).toEqual([false, true])
  })
})

describe('a FieldTitle', () => {
  it('is set in sentence case on a choice card beside its radio, and keeps the caption above a control', async () => {
    const card = h(FieldLabel, null, () => h(Field, { orientation: 'horizontal' }, () => [h(FieldContent, null, () => h(FieldTitle, null, () => 'Express')), h(Checkbox)]))
    expect(await classes(card, 'field-title')).toEqual([true])
    expect(
      await classes(
        h(Field, null, () => h(FieldTitle, null, () => 'Delivery')),
        'field-title',
      ),
    ).toEqual([false])
  })
})
