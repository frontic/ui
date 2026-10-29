<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, inject } from 'vue'
import { searchContext } from './keys'

const props = defineProps<{
  class?: HTMLAttributes['class']
  /** The text to mark up, such as a product name. */
  text: string
  /** What counts as a match: one term or several, e.g. a corrected spelling next to the typed one. */
  terms?: string | string[]
}>()

const search = inject(searchContext, null)

const parts = computed(() => {
  const terms = [props.terms ?? search?.query.value ?? '']
    .flat()
    .map((term) => term.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
  if (!terms.length) return [{ text: props.text, match: false }]
  const pattern = new RegExp(`(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  return props.text
    .split(pattern)
    .filter(Boolean)
    .map((text) => ({ text, match: terms.some((term) => term.toLowerCase() === text.toLowerCase()) }))
})
</script>

<template>
  <span data-slot="search-highlight" :class="props.class">
    <template v-for="(part, i) in parts" :key="i">
      <mark v-if="part.match" class="fui-search-highlight text-current">{{ part.text }}</mark>
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>
