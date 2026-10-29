<script setup lang="ts">
import type { CollapsibleContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { inject } from 'vue'
import { Collapsible, CollapsibleContent } from '@library/components/ui/collapsible'
import { radioAccordionItem } from './keys'

const props = withDefaults(
  defineProps<
    CollapsibleContentProps & {
      class?: HTMLAttributes['class']
      /** Removes the details from the page while another option is picked; set false to keep them, e.g. a payment provider's card iframe, and mind that hidden required fields still block the form. */
      unmountOnHide?: boolean
    }
  >(),
  { unmountOnHide: true },
)

const forwarded = reactiveOmit(props, 'class', 'unmountOnHide')

const item = inject(radioAccordionItem)!
</script>

<template>
  <Collapsible :open="item.checked.value" :unmount-on-hide="unmountOnHide">
    <CollapsibleContent v-bind="forwarded">
      <div data-slot="radio-accordion-content" :class="['fui-radio-accordion-content', props.class]">
        <slot />
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>
