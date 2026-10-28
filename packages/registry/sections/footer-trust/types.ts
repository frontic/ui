// SPDX-License-Identifier: FSL-1.1-MIT
export interface FooterLink {
  label: string
  href: string
}

export interface FooterTrustItem {
  icon: 'shipping' | 'payment' | 'returns' | 'support'
  title: string
  description: string
}
