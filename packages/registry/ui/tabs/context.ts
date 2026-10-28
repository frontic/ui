import type { ComputedRef, InjectionKey } from 'vue'

export type TabsListVariant = 'default' | 'line'

export const TABS_LIST_VARIANT: InjectionKey<ComputedRef<TabsListVariant>> = Symbol('tabs-list-variant')
