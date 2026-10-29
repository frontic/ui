<script setup lang="ts">
import { Image } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Image
    src="https://static.frontic.com/cdn-cgi/image/format=auto/ui/banners/mens-jackets.png"
    placeholder-src="https://static.frontic.com/cdn-cgi/image/width=24,format=auto/ui/banners/mens-jackets.png"
    loading-effect="blur"
    alt="A man in a colour-block ski jacket in front of snowy mountains"
    class="aspect-video w-full max-w-sm"
    v-bind="$attrs" />
</template>
