// SPDX-License-Identifier: FSL-1.1-MIT
export interface ProductColour {
  value: string
  label: string
  hex: string
  /** The product shot in this colour; the main image shows when it is missing. */
  image?: string
  alt?: string
  /** Sold out: drawn crossed out, still selectable to see the product in it, but not added to the cart. */
  unavailable?: boolean
}

export interface ProductSize {
  value: string
  label?: string
  /** Sold out: shown but not selectable. */
  disabled?: boolean
}

export interface ProductSelection {
  colour?: string
  size?: string
  quantity: number
}
