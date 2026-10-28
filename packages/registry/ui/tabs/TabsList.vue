<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups the triggers that switch between the tabs. */
export default {}
</script>

<script setup lang="ts">
import type { TabsListProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { TabsListVariant } from './context'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { TabsList, useForwardProps } from 'reka-ui'
import { computed, provide } from 'vue'
import { TABS_LIST_VARIANT } from './context'

const tabsList = cva('fui-tabs-list group/tabs-list group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col', {
  variants: {
    variant: {
      default: 'fui-tabs-list-default',
      line: 'fui-tabs-list-line',
    },
  },
  defaultVariants: { variant: 'default' },
})

const props = withDefaults(
  defineProps<
    TabsListProps & {
      class?: HTMLAttributes['class']
      /** The visual style: tabs on a muted bar, or a line under the active tab. */
      variant?: TabsListVariant
    }
  >(),
  {
    variant: 'default',
  },
)

const delegatedProps = reactiveOmit(props, 'class', 'variant')
const forwarded = useForwardProps(delegatedProps)

provide(
  TABS_LIST_VARIANT,
  computed(() => props.variant),
)
</script>

<template>
  <TabsList data-slot="tabs-list" :data-variant="props.variant" v-bind="forwarded" :class="[tabsList({ variant: props.variant }), props.class]">
    <slot />
  </TabsList>
</template>
