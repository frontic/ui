<script setup lang="ts">
import { ref } from 'vue'
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from '.'

defineOptions({ inheritAttrs: false })

const tags = ref(['Cotton', 'Linen'])
</script>

<template>
  <TagsInput v-model="tags" v-bind="$attrs">
    <TagsInputItem v-for="tag in tags" :key="tag" :value="tag">
      <TagsInputItemText />
      <TagsInputItemDelete />
    </TagsInputItem>
    <TagsInputInput placeholder="Add a material" />
  </TagsInput>
</template>
