<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
    }
  >(),
  { as: 'fieldset' },
)
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="field-set" :class="['fui-field-set has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3', props.class]">
    <slot />
  </Primitive>
</template>
