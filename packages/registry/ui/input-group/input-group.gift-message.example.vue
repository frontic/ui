<script setup lang="ts">
import { ref } from 'vue'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from '.'

defineOptions({ inheritAttrs: false })

const limit = 200
const message = ref('')
</script>

<template>
  <InputGroup class="max-w-sm" v-bind="$attrs">
    <InputGroupTextarea
      v-model="message"
      :maxlength="limit"
      placeholder="Add a gift message"
      aria-label="Gift message" />
    <InputGroupAddon align="block-end">
      <InputGroupText class="ms-auto"
        >{{ message.length }}/{{ limit }}</InputGroupText
      >
    </InputGroupAddon>
  </InputGroup>
</template>
