import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import InputGroupButton from '../../ui/input-group/InputGroupButton.vue'

const render = (size?: 'xs' | 'sm' | 'icon-xs' | 'icon-sm') => renderToString(h(InputGroupButton, { size }, () => 'Go'))

describe('InputGroupButton', () => {
  it.each(['xs', 'sm', 'icon-xs', 'icon-sm'] as const)('wears only the input-group size at %s, so no button size competes with it', async (size) => {
    const html = await render(size)
    expect(html).toContain(`fui-input-group-button-${size}`)
    expect(html).not.toMatch(/\bfui-button-(?:xs|sm|default|lg|icon)/)
  })
})
