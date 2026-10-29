<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCaption,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '.'

defineOptions({ inheritAttrs: false })

const columns = ['Order', 'Status', 'Total']
</script>

<template>
  <Table v-bind="$attrs">
    <TableCaption>Your recent orders.</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead
          v-for="column in columns"
          :key="column"
          :class="{ 'text-end': column === 'Total' }"
          >{{ column }}</TableHead
        >
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableEmpty :colspan="columns.length">No orders yet</TableEmpty>
    </TableBody>
  </Table>
</template>
