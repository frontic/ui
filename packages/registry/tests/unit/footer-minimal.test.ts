// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { FooterMinimal } from '../../sections/footer-minimal'

let app: ReturnType<typeof createApp> | undefined
const mount = async (props: Record<string, unknown>) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(FooterMinimal, props) })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

describe('footer minimal', () => {
  it('ships no social links the store did not pass', async () => {
    await mount({})
    expect(document.querySelectorAll('a[aria-label]')).toHaveLength(0)
  })

  it('names its row of links apart from the header navigation', async () => {
    await mount({ links: [{ label: 'Help', href: '/help' }] })
    expect(document.querySelector('nav')!.getAttribute('aria-label')).toBe('Footer')
  })
})
