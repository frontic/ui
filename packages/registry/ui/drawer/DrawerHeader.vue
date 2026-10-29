<script lang="ts" setup>
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { injectDrawerRootContext, Primitive } from 'reka-ui'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
    }
  >(),
  { as: 'div' },
)

const root = injectDrawerRootContext()

const drawerHeader = cva('fui-drawer-header', {
  variants: { swipe: { vertical: 'fui-drawer-header-vertical', horizontal: 'fui-drawer-header-horizontal' } },
  defaultVariants: { swipe: 'vertical' },
})
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    data-slot="drawer-header"
    :class="[drawerHeader({ swipe: root.swipeDirection.value === 'down' || root.swipeDirection.value === 'up' ? 'vertical' : 'horizontal' }), props.class]"
  >
    <slot />
  </Primitive>
</template>
