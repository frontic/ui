<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Dismisses the dialog without taking the action. */
export default {}
</script>

<script setup lang="ts">
import type { AlertDialogCancelProps } from 'reka-ui'
import type { AlertDialogButtonProps } from '.'
import { reactiveOmit } from '@vueuse/core'
import { AlertDialogCancel, useForwardProps } from 'reka-ui'
import { Button } from '@library/components/ui/button'

const props = withDefaults(defineProps<AlertDialogCancelProps & AlertDialogButtonProps>(), {
  variant: 'outline',
  color: 'neutral',
  size: 'md',
})

const delegatedProps = reactiveOmit(props, 'class', 'variant', 'color', 'size')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AlertDialogCancel data-slot="alert-dialog-cancel" v-bind="forwarded" as-child>
    <Button :variant="props.variant" :color="props.color" :size="props.size" :class="props.class">
      <slot />
    </Button>
  </AlertDialogCancel>
</template>
