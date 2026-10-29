<script setup lang="ts">
import type { RatingRootEmits, RatingRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RatingRoot, useForwardPropsEmits } from 'reka-ui'
import { useTemplateRef } from 'vue'
import { checkedRadio, useFieldControl } from '@library/composables/use-field-control'
import type { RatingShape, RatingSize } from '@library/components/ui/rating'
import RatingInputItem from './RatingInputItem.vue'

const props = withDefaults(
  defineProps<
    Omit<RatingRootProps, 'step'> & {
      class?: HTMLAttributes['class']
      /** The size of each mark. */
      size?: RatingSize
      /** Draws the marks as dots or stars. */
      shape?: RatingShape
      /** Builds each mark's screen-reader name from its value and the number of marks, e.g. `4 out of 5`. */
      label?: (value: number, length: number) => string
    }
  >(),
  {
    length: 5,
    hoverable: true,
    size: 'md',
    shape: 'star',
    label: (value: number, length: number) => `${value} out of ${length}`,
  },
)
const emits = defineEmits<RatingRootEmits>()

const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class', 'size', 'shape', 'label'), emits)

// Delete once Reka's Rating reads the Field itself.
const { joined, report } = useFieldControl({
  props,
  forwarded,
  root: useTemplateRef<{ $el: HTMLElement }>('root'),
  element: checkedRadio,
  isFilled: (value) => typeof value === 'number' && value > 0,
})
</script>

<template>
  <RatingRoot ref="root" v-slot="{ items }" data-slot="rating-input" :class="['fui-rating-input', props.class]" v-bind="joined" @update:model-value="report">
    <RatingInputItem v-for="item in items" :key="item" :item="item" :aria-label="props.label(item, props.length)" :size="props.size" :shape="props.shape" />
  </RatingRoot>
</template>
