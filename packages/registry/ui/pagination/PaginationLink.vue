<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Links to a specific page and marks it when it is the current one. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { PaginationButtonSize } from '.'
import { Button } from '@library/components/ui/button'

const props = withDefaults(
  defineProps<
    Pick<PrimitiveProps, 'as'> & {
      /** The URL of the page this link opens. */
      href?: string
      /** The button's size, from Button's size scale. */
      size?: PaginationButtonSize
      /** Marks the current page with an outlined button and `aria-current="page"`. */
      isActive?: boolean
      class?: HTMLAttributes['class']
    }
  >(),
  {
    as: 'a',
    size: 'icon-md',
    isActive: false,
  },
)
</script>

<template>
  <Button
    :as="props.as"
    :href="props.href"
    data-slot="pagination-link"
    :data-active="props.isActive ? '' : undefined"
    :aria-current="props.isActive ? 'page' : undefined"
    :variant="props.isActive ? 'outline' : 'ghost'"
    color="neutral"
    :size="props.size"
    :class="props.class"
  >
    <slot />
  </Button>
</template>
