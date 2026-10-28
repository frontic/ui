<script setup lang="ts">
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Toggle } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Toggle
    v-slot="{ pressed }"
    aria-label="Save to wishlist"
    variant="outline"
    size="icon-md"
    v-bind="$attrs">
    <IconPlaceholder
      data-icon
      lucide="HeartIcon"
      tabler="IconHeart"
      hugeicons="FavouriteIcon"
      phosphor="HeartIcon"
      remixicon="RiHeartLine"
      :class="pressed ? 'fill-current' : undefined" />
  </Toggle>
</template>
