<script setup lang="ts">
import type { PaginationEllipsisProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { PaginationEllipsis, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = withDefaults(
  defineProps<
    PaginationEllipsisProps & {
      class?: HTMLAttributes['class']
      /** Read by screen readers in place of the ellipsis icon. */
      label?: string
    }
  >(),
  {
    label: 'More pages',
  },
)

const delegatedProps = reactiveOmit(props, 'class', 'label')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <PaginationEllipsis data-slot="pagination-ellipsis" v-bind="forwarded" :class="['fui-pagination-ellipsis @max-md/pagination:hidden', props.class]">
    <slot>
      <IconPlaceholder lucide="MoreHorizontalIcon" tabler="IconDots" hugeicons="MoreHorizontalCircle01Icon" phosphor="DotsThreeIcon" remixicon="RiMoreLine" data-icon />
      <span class="sr-only">{{ props.label }}</span>
    </slot>
  </PaginationEllipsis>
</template>
