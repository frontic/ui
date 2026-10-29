<script setup lang="ts">
import type { TagsInputInputProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { injectFieldRootContext, TagsInputInput, useForwardProps } from 'reka-ui'
import { computed } from 'vue'

const props = defineProps<TagsInputInputProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

// Takes the label, description and state of a Field around the tags input. Delete once Reka's TagsInput reads the Field itself.
const field = injectFieldRootContext(null)
const fieldAttrs = computed(() =>
  field
    ? {
        'aria-labelledby': field.labelId.value,
        'aria-describedby': field.describedBy.value,
        'aria-invalid': (field.invalid.value && !field.disabled.value) || undefined,
      }
    : {},
)
</script>

<template>
  <TagsInputInput v-bind="{ ...fieldAttrs, ...forwardedProps }" :class="['fui-tags-input-input bg-transparent focus:outline-none', props.class]" />
</template>
