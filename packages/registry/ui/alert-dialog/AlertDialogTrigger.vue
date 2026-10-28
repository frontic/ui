<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Opens the alert dialog. */
export default {}
</script>

<script setup lang="ts">
import type { AlertDialogTriggerProps } from 'reka-ui'
import { AlertDialogTrigger, useForwardProps } from 'reka-ui'

const props = defineProps<AlertDialogTriggerProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <AlertDialogTrigger data-slot="alert-dialog-trigger" v-bind="forwarded">
    <slot />
  </AlertDialogTrigger>
</template>
