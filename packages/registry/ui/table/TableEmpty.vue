<script lang="ts">
/** Shows a message in place of rows when the table has no data. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import TableRow from './TableRow.vue'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** The number of columns the empty row spans; set it to the table's column count. */
    colspan?: number
  }>(),
  {
    colspan: 1,
  },
)

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <TableRow>
    <td data-slot="table-empty" :class="['fui-table-empty align-middle whitespace-nowrap', props.class]" v-bind="delegatedProps">
      <div class="flex items-center justify-center">
        <slot />
      </div>
    </td>
  </TableRow>
</template>
