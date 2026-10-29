<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit, useVModel } from '@vueuse/core'
import { cva, type VariantProps } from 'class-variance-authority'
import { FieldControl, injectFieldRootContext, Slot } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

defineOptions({
  inheritAttrs: false,
})

const select = cva('fui-native-select w-full min-w-0 appearance-none outline-none transition-colors select-none disabled:pointer-events-none disabled:cursor-not-allowed', {
  variants: {
    size: { md: 'fui-native-select-md', sm: 'fui-native-select-sm' },
  },
  defaultVariants: { size: 'md' },
})

const props = defineProps<{
  /** The selected option's value, bound with v-model. */
  modelValue?: AcceptableValue | AcceptableValue[]
  class?: HTMLAttributes['class']
  /** The height of the select. */
  size?: VariantProps<typeof select>['size']
}>()

const emit = defineEmits<{
  'update:modelValue': AcceptableValue
}>()

const modelValue = useVModel(props, 'modelValue', emit, {
  passive: true,
  defaultValue: '',
})

const delegatedProps = reactiveOmit(props, 'class', 'size')

/** Inside a Field the select joins it through Reka's FieldControl; elsewhere it renders alone. Both roots keep the child's own data-slot over a wrapper's, so the template takes a wrapper's from $attrs. */
const field = injectFieldRootContext(null)
</script>

<template>
  <div :class="['fui-native-select-root group/native-select relative has-[select:disabled]:fui-disabled', props.class]" data-slot="native-select-wrapper" :data-size="props.size ?? 'md'">
    <component :is="field ? FieldControl : Slot" v-bind="field ? { ...$attrs, asChild: true, modelValue } : { ...$attrs, ...delegatedProps }">
      <select
        v-model="modelValue"
        :data-slot="$attrs['data-slot'] ?? 'native-select'"
        :data-placeholder="modelValue === '' ? '' : undefined"
        :class="select({ size: props.size })"
        :data-size="props.size ?? 'md'"
      >
        <slot />
      </select>
    </component>
    <IconPlaceholder
      lucide="ChevronDownIcon"
      tabler="IconChevronDown"
      hugeicons="ArrowDown01Icon"
      phosphor="CaretDownIcon"
      remixicon="RiArrowDownSLine"
      class="fui-native-select-chevron pointer-events-none absolute top-1/2 inset-e-0 -translate-y-1/2 select-none"
      aria-hidden="true"
      data-slot="native-select-icon"
    />
  </div>
</template>
