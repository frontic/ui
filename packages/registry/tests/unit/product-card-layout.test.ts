// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import ProductCardBasic from '../../sections/product-card-basic/ProductCardBasic.vue'
import ProductCardFeatured from '../../sections/product-card-featured/ProductCardFeatured.vue'
import ProductCardGallery from '../../sections/product-card-gallery/ProductCardGallery.vue'
import ProductCardHorizontal from '../../sections/product-card-horizontal/ProductCardHorizontal.vue'
import ProductCardHover from '../../sections/product-card-hover/ProductCardHover.vue'
import ProductCardMinimal from '../../sections/product-card-minimal/ProductCardMinimal.vue'

const product = { name: 'Tee', price: { amount: 3500, currency: 'EUR' } }

describe('product cards', () => {
  it.each([
    ['product-card-basic', ProductCardBasic],
    ['product-card-horizontal', ProductCardHorizontal],
    ['product-card-hover', ProductCardHover],
    ['product-card-gallery', ProductCardGallery],
    ['product-card-minimal', ProductCardMinimal],
  ])('%s is a Card whose content sits in CardContent, taking its sides from the recipe', async (_, Card) => {
    const host = document.createElement('div')
    host.innerHTML = await renderToString(h(Card, { product }))
    const content = host.querySelector('[data-slot="card-content"]')!
    expect(content.classList.contains('fui-card-content')).toBe(true)
    expect([...content.classList].filter((c) => /^p[xlr]?-/.test(c))).toEqual([])
  })

  it('puts the add-to-cart button last in the content, pushed to the bottom so tiles in a row line their buttons up', async () => {
    const host = document.createElement('div')
    host.innerHTML = await renderToString(h(ProductCardBasic, { product }))
    const content = host.querySelector('[data-slot="card-content"]')!
    expect([...content.classList]).toEqual(expect.arrayContaining(['flex', 'flex-1', 'flex-col']))
    const button = content.lastElementChild!
    expect(button.getAttribute('data-slot')).toBe('button')
    expect(button.classList).toContain('mt-auto')
  })

  const ALL = [
    ['product-card-basic', ProductCardBasic],
    ['product-card-featured', ProductCardFeatured],
    ['product-card-gallery', ProductCardGallery],
    ['product-card-horizontal', ProductCardHorizontal],
    ['product-card-hover', ProductCardHover],
    ['product-card-minimal', ProductCardMinimal],
  ] as const
  const render = async (Card: (typeof ALL)[number][1], props: Record<string, unknown>) => {
    const host = document.createElement('div')
    host.innerHTML = await renderToString(h(Card, props))
    return host
  }
  const colours = (n: number) => ({ items: Array.from({ length: n }, (_, i) => ({ key: `c${i}`, name: `Colour ${i}`, colors: { exactColorHex: '#000000' } })) })

  it.each(ALL)('%s links its title to the product, and its photo with the same link out of the tab order', async (look, Card) => {
    const host = await render(Card, { product: { ...product, badge: 'Sale', clearout: true, link: { path: '/tee' } } })
    const title = host.querySelector('h3[data-slot="product-card-title"] > a')!
    expect([title.getAttribute('href'), title.textContent]).toEqual(['/tee', 'Tee'])
    expect(title.classList).toContain('focus-visible:fui-focus-ring')
    const photo = host.querySelector('[data-slot="card-image"] a')!
    expect([photo.getAttribute('href'), photo.getAttribute('tabindex'), photo.getAttribute('aria-hidden')]).toEqual(['/tee', '-1', 'true'])
    expect(photo.querySelector(`[data-slot="${look}-image"]`)).not.toBeNull()
    expect(host.querySelectorAll('[data-slot="card-image"] .fui-badge')).toHaveLength(2)
    expect(host.querySelectorAll('[aria-hidden="true"] .fui-badge')).toHaveLength(0)
  })

  it.each(ALL)('%s lifts on hover when raised, and underlines its title on hover when bare', async (_, Card) => {
    const raised = await render(Card, { product })
    expect(raised.querySelector('[data-slot="card"]')!.classList).toContain('fui-product-card-lift')
    expect(raised.querySelector('[data-slot="product-card-title"]')!.classList).not.toContain('group-hover:underline')
    const bare = await render(Card, { product, surface: 'bare' })
    expect(bare.querySelector('[data-slot="card"]')!.classList).not.toContain('fui-product-card-lift')
    expect(bare.querySelector('[data-slot="product-card-title"]')!.classList).toContain('group-hover:underline')
  })

  it.each(ALL)('%s frames its photo square unless given a ratio, so the catalog’s square shots show whole', async (look, Card) => {
    const frame = (host: HTMLElement) => host.querySelector(`[data-slot="${look}-image"] [data-slot="aspect-ratio"]`)!
    const square = frame(await render(Card, { product }))
    expect(square.querySelector('[data-slot="image"], img')).not.toBeNull()
    expect(square.parentElement!.getAttribute('style')).toContain('padding-bottom: 100%')
    expect(frame(await render(Card, { product, ratio: 3 / 4 })).parentElement!.getAttribute('style')).toContain('padding-bottom: 133.33')
  })

  it('keeps the horizontal card’s photo at its ratio beside taller details instead of stretching its column', async () => {
    const host = await render(ProductCardHorizontal, { product })
    expect(host.querySelector('[data-slot="card-image"]')!.classList).toContain('@md:self-start')
    expect([...host.querySelectorAll('[data-slot="card-image"] *')].filter((el) => el.classList.contains('h-full'))).toEqual([])
  })

  it.each(ALL)('%s names its colour swatches', async (_, Card) => {
    const host = await render(Card, { product: { ...product, siblings: colours(2) }, colourLabel: 'Farbe' })
    expect(host.querySelector('[data-slot="swatch-group"]')!.getAttribute('aria-label')).toBe('Farbe')
  })

  it.each([
    ['product-card-basic', 5, ProductCardBasic],
    ['product-card-featured', 5, ProductCardFeatured],
    ['product-card-gallery', 6, ProductCardGallery],
    ['product-card-horizontal', 4, ProductCardHorizontal],
    ['product-card-hover', 4, ProductCardHover],
  ] as const)('%s counts the colours past its %i swatches', async (_, fit, Card) => {
    const exact = await render(Card, { product: { ...product, siblings: colours(fit) } })
    expect(exact.querySelectorAll('[data-slot="swatch-group-item"]')).toHaveLength(fit)
    expect(exact.querySelector('[data-slot="swatch-group"] + [data-slot="meta"]')).toBeNull()
    const over = await render(Card, { product: { ...product, siblings: colours(fit + 2) }, moreColoursLabel: (n: number) => `${n} more` })
    expect(over.querySelectorAll('[data-slot="swatch-group-item"]')).toHaveLength(fit)
    expect(over.querySelector('[data-slot="swatch-group"] + [data-slot="meta"]')!.textContent).toBe('2 more')
  })

  it('stretches the minimal card’s title link over the whole card when it has no swatches, and keeps it to the title when it has', async () => {
    const plain = await render(ProductCardMinimal, { product })
    expect(plain.querySelector('[data-slot="card"]')!.classList).toContain('relative')
    expect([...plain.querySelector('[data-slot="product-card-title"] > a')!.classList]).toEqual(expect.arrayContaining(['after:absolute', 'after:inset-0']))
    const swatched = await render(ProductCardMinimal, { product: { ...product, siblings: colours(2) } })
    expect(swatched.querySelector('[data-slot="product-card-title"] > a')!.classList).not.toContain('after:absolute')
  })

  it('shows no eyebrow unless one is passed', async () => {
    expect(await renderToString(h(ProductCardBasic, { product }))).not.toContain('data-slot="meta"')
    expect(await renderToString(h(ProductCardBasic, { product, eyebrow: 'Basecamp' }))).toContain('<p data-slot="meta" class="fui-meta">Basecamp</p>')
    expect(await renderToString(h(ProductCardGallery, { product: { ...product, description: 'Soft' } }))).toContain('>Soft</p>')
  })

  it("wears gallery's badge part on the Badge", async () => {
    const html = await renderToString(h(ProductCardGallery, { product: { ...product, badge: 'New' } }))
    expect(html).toMatch(/<span data-slot="product-card-gallery-badge"[^>]*class="fui-badge [^"]*fui-product-card-gallery-badge[^"]*">(?:<!--\[-->)?New/)
  })

  it.each([
    ['product-card-basic', ProductCardBasic],
    ['product-card-hover', ProductCardHover],
    ['product-card-horizontal', ProductCardHorizontal],
    ['product-card-gallery', ProductCardGallery],
    ['product-card-minimal', ProductCardMinimal],
  ])('%s forwards the price locale and the stars label', async (_, Card) => {
    const html = await renderToString(h(Card, { product: { ...product, rating: 4 }, locale: 'de-DE', ratingLabel: (score: number, max: number) => `${score} von ${max} Sternen` }))
    expect(html).toContain('aria-label="4 von 5 Sternen"')
    expect(html).toContain('35,00')
  })

  describe('featured', () => {
    const featured = { ...product, brand: 'Northridge', description: 'Warm', badge: 'Insulated', rating: 4.6, reviewCount: 12 }
    const render = async (props = {}) => {
      const host = document.createElement('div')
      host.innerHTML = await renderToString(h(ProductCardFeatured, { product: featured, ...props }))
      return host
    }

    it('names the brand as the eyebrow above the title, the description below it', async () => {
      const content = (await render()).querySelector('[data-slot="card-content"]')!
      const text = [...content.querySelectorAll('[data-slot="meta"], [data-slot="product-card-title"], [data-slot="product-card-featured-description"]')].map((el) => el.textContent)
      expect(text).toEqual(['Northridge', 'Tee', 'Warm'])
    })

    it('shows no rating', async () => {
      expect((await render()).querySelector('[data-slot="rating"], [role="img"]')).toBeNull()
    })

    it('puts an unlabelled wishlist toggle at the photo’s end corner and the compare toggle beside the price', async () => {
      const host = await render({ wishlistLabel: 'Merken' })
      const onPhoto = host.querySelector('[data-slot="card-image"] button')!
      expect(onPhoto.classList).toContain('inset-e-3')
      expect([onPhoto.getAttribute('aria-label'), onPhoto.getAttribute('aria-pressed'), onPhoto.textContent!.trim()]).toEqual(['Merken', 'false', ''])
      const footer = host.querySelector('[data-slot="card-content"] > :last-child')!
      expect(footer.querySelector('[data-slot="price"]')).not.toBeNull()
      expect(footer.querySelector('button')!.textContent!.trim()).toBe('Compare')
    })

    it('draws the feature badge solid', async () => {
      expect((await render()).querySelector('[data-slot="badge"]')!.className).toContain('fui-badge-new')
    })
  })
})
