// Every served item's own look against its snapshot in look/<item>.txt.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { sidebarLayout, type SidebarCollapsible, type SidebarVariant } from '../../ui/sidebar/utils'
import { isFlatTier, readSourceItems } from './items'
import { ownLook, type OwnLookOptions } from './look'
import { snapshotDiff, snapshotText } from './snapshot'

const DRAWER_SIDE: Record<string, string> = { down: 'bottom', up: 'top', left: 'left', right: 'right' }

/** Per item: axes no prop or cva names, script state, attributes an axis sets, and container widths. */
export const OPTIONS: Record<string, OwnLookOptions> = {
  'toggle-group': { axes: { spacing: ['0', '1', '2'] }, scope: () => ({ context: undefined }) },
  // `layout` stands for whether a Field sits in the label, which FieldLabel reads from its slot, or the label sits in a horizontal Field, which it reads from the Field's orientation.
  field: { scope: (combo) => ({ card: () => combo.layout === 'card', beside: () => combo.layout === 'beside' }) },
  select: { axes: { position: ['item-aligned', 'popper'] } },
  // The frame is the content's container (the viewport); the content is its children's, less its insets, capped from @2xl.
  // `band` sits just below our @2xl (672px).
  dialog: { viewports: { band: 656 }, container: (viewport, _, element) => (element === 'dialog-content' ? viewport : viewport < 672 ? viewport - 32 : Math.min(viewport - 32, 448)) },
  'alert-dialog': {
    viewports: { band: 656 },
    attrs: (combo) => ({ 'size-sm': combo.size === 'sm' ? 'PRESENT' : 'ABSENT' }),
    container: (viewport, combo, element) => (element === 'alert-dialog-content' ? viewport : Math.min(viewport - 32, combo.size === 'sm' || viewport < 672 ? 320 : 512)),
  },
  drawer: {
    axes: { swipeDirection: ['down', 'up', 'left', 'right'] },
    scope: (combo) => ({ root: { swipeDirection: { value: combo.swipeDirection } } }),
    attrs: (combo) => ({ 'vaul-drawer-direction': DRAWER_SIDE[combo.swipeDirection!] ?? '' }),
    container: (viewport, combo) => (combo.swipeDirection === 'left' || combo.swipeDirection === 'right' ? Math.min(384, viewport * 0.75) : viewport),
  },
  // The content draws its own surface under `surface: own`, the shared viewport's otherwise.
  'navigation-menu': {
    axes: { surface: ['shared', 'own'] },
    scope: (combo) => ({ menu: { viewport: { value: combo.surface === 'shared' } } }),
    attrs: (combo) => ({ viewport: combo.surface === 'own' ? 'false' : 'true' }),
  },
  separator: { axes: { orientation: ['horizontal', 'vertical'] } },
  'scroll-area': { axes: { orientation: ['vertical', 'horizontal'] } },
  avatar: { axes: { grouped: ['true'] } },
  // `collapsible` stands for the state the sidebar collapsed to; `none` reads as expanded.
  sidebar: {
    axes: { side: ['start', 'end'], collapsible: ['offcanvas', 'icon', 'none'] },
    scope: (combo) => {
      const side = combo.side === 'end' ? 'end' : 'start'
      const collapsible = (combo.collapsible ?? 'offcanvas') as SidebarCollapsible
      const collapsed = collapsible !== 'none' && combo.collapsible !== undefined
      const layout = sidebarLayout(side, (combo.variant ?? 'sidebar') as SidebarVariant, collapsible, collapsed)
      return {
        state: collapsed ? 'collapsed' : 'expanded',
        isMobile: false,
        layout,
        iconOnly: layout.collapsedTo === 'icon',
        offcanvas: layout.collapsedTo === 'offcanvas',
        collapsed,
        raised: combo.variant === 'inset',
        hidden: combo.showOnHover === true,
      }
    },
    attrs: (combo) => {
      const to = combo.collapsible === 'icon' || combo.collapsible === 'offcanvas' ? combo.collapsible : ''
      const present = (on: boolean) => (on ? 'PRESENT' : 'ABSENT')
      return {
        collapsible: to,
        state: to ? 'collapsed' : 'expanded',
        collapsed: present(!!to),
        'collapsible-icon': present(to === 'icon'),
        'collapsible-offcanvas': present(to === 'offcanvas'),
        'size-sm': present(combo.size === 'sm'),
        'size-lg': present(combo.size === 'lg'),
      }
    },
  },
  carousel: { axes: { orientation: ['horizontal', 'vertical'] } },
  // The day a trigger shows and, on a range, whether it ends the range: reka's data-today, data-outside-view, data-selection-*.
  calendar: { attrs: (combo) => ({ today: combo.day === 'today' ? 'PRESENT' : 'ABSENT', 'outside-view': combo.day === 'outside' ? 'PRESENT' : 'ABSENT' }) },
  'range-calendar': {
    attrs: (combo) => ({
      today: combo.day === 'today' ? 'PRESENT' : 'ABSENT',
      'outside-view': combo.day === 'outside' ? 'PRESENT' : 'ABSENT',
      'selection-start': combo.position === 'edge' ? 'PRESENT' : 'ABSENT',
      'selection-end': 'ABSENT',
    }),
  },
  stepper: { axes: { state: ['inactive', 'active', 'completed'] } },
}

/** The components the registry serves: every source item not pending that renders. */
export function servedItems(root: string): string[] {
  const pending = new Set<string>(JSON.parse(readFileSync(join(root, 'pending.json'), 'utf8')).items)
  return readSourceItems(root)
    .filter((i) => !isFlatTier(i.tier))
    .map((i) => i.name)
    .filter((name) => !pending.has(name))
}

export interface LookVerdict {
  changed: { item: string; removed: string[]; added: string[] }[]
  missing: string[]
  stale: string[]
}

/** `items` (every served item when empty) against their snapshots in `dir`; `write` rewrites them instead. A full run also
 * reports a snapshot no served item has, or with `write` deletes it. */
export async function lookVerdict(root: string, items: string[], write: boolean, dir = join(root, 'look'), served = servedItems(root)): Promise<LookVerdict> {
  const unknown = items.filter((item) => !served.includes(item))
  if (unknown.length) throw new Error(`${unknown.join(', ')} is not a served item`)
  const verdict: LookVerdict = { changed: [], missing: [], stale: [] }
  if (write) mkdirSync(dir, { recursive: true })
  for (const item of items.length ? items : served) {
    const look = await ownLook(root, item, OPTIONS[item])
    const text = snapshotText(look.elements, look.approximate)
    const file = join(dir, `${item}.txt`)
    if (write) writeFileSync(file, text)
    else if (!existsSync(file)) verdict.missing.push(item)
    else {
      const diff = snapshotDiff(readFileSync(file, 'utf8'), text)
      if (diff.removed.length || diff.added.length) verdict.changed.push({ item, ...diff })
    }
  }
  if (!items.length && existsSync(dir))
    for (const file of readdirSync(dir).sort()) {
      const name = file.replace(/\.txt$/, '')
      if (!file.endsWith('.txt') || served.includes(name)) continue
      if (write) rmSync(join(dir, file))
      else verdict.stale.push(name)
    }
  return verdict
}
