<script setup lang="ts">
import type { TabsTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { TabsTrigger, useForwardProps } from 'reka-ui'
import { computed, inject } from 'vue'
import { TABS_LIST_VARIANT } from './context'

const tabsTrigger = cva(
  'fui-tabs-trigger group/tabs-trigger relative whitespace-nowrap transition-all outline-none group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start disabled:pointer-events-none disabled:fui-disabled *:data-icon:pointer-events-none *:data-icon:shrink-0',
  {
    variants: {
      variant: {
        default: 'fui-tabs-trigger-default',
        line: 'fui-tabs-trigger-line',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwardedProps = useForwardProps(delegatedProps)
const injected = inject(TABS_LIST_VARIANT, undefined)
const variant = computed(() => injected?.value ?? 'default')
</script>

<template>
  <TabsTrigger data-slot="tabs-trigger" :class="[tabsTrigger({ variant }), props.class]" v-bind="forwardedProps">
    <slot />
    <span
      v-if="variant === 'line'"
      aria-hidden="true"
      class="absolute opacity-0 transition-opacity group-aria-selected/tabs-trigger:opacity-100 group-data-horizontal/tabs:inset-x-0 group-data-horizontal/tabs:-bottom-1.25 group-data-horizontal/tabs:h-0.5 group-data-vertical/tabs:inset-y-0 group-data-vertical/tabs:-inset-e-1 group-data-vertical/tabs:w-0.5"
    >
      <span data-slot="tabs-trigger-indicator" class="fui-tabs-trigger-indicator block size-full" />
    </span>
  </TabsTrigger>
</template>
