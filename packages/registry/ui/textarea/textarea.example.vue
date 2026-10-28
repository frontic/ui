<script setup lang="ts">
import { Textarea } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Textarea
    aria-label="Gift message"
    placeholder="Add a gift message"
    maxlength="200"
    class="max-w-sm"
    v-bind="$attrs" />
</template>
