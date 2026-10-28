// SPDX-License-Identifier: FSL-1.1-MIT
// Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES
import type { HTMLAttributes } from 'vue'
import type { Button } from '@library/components/ui/button'

export { default as AlertDialog } from './AlertDialog.vue'
export { default as AlertDialogAction } from './AlertDialogAction.vue'
export { default as AlertDialogCancel } from './AlertDialogCancel.vue'
export { default as AlertDialogContent } from './AlertDialogContent.vue'
export { default as AlertDialogDescription } from './AlertDialogDescription.vue'
export { default as AlertDialogFooter } from './AlertDialogFooter.vue'
export { default as AlertDialogHeader } from './AlertDialogHeader.vue'
export { default as AlertDialogMedia } from './AlertDialogMedia.vue'
export { default as AlertDialogTitle } from './AlertDialogTitle.vue'
export { default as AlertDialogTrigger } from './AlertDialogTrigger.vue'

export interface AlertDialogButtonProps {
  /** The button style: solid, outline, soft, ghost or link. */
  variant?: InstanceType<typeof Button>['$props']['variant']
  /** The button colour, e.g. primary, neutral or destructive for an irreversible action. */
  color?: InstanceType<typeof Button>['$props']['color']
  /** The button's height, padding and text size. */
  size?: InstanceType<typeof Button>['$props']['size']
  class?: HTMLAttributes['class']
}
