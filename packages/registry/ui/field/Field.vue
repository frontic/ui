<script setup lang="ts">
import type { FieldRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { FieldOrientation } from '.'
import { reactiveOmit } from '@vueuse/core'
import { FieldRoot, useForwardProps } from 'reka-ui'
import { computed, inject, provide, toRef } from 'vue'
import { fronticFieldOrientation, fronticFieldValidate } from './keys'

const ORIENTATION: Record<FieldOrientation, string> = {
  vertical: 'flex-col',
  horizontal: 'flex-row items-center [&>[data-slot=field-label]]:flex-auto has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
  responsive:
    'flex-col @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>[data-slot=field-label]]:flex-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
}

const props = withDefaults(
  defineProps<
    FieldRootProps & {
      class?: HTMLAttributes['class']
      /** Label above the control, beside it, or `responsive`: beside it once the field group is wide enough. */
      orientation?: FieldOrientation
    }
  >(),
  {
    orientation: 'vertical',
    invalid: undefined,
    dirty: undefined,
    touched: undefined,
  },
)

defineSlots<{
  /** The label, control, description and error; gets `invalid` and the current `errors`. */
  default?: (props: { invalid: boolean; errors: string[] }) => unknown
}>()

const forwarded = useForwardProps(reactiveOmit(props, 'class', 'orientation', 'validate'))

provide(fronticFieldOrientation, toRef(props, 'orientation'))

const validateFor = inject(fronticFieldValidate, undefined)
const validate = computed(() => props.validate ?? (props.name ? validateFor?.(props.name) : undefined))
</script>

<template>
  <FieldRoot
    v-slot="slotProps"
    v-bind="forwarded"
    :validate="validate"
    role="group"
    data-slot="field"
    :data-orientation="orientation"
    :data-horizontal="orientation === 'horizontal' || undefined"
    :class="['fui-field group/field', ORIENTATION[orientation], props.class]"
  >
    <slot v-bind="slotProps" />
  </FieldRoot>
</template>
