<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { AspectRatio } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <div class="w-sm max-w-full">
    <AspectRatio :ratio="16 / 9" v-bind="$attrs">
      <img
        src="https://static.frontic.com/cdn-cgi/image/format=auto/ui/banners/mens-jackets.png"
        alt="A man in a colour-block ski jacket in front of snowy mountains"
        class="size-full object-cover" />
    </AspectRatio>
  </div>
</template>
