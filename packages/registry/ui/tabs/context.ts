// SPDX-License-Identifier: FSL-1.1-MIT
// Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES
import type { ComputedRef, InjectionKey } from 'vue'

export type TabsListVariant = 'default' | 'line'

export const TABS_LIST_VARIANT: InjectionKey<ComputedRef<TabsListVariant>> = Symbol('tabs-list-variant')
