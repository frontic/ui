<script setup lang="ts">
import { Badge } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Badge variant="new" v-bind="$attrs">New</Badge>
</template>
