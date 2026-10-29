<script setup lang="ts">
import type { ToggleGroupItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { inject } from 'vue'
import { Swatch, type SwatchShape, type SwatchSize } from '@library/components/ui/swatch'
import { SWATCH_GROUP_INJECTION_KEY } from '.'

const props = withDefaults(
  defineProps<
    ToggleGroupItemProps & {
      class?: HTMLAttributes['class']
      /** The swatch size when the group sets none. */
      size?: SwatchSize
      /** The corner shape when the group sets none: rounded or a full circle. */
      shape?: SwatchShape
      /** The colour the swatch shows, as a hex code such as `#1f2937`. */
      hex?: string
      /** Shown with the swatch, e.g. the colour's name. */
      label?: string
      /** Classes added to the label; the group's `labelClass` applies when left out. */
      labelClass?: HTMLAttributes['class']
      /** Strikes the swatch through, e.g. for a sold-out colour; it stays selectable. */
      unavailable?: boolean
      /** Read to screen readers after the swatch's name when it is unavailable. */
      unavailableLabel?: string
    }
  >(),
  {
    disabled: false,
    labelClass: undefined,
    unavailableLabel: undefined,
  },
)

const context = inject(SWATCH_GROUP_INJECTION_KEY, undefined)

defineSlots<{
  default?: () => unknown
  /** Replaces the label shown below or beside the swatch. */
  label?: () => unknown
}>()
</script>

<template>
  <Swatch
    :value="props.value"
    :disabled="props.disabled"
    :as="props.as"
    :as-child="props.asChild"
    :size="context?.size ?? props.size"
    :shape="context?.shape ?? props.shape"
    :hex="props.hex"
    :label="props.label"
    :label-class="props.labelClass ?? context?.labelClass"
    :unavailable="props.unavailable"
    :unavailable-label="props.unavailableLabel"
    :label-position="context?.orientation === 'vertical' ? 'end' : 'bottom'"
    :class="props.class"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.label" #label>
      <slot name="label" />
    </template>
  </Swatch>
</template>
