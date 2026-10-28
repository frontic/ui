// SPDX-License-Identifier: FSL-1.1-MIT
// Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES
import type { Button } from '@library/components/ui/button'

export { default as Pagination } from './Pagination.vue'
export { default as PaginationContent } from './PaginationContent.vue'
export { default as PaginationEllipsis } from './PaginationEllipsis.vue'
export { default as PaginationFirst } from './PaginationFirst.vue'
export { default as PaginationItem } from './PaginationItem.vue'
export { default as PaginationLast } from './PaginationLast.vue'
export { default as PaginationLink } from './PaginationLink.vue'
export { default as PaginationNext } from './PaginationNext.vue'
export { default as PaginationPrevious } from './PaginationPrevious.vue'

export type PaginationButtonSize = InstanceType<typeof Button>['$props']['size']
