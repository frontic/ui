import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import HeaderCheckout from '../../templates/header-checkout/HeaderCheckout.vue'

const steps = [
  { label: 'Cart', value: 10 },
  { label: 'Shipping', value: 20 },
  { label: 'Payment', value: 30 },
]

const render = async (props: Record<string, unknown>) => (await renderToString(h(HeaderCheckout, { steps, ...props }))).replace(/<!--.*?-->/g, '')

describe('header-checkout', () => {
  it('says where the shopper is by the current step’s position, not its value', async () => {
    const html = await render({ step: 20 })
    expect(/<span data-slot="stepper-status"[^>]*>\s*([^<]*?)\s*<\/span>/.exec(html)?.[1]).toBe('Step 2 of 3')
    expect(/<h4[^>]*\sdata-current[\s>][^>]*>([^<]*)<\/h4>/.exec(html)?.[1]).toBe('Shipping')
  })

  it('carries the steps in a band below the header row at every width', async () => {
    const html = await render({ step: 20 })
    expect(html).toMatch(/<div data-slot="header-checkout-steps" class="[^"]*"><div [^>]*data-slot="stepper"/)
    expect(/<div data-slot="header-checkout-steps" class="([^"]*)"/.exec(html)![1].split(' ')).not.toContain('hidden')
    expect(html).not.toContain('role="progressbar"')
  })

  it('leaves the band out when the step is not in steps', async () => {
    const html = await render({ step: 99 })
    expect(html).not.toContain('header-checkout-steps')
    expect(html).not.toContain('data-slot="stepper"')
  })
})
