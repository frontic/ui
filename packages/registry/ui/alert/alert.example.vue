<script setup lang="ts">
import { Button } from '@library/components/ui/button'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Alert class="w-full max-w-lg" v-bind="$attrs">
    <AlertTitle>Order placed</AlertTitle>
    <AlertDescription>We sent the confirmation to your inbox.</AlertDescription>
    <AlertAction>
      <Button variant="outline" color="neutral" size="xs" as="a" href="#order">
        View order
      </Button>
    </AlertAction>
  </Alert>
</template>
