<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Lets the shopper turn grouped options on or off, then save or reset the changes. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { SettingsGroup } from './types'
import { ref, useId } from 'vue'
import { Button } from '@library/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@library/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet } from '@library/components/ui/field'
import { Separator } from '@library/components/ui/separator'
import { Switch } from '@library/components/ui/switch'

const props = withDefaults(
  defineProps<{
    /** The options to switch on and off, in titled groups. */
    groups: SettingsGroup[]
    /** Shown as the card's title. */
    title?: string
    /** Shown under the title. */
    description?: string
    /** Shown on the button that undoes the changes since the last save. */
    resetLabel?: string
    /** Shown on the button that saves the options. */
    saveLabel?: string
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    title: 'Settings',
    resetLabel: 'Reset',
    saveLabel: 'Save changes',
  },
)
const emit = defineEmits<{
  /** Fires with the on/off state of every option when the customer saves the settings. */
  save: [enabled: Record<string, boolean>]
}>()

/** Which options are on, by option id. */
const enabled = defineModel<Record<string, boolean>>({ default: () => ({}) })

const id = useId()
const saved = ref({ ...enabled.value })

function toggle(option: string, on: boolean) {
  enabled.value = { ...enabled.value, [option]: on }
}

function reset() {
  enabled.value = { ...saved.value }
}

function save() {
  saved.value = { ...enabled.value }
  emit('save', saved.value)
}
</script>

<template>
  <Card :surface="surface" :class="props.class">
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex flex-col gap-6">
        <template v-for="(group, index) in groups" :key="group.label">
          <Separator v-if="index > 0" />
          <FieldSet>
            <FieldLegend variant="label">{{ group.label }}</FieldLegend>
            <Field v-for="option in group.options" :key="option.id" orientation="horizontal" :data-disabled="option.disabled || undefined">
              <FieldContent>
                <FieldLabel :for="`${id}-${option.id}`">{{ option.label }}</FieldLabel>
                <FieldDescription v-if="option.description">{{ option.description }}</FieldDescription>
              </FieldContent>
              <Switch :id="`${id}-${option.id}`" :model-value="!!enabled[option.id]" :disabled="option.disabled" @update:model-value="toggle(option.id, $event)" />
            </Field>
          </FieldSet>
        </template>
      </div>
    </CardContent>
    <CardFooter class="justify-end gap-2">
      <Button variant="ghost" color="neutral" @click="reset">{{ resetLabel }}</Button>
      <Button @click="save">{{ saveLabel }}</Button>
    </CardFooter>
  </Card>
</template>
