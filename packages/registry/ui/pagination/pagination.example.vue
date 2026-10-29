<script setup lang="ts">
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <div class="w-2xl max-w-full">
    <Pagination
      :items-per-page="10"
      :total="100"
      :default-page="4"
      :sibling-count="0"
      show-edges
      v-bind="$attrs">
      <PaginationContent v-slot="{ items }">
        <PaginationFirst />
        <PaginationPrevious />
        <template v-for="(item, index) in items" :key="index">
          <PaginationItem v-if="item.type === 'page'" :value="item.value">{{
            item.value
          }}</PaginationItem>
          <PaginationEllipsis v-else :index="index" />
        </template>
        <PaginationNext />
        <PaginationLast />
      </PaginationContent>
    </Pagination>
  </div>
</template>
