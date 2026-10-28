import type { PriceType } from '@library/components/ui/price'

export interface SearchProduct {
  name: string
  href: string
  image?: string
  /** A line under the name, such as colour and category. */
  meta?: string
  price: PriceType
  badge?: { label: string; variant: 'promo' | 'new' }
}

export interface SearchCategory {
  name: string
  href: string
  count?: number
}

export interface SearchBrand {
  name: string
  href: string
}

export interface SearchResult {
  /** The query these results answer; results for an older query are not shown. */
  query: string
  products: SearchProduct[]
  categories: SearchCategory[]
  brands: SearchBrand[]
  /** Every match the results page would list, for the "See all" row. */
  total?: number
}

export interface SearchSuggestion {
  label: string
  /** The search the tag runs; the label when left out. */
  query?: string
}

export interface SearchCollection {
  /** Such as "Staff picks". */
  title: string
  products: SearchProduct[]
}
