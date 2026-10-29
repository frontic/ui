export interface ReviewItem {
  id: string
  author: string
  avatar?: string
  /** ISO date, shown in the item's locale. */
  date: string
  rating: number
  content: string
  verified?: boolean
}
