<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { IconPlaceholder } from '@registry/icon-placeholder'
import { InputGroupAddon } from '@library/components/ui/input-group'
import {
  Autocomplete,
  AutocompleteAnchor,
  AutocompleteCancel,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteSeparator,
  AutocompleteTrigger,
  AutocompleteViewport,
} from '.'
import { computed, ref, watch } from 'vue'

defineOptions({ inheritAttrs: false })

const saved = ['Lindenstraße 9, 80469 Munich', 'Gartenweg 2, 60311 Frankfurt']

const addresses = [
  'Hauptstraße 12, 80331 Munich',
  'Hauptstraße 48, 50667 Cologne',
  'Hauptstraße 7, 10115 Berlin',
  'Bergstraße 3, 80333 Munich',
  'Bahnhofstraße 21, 20095 Hamburg',
  'Bahnhofstraße 5, 70173 Stuttgart',
]

/**
 * Stands in for a places API: the server decides what matches, so the list
 * changes with every request.
 */
async function suggest(query: string) {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return addresses.filter((address) =>
    address.toLowerCase().includes(query.toLowerCase()),
  )
}

const query = ref('')
const suggestions = ref<string[]>([])
const savedMatches = computed(() =>
  saved.filter((address) =>
    address.toLowerCase().includes(query.value.toLowerCase()),
  ),
)

// A slower answer to an older query must not replace the newer one's.
watch(query, async (value, _old, onCleanup) => {
  let stale = false
  onCleanup(() => (stale = true))
  const result = value.length < 2 ? [] : await suggest(value)
  if (!stale) suggestions.value = result
})
</script>

<template>
  <Autocomplete v-model="query" ignore-filter v-bind="$attrs">
    <AutocompleteAnchor>
      <InputGroupAddon>
        <IconPlaceholder
          data-icon
          lucide="MapPinIcon"
          tabler="IconMapPin"
          hugeicons="Location01Icon"
          phosphor="MapPinIcon"
          remixicon="RiMapPinLine" />
      </InputGroupAddon>
      <AutocompleteInput placeholder="Delivery address or postcode" />
      <InputGroupAddon align="inline-end">
        <AutocompleteCancel :class="{ invisible: !query }" />
        <AutocompleteTrigger />
      </InputGroupAddon>
    </AutocompleteAnchor>
    <AutocompleteList hide-when-empty>
      <AutocompleteViewport>
        <AutocompleteEmpty>No address found.</AutocompleteEmpty>
        <AutocompleteGroup v-if="savedMatches.length" heading="Saved addresses">
          <AutocompleteItem
            v-for="address in savedMatches"
            :key="address"
            :value="address"
            >{{ address }}</AutocompleteItem
          >
        </AutocompleteGroup>
        <AutocompleteSeparator
          v-if="savedMatches.length && suggestions.length" />
        <AutocompleteGroup v-if="suggestions.length" heading="Suggestions">
          <AutocompleteItem
            v-for="address in suggestions"
            :key="address"
            :value="address"
            >{{ address }}</AutocompleteItem
          >
        </AutocompleteGroup>
      </AutocompleteViewport>
    </AutocompleteList>
  </Autocomplete>
</template>
