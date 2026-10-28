<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { ref } from 'vue'
import { Settings, type SettingsGroup } from '.'

defineOptions({ inheritAttrs: false })

const groups: SettingsGroup[] = [
  {
    label: 'Email',
    options: [
      {
        id: 'orders',
        label: 'Order updates',
        description: 'Confirmation, dispatch and delivery.',
      },
      {
        id: 'restock',
        label: 'Restock alerts',
        description: 'When a size on your wishlist is back.',
      },
      {
        id: 'newsletter',
        label: 'Basecamp Store newsletter',
        description: 'New arrivals and offers. 10% off your first order.',
      },
    ],
  },
  {
    label: 'Text message',
    options: [
      {
        id: 'sms',
        label: 'Delivery day SMS',
        description: 'Add a mobile number to turn this on.',
        disabled: true,
      },
    ],
  },
]

const enabled = ref({
  orders: true,
  restock: true,
  newsletter: false,
  sms: false,
})
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <Settings
      v-model="enabled"
      title="Notifications"
      description="Choose what we send you, and where."
      save-label="Save preferences"
      :groups="groups"
      v-bind="$attrs" />
  </div>
</template>
