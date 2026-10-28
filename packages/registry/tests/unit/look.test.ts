import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stylePresetPath } from '@frontic/library-contract/brand'
import { describe, expect, it } from 'vitest'
import { propAxes } from '../../scripts/lib/axes'
import { ownLook, resolved } from '../../scripts/lib/look'
import { snapshotText } from '../../scripts/lib/snapshot'

const root = join(import.meta.dirname, '../..')
const preset = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
const DESTRUCTIVE: string = preset.color.status.destructive.$value.hex
const RING: string = preset.color.edge.ring.$value.hex

describe('an item’s own look', { timeout: 30_000 }, () => {
  it('resolves an item’s own elements at every combination and width, motion included', async () => {
    const look = await ownLook(root, 'badge')
    const badge = look.elements.get('badge')!
    expect(new Set(badge.combos.map((c) => c.viewport))).toEqual(new Set(['phone', 'desktop']))
    expect([...badge.lines.keys()].some((l) => l.startsWith('E | transition-property:'))).toBe(true)
    expect(snapshotText(look.elements, look.approximate)).toMatch(/^badge \| E \| /m)
  })
  it('resolves toast’s parts from its toastOptions classes, the toast at every type', async () => {
    const toast = (await ownLook(root, 'toast')).elements.get('toast')!
    expect(new Set(toast.combos.map((c) => c.type))).toEqual(new Set(['default', 'info', 'success', 'warning', 'error']))
  })
  it.each(['input', 'textarea', 'native-select'])('keys %s by the slot it falls back to when no wrapper names one', async (item) => {
    expect((await ownLook(root, item)).elements.has(item)).toBe(true)
  })
  it('refuses an item with no folder', async () => {
    await expect(ownLook(root, 'nope')).rejects.toThrow(/nope has no folder/)
  })
})

describe('the resolver', { timeout: 30_000 }, () => {
  it('resolves tw-animate-css at the version projects get through the brand stylesheet', () => {
    const version = (file: string) =>
      JSON.parse(readFileSync(join(root, file), 'utf8')).devDependencies?.['tw-animate-css'] ?? JSON.parse(readFileSync(join(root, file), 'utf8')).dependencies?.['tw-animate-css']
    expect(version('package.json')).toBe(version('../library-contract/package.json'))
  })

  it('resolves the same classes the same way, and a class to its one value', async () => {
    const classes = ['h-9', 'rounded-md', 'px-3', 'hover:bg-muted']
    expect(await resolved(root, classes)).toEqual(await resolved(root, classes))
    expect((await resolved(root, ['h-8', ...classes.slice(1)])).get('E')?.get('height')).toBe('32px')
  })

  it('reads the theme’s data-open and data-closed variants as the open and closed states, as data-state selectors read', async () => {
    const look = await resolved(root, ['data-open:bg-muted', 'data-closed:opacity-50'])
    expect([...look.keys()].sort()).toEqual(['E:closed', 'E:open'])
    expect((await resolved(root, ['data-[state=open]:bg-muted'])).get('E:open')).toEqual(look.get('E:open'))
  })

  it('reads one child selector the same whichever form writes it: quoted or bare attribute values, *:[span] or [&>span]', async () => {
    expect(await resolved(root, ['*:[span]:last:gap-2', "[&>[data-slot='x']]:flex-1"])).toEqual(await resolved(root, ['[&>span:last-child]:gap-2', '[&>[data-slot=x]]:flex-1']))
    expect(await resolved(root, ['[&:has([role=checkbox])]:pr-0', 'data-[state=closed]:overflow-hidden'])).toEqual(await resolved(root, ['has-[[role=checkbox]]:pr-0', 'data-closed:overflow-hidden']))
  })

  it.each([
    ['input-otp', ['aria-invalid:fui-invalid', 'data-active:fui-focus-ring', 'data-active:aria-invalid:fui-invalid'], 'E[data-active]:invalid'],
    ['checkbox', ['fui-checkbox', 'aria-invalid:fui-invalid', 'aria-checked:aria-invalid:fui-invalid'], 'E:checked:invalid'],
  ])('%s: the destructive border wins where its two states meet', async (_, classes, state) => {
    const look = await resolved(root, ['border', ...classes])
    const borders = [...(look.get(state) ?? [])].filter(([property]) => /^border(-\w+)?-color$/.test(property))
    expect(borders.length).toBeGreaterThan(0)
    for (const [, value] of borders) expect(value).toBe(DESTRUCTIVE)
  })

  it('reads an outline: none shorthand as no outline', async () => {
    const look = await resolved(root, ['look-outline-none'], {}, 0, 0, '.look-outline-none { outline: none; }')
    expect([...look.values()].flatMap((ctx) => [...ctx.keys()]).filter((p) => p.startsWith('outline'))).toEqual([])
  })

  it('reads a box-shadow ring and an outline ring of one width and colour as one ring', async () => {
    const ring = async (classes: string[]) => (await resolved(root, classes)).get('E:focus')?.get('ring')
    expect(await ring(['outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring'])).toBeDefined()
    expect(await ring(['outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring'])).toBe(await ring(['outline-none', 'focus-visible:fui-focus-ring']))
  })

  it('resolves switch with no element guessed from its literals', async () => {
    expect((await ownLook(root, 'switch')).approximate).toEqual([])
  })

  it('reads a defineProps string union, through a named interface, as an axis: a sheet resolves at every side, none approximate', async () => {
    expect([...propAxes({ 'SheetContent.vue': "<script setup lang=\"ts\">\ninterface P { side?: 'top' | 'left'; inset?: boolean }\ndefineProps<P>()\n</script>" }).axes.side!]).toEqual(['top', 'left'])
    const look = await ownLook(root, 'sheet')
    expect(look.approximate).toEqual([])
    expect(new Set([...look.elements.values()].flatMap((e) => e.combos.map((c) => c.side)).filter(Boolean)).size).toBeGreaterThan(1)
  })

  it('resolves tw-animate-css enter and exit motion, as the brand stylesheet imports it', async () => {
    const look = await resolved(root, ['data-open:animate-in', 'data-open:zoom-in-95', 'data-open:fade-in-0', 'data-closed:animate-out'])
    expect(look.get('E:open')?.get('animation')).toBe('enter .15s ease 0s 1 normal none')
    expect(look.get('E:open')?.get('--tw-enter-scale')).toBe('.95')
    expect(look.get('E:open')?.get('--tw-enter-opacity')).toBe('0')
    expect(look.get('E:closed')?.get('animation')).toBe('exit .15s ease 0s 1 normal none')
    const side = await resolved(root, ['data-side-bottom:slide-in-from-top-2'])
    expect([...side.values()].map((m) => m.get('--tw-enter-translate-y'))).toEqual(['calc(2*4px*-1)'])
  })

  it('resolves bg-popover to the default brand’s popover white', async () => {
    expect((await resolved(root, ['bg-popover'])).get('E')?.get('background-color')).toBe('#ffffff')
  })

  it('sees a layout step at both widths: a phone below the brand’s md, a desktop past it', async () => {
    const phone = await resolved(root, ['fui-swatch-sm'], {}, 375)
    const desktop = await resolved(root, ['fui-swatch-sm'], {}, 1536)
    expect([phone.get('E')?.get('width'), phone.get('E')?.get('height')]).toEqual(['48px', '48px'])
    expect([desktop.get('E')?.get('width'), desktop.get('E')?.get('height')]).toEqual(['36px', '36px'])
  })

  it('draws a compound state’s ring with the colour the compound sets: an input-otp slot rings destructive when active and invalid', async () => {
    const classes =
      'data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive border-input relative flex h-9 w-9 items-center justify-center border-y border-r text-sm shadow-xs transition-all outline-none data-[active=true]:z-10 data-[active=true]:ring-[3px]'
    const look = await resolved(root, classes.split(' '), {}, 1536, 1536)
    const ring = (ctx: string) => [...look].find(([c]) => c.startsWith('E[data-active') && c.includes(ctx))?.[1].get('ring')
    expect(ring(':invalid')).toBe(`3px color-mix(in oklab, ${DESTRUCTIVE} 20%, transparent)`)
    expect([...look].find(([c]) => /^E\[data-active[^\]]*\]$/.test(c))?.[1].get('ring')).toBe(`3px color-mix(in oklab, ${RING} 50%, transparent)`)
  })

  it('applies a container variant at the container’s width, not the viewport’s', async () => {
    const at = async (container: number) => (await resolved(root, ['flex-col', '@sm:flex-row'], {}, 1536, container)).get('E')?.get('flex-direction')
    expect(await at(320)).toBe('column')
    expect(await at(448)).toBe('row')
  })

  it('a negated attribute keeps a rule off the value it names: not-data-[variant=destructive]', async () => {
    const at = async (variant: string) => [...(await resolved(root, ['not-data-[variant=destructive]:text-red-500'], { variant }, 1536)).values()].find((m) => m.has('color'))?.get('color')
    expect(await at('default')).toBeDefined()
    expect(await at('destructive')).toBeUndefined()
  })

  it.each([
    ['InputGroupInput', 'input-group/InputGroupInput.vue', 'fui-input'],
    ['InputGroupTextarea', 'input-group/InputGroupTextarea.vue', 'fui-textarea'],
    ['AutocompleteInput', 'autocomplete/AutocompleteInput.vue', ''],
  ])('%s leaves the focus line to its input group', async (_, file, recipe) => {
    const source = readFileSync(join(root, 'ui', file), 'utf8')
    const classes = source.match(/'([^']*\bborder-0\b[^']*)'/)![1]!.split(/\s+/)
    const control = await resolved(root, [recipe, ...classes].filter(Boolean))
    expect(new Map(control.get('E:focus')).get('border-bottom-width')).toBe('0px')
  })
})
