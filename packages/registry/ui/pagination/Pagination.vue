<script lang="ts">
/** Groups all parts of the pagination. */
export default {}
</script>

<script setup lang="ts">
import type { PaginationRootEmits, PaginationRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { PaginationRoot, useForwardPropsEmits } from 'reka-ui'

const props = withDefaults(
  defineProps<
    PaginationRootProps & {
      class?: HTMLAttributes['class']
      /** Names the navigation landmark for screen readers. */
      label?: string
    }
  >(),
  { label: 'Pagination' },
)
const emits = defineEmits<PaginationRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'label')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

defineSlots<{
  /** Holds the pagination's content; gets the current page and the number of pages. */
  default?: (props: { page: number; pageCount: number }) => unknown
}>()
</script>

<template>
  <PaginationRoot v-slot="slotProps" data-slot="pagination" :aria-label="props.label" v-bind="forwarded" :class="['fui-pagination @container/pagination', props.class]">
    <slot v-bind="slotProps" />
  </PaginationRoot>
</template>
