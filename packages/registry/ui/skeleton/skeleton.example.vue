<script setup lang="ts">
import { Card, CardContent, CardImage } from '@library/components/ui/card'
import { Skeleton } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <!--
    A product card while its product loads, laid out like ProductCardBasic.
  -->
  <div class="mx-auto w-full max-w-xs">
    <Card aria-busy="true" class="w-full">
      <CardImage>
        <Skeleton class="aspect-3/4 w-full" />
      </CardImage>
      <CardContent class="flex flex-col gap-3">
        <div class="flex flex-col gap-2">
          <Skeleton class="h-3 w-24" />
          <Skeleton class="h-5 w-full" />
          <Skeleton class="h-5 w-2/3" />
          <Skeleton class="h-4 w-28" />
        </div>
        <Skeleton class="h-5 w-16" />
        <div class="flex gap-2">
          <Skeleton class="size-6 rounded-full" />
          <Skeleton class="size-6 rounded-full" />
        </div>
        <Skeleton class="h-10 w-full" v-bind="$attrs" />
      </CardContent>
    </Card>
    <span role="status" class="sr-only">Loading product</span>
  </div>
</template>
