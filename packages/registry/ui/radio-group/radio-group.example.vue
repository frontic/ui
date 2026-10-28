<script setup lang="ts">
import { useId } from 'vue'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@library/components/ui/field'
import { RadioGroup, RadioGroupItem } from '.'

defineOptions({ inheritAttrs: false })

const id = useId()
</script>

<template>
  <Field class="w-fit max-w-full">
    <FieldLabel :native-label="false">Delivery</FieldLabel>
    <RadioGroup default-value="standard" v-bind="$attrs">
      <Field orientation="horizontal">
        <RadioGroupItem :id="`${id}-standard`" value="standard" />
        <FieldContent>
          <FieldLabel :for="`${id}-standard`">Standard delivery</FieldLabel>
          <FieldDescription
            >Arrives in 3 to 5 working days. Free.</FieldDescription
          >
        </FieldContent>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem :id="`${id}-express`" value="express" />
        <FieldContent>
          <FieldLabel :for="`${id}-express`">Express delivery</FieldLabel>
          <FieldDescription>Arrives the next working day.</FieldDescription>
        </FieldContent>
      </Field>
    </RadioGroup>
  </Field>
</template>
