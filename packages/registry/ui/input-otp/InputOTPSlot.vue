<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Shows one character of the one-time code. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { useForwardProps } from 'reka-ui'
import { computed } from 'vue'
import { useVueOTPContext } from 'vue-input-otp'

const props = defineProps<{
  /** Which character of the code this slot shows, counting from 0. */
  index: number
  class?: HTMLAttributes['class']
}>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)

const context = useVueOTPContext()

const slot = computed(() => context?.value.slots[props.index])
</script>

<template>
  <div v-bind="forwarded" data-slot="input-otp-slot" :data-active="slot?.isActive || undefined" :class="['fui-input-otp-slot relative outline-none transition-colors data-active:z-10', props.class]">
    {{ slot?.char }}
    <div v-if="slot?.hasFakeCaret" class="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div class="fui-input-otp-caret animate-caret-blink duration-1000" />
    </div>
  </div>
</template>
