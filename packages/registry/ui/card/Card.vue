<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'

const card = cva('fui-card group/card overflow-hidden has-[>img:first-child]:pt-0 has-[>[data-slot=card-image]:first-child]:pt-0', {
  variants: {
    surface: {
      raised: 'fui-card-raised',
      bare: 'fui-card-bare',
    },
  },
  defaultVariants: { surface: 'raised' },
})

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      /** Raised stands on its own with an edge, a shadow and an inset; bare sits flush inside another surface, a Card-rooted section inside a Card. */
      surface?: VariantProps<typeof card>['surface']
      class?: HTMLAttributes['class']
    }
  >(),
  { as: 'div', surface: 'raised' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="card" :data-surface="props.surface" :class="[card({ surface: props.surface }), props.class]">
    <slot />
  </Primitive>
</template>
