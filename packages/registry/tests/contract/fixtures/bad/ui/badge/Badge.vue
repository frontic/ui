<script setup lang="ts">
import { cva } from 'class-variance-authority'

const props = defineProps<{ variant?: Nope }>()
const badge = cva('', {
  variants: { variant: { default: 'bg-red-500', outline: 'fui-badge-outline' } },
  defaultVariants: { variant: 'default' },
})
</script>

<template>
  <span :class="badge({ variant: props.variant })"><slot /></span>
</template>
