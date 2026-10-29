<script setup lang="ts">
import { Separator } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <div class="flex max-w-sm flex-col gap-4 text-sm">
    <div class="flex flex-col gap-1.5">
      <div class="font-medium">Frost Escape Parka</div>
      <div>Insulated parka with a detachable hood and a two-way zip.</div>
    </div>
    <Separator v-bind="$attrs" />
    <div class="flex h-5 items-center gap-4">
      <div>Free shipping</div>
      <Separator orientation="vertical" />
      <div>30-day returns</div>
      <Separator orientation="vertical" />
      <div>Size guide</div>
    </div>
  </div>
</template>
