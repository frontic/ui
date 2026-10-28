<script setup lang="ts">
import { Button } from '@library/components/ui/button'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <TooltipProvider>
    <Tooltip default-open v-bind="$attrs">
      <TooltipTrigger as-child
        ><Button
          variant="outline"
          color="neutral"
          size="icon-md"
          aria-label="Save to wishlist"
          ><IconPlaceholder
            lucide="HeartIcon"
            tabler="IconHeart"
            hugeicons="FavouriteIcon"
            phosphor="HeartIcon"
            remixicon="RiHeartLine"
            data-icon /></Button
      ></TooltipTrigger>
      <TooltipContent>Save to wishlist</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
