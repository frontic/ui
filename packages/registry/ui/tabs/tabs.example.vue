<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <div class="flex max-w-md flex-col gap-8">
    <Tabs default-value="description" v-bind="$attrs">
      <TabsList>
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="reviews" disabled>Reviews</TabsTrigger>
      </TabsList>
      <TabsContent value="description"
        >A light hybrid jacket with synthetic fill at the core and stretch
        panels where you move.</TabsContent
      >
      <TabsContent value="details"
        >Water-repellent shell, packs into its own chest pocket.</TabsContent
      >
    </Tabs>
    <Tabs default-value="orders" orientation="vertical">
      <TabsList variant="line" aria-label="Account">
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="addresses">Addresses</TabsTrigger>
      </TabsList>
      <TabsContent value="orders"
        >Track, return or reorder what you bought.</TabsContent
      >
      <TabsContent value="addresses"
        >Where your orders ship and your invoices go.</TabsContent
      >
    </Tabs>
  </div>
</template>
