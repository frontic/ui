<script lang="ts">
/** Labels the input of a field. */
export default {}
</script>

<script setup lang="ts">
import type { FieldLabelProps } from 'reka-ui'
import type { HTMLAttributes, VNode } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { FieldLabel, injectFieldRootContext, Label, useForwardProps } from 'reka-ui'
import { Fragment, inject, useSlots } from 'vue'
import Field from './Field.vue'
import { fronticFieldOrientation } from './keys'

const fieldLabel = cva('fui-field-label group/field-label peer/field-label select-none group-data-disabled/field:fui-disabled peer-disabled:cursor-not-allowed peer-disabled:fui-disabled', {
  variants: {
    layout: { default: 'fui-field-label-default', card: 'fui-field-label-card', beside: 'fui-field-label-beside' },
  },
  defaultVariants: { layout: 'default' },
})

const props = defineProps<FieldLabelProps & { class?: HTMLAttributes['class'] }>()

const forwarded = useForwardProps(reactiveOmit(props, 'class'))
const labelProps = useForwardProps(reactiveOmit(props, 'class', 'nativeLabel'))

const field = injectFieldRootContext(null)
/** Every horizontal Field holds a checkbox, radio or switch beside its label. */
const orientation = inject(fronticFieldOrientation, undefined)
const beside = () => orientation?.value === 'horizontal'
const slots = useSlots()
/** A label wrapping a Field is a choice card. */
const holdsField = (nodes: VNode[] = []): boolean => nodes.some((node) => node.type === Field || (node.type === Fragment && Array.isArray(node.children) && holdsField(node.children as VNode[])))
const card = () => holdsField(slots.default?.())
/** A choice card labels the control inside it, so only a plain label in a Field joins the Field. */
const joins = () => field !== null && !card()
</script>

<template>
  <component
    :is="joins() ? FieldLabel : Label"
    data-slot="field-label"
    v-bind="joins() ? forwarded : labelProps"
    :class="[fieldLabel({ layout: card() ? 'card' : beside() ? 'beside' : 'default' }), card() && '[&>[data-slot=field]]:p-4', props.class]"
  >
    <slot />
  </component>
</template>
