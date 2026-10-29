export interface TrackingStep {
  title: string
  /** ISO date the step was reached, shown as month and day in the item's locale at the end of the step's title row. */
  date?: string
  /** One line under the step, e.g. where the parcel is. */
  note?: string
}
