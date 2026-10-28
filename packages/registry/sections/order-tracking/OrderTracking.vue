<script lang="ts">
/** Shows when a parcel arrives and its delivery steps as a timeline, with the tracking number and link. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { TrackingStep } from './types'
import { ref, toRef } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Badge } from '@library/components/ui/badge'
import { Button } from '@library/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@library/components/ui/card'
import { Stepper, StepperDescription, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger } from '@library/components/ui/stepper'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@library/components/ui/tooltip'
import { formatDate } from '@library/lib/format'
import { useLocale } from 'reka-ui'

const props = withDefaults(
  defineProps<{
    /** The card's heading, e.g. the order's reference. */
    title: string
    /** Shown under the heading. */
    description?: string
    /** Shown on the badge beside the heading, e.g. `In transit`. */
    status?: string
    /** The parcel's stages from order to delivery, one stepper item each. */
    steps: TrackingStep[]
    /** The step the parcel is at, 1-based; earlier steps show as done. */
    current: number
    /** The expected delivery, the card's headline, e.g. `Arrives Thursday`. */
    eta?: string
    /** Shown beside the expected delivery, e.g. the time window. */
    etaDetail?: string
    /** The shipping company, shown before the tracking number's label. */
    carrier?: string
    /** The parcel's tracking number, with a button that copies it; the parcel row hides when left out. */
    trackingNumber?: string
    /** The carrier's tracking page, opened in a new tab by the track button; no button when left out. */
    trackingUrl?: string
    /** Shown above the tracking number. */
    trackingNumberLabel?: string
    /** Shown on the button that opens the carrier's tracking page. */
    trackLabel?: string
    /** Shown on the button that asks to change the delivery date. */
    changeDateLabel?: string
    /** Screen-reader name and tooltip of the button that copies the tracking number. */
    copyLabel?: string
    /** Shown in the copy button's tooltip once the number is copied. */
    copiedLabel?: string
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    /** BCP 47 locale the step dates are formatted in; the ConfigProvider's when left out. */
    locale?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    trackingNumberLabel: 'tracking number',
    trackLabel: 'Track parcel',
    changeDateLabel: 'Change delivery date',
    copyLabel: 'Copy tracking number',
    copiedLabel: 'Copied',
  },
)
const locale = useLocale(toRef(() => props.locale))
const emit = defineEmits<{
  /** Fires when the shopper asks to change the delivery date. */
  changeDate: []
  /** Fires with the tracking number after the shopper copies it to the clipboard. */
  copy: [trackingNumber: string]
}>()

const copied = ref(false)

function copy() {
  if (!props.trackingNumber) return
  void navigator.clipboard?.writeText(props.trackingNumber)
  copied.value = true
  emit('copy', props.trackingNumber)
}
</script>

<template>
  <Card :surface="surface" :class="props.class">
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
      <CardAction v-if="status">
        <Badge variant="new" size="sm">{{ status }}</Badge>
      </CardAction>
    </CardHeader>
    <CardContent class="flex flex-col gap-6">
      <div v-if="eta" class="flex flex-col">
        <span data-slot="order-tracking-eta" class="fui-order-tracking-eta">{{ eta }}</span>
        <span v-if="etaDetail" data-slot="meta" class="fui-meta">{{ etaDetail }}</span>
      </div>
      <Stepper :model-value="current" :linear="false" orientation="vertical">
        <StepperItem v-for="(step, index) in steps" :key="index" :step="index + 1" :disabled="index + 1 > current">
          <StepperTrigger>
            <StepperIndicator>
              <IconPlaceholder v-if="index + 1 < current" lucide="CheckIcon" tabler="IconCheck" hugeicons="Tick02Icon" phosphor="CheckIcon" remixicon="RiCheckLine" data-icon />
              <IconPlaceholder v-else-if="index + 1 === current" lucide="TruckIcon" tabler="IconTruck" hugeicons="TruckIcon" phosphor="TruckIcon" remixicon="RiTruckLine" data-icon />
              <template v-else>{{ index + 1 }}</template>
            </StepperIndicator>
            <StepperTitle class="flex items-baseline justify-between gap-3">
              {{ step.title }}
              <time v-if="step.date" data-slot="meta" class="fui-meta" :datetime="step.date">{{ formatDate(step.date, { month: 'short', day: 'numeric' }, locale) }}</time>
            </StepperTitle>
            <StepperDescription v-if="step.note">{{ step.note }}</StepperDescription>
          </StepperTrigger>
          <StepperSeparator v-if="index < steps.length - 1" />
        </StepperItem>
      </Stepper>
      <div v-if="trackingNumber" data-slot="order-tracking-parcel" class="fui-order-tracking-parcel flex items-center justify-between">
        <div class="flex min-w-0 flex-col">
          <span data-slot="meta" class="fui-meta">
            <template v-if="carrier">{{ carrier }} · </template>{{ trackingNumberLabel }}
          </span>
          <span data-slot="line-title" class="fui-line-title truncate tabular-nums">{{ trackingNumber }}</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" color="neutral" size="icon-sm" :aria-label="copyLabel" @click="copy">
                <IconPlaceholder v-if="copied" lucide="CheckIcon" tabler="IconCheck" hugeicons="Tick02Icon" phosphor="CheckIcon" remixicon="RiCheckLine" data-icon />
                <IconPlaceholder v-else lucide="CopyIcon" tabler="IconCopy" hugeicons="Copy01Icon" phosphor="CopyIcon" remixicon="RiFileCopyLine" data-icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ copied ? copiedLabel : copyLabel }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </CardContent>
    <CardFooter class="flex-col gap-2">
      <Button v-if="trackingUrl" as="a" :href="trackingUrl" target="_blank" rel="noopener" class="w-full">
        {{ trackLabel }}
        <IconPlaceholder lucide="ExternalLinkIcon" tabler="IconExternalLink" hugeicons="LinkSquare02Icon" phosphor="ArrowSquareOutIcon" remixicon="RiExternalLinkLine" data-icon />
      </Button>
      <Button variant="ghost" color="neutral" class="w-full" @click="emit('changeDate')">{{ changeDateLabel }}</Button>
    </CardFooter>
  </Card>
</template>
