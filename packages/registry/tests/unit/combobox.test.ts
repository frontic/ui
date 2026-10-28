// @vitest-environment happy-dom
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { injectComboboxRootContext } from 'reka-ui'
import { readRegistryRecipes } from '../../scripts/lib/recipes'
import { Combobox, ComboboxAnchor, ComboboxSeparator, ComboboxTrigger } from '../../ui/combobox'

const anchor = async (props: Record<string, unknown> = {}) => {
  const host = document.createElement('div')
  host.innerHTML = await renderToString(h(Combobox, null, () => h(ComboboxAnchor, props, () => h(ComboboxTrigger, null, () => 'Ship to'))))
  return host.querySelector('[data-slot="combobox-anchor"]')!.className.split(' ')
}

describe('a ComboboxAnchor', () => {
  it('hugs its trigger, so the list it sizes is as wide as the trigger', async () => {
    expect(await anchor()).toEqual(['fui-combobox-anchor'])
    const { trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))
    expect(trees['combobox-anchor']!.base).toEqual({ display: 'inline-flex', width: 'fit' })
  })

  it('takes a width from the consumer', async () => {
    expect(await anchor({ class: 'w-full' })).toContain('w-full')
  })
})

describe('a ComboboxSeparator', () => {
  const separator = async (search: string) => {
    const Searched = defineComponent(() => {
      injectComboboxRootContext().filterSearch.value = search
      return () => h(ComboboxSeparator)
    })
    const host = document.createElement('div')
    host.innerHTML = await renderToString(h(Combobox, null, () => h(Searched)))
    return host.querySelector<HTMLElement>('[data-slot="combobox-separator"]')!.style.display
  }

  it('shows between groups, and hides while a search filters them, so no line is left beside an emptied group', async () => {
    expect(await separator('')).toBe('')
    expect(await separator('sw')).toBe('none')
  })
})

describe('the option lists', () => {
  const { trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))

  it('take their items from option-item, not from the menu family they would have to undo', () => {
    for (const name of ['combobox-item', 'select-item', 'autocomplete-item']) {
      expect(trees[name]!.base, name).toMatchObject({ extends: 'option-item' })
      expect(Object.keys(trees[name]!.base), name).not.toEqual(expect.arrayContaining(['fontSize']))
    }
  })
})
