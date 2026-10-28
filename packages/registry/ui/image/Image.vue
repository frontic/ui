<script lang="ts">
/** Shows an image with a loading state and a fallback if it fails to load. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { cva } from 'class-variance-authority'
import ImageFallback from './ImageFallback.vue'

type LoadingEffect = 'skeleton' | 'blur' | 'none'

const image = cva('fui-image relative overflow-hidden')

const imageLoading = cva('fui-image-loading absolute inset-0 z-10 overflow-hidden', {
  variants: {
    effect: {
      skeleton: 'fui-image-loading-skeleton',
      blur: 'fui-image-loading-blur',
    },
  },
  defaultVariants: { effect: 'skeleton' },
})

defineOptions({ inheritAttrs: false })

defineSlots<{
  /** Replaces the placeholder shown when the image fails to load and no fallback URL loads either. */
  fallback?: () => unknown
}>()

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** URL of the image to show. */
    src?: string
    /** Text alternative read by screen readers; leave empty for a purely decorative image. */
    alt?: string
    /** What shows until the image has loaded: a pulsing placeholder, the `placeholderSrc` preview blurred, or nothing. Blur without a `placeholderSrc` shows the pulsing placeholder. */
    loadingEffect?: LoadingEffect
    /** URL tried when `src` fails to load; the fallback slot shows when both fail. */
    fallbackSrc?: string
    /** URL of a tiny version of the image, e.g. 24px wide, shown blurred while `src` loads when `loadingEffect` is `blur`. */
    placeholderSrc?: string
    /** Loads the image first, eagerly and at high fetch priority, instead of when it nears the viewport. Set it on the one image that is the page's largest paint, such as a hero or the first gallery image. */
    priority?: boolean
  }>(),
  {
    loadingEffect: 'skeleton',
  },
)

const loaded = ref(false)
const errored = ref(false)
const fallbackErrored = ref(false)
const imgRef = useTemplateRef<HTMLImageElement>('imgRef')
const failed = computed(() => (errored.value && !props.fallbackSrc) || fallbackErrored.value)

watch(
  () => props.src,
  () => {
    loaded.value = false
    errored.value = false
    fallbackErrored.value = false
  },
)

onMounted(() => {
  const img = imgRef.value
  if (!img) return
  if (img.complete) {
    if (img.naturalWidth === 0) errored.value = true
    else loaded.value = true
  }
})

function onLoad() {
  loaded.value = true
}

function onError() {
  if (errored.value && props.fallbackSrc) {
    fallbackErrored.value = true
  } else {
    errored.value = true
  }
}
</script>

<template>
  <span data-slot="image" :role="failed && alt ? 'img' : undefined" :aria-label="failed && alt ? alt : undefined" :class="[image(), props.class]">
    <template v-if="failed">
      <slot name="fallback">
        <ImageFallback />
      </slot>
    </template>

    <template v-else>
      <span v-if="!loaded && loadingEffect === 'blur' && placeholderSrc" data-slot="image-loading" :class="imageLoading({ effect: 'blur' })">
        <img :src="placeholderSrc" alt="" aria-hidden="true" :loading="priority ? 'eager' : 'lazy'" class="block size-full scale-110 object-cover blur-lg" />
      </span>
      <span v-else-if="!loaded && loadingEffect !== 'none'" data-slot="image-loading" :class="[imageLoading({ effect: 'skeleton' }), 'animate-pulse motion-reduce:animate-none']" />

      <img
        ref="imgRef"
        :loading="priority ? 'eager' : 'lazy'"
        :decoding="priority ? 'auto' : 'async'"
        :fetchpriority="priority ? 'high' : undefined"
        v-bind="$attrs"
        :src="errored && fallbackSrc ? fallbackSrc : src"
        :alt="alt"
        data-slot="image-img"
        class="block size-full object-cover"
        @load="onLoad"
        @error="onError"
      />
    </template>
  </span>
</template>
