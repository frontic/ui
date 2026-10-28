import type { HTMLAttributes } from 'vue'
import type { Button } from '@library/components/ui/button'

export { default as InputGroup } from './InputGroup.vue'
export { default as InputGroupAddon } from './InputGroupAddon.vue'
export { default as InputGroupButton } from './InputGroupButton.vue'
export { default as InputGroupInput } from './InputGroupInput.vue'
export { default as InputGroupText } from './InputGroupText.vue'
export { default as InputGroupTextarea } from './InputGroupTextarea.vue'

/** The height of the group and its input: md is 40px, sm is 36px. */
export type InputGroupSize = 'md' | 'sm'

export type InputGroupAddonAlign = 'inline-start' | 'inline-end' | 'block-start' | 'block-end'

export interface InputGroupButtonProps {
  /** The button style: solid, outline, soft, ghost or link. */
  variant?: InstanceType<typeof Button>['$props']['variant']
  /** The button colour role, e.g. neutral or brand. */
  color?: InstanceType<typeof Button>['$props']['color']
  /** The button's size inside the field; the `icon-*` sizes make a square, icon-only button. */
  size?: 'xs' | 'sm' | 'icon-xs' | 'icon-sm'
  class?: HTMLAttributes['class']
}
