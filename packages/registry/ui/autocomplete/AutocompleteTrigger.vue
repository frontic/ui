<script lang="ts">
/** Opens and closes the suggestion list. */
export default {}
</script>

<script setup lang="ts">
import type { ComboboxTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AutocompleteTrigger, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { InputGroupButton } from '@library/components/ui/input-group'

const props = withDefaults(
  defineProps<
    ComboboxTriggerProps & {
      class?: HTMLAttributes['class']
      /** Accessible name of the button. */
      label?: string
    }
  >(),
  {
    label: 'Show suggestions',
  },
)

const delegatedProps = reactiveOmit(props, 'class', 'label')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AutocompleteTrigger as-child data-slot="autocomplete-trigger" v-bind="forwarded">
    <InputGroupButton size="icon-xs" :aria-label="props.label" :class="props.class">
      <slot>
        <IconPlaceholder lucide="ChevronDownIcon" tabler="IconChevronDown" hugeicons="ArrowDown01Icon" phosphor="CaretDownIcon" remixicon="RiArrowDownSLine" data-icon />
      </slot>
    </InputGroupButton>
  </AutocompleteTrigger>
</template>
