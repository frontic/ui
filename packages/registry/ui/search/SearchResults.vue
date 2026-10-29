<script lang="ts">
/** The panel of results, suggestions and the "Search for" row, under the field or inside the overlay. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { ComboboxContent, ComboboxViewport } from 'reka-ui'
import { computed, inject } from 'vue'
import { searchOverlay } from './keys'

const results = cva('fui-search-results', {
  variants: { position: { popper: 'fui-search-results-popper', inline: 'fui-search-results-inline' } },
  defaultVariants: { position: 'popper' },
})

const layout = {
  popper:
    'z-50 max-h-(--reka-combobox-content-available-height) w-(--reka-combobox-trigger-width) max-w-(--reka-combobox-content-available-width) origin-(--reka-combobox-content-transform-origin) data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 duration-100',
  inline: 'min-h-0 flex-1',
}

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** Popper floats under the field at its width (a class widens it); inline sits in the flow, as inside the overlay. */
    position?: VariantProps<typeof results>['position']
  }>(),
  { position: 'popper' },
)

const overlay = inject(searchOverlay, null)

// Esc closes the overlay at once, not first the panel inside it.
function onEscape(event: KeyboardEvent) {
  if (!overlay) return
  event.preventDefault()
  overlay.close()
}

const layoutClass = computed(() => layout[props.position ?? 'popper'])
</script>

<template>
  <ComboboxContent
    data-slot="search-results"
    @escape-key-down="onEscape"
    :position="props.position === 'inline' ? 'inline' : 'popper'"
    align="start"
    :side-offset="4"
    :collision-padding="16"
    :class="['overflow-hidden', layoutClass, results({ position: props.position, class: props.class })]"
  >
    <ComboboxViewport class="fui-search-results-viewport overflow-y-auto overscroll-contain">
      <slot />
    </ComboboxViewport>
  </ComboboxContent>
</template>
