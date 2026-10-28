<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { ref } from 'vue'
import { SwatchGroup } from '@library/components/ui/swatch-group'
import { Swatch, SwatchFallback, SwatchImage } from '.'

defineOptions({ inheritAttrs: false })

const photo =
  'https://static.frontic.com/cdn-cgi/image/width=160,format=auto/ui/products/blizzard-defender-aubergine.jpg'
const colours = [
  { value: 'charcoal', label: 'Charcoal', hex: '#4a4a47' },
  { value: 'slate-blue', label: 'Slate blue', hex: '#5f7680' },
  { value: 'dusty-pink', label: 'Dusty pink', hex: '#d6aaa6', soldOut: true },
]
const selected = ref('aubergine')
</script>

<template>
  <SwatchGroup v-model="selected" type="single" aria-label="Colour">
    <Swatch value="aubergine" hex="#3d3347" label="Aubergine" v-bind="$attrs">
      <SwatchImage :src="photo" alt="" />
      <SwatchFallback />
    </Swatch>
    <Swatch
      v-for="colour in colours"
      :key="colour.value"
      :value="colour.value"
      :hex="colour.hex"
      :label="colour.label"
      :unavailable="colour.soldOut"
      unavailable-label="Sold out"
      v-bind="$attrs" />
  </SwatchGroup>
</template>
