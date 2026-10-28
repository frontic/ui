// @vitest-environment happy-dom
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Input } from '../../ui/input'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

const render = async (props: Record<string, unknown>) => {
  const host = document.createElement('div')
  host.innerHTML = await renderToString(h(Input, props))
  const el = host.querySelector('input')!
  return { size: el.dataset.size, md: el.classList.contains('fui-input-md'), sm: el.classList.contains('fui-input-sm') }
}

describe('an Input’s size', () => {
  it('is md unless set', async () => {
    expect(await render({})).toEqual({ size: 'md', md: true, sm: false })
  })

  it('takes sm, to line up with a small Select', async () => {
    expect(await render({ size: 'sm' })).toEqual({ size: 'sm', md: false, sm: true })
  })

  it('matches the select trigger’s heights', () => {
    const { trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))
    const select = trees['select-trigger']!.variants!.size!
    const input = trees.input!
    expect([(input.base as Record<string, unknown>).height, input.variants!.size!.sm]).toEqual([select.md!.height, select.sm])
  })

  it('keeps md’s height in the base, so a component that sizes its own Input, like SidebarInput, still wins', () => {
    const { trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))
    expect(trees.input!.variants!.size!.md).toEqual({})
  })
})
