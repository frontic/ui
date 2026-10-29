import type { InjectionKey } from 'vue'

/** Whether the Combobox itself is required, for the trigger that joins the Field. */
export const comboboxRequired: InjectionKey<() => boolean> = Symbol('comboboxRequired')
