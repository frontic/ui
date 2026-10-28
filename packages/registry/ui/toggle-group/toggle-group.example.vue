<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <ToggleGroup
    type="multiple"
    variant="outline"
    :default-value="['waterproof', 'insulated']"
    aria-label="Jacket features"
    v-bind="$attrs">
    <ToggleGroupItem value="waterproof">Waterproof</ToggleGroupItem>
    <ToggleGroupItem value="insulated">Insulated</ToggleGroupItem>
    <ToggleGroupItem value="packable">Packable</ToggleGroupItem>
  </ToggleGroup>
</template>
