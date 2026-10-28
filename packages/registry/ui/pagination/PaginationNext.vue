<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Lets the user go to the next page. */
export default {}
</script>

<script setup lang="ts">
import type { PaginationNextProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { PaginationButtonSize } from '.'
import { reactiveOmit } from '@vueuse/core'
import { PaginationNext, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'

const props = withDefaults(
  defineProps<
    PaginationNextProps & {
      /** The button's size, from Button's size scale. */
      size?: PaginationButtonSize
      class?: HTMLAttributes['class']
      /** Shown next to the icon on the button that goes to the next page; hidden when the pagination is narrow. */
      label?: string
    }
  >(),
  {
    size: 'md',
    label: 'Next',
  },
)

const delegatedProps = reactiveOmit(props, 'class', 'size', 'label')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <PaginationNext data-slot="pagination-next" v-bind="forwarded" as-child>
    <Button variant="ghost" color="neutral" :size="props.size" :class="['fui-pagination-next', props.class]">
      <slot>
        <span class="hidden @2xl/pagination:block">{{ props.label }}</span>
        <IconPlaceholder lucide="ChevronRightIcon" tabler="IconChevronRight" hugeicons="ArrowRight01Icon" phosphor="CaretRightIcon" remixicon="RiArrowRightSLine" class="rtl:-scale-x-100" data-icon />
      </slot>
    </Button>
  </PaginationNext>
</template>
