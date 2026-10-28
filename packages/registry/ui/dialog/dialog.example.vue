<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { ref, useId } from 'vue'
import { Button } from '@library/components/ui/button'
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from '@library/components/ui/field'
import { Input } from '@library/components/ui/input'
import {
  NativeSelect,
  NativeSelectOption,
} from '@library/components/ui/native-select'
import { Switch } from '@library/components/ui/switch'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '.'

defineOptions({ inheritAttrs: false })

const countries = [
  { value: 'de', label: 'Germany' },
  { value: 'at', label: 'Austria' },
  { value: 'ch', label: 'Switzerland' },
  { value: 'it', label: 'Italy' },
  { value: 'nl', label: 'Netherlands' },
]

const firstName = ref('Lena')
const lastName = ref('Huber')
const street = ref('Lindwurmstraße 88')
const postcode = ref('80337')
const city = ref('München')
const country = ref('de')
const isDefault = ref(true)

const id = useId()
</script>

<template>
  <Dialog v-slot="{ close }" default-open v-bind="$attrs">
    <DialogTrigger as-child
      ><Button variant="outline" color="neutral"
        >Edit address</Button
      ></DialogTrigger
    >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit address</DialogTitle>
        <DialogDescription
          >Changes apply to your next orders, not to ones already on their
          way.</DialogDescription
        >
      </DialogHeader>
      <DialogBody>
        <form :id="`${id}-form`" @submit.prevent="close()">
          <FieldGroup>
            <div class="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel :for="`${id}-first-name`">First name</FieldLabel>
                <Input
                  :id="`${id}-first-name`"
                  v-model="firstName"
                  autocomplete="given-name" />
              </Field>
              <Field>
                <FieldLabel :for="`${id}-last-name`">Last name</FieldLabel>
                <Input
                  :id="`${id}-last-name`"
                  v-model="lastName"
                  autocomplete="family-name" />
              </Field>
            </div>
            <Field>
              <FieldLabel :for="`${id}-street`">Street and number</FieldLabel>
              <Input
                :id="`${id}-street`"
                v-model="street"
                autocomplete="address-line1" />
            </Field>
            <div class="grid grid-cols-3 gap-4">
              <Field>
                <FieldLabel :for="`${id}-postcode`">Postcode</FieldLabel>
                <Input
                  :id="`${id}-postcode`"
                  v-model="postcode"
                  autocomplete="postal-code" />
              </Field>
              <Field class="col-span-2">
                <FieldLabel :for="`${id}-city`">City</FieldLabel>
                <Input
                  :id="`${id}-city`"
                  v-model="city"
                  autocomplete="address-level2" />
              </Field>
            </div>
            <Field>
              <FieldLabel :for="`${id}-country`">Country</FieldLabel>
              <NativeSelect
                :id="`${id}-country`"
                v-model="country"
                autocomplete="country"
                class="w-full">
                <NativeSelectOption
                  v-for="option in countries"
                  :key="option.value"
                  :value="option.value"
                  >{{ option.label }}</NativeSelectOption
                >
              </NativeSelect>
            </Field>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel :for="`${id}-default`"
                  >Use as my default delivery address</FieldLabel
                >
              </FieldContent>
              <Switch :id="`${id}-default`" v-model="isDefault" />
            </Field>
          </FieldGroup>
        </form>
      </DialogBody>
      <DialogFooter>
        <DialogClose as-child
          ><Button variant="outline" color="neutral"
            >Cancel</Button
          ></DialogClose
        >
        <Button type="submit" :form="`${id}-form`">Save address</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
