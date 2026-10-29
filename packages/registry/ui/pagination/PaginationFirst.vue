<script setup lang="ts">
import type { PaginationFirstProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { PaginationButtonSize } from '.'
import { reactiveOmit } from '@vueuse/core'
import { PaginationFirst, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'

const props = withDefaults(
  defineProps<
    PaginationFirstProps & {
      /** The button's size, from Button's size scale. */
      size?: PaginationButtonSize
      class?: HTMLAttributes['class']
      /** Shown next to the icon on the button that jumps to the first page; hidden when the pagination is narrow. */
      label?: string
    }
  >(),
  {
    size: 'md',
    label: 'First',
  },
)

const delegatedProps = reactiveOmit(props, 'class', 'size', 'label')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <PaginationFirst data-slot="pagination-first" v-bind="forwarded" as-child>
    <Button variant="ghost" color="neutral" :size="props.size" :class="[props.class]">
      <slot>
        <IconPlaceholder
          lucide="ChevronsLeftIcon"
          tabler="IconChevronsLeft"
          hugeicons="ArrowLeftDoubleIcon"
          phosphor="CaretDoubleLeftIcon"
          remixicon="RiArrowLeftDoubleLine"
          class="rtl:-scale-x-100"
          data-icon
        />
        <span class="hidden @2xl/pagination:block">{{ props.label }}</span>
      </slot>
    </Button>
  </PaginationFirst>
</template>
