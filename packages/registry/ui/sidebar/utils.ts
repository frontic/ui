import type { ComputedRef, Ref } from 'vue'
import { createContext, type Direction } from 'reka-ui'

export const SIDEBAR_COOKIE_NAME = 'sidebar_state'
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
export const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

export type SidebarSide = 'start' | 'end'
export type SidebarVariant = 'sidebar' | 'floating' | 'inset'
export type SidebarCollapsible = 'offcanvas' | 'icon' | 'none'
export type SidebarProviderVariant = 'default' | 'inset'

export const [useSidebar, provideSidebarContext] = createContext<{
  state: ComputedRef<'expanded' | 'collapsed'>
  open: Ref<boolean>
  setOpen: (value: boolean) => void
  isMobile: Ref<boolean>
  openMobile: Ref<boolean>
  setOpenMobile: (value: boolean) => void
  toggleSidebar: () => void
  /** The layout's variant: `inset` paints the wrapper, raises SidebarInset and is its Sidebars' default. */
  variant: Ref<SidebarProviderVariant>
}>('SidebarProvider')

/** One Sidebar's own props, for the rail and menu buttons inside it. */
export const [injectSidebarInstance, provideSidebarInstance] = createContext<{
  side: Ref<SidebarSide>
  collapsible: Ref<SidebarCollapsible>
}>('Sidebar')

/** The screen edge a side lands on: start is the left in a left-to-right direction and the right in a right-to-left one. */
export function physicalSide(side: SidebarSide, dir: Direction): 'left' | 'right' {
  return (side === 'start') !== (dir === 'rtl') ? 'left' : 'right'
}

/** The values a desktop sidebar's gap and container take; uncollapsed, both take sidebar-size's width. */
export function sidebarLayout(side: SidebarSide, variant: SidebarVariant, collapsible: SidebarCollapsible, collapsed: boolean) {
  const padded = variant === 'floating' || variant === 'inset'
  const to = collapsed ? collapsible : undefined
  const icon = padded ? ('icon-padded' as const) : ('icon' as const)
  const offcanvas = to === 'offcanvas'
  return {
    collapsedTo: to,
    gap: offcanvas ? ('offcanvas' as const) : to === 'icon' ? icon : undefined,
    container: to === 'icon' ? icon : undefined,
    edge: padded ? ('padded' as const) : side,
    offset: side === 'start' ? (offcanvas ? 'inset-s-0 -translate-x-full rtl:translate-x-full' : 'inset-s-0') : offcanvas ? 'inset-e-0 translate-x-full rtl:-translate-x-full' : 'inset-e-0',
  }
}
