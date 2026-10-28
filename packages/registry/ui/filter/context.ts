// SPDX-License-Identifier: FSL-1.1-MIT
import type { ComputedRef, InjectionKey } from 'vue'

export const FILTER_GROUP_LABEL: InjectionKey<ComputedRef<string>> = Symbol('filter-group-label')
