import type { ComputedRef, InjectionKey } from 'vue'

export type AlertVariant = 'neutral' | 'info' | 'success' | 'warning' | 'error'

export const ALERT_VARIANT: InjectionKey<ComputedRef<AlertVariant>> = Symbol('alert-variant')
