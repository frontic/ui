<script setup lang="ts">
import type { FieldErrorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { FieldError, injectFieldRootContext, useForwardProps } from 'reka-ui'
import { computed } from 'vue'

const props = defineProps<
  FieldErrorProps & {
    class?: HTMLAttributes['class']
    /** Messages from outside the Field, such as vee-validate's or TanStack Form's; shown instead of the Field's own, duplicates dropped. */
    errors?: Array<string | { message: string | undefined } | undefined>
  }
>()

const slots = defineSlots<{
  /** Replaces the messages; gets the current `errors`. */
  default?: (props: { errors: string[] }) => unknown
}>()

const forwarded = useForwardProps(reactiveOmit(props, 'class', 'errors'))

const field = injectFieldRootContext(null)
const given = computed(() =>
  props.errors ? [...new Set(props.errors.map((error) => (typeof error === 'string' ? error : error?.message)).filter((message): message is string => !!message))] : undefined,
)
/** Given errors, or no Field to read, render a plain alert; otherwise Reka's FieldError shows the Field's messages. */
const joins = computed(() => field !== null && !given.value)
const shown = computed(() => joins.value || !!given.value?.length || !!slots.default)
const messages = (scope?: { errors: string[] }) => scope?.errors ?? given.value ?? []
</script>

<template>
  <component
    :is="joins ? FieldError : 'div'"
    v-if="shown"
    v-slot="scope"
    v-bind="joins ? forwarded : {}"
    role="alert"
    data-slot="field-error"
    :class="['fui-field-error [&>ul]:ms-4 [&>ul]:flex [&>ul]:list-disc [&>ul]:flex-col [&>ul]:gap-1', props.class]"
  >
    <slot :errors="messages(scope)">
      <ul v-if="messages(scope).length > 1">
        <li v-for="message in messages(scope)" :key="message">{{ message }}</li>
      </ul>
      <template v-else>{{ messages(scope)[0] }}</template>
    </slot>
  </component>
</template>
