// SPDX-License-Identifier: FSL-1.1-MIT
// Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES
import type { InjectionKey } from 'vue'

/** Whether the Combobox itself is required, for the trigger that joins the Field. */
export const comboboxRequired: InjectionKey<() => boolean> = Symbol('comboboxRequired')
