<script setup lang="ts">
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Badge } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Badge v-bind="$attrs">
    <IconPlaceholder
      lucide="CheckIcon"
      tabler="IconCheck"
      hugeicons="Tick02Icon"
      phosphor="CheckIcon"
      remixicon="RiCheckLine"
      data-icon />
    New
  </Badge>
</template>
