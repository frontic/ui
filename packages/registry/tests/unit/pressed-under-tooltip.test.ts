import { RECIPE_STATES } from '@frontic/library-contract/recipe'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import Toggle from '../../ui/toggle/Toggle.vue'
import Tooltip from '../../ui/tooltip/Tooltip.vue'
import TooltipProvider from '../../ui/tooltip/TooltipProvider.vue'
import TooltipTrigger from '../../ui/tooltip/TooltipTrigger.vue'

const render = () =>
  renderToString(
    createSSRApp({
      render: () => h(TooltipProvider, null, () => h(Tooltip, null, () => h(TooltipTrigger, { asChild: true }, () => h(Toggle, { defaultValue: true, 'aria-label': 'Bold' }, () => 'B')))),
    }),
  )

describe('a pressed toggle under a tooltip trigger', () => {
  it('loses data-state=on to the tooltip but keeps aria-pressed, which the checked state reads', async () => {
    const html = await render()
    expect(html).not.toContain('data-state="on"')
    expect(html).toContain('aria-pressed="true"')
    expect(RECIPE_STATES.checked).toContain('[aria-pressed=true]')
  })
})
