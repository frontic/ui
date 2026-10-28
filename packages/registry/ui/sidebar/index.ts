// SPDX-License-Identifier: FSL-1.1-MIT
// Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES
import type { HTMLAttributes } from 'vue'
import type { SidebarCollapsible, SidebarSide, SidebarVariant } from './utils'

export interface SidebarProps {
  /** The edge the sidebar sits on: `start` is the left in a left-to-right page and the right in a right-to-left one. */
  side?: SidebarSide
  /** Defaults to the provider's: `inset` under `<SidebarProvider variant="inset">`, else `sidebar`. */
  variant?: SidebarVariant
  /** How the sidebar collapses: off the screen, down to icons, or not at all. */
  collapsible?: SidebarCollapsible
  /** The sidebar's title for screen readers on mobile, where it opens as a sheet. */
  label?: string
  /** The sidebar's description for screen readers on mobile, where it opens as a sheet. */
  description?: string
  /** Lands on the container. A width class here also stops icon collapse; set the width with `--fui-sidebar-size-width` on SidebarProvider. */
  class?: HTMLAttributes['class']
}

export { default as Sidebar } from './Sidebar.vue'
export { default as SidebarContent } from './SidebarContent.vue'
export { default as SidebarFooter } from './SidebarFooter.vue'
export { default as SidebarGroup } from './SidebarGroup.vue'
export { default as SidebarGroupAction } from './SidebarGroupAction.vue'
export { default as SidebarGroupContent } from './SidebarGroupContent.vue'
export { default as SidebarGroupLabel } from './SidebarGroupLabel.vue'
export { default as SidebarHeader } from './SidebarHeader.vue'
export { default as SidebarInput } from './SidebarInput.vue'
export { default as SidebarInset } from './SidebarInset.vue'
export { default as SidebarMenu } from './SidebarMenu.vue'
export { default as SidebarMenuAction } from './SidebarMenuAction.vue'
export { default as SidebarMenuBadge } from './SidebarMenuBadge.vue'
export { default as SidebarMenuButton } from './SidebarMenuButton.vue'
export type { SidebarMenuButtonSize, SidebarMenuButtonVariant } from './SidebarMenuButtonChild.vue'
export { default as SidebarMenuItem } from './SidebarMenuItem.vue'
export { default as SidebarMenuSkeleton } from './SidebarMenuSkeleton.vue'
export { default as SidebarMenuSub } from './SidebarMenuSub.vue'
export { default as SidebarMenuSubButton } from './SidebarMenuSubButton.vue'
export { default as SidebarMenuSubItem } from './SidebarMenuSubItem.vue'
export { default as SidebarProvider } from './SidebarProvider.vue'
export { default as SidebarRail } from './SidebarRail.vue'
export { default as SidebarSeparator } from './SidebarSeparator.vue'
export { default as SidebarTrigger } from './SidebarTrigger.vue'
export type { SidebarCollapsible, SidebarProviderVariant, SidebarSide, SidebarVariant } from './utils'
export { useSidebar } from './utils'
