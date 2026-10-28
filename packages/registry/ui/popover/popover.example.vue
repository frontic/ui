<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { Button } from '@library/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@library/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '.'

defineOptions({ inheritAttrs: false })

const sizes = [
  { size: 'S', chest: '88–96', waist: '76–84' },
  { size: 'M', chest: '96–104', waist: '84–92' },
  { size: 'L', chest: '104–112', waist: '92–100' },
  { size: 'XL', chest: '112–120', waist: '100–108' },
]
</script>

<template>
  <Popover default-open v-bind="$attrs">
    <PopoverTrigger as-child
      ><Button variant="outline" color="neutral"
        >Size guide</Button
      ></PopoverTrigger
    >
    <PopoverContent>
      <PopoverHeader>
        <PopoverTitle>Jacket sizes</PopoverTitle>
        <PopoverDescription
          >Body measurements in centimetres.</PopoverDescription
        >
      </PopoverHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Size</TableHead>
            <TableHead class="text-end">Chest</TableHead>
            <TableHead class="text-end">Waist</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in sizes" :key="row.size">
            <TableCell>{{ row.size }}</TableCell>
            <TableCell class="text-end">{{ row.chest }}</TableCell>
            <TableCell class="text-end">{{ row.waist }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </PopoverContent>
  </Popover>
</template>
