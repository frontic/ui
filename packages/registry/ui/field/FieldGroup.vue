<script lang="ts">
/** Stacks several fields of a form together. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { cva } from 'class-variance-authority'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed, useAttrs } from 'vue'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
    }
  >(),
  { as: 'div' },
)
// A checkbox group passes its own data-slot; no structural variant matches an element's own attribute.
const attrs = useAttrs()
const kind = computed(() => (attrs['data-slot'] === 'checkbox-group' ? 'checkboxes' : 'fields'))

const fieldGroup = cva('fui-field-group', {
  variants: { kind: { fields: 'fui-field-group-fields', checkboxes: 'fui-field-group-checkboxes' } },
  defaultVariants: { kind: 'fields' },
})
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    data-slot="field-group"
    :class="[fieldGroup({ kind }), 'group/field-group @container/field-group [&>[data-slot=field-group]]:gap-4', props.class]"
  >
    <slot />
  </Primitive>
</template>
