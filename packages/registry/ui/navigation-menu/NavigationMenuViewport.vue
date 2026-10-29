<script setup lang="ts">
import type { NavigationMenuViewportProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NavigationMenuViewport, useForwardProps } from 'reka-ui'

const props = defineProps<NavigationMenuViewportProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <div class="absolute top-full inset-s-0 isolate z-50 flex justify-center">
    <NavigationMenuViewport
      data-slot="navigation-menu-viewport"
      v-bind="forwardedProps"
      :class="[
        'fui-navigation-menu-viewport relative origin-top data-open:animate-in data-closed:animate-out data-open:zoom-in-90 data-closed:zoom-out-90 transition-all duration-200 ease-out overflow-hidden',
        props.class,
      ]"
    />
  </div>
</template>
