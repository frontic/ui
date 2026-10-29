<script setup lang="ts">
import { Input } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Input
    type="email"
    placeholder="you@example.com"
    autocomplete="email"
    aria-label="Email"
    class="max-w-sm"
    v-bind="$attrs" />
</template>
