<script lang="ts">
import type { ImgHTMLAttributes } from 'vue'
import type { PrimitiveProps } from 'reka-ui'
import type { ImageLoadingStatus } from './SwatchRoot.vue'

export interface SwatchImageProps extends PrimitiveProps {
  /** The URL of the image that shows the option. */
  src: string
  /** Describes the image for screen readers. */
  alt?: string
  /** The referrer policy used when loading the image. */
  referrerPolicy?: ImgHTMLAttributes['referrerpolicy']
  /** The CORS mode used when loading the image. */
  crossOrigin?: ImgHTMLAttributes['crossorigin']
}

export type SwatchImageEmits = {
  /** Fires with the image's loading status, `idle`, `loading`, `loaded` or `error`, when the image mounts and each time the status changes. */
  loadingStatusChange: [value: ImageLoadingStatus]
}
</script>

<script setup lang="ts">
import { useImage } from '@vueuse/core'
import { computed, watch } from 'vue'
import { cva } from 'class-variance-authority'
import { Primitive } from 'reka-ui'
import { injectSwatchRootContext } from './SwatchRoot.vue'

const image = cva('fui-swatch-image object-cover', {
  variants: {
    shape: { default: 'fui-swatch-image-default', pill: 'fui-swatch-image-pill' },
    size: { xs: 'fui-swatch-image-xs', sm: 'fui-swatch-image-sm', md: 'fui-swatch-image-md', lg: 'fui-swatch-image-lg' },
  },
  defaultVariants: { shape: 'default' },
})

const props = withDefaults(defineProps<SwatchImageProps>(), { as: 'img' })
const emits = defineEmits<SwatchImageEmits>()

const context = injectSwatchRootContext()
const { isLoading, isReady, error } = useImage(() => ({ src: props.src, referrerPolicy: props.referrerPolicy as HTMLImageElement['referrerPolicy'], crossorigin: props.crossOrigin }))
const imageLoadingStatus = computed<ImageLoadingStatus>(() => (!props.src || error.value ? 'error' : isReady.value ? 'loaded' : isLoading.value ? 'loading' : 'idle'))

watch(
  imageLoadingStatus,
  (newValue) => {
    emits('loadingStatusChange', newValue)
    if (newValue !== 'idle') context.imageLoadingStatus.value = newValue
  },
  { immediate: true },
)
</script>

<template>
  <Primitive
    v-show="imageLoadingStatus === 'loaded'"
    data-slot="swatch-image"
    :as-child="asChild"
    :as="as"
    :src="src"
    :alt="alt"
    :referrer-policy="referrerPolicy"
    :class="image({ shape: context.shape.value, size: context.size.value })"
  >
    <slot />
  </Primitive>
</template>
