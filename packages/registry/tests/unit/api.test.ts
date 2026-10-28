import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import type { ItemApi } from '@frontic/registry-client'
import { itemApis } from '../../scripts/lib/api'
import { THIRD_PARTY_DESCRIPTIONS, THIRD_PARTY_EVENTS } from '../../scripts/lib/third-party-props'
import { servedItems } from '../../scripts/build'

const root = join(import.meta.dirname, '../..')
let apis: Record<string, ItemApi>

beforeAll(async () => {
  apis = await itemApis(root, await servedItems(root))
}, 120_000)

// A part's source file, found in whichever tier holds its item.
const partPath = (file: string) => ['ui', 'sections', 'templates'].map((tier) => join(tier, file)).find((path) => existsSync(join(root, path)))!
const part = (item: string, name: string) => apis[item]!.parts.find((p) => p.name === name)!

describe('an item api', () => {
  it("lists every component the item's index exports, each with its data-slot", () => {
    expect(apis.accordion!.parts.map((p) => [p.name, p.slot])).toEqual([
      ['Accordion', 'accordion'],
      ['AccordionContent', 'accordion-content'],
      ['AccordionItem', 'accordion-item'],
      ['AccordionTrigger', 'accordion-trigger'],
    ])
  })

  it("takes the part's own data-slot, never a wrapper's or an inner element's", () => {
    expect(part('table', 'Table').slot).toBe('table')
    expect(part('dialog', 'DialogContent').slot).toBe('dialog-content')
    expect(part('product-card-basic', 'ProductCardBasic').slot).toBeUndefined()
  })

  it("reads a part's purpose from the doc comment on its default export, the place editors show on hover", () => {
    expect(part('accordion', 'Accordion').description).toBe('Groups all parts of the accordion.')
    const files = Object.entries(apis).flatMap(([item, api]) => api.parts.map((p) => `${item}/${p.file}`))
    const sources = Object.fromEntries(files.map((file) => [file, readFileSync(join(root, partPath(file)), 'utf8')]))
    expect(files.filter((file) => !/<script lang="ts">[\s\S]*?\/\*\*[\s\S]*?\*\/\s*export default \{/.test(sources[file]!))).toEqual([])
    expect(files.filter((file) => /<script\b[^>]*\bsetup\b[^>]*>\s*\/\*\*/.test(sources[file]!))).toEqual([])
  })

  it("names the element a part renders: its own element's HTML tag, else the Reka component's real as default", () => {
    expect(part('table', 'TableRow').element).toBe('tr')
    expect(part('tabs', 'TabsTrigger').element).toBe('button')
    expect(part('dialog', 'DialogTitle').element).toBe('h2')
    expect(part('product-card-basic', 'ProductCardBasic').element).toBeUndefined()
  })

  it("never takes the as default Reka's shared base type documents, which is div for every part", () => {
    const as = (item: string, name: string) => part(item, name).props.find((p) => p.name === 'as')
    expect(as('tabs', 'TabsTrigger')!.default).toBe("'button'")
    expect(as('accordion', 'AccordionTrigger')!.default).toBeUndefined()
  })

  it("shows the default a prop really has: Reka's runtime default, else false for a boolean Vue casts, never for one Reka leaves undefined on purpose", () => {
    const def = (item: string, name: string, prop: string) => part(item, name).props.find((p) => p.name === prop)!.default
    expect(def('dialog', 'Dialog', 'modal')).toBe('true')
    expect(def('dialog', 'Dialog', 'defaultOpen')).toBe('false')
    expect(def('dialog', 'Dialog', 'open')).toBeUndefined()
    expect(def('accordion', 'AccordionContent', 'forceMount')).toBe('false')
    expect(def('accordion', 'AccordionContent', 'asChild')).toBe('false')
    expect(def('sidebar', 'SidebarMenuButton', 'isActive')).toBe('false')
    // Reka forwards it unset to an inner component whose default is true, so Vue's cast on the outer one never applies.
    expect(def('popover', 'PopoverContent', 'avoidCollisions')).toBe('true')
    // Reka leaves it undefined so the tooltip inherits its provider's value, which its docs give.
    expect(def('tooltip', 'Tooltip', 'delayDuration')).toBe('700')
  })

  it('resolves a type alias to its members, and adds nothing when the type already reads in full', () => {
    const prop = (item: string, name: string, key: string) => part(item, name).props.find((p) => p.name === key)!
    expect(prop('alert', 'Alert', 'variant').fullType).toBe("'neutral' | 'info' | 'success' | 'warning' | 'error'")
    expect(prop('rating', 'Rating', 'size').fullType).toBe("'md' | 'sm' | 'lg'")
    expect(prop('accordion', 'Accordion', 'orientation').fullType).toBe("'vertical' | 'horizontal'")
    expect(prop('accordion', 'Accordion', 'collapsible').fullType).toBeUndefined()
    expect(prop('accordion', 'Accordion', 'modelValue').fullType).toBeUndefined()
  })

  it('describes every prop, class with one shared sentence', () => {
    expect(part('accordion', 'AccordionContent').props.find((p) => p.name === 'class')!.description).toBe("Classes added to the part's own element, after its recipe classes.")
    expect(Object.entries(apis).flatMap(([item, api]) => api.parts.flatMap((p) => p.props.filter((prop) => !prop.description).map((prop) => `${item}/${p.name}.${prop.name}`)))).toEqual([])
  })

  it('lists class on a part that styles its own element with a recipe', () => {
    expect(part('avatar', 'AvatarImage').props.map((p) => p.name)).toContain('class')
  })

  it('names only existing props in the descriptions written for library props', () => {
    const props = new Set(Object.values(apis).flatMap((api) => api.parts.flatMap((p) => p.props.map((prop) => `${p.name}.${prop.name}`))))
    expect(Object.keys(THIRD_PARTY_DESCRIPTIONS).filter((key) => !props.has(key))).toEqual([])
  })

  it('has a purpose for every part', () => {
    expect(Object.entries(apis).flatMap(([item, api]) => api.parts.filter((p) => !p.description).map((p) => `${item}/${p.file}`))).toEqual([])
  })

  it("carries a part's props with type, default and the description its source type documents", () => {
    const asChild = part('accordion', 'AccordionTrigger').props.find((p) => p.name === 'asChild')!
    expect(asChild.type).toBe('boolean')
    expect(asChild.description).toMatch(/child/)
    expect(part('button', 'Button').props.find((p) => p.name === 'variant')).toMatchObject({ type: "'solid' | 'outline' | 'soft' | 'ghost' | 'link'", default: "'solid'", required: false })
    expect(part('button', 'Button').props.find((p) => p.name === 'color')).toMatchObject({ type: "'neutral' | 'primary' | 'destructive' | 'buy' | 'checkout' | 'inverse'", default: "'primary'" })
    expect(part('badge', 'Badge').props.find((p) => p.name === 'variant')).toMatchObject({
      type: "'neutral' | 'info' | 'success' | 'warning' | 'error' | 'primary' | 'promo' | 'discount' | 'new' | 'price'",
      default: "'neutral'",
    })
    expect(part('product-card-basic', 'ProductCardBasic').props.find((p) => p.name === 'product')).toMatchObject({ type: 'Product', required: true })
  })

  it('keeps null where a prop takes it, never the null cva adds to every variant', () => {
    const type = (item: string, name: string, prop: string) => part(item, name).props.find((p) => p.name === prop)!.type
    expect(type('progress', 'Progress', 'modelValue')).toBe('number | null')
    expect(type('switch', 'Switch', 'modelValue')).toBe('boolean | null')
    expect(type('checkbox', 'Checkbox', 'modelValue')).toBe("boolean | 'indeterminate' | null")
    expect(type('date-picker', 'DatePicker', 'modelValue')).toBe('DateValue | null')
    expect(type('drawer', 'Drawer', 'snapPoint')).toBe('DrawerSnapPoint | null')
    expect(type('switch', 'Switch', 'size')).toBe("'md' | 'sm'")
    expect(type('toggle', 'Toggle', 'variant')).toBe("'default' | 'outline'")
    expect(type('field', 'FieldLegend', 'variant')).toBe("'label' | 'legend'")
  })

  it('takes a default the wrapped primitive documents when the part declares none', () => {
    const props = Object.fromEntries(part('accordion', 'Accordion').props.map((p) => [p.name, p.default]))
    expect(props).toMatchObject({ orientation: "'vertical'", dir: "'ltr'", disabled: 'false', unmountOnHide: 'true', asChild: 'false' })
  })

  it("describes an event from the JSDoc its emits type carries, following Reka's chain of emits types", () => {
    const event = (item: string, name: string, key: string) => part(item, name).events.find((e) => e.name === key)!.description
    expect(event('dialog', 'Dialog', 'update:open')).toBe('Event handler called when the open state of the dialog changes.')
    expect(event('dialog', 'DialogContent', 'openAutoFocus')).toBe('Event handler called when auto-focusing on open. Can be prevented.')
    expect(event('dialog', 'DialogContent', 'escapeKeyDown')).toMatch(/escape key/i)
  })

  it('describes a v-model update event from the model it updates', () => {
    const event = part('shipping-address', 'ShippingAddress').events.find((e) => e.name === 'update:city')!
    expect(event.description).toBe('Fires with the new value when `city` changes; `v-model:city` binds it.')
  })

  it('describes every event, and every slot but a default one with no slot props', () => {
    const plain = (slot: { name: string; type?: string }) => slot.name === 'default' && !slot.type
    expect(
      Object.entries(apis).flatMap(([item, api]) =>
        api.parts.flatMap((p) => [
          ...p.events.filter((e) => !e.description).map((e) => `${item}/${p.name} event ${e.name}`),
          ...p.slots.filter((slot) => !plain(slot) && !slot.description).map((slot) => `${item}/${p.name} slot ${slot.name}`),
        ]),
      ),
    ).toEqual([])
  })

  it("writes every description as markdown: Reka's <br> a paragraph break, a {@link url} a link", () => {
    const texts = Object.values(apis).flatMap((api) => api.parts.flatMap((p) => [p.description, ...[...p.props, ...p.events, ...p.slots].map((entry) => entry.description)]))
    expect(texts.filter((text) => /<br|\{@/.test(text ?? ''))).toEqual([])
    const portal = part('dropdown-menu', 'DropdownMenuPortal').props.find((p) => p.name === 'to')!
    expect(portal.description).toBe('Vue native teleport component prop `:to`\n\n[vuejs.org/guide/built-ins/teleport.html#basic-usage](https://vuejs.org/guide/built-ins/teleport.html#basic-usage)')
    expect(part('separator', 'Separator').props.find((p) => p.name === 'decorative')!.description).toMatch(/^Whether or not the component is purely decorative\.\n\nWhen `true`/)
  })

  it("names whose page a library's link opens, never the library's own 'our'", () => {
    const texts = Object.values(apis).flatMap((api) => api.parts.flatMap((p) => [p.description, ...[...p.props, ...p.events, ...p.slots].map((entry) => entry.description)]))
    expect(texts.filter((text) => /\bour\s+\[/i.test(text ?? ''))).toEqual([])
    expect(part('accordion', 'Accordion').props.find((p) => p.name === 'asChild')!.description).toBe(
      "Change the default rendered element for the one passed as a child, merging their props and behavior.\n\nRead Reka UI's [Composition](https://www.reka-ui.com/docs/guides/composition) guide for more details.",
    )
  })

  it('names only existing events in the descriptions written for library events', () => {
    const events = new Set(Object.values(apis).flatMap((api) => api.parts.flatMap((p) => p.events.map((e) => `${p.name}.${e.name}`))))
    expect(Object.keys(THIRD_PARTY_EVENTS).filter((key) => !events.has(key))).toEqual([])
  })

  it('names a library type as its source does, without the $n suffix a bundled declaration file gives duplicates', () => {
    const types = Object.values(apis).flatMap((api) =>
      api.parts.flatMap((p) => [...p.props.flatMap((prop) => [prop.type, prop.fullType]), ...p.events.map((e) => e.type), ...p.slots.map((s) => s.type)]),
    )
    expect(types.filter((type) => /\w\$\d/.test(type ?? ''))).toEqual([])
  })

  it("lists the data attributes on a part's own element: its template's and those of the Reka components it renders through", () => {
    const attributes = (item: string, name: string) => part(item, name).dataAttributes?.map((a) => a.name)
    // AccordionTrigger renders CollapsibleTrigger, which sets data-state and data-disabled too.
    expect(attributes('accordion', 'AccordionTrigger')).toEqual(['data-disabled', 'data-orientation', 'data-state'])
    // TabsTrigger sets them on the Primitive inside an as-child RovingFocusItem.
    expect(attributes('tabs', 'TabsTrigger')).toEqual(['data-disabled', 'data-orientation', 'data-state'])
    // DialogContent renders through Presence and then DialogContentModal.
    expect(attributes('dialog', 'DialogContent')).toContain('data-state')
    // PopperContent takes $attrs on the element inside its positioning wrapper.
    expect(attributes('popover', 'PopoverContent')).toEqual(expect.arrayContaining(['data-align', 'data-side', 'data-state']))
    expect(attributes('sidebar', 'SidebarMenuButton')).toEqual(expect.arrayContaining(['data-active', 'data-size', 'data-sidebar']))
    expect(attributes('button', 'Button')).toEqual(['data-color', 'data-size', 'data-variant'])
    expect(attributes('card', 'CardTitle')).toBeUndefined()
    const names = Object.values(apis).flatMap((api) => api.parts.flatMap((p) => p.dataAttributes?.map((a) => a.name) ?? []))
    expect(names.filter((name) => name === 'data-slot' || name.startsWith('data-reka-'))).toEqual([])
  })

  it('gives each data attribute the values it takes: from the binding, a Reka helper, the prop it mirrors, else none for one that is only present', () => {
    const attribute = (item: string, name: string, key: string) => part(item, name).dataAttributes!.find((a) => a.name === key)!
    expect(attribute('accordion', 'AccordionTrigger', 'data-state').values).toEqual(['open', 'closed'])
    expect(attribute('tabs', 'TabsTrigger', 'data-state').values).toEqual(['active', 'inactive'])
    expect(attribute('checkbox', 'Checkbox', 'data-state').values).toEqual(['checked', 'unchecked', 'indeterminate'])
    expect(attribute('button', 'Button', 'data-variant').values).toEqual(['solid', 'outline', 'soft', 'ghost', 'link'])
    expect(attribute('button', 'Button', 'data-variant').description).toBe('Carries the `variant` prop.')
    expect(attribute('pagination', 'PaginationEllipsis', 'data-type').values).toEqual(['ellipsis'])
    expect(attribute('accordion', 'AccordionTrigger', 'data-disabled').values).toBeUndefined()
    expect(attribute('sidebar', 'SidebarMenuButton', 'data-active')).toEqual({ name: 'data-active', description: 'Present while the item is the active one.' })
    // A value a child takes from a fixed prop is how the part is built, not an option: CartCompact's trigger Button is always ghost.
    expect(part('cart-compact', 'CartCompact').dataAttributes).toBeUndefined()
    expect(part('sidebar', 'SidebarTrigger').dataAttributes!.map((a) => a.name)).toEqual(['data-sidebar'])
    // DrawerContentImpl builds these in a computed object it spreads onto the element.
    expect(part('drawer', 'DrawerContent').dataAttributes!.map((a) => a.name)).toEqual(expect.arrayContaining(['data-nested-drawer-open', 'data-state', 'data-swipe-direction', 'data-swiping']))
    expect(attribute('drawer', 'DrawerContent', 'data-state').values).toEqual(['open', 'closed'])
    expect(attribute('drawer', 'DrawerContent', 'data-swiping').values).toBeUndefined()
  })

  it("lists the CSS variables a part's element can read: set on it or an element around it, in a template or a script, Reka's popper internals left out", () => {
    const variables = (item: string, name: string) => part(item, name).cssVariables?.map((v) => v.name)
    expect(variables('accordion', 'AccordionContent')).toEqual([
      '--reka-accordion-content-height',
      '--reka-accordion-content-width',
      '--reka-collapsible-content-height',
      '--reka-collapsible-content-width',
    ])
    expect(variables('popover', 'PopoverContent')).toEqual([
      '--reka-popover-content-available-height',
      '--reka-popover-content-available-width',
      '--reka-popover-content-transform-origin',
      '--reka-popover-trigger-height',
      '--reka-popover-trigger-width',
    ])
    // DrawerContentImpl sets these from its script, through the names in its utils.
    expect(variables('drawer', 'DrawerContent')).toEqual(expect.arrayContaining(['--drawer-height', '--drawer-swipe-movement-x', '--drawer-swipe-strength']))
    expect(variables('button', 'Button')).toBeUndefined()
  })

  it('describes every CSS variable', () => {
    const missing = Object.entries(apis).flatMap(([item, api]) => api.parts.flatMap((p) => (p.cssVariables ?? []).filter((v) => !v.description).map((v) => `${item}/${p.name} ${v.name}`)))
    expect(missing).toEqual([])
  })

  it('describes every data attribute', () => {
    const missing = Object.entries(apis).flatMap(([item, api]) => api.parts.flatMap((p) => (p.dataAttributes ?? []).filter((a) => !a.description).map((a) => `${item}/${p.name} ${a.name}`)))
    expect(missing).toEqual([])
  })

  it("carries a part's events and slots", () => {
    expect(part('product-card-basic', 'ProductCardBasic').events.map(({ name, type }) => ({ name, type }))).toEqual([{ name: 'add-to-cart', type: '[product: Product]' }])
    expect(part('accordion', 'AccordionTrigger').slots.map((s) => s.name)).toEqual(['default', 'icon'])
    expect(part('combobox', 'ComboboxTrigger').slots.map((s) => s.name)).toEqual(['default', 'icon'])
  })

  it('names the shared families each part borrows, through the recipe it wears', () => {
    expect(part('accordion', 'AccordionContent').styling).toEqual([{ recipe: 'accordion-body', families: ['link-foreground'] }])
    expect(part('accordion', 'AccordionTrigger').styling).toBeUndefined()
    expect(part('dialog', 'DialogDescription').styling).toEqual([{ recipe: 'dialog-description', families: ['part-description', 'link-foreground'] }])
    expect(apis.accordion).not.toHaveProperty('family')
  })

  it('names a part the index exports twice by its first name, the second as an alias', () => {
    expect(apis.toast!.parts.map((p) => [p.name, p.aliases])).toEqual([['Toast', ['Toaster']]])
  })

  it('installs with the public CLI', () => {
    expect(apis.accordion!.install).toBe('npx @frontic/ui add accordion')
  })
})

describe('what an item api tells beyond its parts', () => {
  it('nests the parts as the main example writes them, opening a part that renders other parts itself, one entry per part among siblings', () => {
    expect(apis.dialog!.anatomy).toBe(
      [
        '<Dialog>',
        '  <DialogTrigger />',
        '  <DialogContent>',
        '    <DialogHeader>',
        '      <DialogTitle />',
        '      <DialogDescription />',
        '    </DialogHeader>',
        '    <DialogBody />',
        '    <DialogFooter>',
        '      <DialogClose />',
        '    </DialogFooter>',
        '  </DialogContent>',
        '</Dialog>',
      ].join('\n'),
    )
    // Price's example writes only <Price>; Price.vue renders the rest.
    expect(apis.price!.anatomy).toBe('<Price>\n  <PriceDiscount />\n  <PriceRef />\n  <PriceAmount />\n  <PriceHint />\n</Price>')
    // The sidebar example has four groups; the anatomy shows one, holding what any of them holds.
    expect(apis.sidebar!.anatomy!.match(/<SidebarGroup>/g)).toHaveLength(1)
    expect(apis.button!.anatomy).toBeUndefined()
  })

  it('names the states the recipes or classes give a look of their own', () => {
    expect(apis.accordion!.states).toEqual(['hover', 'focus', 'disabled'])
    expect(apis.checkbox!.states).toContain('checked')
    // The picker's invalid look lives in the date field it renders.
    expect(apis['date-picker']!.states).toContain('invalid')
  })

  it('lists what the barrel exports besides the parts, where each comes from, and leaves out the parts’ injection plumbing', () => {
    expect(apis.price!.exports).toEqual([
      { name: 'formatPrice', type: false, from: { name: 'format', title: 'Format', path: 'lib/format' } },
      { name: 'PriceType', type: true, from: { name: 'format', title: 'Format', path: 'lib/format' } },
      { name: 'PriceSize', type: true, definition: "type PriceSize = 'sm' | 'md' | 'lg'" },
      { name: 'PriceAlign', type: true, definition: "type PriceAlign = 'start' | 'end'" },
    ])
    expect(apis['cart-compact']!.exports).toEqual([{ name: 'CartLine', type: true, from: { name: 'cart', title: 'Cart', path: 'lib/cart' } }])
    expect(apis.toast!.exports).toEqual([{ name: 'toast', type: false, package: 'vue-sonner' }])
    expect(apis['swatch-group']!.exports!.map((entry) => entry.name)).not.toContain('SWATCH_GROUP_INJECTION_KEY')
    expect(apis['payment-card']!.exports!.find((entry) => entry.name === 'formatPaymentCardNumber')!.definition).toBe('function formatPaymentCardNumber(digits: string): string')
  })

  it('links the items an item is built from and used by, read from its installed files, not its examples', () => {
    expect(apis.price!.builtFrom!.map((link) => link.path)).toEqual(['components/ui/badge', 'lib/format'])
    expect(apis.format!.usedBy!.map((link) => link.name)).toContain('price')
    // Carousel's example shows prices; carousel itself is not built from price.
    expect(apis.carousel!.builtFrom!.map((link) => link.name)).not.toContain('price')
    expect(apis.price!.usedBy!.map((link) => link.name)).not.toContain('carousel')
  })

  it('names each shared recipe the item extends or composes, with the other items that use it, so a reader sees what an edit touches', () => {
    const card = apis.card!.sharedRecipes!
    expect(card.filter((entry) => !entry.composed).map((entry) => entry.recipe)).toEqual(['panel', 'part-description', 'part-title', 'surface-inset'])
    expect(card.find((entry) => entry.recipe === 'panel')!.alsoIn).toEqual([])
    expect(card.find((entry) => entry.recipe === 'surface-inset')!.alsoIn.map((link) => link.name)).toEqual(expect.arrayContaining(['dialog', 'alert-dialog']))
    const button = apis.button!.sharedRecipes!
    expect(button.filter((entry) => entry.composed).map((entry) => entry.recipe)).toEqual(expect.arrayContaining(['focus-ring', 'disabled', 'invalid']))
    const ring = button.find((entry) => entry.recipe === 'focus-ring')!
    expect(ring.alsoIn.map((link) => link.name)).not.toContain('button')
    expect(ring.alsoIn.length).toBeGreaterThan(10)
    expect(ring.alsoIn[0]).toEqual({ name: expect.any(String), title: expect.any(String), path: expect.stringMatching(/^components\//) })
  })
})
