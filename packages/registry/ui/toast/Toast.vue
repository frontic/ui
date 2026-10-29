<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { computed } from 'vue'
import { useDirection } from 'reka-ui'
import { Toaster as VueSonner } from 'vue-sonner'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<ToasterProps>()
const delegatedProps = reactiveOmit(props, 'class', 'toastOptions')
// vue-sonner reads <html dir> on its own; the ConfigProvider's direction is the one the items follow.
const direction = useDirection()

const toast = cva('fui-toast flex items-center', {
  variants: {
    tone: {
      info: 'fui-toast-info',
      positive: 'fui-toast-positive',
      warning: 'fui-toast-warning',
      destructive: 'fui-toast-destructive',
    },
  },
  defaultVariants: {},
})

const classes = {
  toast: toast(),
  info: toast({ tone: 'info' }),
  success: toast({ tone: 'positive' }),
  warning: toast({ tone: 'warning' }),
  error: toast({ tone: 'destructive' }),
  title: cva('fui-toast-title')(),
  description: cva('fui-toast-description')(),
  content: cva('fui-toast-content flex flex-col')(),
  icon: 'flex shrink-0 items-center',
  actionButton: cva('fui-toast-action ms-auto inline-flex shrink-0 cursor-pointer items-center focus-visible:fui-focus-ring')(),
  cancelButton: cva('fui-toast-cancel ms-auto inline-flex shrink-0 cursor-pointer items-center focus-visible:fui-focus-ring')(),
}

const toastOptions = computed(() => {
  const own = props.toastOptions?.classes ?? {}
  const merged = Object.fromEntries(Object.entries(classes).map(([key, value]) => [key, [value, own[key as keyof typeof own]].filter(Boolean).join(' ')]))
  return { ...props.toastOptions, unstyled: true, classes: { ...own, ...merged } }
})
</script>

<template>
  <VueSonner :class="props.class" :toast-options="toastOptions" v-bind="delegatedProps" :dir="props.dir ?? direction">
    <template #success-icon>
      <IconPlaceholder lucide="CircleCheckIcon" tabler="IconCircleCheck" hugeicons="CheckmarkCircle01Icon" phosphor="CheckCircleIcon" remixicon="RiCheckboxCircleLine" data-icon />
    </template>
    <template #info-icon>
      <IconPlaceholder lucide="InfoIcon" tabler="IconInfoCircle" hugeicons="InformationCircleIcon" phosphor="InfoIcon" remixicon="RiInformationLine" data-icon />
    </template>
    <template #warning-icon>
      <IconPlaceholder lucide="TriangleAlertIcon" tabler="IconAlertTriangle" hugeicons="Alert02Icon" phosphor="WarningIcon" remixicon="RiAlertLine" data-icon />
    </template>
    <template #error-icon>
      <IconPlaceholder lucide="OctagonXIcon" tabler="IconOctagonOff" hugeicons="CancelCircleIcon" phosphor="XCircleIcon" remixicon="RiCloseCircleLine" data-icon />
    </template>
    <template #loading-icon>
      <div>
        <IconPlaceholder lucide="Loader2Icon" tabler="IconLoader2" hugeicons="Loading03Icon" phosphor="CircleNotchIcon" remixicon="RiLoader4Line" data-icon class="animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <IconPlaceholder lucide="XIcon" tabler="IconX" hugeicons="Cancel01Icon" phosphor="XIcon" remixicon="RiCloseLine" data-icon />
    </template>
  </VueSonner>
</template>

<style>
@import 'vue-sonner/style.css';
</style>
