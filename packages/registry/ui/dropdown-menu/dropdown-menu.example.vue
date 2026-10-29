<script setup lang="ts">
import { ref } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '.'

defineOptions({ inheritAttrs: false })

const markets = [
  { value: 'de', label: 'Germany · EUR' },
  { value: 'at', label: 'Austria · EUR' },
  { value: 'ch', label: 'Switzerland · CHF' },
]
const market = ref('de')
const offers = ref(true)
</script>

<template>
  <DropdownMenu default-open v-bind="$attrs">
    <DropdownMenuTrigger as-child
      ><Button variant="outline" color="neutral"
        >Account</Button
      ></DropdownMenuTrigger
    >
    <DropdownMenuContent>
      <DropdownMenuLabel>
        Lena Huber
        <span class="block font-normal text-muted-foreground normal-case"
          >lena.huber@example.com</span
        >
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <IconPlaceholder
            lucide="PackageIcon"
            tabler="IconPackage"
            hugeicons="PackageIcon"
            phosphor="PackageIcon"
            remixicon="RiBox3Line"
            data-icon />
          Orders
          <DropdownMenuShortcut>⇧⌘O</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconPlaceholder
            lucide="MapPinIcon"
            tabler="IconMapPin"
            hugeicons="Location01Icon"
            phosphor="MapPinIcon"
            remixicon="RiMapPinLine"
            data-icon />
          Addresses
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconPlaceholder
            lucide="HeartIcon"
            tabler="IconHeart"
            hugeicons="FavouriteIcon"
            phosphor="HeartIcon"
            remixicon="RiHeartLine"
            data-icon />
          Wishlist
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconPlaceholder
              lucide="GlobeIcon"
              tabler="IconWorld"
              hugeicons="Globe02Icon"
              phosphor="GlobeIcon"
              remixicon="RiGlobalLine"
              data-icon />
            Country
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup v-model="market">
              <DropdownMenuRadioItem
                v-for="option in markets"
                :key="option.value"
                :value="option.value"
                >{{ option.label }}</DropdownMenuRadioItem
              >
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem v-model="offers"
        >Email me offers</DropdownMenuCheckboxItem
      >
      <DropdownMenuSeparator />
      <DropdownMenuItem color="destructive">
        <IconPlaceholder
          lucide="LogOutIcon"
          tabler="IconLogout"
          hugeicons="Logout01Icon"
          phosphor="SignOutIcon"
          remixicon="RiLogoutBoxRLine"
          data-icon />
        Sign out
        <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
