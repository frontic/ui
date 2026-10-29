<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ComboboxAnchor, ComboboxInput } from 'reka-ui'
import { DialogClose } from 'reka-ui'
import { inject, useTemplateRef } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { searchContext, searchOverlay } from './keys'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** Names the field for screen readers when no label is shown. */
    label?: string
    /** The clear button's label for screen readers. */
    clearLabel?: string
  }>(),
  { label: 'Search', clearLabel: 'Clear search' },
)

const search = inject(searchContext)!
const overlay = inject(searchOverlay, null)
const input = useTemplateRef<{ $el: HTMLInputElement }>('input')

function clear() {
  search.query.value = ''
  input.value?.$el.focus()
}
</script>

<template>
  <div class="flex items-center gap-3">
    <ComboboxAnchor data-slot="search-input" :class="['fui-search-input', props.class]">
      <IconPlaceholder lucide="SearchIcon" tabler="IconSearch" hugeicons="SearchIcon" phosphor="MagnifyingGlassIcon" remixicon="RiSearchLine" data-icon class="shrink-0" />
      <ComboboxInput ref="input" v-model="search.query.value" :aria-label="props.label" type="text" enterkeyhint="search" class="min-w-0 flex-1 bg-transparent outline-hidden" v-bind="$attrs" />
      <button
        v-if="search.query.value"
        type="button"
        data-slot="search-input-clear"
        class="fui-search-input-clear flex shrink-0 items-center justify-center outline-none focus-visible:fui-focus-ring"
        :aria-label="props.clearLabel"
        @click="clear"
      >
        <IconPlaceholder lucide="XIcon" tabler="IconX" hugeicons="Cancel01Icon" phosphor="XIcon" remixicon="RiCloseLine" class="size-4" />
      </button>
    </ComboboxAnchor>
    <DialogClose v-if="overlay" data-slot="search-cancel" class="fui-search-cancel shrink-0 outline-none focus-visible:fui-focus-ring @2xl:hidden">{{ overlay.cancelLabel.value }}</DialogClose>
  </div>
</template>
