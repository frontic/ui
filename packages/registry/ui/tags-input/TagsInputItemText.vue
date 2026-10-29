<script setup lang="ts">
import type { TagsInputItemTextProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TagsInputItemText, useForwardProps } from 'reka-ui'

const props = defineProps<TagsInputItemTextProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TagsInputItemText v-bind="forwardedProps" :class="['fui-tags-input-item-text bg-transparent', props.class]" />
</template>
