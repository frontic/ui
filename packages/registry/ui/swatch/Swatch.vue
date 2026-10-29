<script lang="ts">
/** Lets the user select a colour or material option, shown as a labelled sample. */
export default {}
</script>

<script setup lang="ts">
import type { AcceptableValue, ToggleEmits, ToggleProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { injectToggleGroupRootContext, Toggle, ToggleGroupItem, useForwardPropsEmits } from 'reka-ui'
import { computed } from 'vue'
import type { SwatchLabelPosition, SwatchShape, SwatchSize } from '.'
import SwatchRoot from './SwatchRoot.vue'
import SwatchFallback from './SwatchFallback.vue'
import SwatchLabel from './SwatchLabel.vue'

const swatch = cva('fui-swatch relative overflow-hidden transition focus-visible:fui-focus-ring disabled:pointer-events-none disabled:fui-disabled', {
  variants: {
    size: { xs: 'fui-swatch-xs', sm: 'fui-swatch-sm', md: 'fui-swatch-md', lg: 'fui-swatch-lg' },
    shape: { default: 'fui-swatch-default', pill: 'fui-swatch-pill' },
  },
  defaultVariants: { size: 'md', shape: 'default' },
})

const props = withDefaults(
  defineProps<
    ToggleProps & {
      class?: HTMLAttributes['class']
      /** The size of the swatch. */
      size?: SwatchSize
      /** The corner shape: rounded or a full circle. */
      shape?: SwatchShape
      /** The colour the swatch shows, as a hex code such as `#1f2937`. */
      hex?: string
      /** Shown with the swatch, e.g. the colour's name. */
      label?: string
      /** Classes added to the label. */
      labelClass?: HTMLAttributes['class']
      /** Where the label sits: below the swatch or after it. */
      labelPosition?: SwatchLabelPosition
      /** The value the swatch stands for inside a SwatchGroup. */
      value?: AcceptableValue
      /** Strikes the swatch through, e.g. for a sold-out colour; it stays selectable. */
      unavailable?: boolean
      /** Read to screen readers after the swatch's name when it is unavailable. */
      unavailableLabel?: string
    }
  >(),
  {
    size: 'md',
    shape: 'default',
    labelPosition: 'bottom',
    disabled: false,
    unavailableLabel: 'Unavailable',
  },
)

defineOptions({ inheritAttrs: false })

const emits = defineEmits<ToggleEmits>()

const group = injectToggleGroupRootContext(null)
const delegatedProps = reactiveOmit(props, 'class', 'size', 'shape', 'hex', 'label', 'labelClass', 'labelPosition', 'value', 'unavailable', 'unavailableLabel')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
const control = computed(() =>
  group
    ? { is: ToggleGroupItem, bind: { value: props.value, disabled: props.disabled, as: props.as, asChild: props.asChild, 'data-slot': 'swatch-group-item' } }
    : { is: Toggle, bind: forwarded.value },
)

defineSlots<{
  default?: () => unknown
  /** Replaces the label shown below or beside the swatch. */
  label?: () => unknown
}>()
</script>

<template>
  <label
    :data-disabled="(group && disabled) || undefined"
    :class="['flex items-center data-disabled:pointer-events-none data-disabled:fui-disabled', labelPosition === 'end' ? 'flex-row gap-2' : 'flex-col gap-1']"
  >
    <component :is="control.is" data-slot="swatch" v-bind="{ ...control.bind, ...$attrs }" :data-unavailable="unavailable || undefined" :class="[swatch({ size, shape }), props.class]">
      <SwatchRoot :hex="props.hex" :shape="props.shape" :size="props.size">
        <slot>
          <SwatchFallback v-if="props.hex" />
        </slot>
      </SwatchRoot>
      <svg
        v-if="unavailable"
        data-slot="swatch-strike"
        class="fui-swatch-strike pointer-events-none absolute inset-0"
        width="100%"
        height="100%"
        viewBox="0 0 10 10"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line class="fui-swatch-strike-halo" x1="0" y1="10" x2="10" y2="0" stroke="currentColor" stroke-width="3" vector-effect="non-scaling-stroke" />
        <line x1="0" y1="10" x2="10" y2="0" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" />
      </svg>
    </component>
    <slot name="label">
      <SwatchLabel v-if="label" :class="labelClass">{{ label }}</SwatchLabel>
    </slot>
    <span v-if="unavailable" class="sr-only">, {{ unavailableLabel }}</span>
  </label>
</template>
