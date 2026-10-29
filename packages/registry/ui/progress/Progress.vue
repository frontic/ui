<script setup lang="ts">
import type { ProgressRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ProgressIndicator, ProgressRoot, useForwardProps } from 'reka-ui'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<
    Omit<ProgressRootProps, 'modelValue'> & {
      /** How far the task is, from 0 to `max`; `null` while that is unknown, which slides a segment along the track. Can be bound with `v-model`. */
      modelValue?: number | null
      class?: HTMLAttributes['class']
    }
  >(),
  {
    modelValue: 0,
  },
)

const delegatedProps = reactiveOmit(props, 'class')
const filled = computed(() => (props.modelValue == null ? undefined : (props.modelValue / (props.max && props.max > 0 ? props.max : 100)) * 100))
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ProgressRoot data-slot="progress" v-bind="forwarded" :class="['fui-progress relative overflow-x-hidden', props.class]">
    <ProgressIndicator
      data-slot="progress-indicator"
      class="fui-progress-indicator size-full flex-1 transition-all data-state-indeterminate:animate-progress-indeterminate motion-reduce:data-state-indeterminate:animate-none motion-reduce:data-state-indeterminate:scale-x-33"
      :style="filled === undefined ? undefined : `transform: translateX(-${100 - filled}%);`"
    />
  </ProgressRoot>
</template>
