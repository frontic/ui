<script setup lang="ts">
import { Swatch } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Swatch hex="#3d3347" label="Aubergine" v-bind="$attrs" />
</template>
