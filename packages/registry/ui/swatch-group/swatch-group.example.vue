<script setup lang="ts">
import { ref } from 'vue'
import { SwatchGroup, SwatchGroupItem } from '.'

defineOptions({ inheritAttrs: false })

const selected = ref('aubergine')
</script>

<template>
  <SwatchGroup
    v-model="selected"
    type="single"
    aria-label="Colour"
    v-bind="$attrs">
    <SwatchGroupItem value="aubergine" hex="#3d3347" label="Aubergine" />
    <SwatchGroupItem value="dusty-rose" hex="#b98a87" label="Dusty rose" />
    <SwatchGroupItem
      value="salmon"
      hex="#dc967b"
      label="Salmon"
      unavailable
      unavailable-label="Sold out" />
  </SwatchGroup>
</template>
