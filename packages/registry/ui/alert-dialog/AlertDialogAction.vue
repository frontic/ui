<script lang="ts">
/** Confirms the action the dialog asks about and closes the dialog. */
export default {}
</script>

<script setup lang="ts">
import type { AlertDialogActionProps } from 'reka-ui'
import type { AlertDialogButtonProps } from '.'
import { reactiveOmit } from '@vueuse/core'
import { AlertDialogAction, useForwardProps } from 'reka-ui'
import { Button } from '@library/components/ui/button'

const props = withDefaults(defineProps<AlertDialogActionProps & AlertDialogButtonProps>(), {
  variant: 'solid',
  color: 'primary',
  size: 'md',
})

const delegatedProps = reactiveOmit(props, 'class', 'variant', 'color', 'size')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AlertDialogAction data-slot="alert-dialog-action" v-bind="forwarded" as-child>
    <Button :variant="props.variant" :color="props.color" :size="props.size" :class="props.class">
      <slot />
    </Button>
  </AlertDialogAction>
</template>
