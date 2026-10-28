<script setup lang="ts">
import { cva } from 'class-variance-authority'

const props = defineProps<{ variant?: 'default' | 'outline' }>()
const badge = cva('fui-badge', {
  variants: { variant: { default: 'fui-badge-default', outline: 'fui-badge-outline' } },
  defaultVariants: { variant: 'default' },
})
</script>

<template>
  <span :class="badge({ variant: props.variant })"><slot /></span>
</template>
