<script lang="ts">
/** Clears the text the user has typed. */
export default {}
</script>

<script setup lang="ts">
import type { ComboboxCancelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AutocompleteCancel, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { InputGroupButton } from '@library/components/ui/input-group'

const props = withDefaults(
  defineProps<
    ComboboxCancelProps & {
      class?: HTMLAttributes['class']
      /** Accessible name of the button. */
      label?: string
    }
  >(),
  {
    label: 'Clear',
  },
)

const delegatedProps = reactiveOmit(props, 'class', 'label')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AutocompleteCancel as-child data-slot="autocomplete-cancel" v-bind="forwarded">
    <InputGroupButton size="icon-xs" :aria-label="props.label" :class="props.class">
      <slot>
        <IconPlaceholder lucide="XIcon" tabler="IconX" hugeicons="Cancel01Icon" phosphor="XIcon" remixicon="RiCloseLine" data-icon />
      </slot>
    </InputGroupButton>
  </AutocompleteCancel>
</template>
