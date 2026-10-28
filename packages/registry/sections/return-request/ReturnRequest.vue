<script lang="ts">
/** Lets the shopper pick items to return, give a reason and choose the refund. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ReturnChoice, ReturnItem, ReturnRequestValue } from './types'
import type { PriceType } from '@library/lib/format'
import { computed, useId } from 'vue'
import { Button } from '@library/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@library/components/ui/card'
import { Checkbox } from '@library/components/ui/checkbox'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet } from '@library/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@library/components/ui/native-select'
import { Price } from '@library/components/ui/price'
import { RadioGroup, RadioGroupItem } from '@library/components/ui/radio-group'
import { Textarea } from '@library/components/ui/textarea'

const props = withDefaults(
  defineProps<{
    /** Shown as the card's title. */
    title?: string
    /** The order the return is for, such as its number and delivery date. */
    description?: string
    /** The order's items, each with a checkbox to pick it for the return. */
    items: ReturnItem[]
    /** The return reasons the shopper picks from; the reason field hides when empty. */
    reasons?: ReturnChoice[]
    /** Where the refund can go: the original payment, store credit. */
    refundMethods?: ReturnChoice[]
    /** ISO 4217 code the refund total is shown in while there are no items; otherwise the items' own. */
    currency?: string
    /** Shown above the list of items. */
    itemsLabel?: string
    /** Shown above the reason select. */
    reasonLabel?: string
    /** Shown above the comment field. */
    commentLabel?: string
    /** Shown in the empty comment field. */
    commentPlaceholder?: string
    /** Shown above the refund methods. */
    refundToLabel?: string
    /** Shown above the refund total. */
    refundLabel?: string
    /** Shown on the button that sends the return request. */
    submitLabel?: string
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    title: 'Start a return',
    reasons: () => [
      { value: 'fit', label: "Doesn't fit" },
      { value: 'quality', label: 'Not as expected' },
      { value: 'damaged', label: 'Arrived damaged' },
      { value: 'wrong', label: 'Wrong item sent' },
      { value: 'other', label: 'Something else' },
    ],
    refundMethods: () => [],
    currency: 'EUR',
    itemsLabel: 'Items to return',
    reasonLabel: 'Reason',
    commentLabel: 'Anything we should know?',
    refundToLabel: 'Refund to',
    refundLabel: 'Refund',
    submitLabel: 'Request return',
  },
)
const emit = defineEmits<{
  /** Fires with the selected item IDs, reason, comment and refund method when the customer requests the return. */
  submit: [request: ReturnRequestValue]
}>()

/** The ids of the items picked for the return. */
const selected = defineModel<string[]>('selected', { default: () => [] })
/** The chosen return reason, by value; the first reason shows when none is. */
const reason = defineModel<string>('reason')
/** What the shopper typed in the comment field. */
const comment = defineModel<string>('comment', { default: '' })
/** The chosen refund method, by value; the first method shows when none is. */
const refundTo = defineModel<string>('refundTo')

const id = useId()

const returnable = (item: ReturnItem) => item.returnable !== false
const isSelected = (item: ReturnItem) => returnable(item) && selected.value.includes(item.id)

function setSelected(item: ReturnItem, on: boolean | 'indeterminate') {
  const others = selected.value.filter((value) => value !== item.id)
  selected.value = on === true ? [...others, item.id] : others
}

const picked = computed(() => props.items.filter(isSelected))
const refundTotal = computed(() => picked.value.reduce((sum, item) => sum + item.price.amount, 0))
// The items' currency and precision; `currency` while there are none.
const refund = computed((): PriceType => ({ ...(props.items[0]?.price ?? { currency: props.currency }), ref: undefined, amount: refundTotal.value }))

function submit() {
  emit('submit', {
    items: picked.value.map((item) => item.id),
    reason: reason.value ?? props.reasons[0]?.value,
    comment: comment.value,
    refundTo: refundTo.value ?? props.refundMethods[0]?.value,
  })
}
</script>

<template>
  <Card :surface="surface" :class="props.class">
    <CardHeader>
      <CardTitle as="h3">{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-6">
      <FieldSet>
        <FieldLegend variant="label">{{ itemsLabel }}</FieldLegend>
        <div data-slot="checkbox-group" class="flex flex-col gap-3">
          <Field v-for="item in items" :key="item.id" orientation="horizontal" :data-disabled="!returnable(item) || undefined">
            <Checkbox :id="`${id}-item-${item.id}`" :model-value="isSelected(item)" :disabled="!returnable(item)" @update:model-value="setSelected(item, $event)" />
            <FieldContent>
              <FieldLabel :for="`${id}-item-${item.id}`">{{ item.name }}</FieldLabel>
              <FieldDescription v-if="item.detail">{{ item.detail }}</FieldDescription>
            </FieldContent>
            <Price :price="item.price" size="sm" :show-discount="false" align="end" class="group-data-disabled/field:fui-disabled" />
          </Field>
        </div>
      </FieldSet>
      <Field v-if="reasons.length">
        <FieldLabel :for="`${id}-reason`">{{ reasonLabel }}</FieldLabel>
        <NativeSelect :id="`${id}-reason`" :model-value="reason ?? reasons[0]?.value" class="w-full" @update:model-value="reason = String($event)">
          <NativeSelectOption v-for="option in reasons" :key="option.value" :value="option.value">{{ option.label }}</NativeSelectOption>
        </NativeSelect>
      </Field>
      <Field>
        <FieldLabel :for="`${id}-comment`">{{ commentLabel }}</FieldLabel>
        <Textarea :id="`${id}-comment`" v-model="comment" :placeholder="commentPlaceholder" rows="2" />
      </Field>
      <FieldSet v-if="refundMethods.length">
        <FieldLegend variant="label">{{ refundToLabel }}</FieldLegend>
        <RadioGroup :model-value="refundTo ?? refundMethods[0]?.value" class="grid-cols-2" @update:model-value="refundTo = $event as string">
          <Field v-for="method in refundMethods" :key="method.value" orientation="horizontal">
            <RadioGroupItem :id="`${id}-refund-${method.value}`" :value="method.value" />
            <FieldLabel :for="`${id}-refund-${method.value}`">
              <span data-slot="return-request-option" class="fui-return-request-option">{{ method.label }}</span>
            </FieldLabel>
          </Field>
        </RadioGroup>
      </FieldSet>
    </CardContent>
    <CardFooter class="justify-between gap-4">
      <div class="flex flex-col">
        <span data-slot="meta" class="fui-meta">{{ refundLabel }}</span>
        <Price :price="refund" />
      </div>
      <Button :disabled="!picked.length" @click="submit">{{ submitLabel }}</Button>
    </CardFooter>
  </Card>
</template>
