<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
import type { PrimitiveProps } from 'reka-ui'

export interface SwatchFallbackProps extends PrimitiveProps {
  /** Waits this many milliseconds before showing the fallback, so a fast image loads without a flash. */
  delayMs?: number
}

/** Shows the option's colour while its image loads or when there is none. */
export default {}
</script>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { cva } from 'class-variance-authority'
import { Primitive } from 'reka-ui'
import { injectSwatchRootContext } from './SwatchRoot.vue'

const fallback = cva('fui-swatch-fallback absolute inset-px', {
  variants: {
    shape: { default: 'fui-swatch-fallback-default', pill: 'fui-swatch-fallback-pill' },
    size: { xs: 'fui-swatch-fallback-xs', sm: 'fui-swatch-fallback-sm', md: 'fui-swatch-fallback-md', lg: 'fui-swatch-fallback-lg' },
  },
  defaultVariants: { shape: 'default' },
})

const props = withDefaults(defineProps<SwatchFallbackProps>(), { as: 'span' })

const context = injectSwatchRootContext()
const canRender = ref(props.delayMs === undefined)

watchEffect((onCleanup) => {
  if (props.delayMs !== undefined) {
    const timerId = window.setTimeout(() => {
      canRender.value = true
    }, props.delayMs)
    onCleanup(() => window.clearTimeout(timerId))
  }
})
</script>

<template>
  <Primitive
    v-if="canRender && context.imageLoadingStatus.value !== 'loaded'"
    data-slot="swatch-fallback"
    :as-child="asChild"
    :as="as"
    :class="fallback({ shape: context.shape.value, size: context.size.value })"
    :style="context.hex.value ? { backgroundColor: context.hex.value } : undefined"
  >
    <slot />
  </Primitive>
</template>
