<script setup lang="ts">
import { ref } from 'vue'
import { AccountAccess } from '.'

defineOptions({ inheritAttrs: false })

const email = ref('lena.berg@example.com')
const password = ref('')
const twoFactor = ref(true)
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <AccountAccess
      v-model:email="email"
      current-email="lena.berg@example.com"
      v-model:password="password"
      v-model:two-factor="twoFactor"
      description="How you get into your Basecamp Store account."
      notice-title="Confirm your new email"
      notice-description="We sent a link to lena.berg@example.org. It expires on 10 Oct."
      password-hint="Last changed on 14 March 2026."
      two-factor-hint="Authenticator app, added 2 Sep 2026."
      v-bind="$attrs" />
  </div>
</template>
