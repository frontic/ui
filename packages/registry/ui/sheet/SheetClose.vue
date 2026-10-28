<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Closes the sheet. */
export default {}
</script>

<script setup lang="ts">
import type { DialogCloseProps } from 'reka-ui'
import { DialogClose, useForwardProps } from 'reka-ui'

const props = defineProps<DialogCloseProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <DialogClose data-slot="sheet-close" v-bind="forwarded">
    <slot />
  </DialogClose>
</template>
