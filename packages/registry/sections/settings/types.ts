export interface SettingsOption {
  /** Key of the option in the model. */
  id: string
  label: string
  description?: string
  disabled?: boolean
}

/** A titled set of options, such as one channel of notification settings. */
export interface SettingsGroup {
  label: string
  options: SettingsOption[]
}
