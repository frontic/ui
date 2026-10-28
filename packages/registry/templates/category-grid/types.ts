// SPDX-License-Identifier: FSL-1.1-MIT
import type { NavigationCategory, NavigationLink } from '@library/components/sections/navigation-shop'

export type { Product } from '@library/components/sections/product-card-gallery'
export type { NavigationCategory, NavigationLink } from '@library/components/sections/navigation-shop'
export type { UiFilter, UiFilterOption, UiFilterStats, UiFilterValue, UiSort } from '@library/lib/filter-model'

/** The props the listing hands its HeaderShop. */
export interface GridHeader {
  announcement?: string
  logoText?: string
  logoSrc?: string
  homeHref?: string
  categories?: NavigationCategory[]
  pages?: NavigationLink[]
  cartCount?: number
}

export interface GridCrumb {
  label: string
  href?: string
}
