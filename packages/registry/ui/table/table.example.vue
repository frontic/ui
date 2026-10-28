<script setup lang="ts">
import { Badge } from '@library/components/ui/badge'
import { Price } from '@library/components/ui/price'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '.'

defineOptions({ inheritAttrs: false })

const orders = [
  { id: '#1042', status: 'Shipped', variant: 'info', total: 14900 },
  { id: '#1043', status: 'Processing', variant: 'primary', total: 14500 },
  { id: '#1044', status: 'Delivered', variant: 'success', total: 11200 },
] as const
const sum = {
  amount: orders.reduce((total, order) => total + order.total, 0),
  currency: 'EUR',
}
</script>

<template>
  <Table v-bind="$attrs">
    <TableCaption>Your recent orders.</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead>Order</TableHead>
        <TableHead>Status</TableHead>
        <TableHead class="text-end">Total</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="order in orders" :key="order.id">
        <TableCell>{{ order.id }}</TableCell>
        <TableCell
          ><Badge :variant="order.variant" size="sm">{{
            order.status
          }}</Badge></TableCell
        >
        <TableCell class="text-end"
          ><Price
            align="end"
            :price="{ amount: order.total, currency: 'EUR' }"
            size="sm"
        /></TableCell>
      </TableRow>
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell colspan="2">Total</TableCell>
        <TableCell class="text-end"
          ><Price align="end" :price="sum" size="sm"
        /></TableCell>
      </TableRow>
    </TableFooter>
  </Table>
</template>
