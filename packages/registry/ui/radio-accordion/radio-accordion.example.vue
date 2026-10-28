<script setup lang="ts">
import { ref } from 'vue'
import { Field, FieldLabel } from '@library/components/ui/field'
import { NativeSelect } from '@library/components/ui/native-select'
import {
  RadioAccordion,
  RadioAccordionContent,
  RadioAccordionItem,
  RadioAccordionTrigger,
} from '.'

defineOptions({ inheritAttrs: false })

const shipping = ref('express')
const window = ref('morning')
</script>

<template>
  <RadioAccordion v-model="shipping" class="w-md max-w-full" v-bind="$attrs">
    <RadioAccordionItem value="standard">
      <RadioAccordionTrigger
        >Standard, 3 to 5 working days</RadioAccordionTrigger
      >
      <RadioAccordionContent
        >Free on orders over €50, otherwise €4.90.</RadioAccordionContent
      >
    </RadioAccordionItem>
    <RadioAccordionItem value="express">
      <RadioAccordionTrigger>Express, next working day</RadioAccordionTrigger>
      <RadioAccordionContent>
        <Field>
          <FieldLabel>Delivery window</FieldLabel>
          <NativeSelect v-model="window" class="w-full">
            <option value="morning">8:00 to 12:00</option>
            <option value="afternoon">12:00 to 17:00</option>
            <option value="evening">17:00 to 21:00</option>
          </NativeSelect>
        </Field>
      </RadioAccordionContent>
    </RadioAccordionItem>
    <RadioAccordionItem value="pickup" disabled>
      <RadioAccordionTrigger
        >Pick up at the Basecamp store</RadioAccordionTrigger
      >
    </RadioAccordionItem>
  </RadioAccordion>
</template>
