// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../../ui/input-group'
import { Kbd } from '../../ui/kbd'

const addonClass = async (align: 'inline-start' | 'inline-end', child: () => unknown) => {
  const host = document.createElement('div')
  host.innerHTML = await renderToString(h(InputGroup, null, () => [h(InputGroupInput), h(InputGroupAddon, { align }, child)]))
  return host.querySelector('[data-slot="input-group-addon"]')!.className
}

describe('an InputGroup addon at the edge of the line', () => {
  it.each([
    ['a key', 'inline-end', () => h(Kbd, null, () => '/')],
    ['a key', 'inline-start', () => h(Kbd, null, () => '/')],
    ['a button', 'inline-end', () => h(InputGroupButton, { 'aria-label': 'Clear' })],
    ['a button', 'inline-start', () => h(InputGroupButton, { 'aria-label': 'Clear' })],
  ] as const)('keeps %s inside the underline at %s', async (_, align, child) => {
    expect(await addonClass(align, child)).not.toMatch(/(^|\s)\S*-m[se]-1(\s|$)/)
  })
})
