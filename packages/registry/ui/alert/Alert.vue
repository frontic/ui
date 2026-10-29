<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import type { AlertVariant } from './context'
import { cva } from 'class-variance-authority'
import { computed, provide } from 'vue'
import { ALERT_VARIANT } from './context'

const alert = cva(
  'fui-alert group/alert relative *:col-start-2 *:data-icon:col-start-1 *:data-icon:row-span-2 *:data-icon:me-1.5 *:data-icon:translate-y-0.5 after:absolute after:-inset-y-px after:-inset-s-px',
  {
    variants: {
      variant: {
        neutral: 'fui-alert-neutral',
        info: 'fui-alert-info',
        success: 'fui-alert-success',
        warning: 'fui-alert-warning',
        error: 'fui-alert-error',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** The state the message reports: neutral, info, success, warning or error. Each takes its colour and its icon. */
    variant?: AlertVariant
    /** Shows the state's icon before the content; the `icon` slot replaces it. */
    icon?: boolean
  }>(),
  { variant: 'neutral', icon: true },
)

defineSlots<{
  /** Replaces the state's icon. */
  icon?: () => unknown
  /** The title, description and actions. */
  default?: () => unknown
}>()

provide(
  ALERT_VARIANT,
  computed(() => props.variant),
)
</script>

<template>
  <div data-slot="alert" :data-variant="props.variant" :class="[alert({ variant: props.variant }), props.class]" role="alert">
    <slot v-if="props.icon" name="icon">
      <IconPlaceholder v-if="props.variant === 'info'" lucide="InfoIcon" tabler="IconInfoCircle" hugeicons="InformationCircleIcon" phosphor="InfoIcon" remixicon="RiInformationLine" data-icon />
      <IconPlaceholder
        v-else-if="props.variant === 'success'"
        lucide="CircleCheckIcon"
        tabler="IconCircleCheck"
        hugeicons="CheckmarkCircle01Icon"
        phosphor="CheckCircleIcon"
        remixicon="RiCheckboxCircleLine"
        data-icon
      />
      <IconPlaceholder v-else-if="props.variant === 'warning'" lucide="TriangleAlertIcon" tabler="IconAlertTriangle" hugeicons="Alert02Icon" phosphor="WarningIcon" remixicon="RiAlertLine" data-icon />
      <IconPlaceholder
        v-else-if="props.variant === 'error'"
        lucide="OctagonXIcon"
        tabler="IconOctagonOff"
        hugeicons="CancelCircleIcon"
        phosphor="XCircleIcon"
        remixicon="RiCloseCircleLine"
        data-icon
      />
      <IconPlaceholder v-else lucide="BellRingIcon" tabler="IconBellRinging" hugeicons="BellRingIcon" phosphor="BellRingingIcon" remixicon="RiBellLine" data-icon />
    </slot>
    <slot />
  </div>
</template>
