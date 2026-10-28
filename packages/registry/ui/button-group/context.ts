// SPDX-License-Identifier: FSL-1.1-MIT
// Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES
import type { InjectionKey, Ref } from 'vue'
import type { ButtonGroupOrientation } from '.'

export const BUTTON_GROUP_ORIENTATION: InjectionKey<Ref<ButtonGroupOrientation>> = Symbol('button-group-orientation')
