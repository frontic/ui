<script setup lang="ts">
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <AlertDialog default-open v-bind="$attrs">
    <AlertDialogTrigger as-child
      ><Button variant="outline" color="destructive"
        >Delete address</Button
      ></AlertDialogTrigger
    >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogMedia>
          <IconPlaceholder
            lucide="TriangleAlertIcon"
            tabler="IconAlertTriangle"
            hugeicons="Alert02Icon"
            phosphor="WarningIcon"
            remixicon="RiAlertLine"
            data-icon />
        </AlertDialogMedia>
        <AlertDialogTitle>Delete this address?</AlertDialogTitle>
        <AlertDialogDescription
          >It leaves your address book. Orders already placed keep
          it.</AlertDialogDescription
        >
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction color="destructive">Delete</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
