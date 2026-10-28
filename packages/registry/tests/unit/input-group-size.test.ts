// @vitest-environment happy-dom
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { InputGroup, InputGroupInput } from '../../ui/input-group'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

const render = async (props: Record<string, unknown>) => {
  const host = document.createElement('div')
  host.innerHTML = await renderToString(h(InputGroup, props, () => h(InputGroupInput)))
  const group = host.querySelector<HTMLElement>('[data-slot="input-group"]')!
  const input = host.querySelector('input')!
  return { group: group.dataset.size, sm: group.classList.contains('fui-input-group-sm'), input: input.dataset.size }
}

describe('an InputGroup’s size', () => {
  it('is md unless set, and so is its input', async () => {
    expect(await render({})).toEqual({ group: 'md', sm: false, input: 'md' })
  })

  it('takes sm, and its input follows', async () => {
    expect(await render({ size: 'sm' })).toEqual({ group: 'sm', sm: true, input: 'sm' })
  })

  it('matches Input’s heights, with md’s in the base so a component that sizes its own group still wins', () => {
    const { trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))
    const height = (name: string) => (trees[name]!.base as Record<string, unknown>).height
    expect([height('input-group'), trees['input-group']!.variants!.size]).toEqual([height('input'), trees.input!.variants!.size])
  })
})
