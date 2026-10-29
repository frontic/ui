<script setup lang="ts">
import { PopoverContent } from '@library/components/ui/popover'

/** Opens the calendar on the picked day, else today, else its first day that can be picked. */
function focusDay(event: Event) {
  const calendar = event.target as HTMLElement
  const day =
    calendar.querySelector<HTMLElement>('[data-selected]') ??
    calendar.querySelector<HTMLElement>('[data-today]:not([data-disabled])') ??
    calendar.querySelector<HTMLElement>('[data-value]:not([data-outside-view]):not([data-disabled])')
  if (!day) return
  event.preventDefault()
  day.focus()
}
</script>

<template>
  <PopoverContent data-slot="date-picker-content" align="start" class="fui-date-picker-content" @open-auto-focus="focusDay">
    <slot />
  </PopoverContent>
</template>
