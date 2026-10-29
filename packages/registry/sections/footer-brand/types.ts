export interface FooterLink {
  label: string
  href: string
}

export interface FooterLinkGroup {
  title: string
  links: FooterLink[]
}

export interface FooterSocialLink {
  label: string
  href: string
  icon: 'instagram' | 'x' | 'facebook' | 'youtube' | 'pinterest' | 'tiktok'
}
