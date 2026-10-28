<script setup lang="ts">
import { Image } from '@library/components/ui/image'
import {
  MegaMenu,
  MegaMenuContent,
  MegaMenuItem,
  MegaMenuLink,
  MegaMenuList,
  MegaMenuTrigger,
  MegaMenuViewport,
} from '.'

defineOptions({ inheritAttrs: false })

const image = (name: string) =>
  `https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/${name}.jpg`

const menus = [
  {
    name: 'Women',
    columns: [
      {
        name: 'Winter',
        links: ['Jackets', 'Beanies', 'Goggles', 'Helmets', 'Gloves'],
      },
      { name: 'Equipment', links: ['Backpacks'] },
    ],
    featured: {
      name: 'Winterwonder Parka',
      image: image('winterwonder-parka'),
    },
  },
  {
    name: 'Men',
    columns: [
      { name: 'Winter', links: ['Jackets', 'Beanies', 'Goggles', 'Helmets'] },
      { name: 'Equipment', links: ['Backpacks'] },
    ],
    featured: {
      name: 'Frost Escape Parka',
      image: image('frost-escape-parka'),
    },
  },
]
</script>

<template>
  <div class="min-h-110 w-4xl max-w-full">
    <MegaMenu default-value="Women" v-bind="$attrs">
      <MegaMenuList>
        <MegaMenuItem v-for="menu in menus" :key="menu.name" :value="menu.name">
          <MegaMenuTrigger class="h-9 px-4">{{ menu.name }}</MegaMenuTrigger>
          <MegaMenuContent>
            <div
              class="grid grid-cols-2 gap-6 p-6 @2xl:grid-cols-3 @2xl:gap-8 @2xl:p-8">
              <div
                v-for="column in menu.columns"
                :key="column.name"
                class="flex flex-col gap-3">
                <p class="text-muted-foreground">{{ column.name }}</p>
                <MegaMenuLink
                  v-for="link in column.links"
                  :key="link"
                  href="#"
                  >{{ link }}</MegaMenuLink
                >
              </div>
              <MegaMenuLink href="#" class="flex flex-col gap-3">
                <Image
                  :src="menu.featured.image"
                  alt=""
                  class="aspect-square w-full object-cover" />
                {{ menu.featured.name }}
              </MegaMenuLink>
            </div>
          </MegaMenuContent>
        </MegaMenuItem>
        <MegaMenuItem>
          <MegaMenuLink href="#" class="inline-flex h-9 items-center px-4"
            >Sale</MegaMenuLink
          >
        </MegaMenuItem>
      </MegaMenuList>
      <MegaMenuViewport />
    </MegaMenu>
  </div>
</template>
