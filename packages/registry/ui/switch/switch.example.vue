<script setup lang="ts">
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@library/components/ui/field'
import { Switch } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Field orientation="horizontal">
    <FieldContent>
      <FieldLabel>Order updates</FieldLabel>
      <FieldDescription>We email you when your order ships.</FieldDescription>
    </FieldContent>
    <Switch v-bind="$attrs" />
  </Field>
</template>
