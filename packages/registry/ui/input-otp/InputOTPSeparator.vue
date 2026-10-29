<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <div data-slot="input-otp-separator" role="separator" v-bind="forwarded" :class="['fui-input-otp-separator', props.class]">
    <slot>
      <IconPlaceholder lucide="MinusIcon" tabler="IconMinus" hugeicons="MinusSignIcon" phosphor="MinusIcon" remixicon="RiSubtractLine" />
    </slot>
  </div>
</template>
