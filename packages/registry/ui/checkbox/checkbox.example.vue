<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@library/components/ui/field'
import { Checkbox } from '.'

defineOptions({ inheritAttrs: false })

const id = useId()
const topics = [
  {
    key: 'arrivals',
    name: 'New arrivals',
    detail:
      'The season’s first jackets, goggles and packs, the week they land.',
  },
  {
    key: 'offers',
    name: 'Sales and offers',
    detail: 'Members’ prices and the end-of-season sale before it opens.',
  },
  {
    key: 'events',
    name: 'Store events',
    detail: 'Workshops, repair days and film nights at your Basecamp store.',
  },
]
const picked = ref<string[]>(['arrivals'])

const all = computed(() =>
  picked.value.length === topics.length
    ? true
    : picked.value.length
      ? 'indeterminate'
      : false,
)
const toggleAll = () =>
  (picked.value = all.value === true ? [] : topics.map((topic) => topic.key))
const toggle = (key: string, on: boolean | 'indeterminate') =>
  (picked.value =
    on === true
      ? [...picked.value, key]
      : picked.value.filter((k) => k !== key))
</script>

<template>
  <FieldSet class="w-xl max-w-full">
    <FieldLegend>Newsletter</FieldLegend>
    <div class="flex flex-col gap-3">
      <Field orientation="horizontal">
        <Checkbox
          :id="`${id}-all`"
          :model-value="all"
          @update:model-value="toggleAll"
          v-bind="$attrs" />
        <FieldLabel :for="`${id}-all`">All newsletters</FieldLabel>
      </Field>
      <FieldSeparator />
      <div class="flex flex-col gap-3">
        <Field
          v-for="topic in topics"
          :key="topic.key"
          orientation="horizontal">
          <Checkbox
            :id="`${id}-${topic.key}`"
            :model-value="picked.includes(topic.key)"
            @update:model-value="(on) => toggle(topic.key, on)" />
          <FieldContent>
            <FieldLabel :for="`${id}-${topic.key}`">{{
              topic.name
            }}</FieldLabel>
            <FieldDescription>{{ topic.detail }}</FieldDescription>
          </FieldContent>
        </Field>
      </div>
    </div>
  </FieldSet>
</template>
