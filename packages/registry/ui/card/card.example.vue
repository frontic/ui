<script setup lang="ts">
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Badge } from '@library/components/ui/badge'
import { Button } from '@library/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardImage,
  CardTitle,
} from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Card class="w-full max-w-sm" v-bind="$attrs">
    <CardImage>
      <img
        src="https://static.frontic.com/cdn-cgi/image/width=768,format=auto/ui/banners/mens-jackets.png"
        alt="A skier in a colour-block jacket in front of snowy mountains"
        class="aspect-video w-full object-cover" />
    </CardImage>
    <CardHeader>
      <CardTitle>Basecamp Innsbruck</CardTitle>
      <CardDescription
        >Maria-Theresien-Straße 18, 6020 Innsbruck</CardDescription
      >
      <CardAction>
        <Badge variant="success" size="sm">Open</Badge>
      </CardAction>
    </CardHeader>
    <CardContent>
      <ul class="flex flex-col gap-3">
        <li class="flex items-center gap-2">
          <IconPlaceholder
            lucide="ClockIcon"
            tabler="IconClock"
            hugeicons="Clock01Icon"
            phosphor="ClockIcon"
            remixicon="RiTimeLine"
            class="size-4 shrink-0"
            data-icon />
          Open today until 19:00
        </li>
        <li class="flex items-center gap-2">
          <IconPlaceholder
            lucide="MapPinIcon"
            tabler="IconMapPin"
            hugeicons="Location01Icon"
            phosphor="MapPinIcon"
            remixicon="RiMapPinLine"
            class="size-4 shrink-0"
            data-icon />
          1.2 km away
        </li>
        <li class="flex items-center gap-2">
          <IconPlaceholder
            lucide="PackageCheckIcon"
            tabler="IconPackage"
            hugeicons="PackageIcon"
            phosphor="PackageIcon"
            remixicon="RiBox3Line"
            class="size-4 shrink-0"
            data-icon />
          Click &amp; collect ready in 2 hours
        </li>
      </ul>
    </CardContent>
    <CardFooter class="gap-2">
      <Button
        as="a"
        href="tel:+43512000000"
        variant="outline"
        color="neutral"
        class="flex-1">
        <IconPlaceholder
          lucide="PhoneIcon"
          tabler="IconPhone"
          hugeicons="Call02Icon"
          phosphor="PhoneIcon"
          remixicon="RiPhoneLine"
          data-icon="inline-start" />
        Call
      </Button>
      <Button as="a" href="#directions" class="flex-1">Directions</Button>
    </CardFooter>
  </Card>
</template>
