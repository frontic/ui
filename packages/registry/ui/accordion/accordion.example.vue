<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Accordion type="single" collapsible class="max-w-md" v-bind="$attrs">
    <AccordionItem value="shipping">
      <AccordionTrigger>How long does shipping take?</AccordionTrigger>
      <AccordionContent>Orders ship within two working days.</AccordionContent>
    </AccordionItem>
    <AccordionItem value="returns">
      <AccordionTrigger>Can I return an item?</AccordionTrigger>
      <AccordionContent>Send anything back within 30 days.</AccordionContent>
    </AccordionItem>
  </Accordion>
</template>
