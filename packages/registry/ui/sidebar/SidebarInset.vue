<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { computed } from 'vue'
import { useSidebar } from './utils'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
    }
  >(),
  { as: 'main' },
)

const { isMobile, variant } = useSidebar()
const raised = computed(() => variant.value === 'inset' && !isMobile.value)

const sidebarInset = cva('fui-sidebar-inset relative', {
  variants: {
    variant: {
      flat: 'fui-sidebar-inset-flat',
      raised: 'fui-sidebar-inset-raised',
    },
  },
  defaultVariants: { variant: 'flat' },
})
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="sidebar-inset" :class="[sidebarInset({ variant: raised ? 'raised' : 'flat' }), raised && 'peer-data-collapsed:ms-2', props.class]">
    <slot />
  </Primitive>
</template>
