// SPDX-License-Identifier: FSL-1.1-MIT
export interface ReviewItem {
  id: string
  author: string
  avatar?: string
  rating: number
  content: string
  /** ISO date, shown in the item's locale. */
  date: string
  verified?: boolean
}

export interface RatingCount {
  rating: number
  count: number
}
