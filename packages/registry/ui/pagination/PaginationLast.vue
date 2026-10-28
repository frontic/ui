<script lang="ts">
/** Lets the user jump to the last page. */
export default {}
</script>

<script setup lang="ts">
import type { PaginationLastProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { PaginationButtonSize } from '.'
import { reactiveOmit } from '@vueuse/core'
import { PaginationLast, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'

const props = withDefaults(
  defineProps<
    PaginationLastProps & {
      /** The button's size, from Button's size scale. */
      size?: PaginationButtonSize
      class?: HTMLAttributes['class']
      /** Shown next to the icon on the button that jumps to the last page; hidden when the pagination is narrow. */
      label?: string
    }
  >(),
  {
    size: 'md',
    label: 'Last',
  },
)

const delegatedProps = reactiveOmit(props, 'class', 'size', 'label')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <PaginationLast data-slot="pagination-last" v-bind="forwarded" as-child>
    <Button variant="ghost" color="neutral" :size="props.size" :class="[props.class]">
      <slot>
        <span class="hidden @2xl/pagination:block">{{ props.label }}</span>
        <IconPlaceholder
          lucide="ChevronsRightIcon"
          tabler="IconChevronsRight"
          hugeicons="ArrowRightDoubleIcon"
          phosphor="CaretDoubleRightIcon"
          remixicon="RiArrowRightDoubleLine"
          class="rtl:-scale-x-100"
          data-icon
        />
      </slot>
    </Button>
  </PaginationLast>
</template>
