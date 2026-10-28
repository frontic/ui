export interface DeliveryWindow {
  value: string
  /** The toggle's text, e.g. `8–12`. */
  label: string
  /** The summary's text, e.g. `08:00–12:00`; falls back to `label`. */
  detail?: string
  /** Booked out: shown, not selectable. */
  full?: boolean
}

export interface DeliveryNotice {
  title: string
  description?: string
}
