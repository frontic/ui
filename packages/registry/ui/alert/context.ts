// SPDX-License-Identifier: FSL-1.1-MIT
// Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES
import type { ComputedRef, InjectionKey } from 'vue'

export type AlertVariant = 'neutral' | 'info' | 'success' | 'warning' | 'error'

export const ALERT_VARIANT: InjectionKey<ComputedRef<AlertVariant>> = Symbol('alert-variant')
