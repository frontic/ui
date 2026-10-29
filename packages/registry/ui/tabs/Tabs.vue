<script setup lang="ts">
import type { TabsRootEmits, TabsRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TabsRoot, useForwardPropsEmits } from 'reka-ui'
import { computed } from 'vue'

const props = defineProps<TabsRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<TabsRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
const vertical = computed(() => props.orientation === 'vertical')

defineSlots<{
  /** Holds the tab list and panels; gets the value of the active tab. */
  default?: (props: { modelValue: string | number | undefined }) => unknown
}>()
</script>

<template>
  <TabsRoot
    v-slot="slotProps"
    data-slot="tabs"
    :data-orientation="vertical ? 'vertical' : 'horizontal'"
    :data-horizontal="vertical ? undefined : ''"
    :data-vertical="vertical ? '' : undefined"
    v-bind="forwarded"
    :class="['fui-tabs group/tabs data-horizontal:flex-col', props.class]"
  >
    <slot v-bind="slotProps" />
  </TabsRoot>
</template>
