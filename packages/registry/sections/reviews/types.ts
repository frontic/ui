export interface ReviewsShare {
  /** The star rating, 1 to 5. */
  stars: number
  count: number
}

export interface ReviewsEntry {
  author: string
  /** The author's picture, shown in the avatar. */
  avatar?: string
  /** Shown in the avatar when there is no picture; the author's initials when missing. */
  initials?: string
  /** ISO date, shown in the item's locale. */
  date?: string
  rating: number
  content: string
  verified?: boolean
}
