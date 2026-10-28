export interface PaymentOption {
  value: string
  label: string
  /** Shown at the row's end, e.g. the accepted cards or why it is unavailable. */
  detail?: string
  /** Shown below the row while it is selected. */
  description?: string
  disabled?: boolean
}
