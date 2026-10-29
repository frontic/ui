<script setup lang="ts">
import { FieldValidity } from 'reka-ui'

defineSlots<{
  /** Gets the field's `validity` (`valid` is `null` until there is one), its `errors`, the first `error`, the `value` validated last and the `initialValue`. */
  default?: (props: { validity: Omit<Record<keyof ValidityState, boolean>, 'valid'> & { valid: boolean | null }; errors: string[]; error: string; value: unknown; initialValue: unknown }) => unknown
}>()
</script>

<template>
  <FieldValidity v-slot="state">
    <slot v-bind="state" />
  </FieldValidity>
</template>
