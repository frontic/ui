<script lang="ts">
/** Lets the user go to the previous page. */
export default {}
</script>

<script setup lang="ts">
import type { PaginationPrevProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { PaginationButtonSize } from '.'
import { reactiveOmit } from '@vueuse/core'
import { PaginationPrev, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'

const props = withDefaults(
  defineProps<
    PaginationPrevProps & {
      /** The button's size, from Button's size scale. */
      size?: PaginationButtonSize
      class?: HTMLAttributes['class']
      /** Shown next to the icon on the button that goes to the previous page; hidden when the pagination is narrow. */
      label?: string
    }
  >(),
  {
    size: 'md',
    label: 'Previous',
  },
)

const delegatedProps = reactiveOmit(props, 'class', 'size', 'label')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <PaginationPrev data-slot="pagination-previous" v-bind="forwarded" as-child>
    <Button variant="ghost" color="neutral" :size="props.size" :class="['fui-pagination-previous', props.class]">
      <slot>
        <IconPlaceholder lucide="ChevronLeftIcon" tabler="IconChevronLeft" hugeicons="ArrowLeft01Icon" phosphor="CaretLeftIcon" remixicon="RiArrowLeftSLine" class="rtl:-scale-x-100" data-icon />
        <span class="hidden @2xl/pagination:block">{{ props.label }}</span>
      </slot>
    </Button>
  </PaginationPrev>
</template>
