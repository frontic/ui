<script setup lang="ts">
import type { PaginationListItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { PaginationButtonSize } from '.'
import { reactiveOmit } from '@vueuse/core'
import { injectPaginationRootContext, PaginationListItem, useForwardProps } from 'reka-ui'
import { computed } from 'vue'
import { Button } from '@library/components/ui/button'

const props = withDefaults(
  defineProps<
    PaginationListItemProps & {
      /** The button's size, from Button's size scale. */
      size?: PaginationButtonSize
      class?: HTMLAttributes['class']
      /** Marks the page as the current one with an outlined button; follows the pagination's page when left out. */
      isActive?: boolean
    }
  >(),
  {
    size: 'icon-md',
    isActive: undefined,
  },
)

const delegatedProps = reactiveOmit(props, 'class', 'size', 'isActive')
const root = injectPaginationRootContext()
const active = computed(() => props.isActive ?? root.page.value === props.value)
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <PaginationListItem data-slot="pagination-item" v-bind="forwarded" as-child>
    <Button :variant="active ? 'outline' : 'ghost'" color="neutral" :size="props.size" :data-active="active ? '' : undefined" :class="['@max-md/pagination:not-data-active:hidden', props.class]">
      <slot />
    </Button>
  </PaginationListItem>
</template>
