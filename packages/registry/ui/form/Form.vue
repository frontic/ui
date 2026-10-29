<script setup lang="ts">
import type { FormRootEmits, FormRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { StandardSchema } from './schema'
import { reactiveOmit } from '@vueuse/core'
import { FormRoot, useForwardProps } from 'reka-ui'
import { computed, getCurrentInstance, provide, ref, useTemplateRef } from 'vue'
import { fronticFieldValidate } from '@library/components/ui/field'
import { schemaValidate, unclaimed } from './schema'

const props = defineProps<
  FormRootProps & {
    class?: HTMLAttributes['class']
    /** Validates every named field without a `validate` of its own against the form's values; any Standard Schema, such as Zod 4. Values arrive as the inputs' strings. A field shows the issues at its name or inside it; any other issue holds the submit back and reaches the default slot. */
    schema?: StandardSchema
  }
>()

const emit = defineEmits<FormRootEmits>()

defineSlots<{
  /** The fields and the submit button; gets the schema's messages that no field shows as `errors`. */
  default?: (props: { errors: string[] }) => unknown
}>()

const forwarded = useForwardProps(reactiveOmit(props, 'class', 'schema'))

/** Reka keeps the browser from submitting whenever a formSubmit listener is bound: bind it when the consumer did, or when a schema has to check the whole form first. */
const listensToFormSubmit = Boolean(getCurrentInstance()?.vnode.props?.onFormSubmit)
/** Submits whose default the consumer's own submit handler prevented: they handle the submit, so it never goes out natively. */
const handled = new WeakSet<Event>()
const listeners = computed(() => ({
  onSubmit: (event: SubmitEvent) => {
    emit('submit', event)
    if (event.defaultPrevented) handled.add(event)
  },
  ...(listensToFormSubmit || props.schema ? { onFormSubmit } : {}),
}))

const errors = ref<string[]>([])
async function onFormSubmit(values: Record<string, unknown>, event: SubmitEvent) {
  errors.value = props.schema ? await unclaimed(props.schema, values) : []
  if (errors.value.length) return
  if (listensToFormSubmit) emit('formSubmit', values, event)
  else if (!handled.has(event)) send(event)
}

const SUBMITTER_OVERRIDES = [
  ['formaction', 'action'],
  ['formmethod', 'method'],
  ['formenctype', 'enctype'],
  ['formtarget', 'target'],
] as const

/** Submits the form the browser was kept from submitting, with the button that sent it and the form attributes that button overrides. */
function send(event: SubmitEvent) {
  const form = event.target as HTMLFormElement
  const submitter = event.submitter as HTMLButtonElement | HTMLInputElement | null
  const carried = submitter?.name ? Object.assign(document.createElement('input'), { type: 'hidden', name: submitter.name, value: submitter.value }) : undefined
  if (carried) form.append(carried)
  const restore = SUBMITTER_OVERRIDES.flatMap(([own, attribute]) => {
    const value = submitter?.getAttribute(own)
    if (value == null) return []
    const before = form.getAttribute(attribute)
    form.setAttribute(attribute, value)
    return [() => (before === null ? form.removeAttribute(attribute) : form.setAttribute(attribute, before))]
  })
  form.submit()
  carried?.remove()
  for (const undo of restore) undo()
}

provide(fronticFieldValidate, (name) => (props.schema ? schemaValidate(props.schema, name) : undefined))

const root = useTemplateRef<{ validate: (name?: string) => boolean }>('root')

defineExpose({
  /** Validates every field, or the fields with this name; true when all are valid. */
  validate: (name?: string) => root.value?.validate(name) ?? false,
})
</script>

<template>
  <FormRoot ref="root" v-bind="{ ...forwarded, ...listeners }" :class="['fui-form', props.class]" data-slot="form">
    <slot :errors="errors" />
  </FormRoot>
</template>
