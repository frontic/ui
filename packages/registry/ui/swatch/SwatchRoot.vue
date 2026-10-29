<script lang="ts">
import type { Ref } from 'vue'
import type { SwatchShape, SwatchSize } from '.'
import { createContext } from 'reka-ui'

/** Where the swatch image is: not started, loading, loaded or failed. */
export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'

export type SwatchRootContext = {
  imageLoadingStatus: Ref<ImageLoadingStatus>
  hex: Ref<string | undefined>
  shape: Ref<SwatchShape>
  size: Ref<SwatchSize | undefined>
}

export const [injectSwatchRootContext, provideSwatchRootContext] = createContext<SwatchRootContext>('SwatchRoot')

/** Groups the image and fallback of a swatch and shares its shape and size. */
export default {}
</script>

<script setup lang="ts">
import { ref, toRef } from 'vue'

const props = withDefaults(
  defineProps<{
    /** The colour the fallback fills with while no image is loaded. */
    hex?: string
    /** The corner shape the image and fallback take. */
    shape?: SwatchShape
    /** The size the image and fallback take. */
    size?: SwatchSize
  }>(),
  { shape: 'default' },
)

provideSwatchRootContext({
  imageLoadingStatus: ref<ImageLoadingStatus>('idle'),
  hex: toRef(props, 'hex'),
  shape: toRef(props, 'shape'),
  size: toRef(props, 'size'),
})
</script>

<template>
  <slot />
</template>
