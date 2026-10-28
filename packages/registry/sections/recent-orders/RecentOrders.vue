<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Lists recent orders with status and total, and actions such as track or return. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { OrderStatus, RecentOrder } from './types'
import { computed, toRef } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Badge } from '@library/components/ui/badge'
import { Button } from '@library/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@library/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@library/components/ui/dropdown-menu'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationNext, PaginationPrevious } from '@library/components/ui/pagination'
import { Price } from '@library/components/ui/price'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@library/components/ui/table'
import { formatDate } from '@library/lib/format'
import { pageRange } from '@library/lib/text'
import { useLocale } from 'reka-ui'

const props = withDefaults(
  defineProps<{
    /** The orders on the current page. */
    orders: RecentOrder[]
    /** All orders across the pages; the pagination shows when they need more than one. */
    total?: number
    /** How many orders a page holds. */
    pageSize?: number
    /** Shown as the card's title. */
    title?: string
    /** Shown under the title. */
    description?: string
    /** Shown on the button that downloads all invoices. */
    downloadLabel?: string
    /** Shown in place of the table when there are no orders. */
    emptyLabel?: string
    /** Heading of the order number column. */
    orderLabel?: string
    /** Heading of the order date column. */
    dateLabel?: string
    /** Heading of the ordered items column. */
    itemsLabel?: string
    /** Heading of the status column. */
    statusLabel?: string
    /** Heading of the order total column. */
    totalLabel?: string
    /** Screen-reader heading of the column with each order's action menu. */
    actionsLabel?: string
    /** Shown on the menu item that opens the order. */
    viewLabel?: string
    /** Shown on the menu item that tracks the parcel of a shipped order. */
    trackLabel?: string
    /** Shown on the menu item that downloads the order's invoice. */
    invoiceLabel?: string
    /** Shown on the menu item that starts a return for a delivered order. */
    returnLabel?: string
    /** Shown on each order's status badge, by status. */
    statusLabels?: Record<OrderStatus, string>
    /** Shown after the first item name, counting the order's other items. */
    moreLabel?: (count: number) => string
    /** Shown under the table, saying which orders the page holds out of how many. */
    rangeLabel?: (from: number, to: number, total: number) => string
    /** Screen-reader label of an order's action menu button. */
    orderActionsLabel?: (order: RecentOrder) => string
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    /** BCP 47 locale the dates and totals are formatted in; the ConfigProvider's when left out. */
    locale?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    pageSize: 5,
    title: 'Recent orders',
    description: 'Everything you ordered in the last three months.',
    downloadLabel: 'Download all invoices',
    emptyLabel: 'You have no orders yet.',
    orderLabel: 'Order',
    dateLabel: 'Date',
    itemsLabel: 'Items',
    statusLabel: 'Status',
    totalLabel: 'Total',
    actionsLabel: 'Actions',
    viewLabel: 'View order',
    trackLabel: 'Track parcel',
    invoiceLabel: 'Invoice (PDF)',
    returnLabel: 'Start a return',
    statusLabels: () => ({
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      returned: 'Returned',
    }),
    moreLabel: (count: number) => `+${count} more`,
    rangeLabel: (from: number, to: number, total: number) => `Showing ${from}–${to} of ${total} ${total === 1 ? 'order' : 'orders'}`,
    orderActionsLabel: (order: RecentOrder) => `Actions for order ${order.number}`,
  },
)
const locale = useLocale(toRef(() => props.locale))
const dateText = (date: string) => formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' }, locale.value)
const emit = defineEmits<{
  /** Fires when the customer clicks the button to download all invoices. */
  downloadAll: []
  /** Fires with the order when the customer chooses to view it. */
  view: [order: RecentOrder]
  /** Fires with a shipped order when the customer chooses to track it. */
  track: [order: RecentOrder]
  /** Fires with the order when the customer requests its invoice. */
  invoice: [order: RecentOrder]
  /** Fires with a delivered order when the customer starts a return for it. */
  return: [order: RecentOrder]
}>()

/** The current page, starting at 1. */
const page = defineModel<number>('page', { default: 1 })

const STATUS_VARIANT: Record<OrderStatus, 'success' | 'info' | 'primary' | 'neutral'> = {
  processing: 'primary',
  shipped: 'info',
  delivered: 'success',
  returned: 'neutral',
}

const count = computed(() => props.total ?? props.orders.length)
const shown = computed(() => pageRange(page.value, props.pageSize, count.value))
</script>

<template>
  <Card :surface="surface" :class="props.class">
    <CardHeader>
      <CardTitle as="h3">{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
      <CardAction class="col-start-2 row-span-2 row-start-1 justify-self-end">
        <div class="hidden @md/card-header:block">
          <Button variant="outline" color="neutral" size="sm" :disabled="!count" @click="emit('downloadAll')">{{ downloadLabel }}</Button>
        </div>
        <div class="@md/card-header:hidden">
          <Button variant="outline" color="neutral" size="icon-sm" :aria-label="downloadLabel" :disabled="!count" @click="emit('downloadAll')">
            <IconPlaceholder lucide="DownloadIcon" tabler="IconDownload" hugeicons="Download01Icon" phosphor="DownloadSimpleIcon" remixicon="RiDownloadLine" data-icon />
          </Button>
        </div>
      </CardAction>
    </CardHeader>
    <CardContent class="@container">
      <p v-if="!count" data-slot="hint" class="fui-hint">{{ emptyLabel }}</p>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>{{ orderLabel }}</TableHead>
            <TableHead class="hidden @lg:table-cell">{{ dateLabel }}</TableHead>
            <TableHead class="hidden @2xl:table-cell">{{ itemsLabel }}</TableHead>
            <TableHead class="hidden @sm:table-cell">{{ statusLabel }}</TableHead>
            <TableHead class="text-end">{{ totalLabel }}</TableHead>
            <TableHead
              ><span class="sr-only">{{ actionsLabel }}</span></TableHead
            >
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="order in orders" :key="order.number">
            <TableCell>
              <div class="flex flex-col items-start gap-1">
                <span data-slot="line-title" class="fui-line-title">{{ order.number }}</span>
                <div class="flex flex-col items-start gap-1 @lg:hidden">
                  <time data-slot="hint" class="fui-hint" :datetime="order.date">{{ dateText(order.date) }}</time>
                  <Badge :variant="STATUS_VARIANT[order.status]" size="sm" class="@sm:hidden">{{ statusLabels[order.status] }}</Badge>
                </div>
              </div>
            </TableCell>
            <TableCell class="hidden @lg:table-cell">
              <time data-slot="hint" class="fui-hint" :datetime="order.date">{{ dateText(order.date) }}</time>
            </TableCell>
            <TableCell class="hidden @2xl:table-cell">
              {{ order.items[0] }}
              <span v-if="order.items.length > 1" data-slot="hint" class="fui-hint">{{ moreLabel(order.items.length - 1) }}</span>
            </TableCell>
            <TableCell class="hidden @sm:table-cell">
              <Badge :variant="STATUS_VARIANT[order.status]" size="sm">{{ statusLabels[order.status] }}</Badge>
            </TableCell>
            <TableCell class="text-end">
              <Price align="end" :price="order.total" size="sm" :locale="locale" />
            </TableCell>
            <TableCell class="text-end">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" color="neutral" size="icon-sm" :aria-label="orderActionsLabel(order)">
                    <IconPlaceholder lucide="MoreHorizontalIcon" tabler="IconDots" hugeicons="MoreHorizontalCircle01Icon" phosphor="DotsThreeIcon" remixicon="RiMoreLine" data-icon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @select="emit('view', order)">
                    <IconPlaceholder lucide="PackageSearchIcon" tabler="IconPackage" hugeicons="PackageSearchIcon" phosphor="PackageIcon" remixicon="RiFileSearchLine" data-icon />
                    {{ viewLabel }}
                  </DropdownMenuItem>
                  <DropdownMenuItem :disabled="order.status !== 'shipped'" @select="emit('track', order)">
                    <IconPlaceholder lucide="TruckIcon" tabler="IconTruck" hugeicons="TruckIcon" phosphor="TruckIcon" remixicon="RiTruckLine" data-icon />
                    {{ trackLabel }}
                  </DropdownMenuItem>
                  <DropdownMenuItem @select="emit('invoice', order)">
                    <IconPlaceholder lucide="FileTextIcon" tabler="IconFileText" hugeicons="File01Icon" phosphor="FileTextIcon" remixicon="RiFileTextLine" data-icon />
                    {{ invoiceLabel }}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem :disabled="order.status !== 'delivered'" @select="emit('return', order)">
                    <IconPlaceholder lucide="RotateCcwIcon" tabler="IconRotate" hugeicons="RotateCcwIcon" phosphor="ArrowCounterClockwiseIcon" remixicon="RiArrowGoBackLine" data-icon />
                    {{ returnLabel }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
    <CardFooter v-if="count" class="@container flex-col items-start gap-4">
      <div class="flex w-full flex-col gap-4 @xl:flex-row @xl:items-center @xl:justify-between">
        <span v-if="shown && orders.length" data-slot="hint" class="fui-hint shrink-0">{{ rangeLabel(shown.from, Math.min(shown.to, shown.from + orders.length - 1), count) }}</span>
        <Pagination v-if="count > pageSize" v-model:page="page" :items-per-page="pageSize" :total="count" class="mx-0 justify-start @xl:justify-end">
          <PaginationContent v-slot="{ items }">
            <PaginationPrevious />
            <template v-for="(item, index) in items" :key="index">
              <PaginationItem v-if="item.type === 'page'" :value="item.value">{{ item.value }}</PaginationItem>
              <PaginationEllipsis v-else :index="index" />
            </template>
            <PaginationNext />
          </PaginationContent>
        </Pagination>
      </div>
    </CardFooter>
  </Card>
</template>
