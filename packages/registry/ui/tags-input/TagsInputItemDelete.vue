<script lang="ts">
/** Lets the user remove its tag. */
export default {}
</script>

<script setup lang="ts">
import type { TagsInputItemDeleteProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { injectTagsInputItemContext, TagsInputItemDelete, useForwardProps } from 'reka-ui'
import { useId } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = withDefaults(
  defineProps<
    TagsInputItemDeleteProps & {
      class?: HTMLAttributes['class']
      /** Read before the tag's text, so the button is announced as e.g. "Remove Cotton". */
      removeLabel?: string
    }
  >(),
  { removeLabel: 'Remove' },
)

const delegatedProps = reactiveOmit(props, 'class', 'removeLabel')
const item = injectTagsInputItemContext()
const labelId = useId()

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TagsInputItemDelete
    v-bind="forwardedProps"
    :aria-labelledby="`${labelId} ${item.textId}`"
    :class="['fui-tags-input-item-delete relative bg-transparent outline-none after:absolute after:-inset-1.75', props.class]"
  >
    <span :id="labelId" class="sr-only">{{ removeLabel }}</span>
    <slot>
      <IconPlaceholder lucide="XIcon" tabler="IconX" hugeicons="Cancel01Icon" phosphor="XIcon" remixicon="RiCloseLine" data-icon />
    </slot>
  </TagsInputItemDelete>
</template>
