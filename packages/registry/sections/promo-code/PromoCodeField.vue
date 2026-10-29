<script lang="ts">
/** The promo code field with its hint, the applied codes as removable chips and an optional notice; PromoCode's body, for placing inside another summary. */
export default {}
</script>

<script setup lang="ts">
import type { AppliedDiscount, PromoNotice } from './types'
import { useId } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Alert, AlertDescription, AlertTitle } from '@library/components/ui/alert'
import { Badge } from '@library/components/ui/badge'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@library/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@library/components/ui/input-group'

withDefaults(
  defineProps<{
    /** The codes and gift cards on the order, each shown as a removable chip. */
    applied?: AppliedDiscount[]
    /** A success message under the chips, e.g. after a code was applied. */
    notice?: PromoNotice
    /** Shown above the code field. */
    codeLabel?: string
    /** Shown in the empty code field. */
    placeholder?: string
    /** Shown on the button that applies the entered code. */
    applyLabel?: string
    /** Shown under the code field, e.g. which codes can be combined. */
    hint?: string
    /** Screen-reader label of the button that removes a code from the order. */
    removeLabel?: (label: string) => string
  }>(),
  {
    applied: () => [],
    codeLabel: 'Code',
    placeholder: 'Enter a code',
    applyLabel: 'Apply',
    removeLabel: (label: string) => `Remove ${label}`,
  },
)
const emit = defineEmits<{
  /** Fires with the trimmed code when the shopper applies a non-empty promo code. */
  apply: [code: string]
  /** Fires with the applied code when the shopper removes it. */
  remove: [code: AppliedDiscount]
}>()
/** The code typed into the field. */
const code = defineModel<string>({ default: '' })

const id = useId()

function apply() {
  const value = code.value.trim()
  if (value) emit('apply', value)
}
</script>

<template>
  <FieldGroup>
    <Field>
      <FieldLabel :for="id">{{ codeLabel }}</FieldLabel>
      <InputGroup>
        <InputGroupAddon>
          <IconPlaceholder lucide="TicketPercentIcon" tabler="IconRosetteDiscount" hugeicons="CouponPercentIcon" phosphor="TicketIcon" remixicon="RiCoupon3Line" data-icon />
        </InputGroupAddon>
        <InputGroupInput :id="id" v-model="code" :placeholder="placeholder" @keydown.enter.prevent="apply" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="outline" color="neutral" @click="apply">{{ applyLabel }}</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldDescription v-if="hint">{{ hint }}</FieldDescription>
    </Field>
    <div v-if="applied.length || notice" class="flex flex-col gap-3">
      <TransitionGroup v-if="applied.length" tag="div" class="flex flex-wrap items-center gap-2" leave-active-class="transition-opacity duration-150" leave-to-class="opacity-0">
        <Badge v-for="entry in applied" :key="entry.id" :variant="entry.kind === 'promo' ? 'promo' : 'primary'">
          <IconPlaceholder v-if="entry.kind === 'promo'" lucide="TagIcon" tabler="IconTag" hugeicons="Tag01Icon" phosphor="TagIcon" remixicon="RiPriceTag3Line" data-icon />
          <IconPlaceholder v-else lucide="GiftIcon" tabler="IconGift" hugeicons="GiftIcon" phosphor="GiftIcon" remixicon="RiGiftLine" data-icon />
          {{ entry.label }}
          <button type="button" :aria-label="removeLabel(entry.lineLabel ?? entry.label)" class="flex items-center" @click="emit('remove', entry)">
            <IconPlaceholder lucide="XIcon" tabler="IconX" hugeicons="Cancel01Icon" phosphor="XIcon" remixicon="RiCloseLine" data-icon />
          </button>
        </Badge>
      </TransitionGroup>
      <Alert v-if="notice" variant="success">
        <AlertTitle>{{ notice.title }}</AlertTitle>
        <AlertDescription v-if="notice.description">{{ notice.description }}</AlertDescription>
      </Alert>
    </div>
  </FieldGroup>
</template>
