<script setup lang="ts">
import type { TagGroupItemDeleteProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TagGroupItemDelete, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<TagGroupItemDeleteProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TagGroupItemDelete v-bind="forwardedProps" :class="['fui-tag-group-item-delete bg-transparent outline-none focus-visible:fui-focus-ring data-disabled:pointer-events-none', props.class]">
    <slot>
      <IconPlaceholder lucide="XIcon" tabler="IconX" hugeicons="Cancel01Icon" phosphor="XIcon" remixicon="RiCloseLine" class="size-3.5" />
    </slot>
  </TagGroupItemDelete>
</template>
