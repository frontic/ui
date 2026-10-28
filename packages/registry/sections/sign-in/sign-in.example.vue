<script setup lang="ts">
import { ref } from 'vue'
import { SignIn } from '.'

defineOptions({ inheritAttrs: false })

const code = ref('4817')
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <SignIn
      v-model:code="code"
      email="lena.berg@example.com"
      code-hint="Didn't get it? Resend in 0:42."
      v-bind="$attrs" />
  </div>
</template>
