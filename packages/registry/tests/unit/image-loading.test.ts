// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Image } from '../../ui/image'

const img = async (props: Record<string, unknown>) => {
  const host = document.createElement('div')
  host.innerHTML = await renderToString(h(Image, { src: '/a.jpg', alt: '', ...props }))
  const el = host.querySelector('img')!
  return { loading: el.getAttribute('loading'), decoding: el.getAttribute('decoding'), fetchpriority: el.getAttribute('fetchpriority') }
}

describe('an Image', () => {
  it('loads lazily by default, so a long grid fetches only what nears the viewport', async () => {
    expect(await img({})).toEqual({ loading: 'lazy', decoding: 'async', fetchpriority: null })
  })

  it('loads first with priority, for the page’s largest paint', async () => {
    expect(await img({ priority: true })).toEqual({ loading: 'eager', decoding: 'auto', fetchpriority: 'high' })
  })

  it('lets a loading attribute passed by the consumer win', async () => {
    expect((await img({ loading: 'eager' })).loading).toBe('eager')
  })
})

describe('an Image with the blur effect', () => {
  const layer = async (props: Record<string, unknown>) => {
    const host = document.createElement('div')
    host.innerHTML = await renderToString(h(Image, { src: '/a.jpg', alt: '', loadingEffect: 'blur', ...props }))
    const loading = host.querySelector('[data-slot="image-loading"]')!
    return { preview: loading.querySelector('img')?.getAttribute('src') ?? null, pulse: loading.className.includes('animate-pulse') }
  }

  it('shows the placeholder image blurred while the image loads', async () => {
    expect(await layer({ placeholderSrc: '/a-24.jpg' })).toEqual({ preview: '/a-24.jpg', pulse: false })
  })

  it('loads the preview lazily too, unless the image has priority', async () => {
    const preview = async (props: Record<string, unknown>) => {
      const host = document.createElement('div')
      host.innerHTML = await renderToString(h(Image, { src: '/a.jpg', alt: '', loadingEffect: 'blur', placeholderSrc: '/a-24.jpg', ...props }))
      return host.querySelector('[data-slot="image-loading"] img')!.getAttribute('loading')
    }
    expect([await preview({}), await preview({ priority: true })]).toEqual(['lazy', 'eager'])
  })

  it('pulses like the skeleton without a placeholder image', async () => {
    expect(await layer({})).toEqual({ preview: null, pulse: true })
  })

  it('holds the pulse still when the shopper asks for reduced motion', async () => {
    const host = document.createElement('div')
    host.innerHTML = await renderToString(h(Image, { src: '/a.jpg', alt: '' }))
    expect(host.querySelector('[data-slot="image-loading"]')!.classList.contains('motion-reduce:animate-none')).toBe(true)
  })
})

describe('an Image that fails to load', () => {
  const failed = async (alt: string) => {
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp(() => h(Image, { src: '/missing.jpg', alt }))
    app.mount(host)
    host.querySelector('img')!.dispatchEvent(new Event('error'))
    await nextTick()
    const root = host.querySelector('[data-slot="image"]')!
    const name = { fallback: !!root.querySelector('[data-slot="image-fallback"]'), role: root.getAttribute('role'), label: root.getAttribute('aria-label') }
    app.unmount()
    host.remove()
    return name
  }

  it('keeps its alt text for screen readers in place of the broken image', async () => {
    expect(await failed('Summit Series Winter Parka')).toEqual({ fallback: true, role: 'img', label: 'Summit Series Winter Parka' })
  })

  it('stays silent when the image is decorative', async () => {
    expect(await failed('')).toEqual({ fallback: true, role: null, label: null })
  })
})
