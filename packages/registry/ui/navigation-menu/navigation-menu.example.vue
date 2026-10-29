<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '.'

defineOptions({ inheritAttrs: false })

const categories = [
  {
    title: 'Jackets',
    description: 'Shells and insulated layers for the trail.',
  },
  { title: 'Backpacks', description: 'Day packs to multi-day haulers.' },
  { title: 'Goggles', description: 'Lenses for flat light and bright days.' },
  { title: 'Sale', description: 'Last season, reduced.' },
]
const help = ['Shipping', 'Returns', 'Size guide']
</script>

<template>
  <div class="@container min-h-72 w-xl max-w-full">
    <NavigationMenu default-value="shop" v-bind="$attrs">
      <NavigationMenuList>
        <NavigationMenuItem value="shop">
          <NavigationMenuTrigger>Shop</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul class="grid w-72 @lg:w-md @lg:grid-cols-2">
              <li v-for="category in categories" :key="category.title">
                <NavigationMenuLink href="#" class="flex-col items-start">
                  {{ category.title }}
                  <span class="text-muted-foreground">{{
                    category.description
                  }}</span>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Help</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul class="w-40">
              <li v-for="page in help" :key="page">
                <NavigationMenuLink href="#">{{ page }}</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#" active>Journal</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuIndicator />
      </NavigationMenuList>
    </NavigationMenu>
  </div>
</template>
