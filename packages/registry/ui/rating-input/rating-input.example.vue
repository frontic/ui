<script setup lang="ts">
import { Field, FieldLabel } from '@library/components/ui/field'
import { RatingInput } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Field class="w-fit max-w-full">
    <FieldLabel :native-label="false">Your rating</FieldLabel>
    <RatingInput :default-value="4" v-bind="$attrs" />
  </Field>
</template>
