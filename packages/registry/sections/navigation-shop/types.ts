export interface NavigationLink {
  name: string
  href: string
  highlight?: boolean
}

export interface NavigationFeatured {
  name: string
  href: string
  imageSrc: string
  imageAlt: string
  /** In the captioned layout, spans both columns at 2:1; the first tile does when left out. */
  wide?: boolean
}

export interface NavigationColumn {
  name: string
  links: NavigationLink[]
}

export interface NavigationCategory {
  name: string
  href?: string
  featured?: NavigationFeatured[]
  columns?: NavigationColumn[]
}

/** How a flyout sets its featured tiles against its link columns. */
export type NavigationLayout = 'beside' | 'above' | 'captioned'

export interface NavigationProps {
  /** Beside puts the link columns left of square tiles; above sets a row of tiles over full-width columns; captioned leads with a wide tile under caption overlays and underlines the triggers. */
  layout?: NavigationLayout
  /** The top-level categories; one with featured tiles or link columns opens a flyout, one without is a plain link. */
  categories: NavigationCategory[]
  /** Plain links after the categories, such as Sale or Journal. */
  pages?: NavigationLink[]
  /** Screen-reader name of the button that opens the mobile menu. */
  menuLabel?: string
  /** Screen-reader title of the mobile menu. */
  sheetTitle?: string
  /** Shown under each featured tile's name, e.g. `Shop now`. */
  featuredCta?: string
}
