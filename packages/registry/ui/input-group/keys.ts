// SPDX-License-Identifier: FSL-1.1-MIT
// Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES
import type { InjectionKey, Ref } from 'vue'
import type { InputGroupSize } from '.'

/** The group's height, which the input inside it takes too. */
export const fronticInputGroupSize: InjectionKey<Ref<InputGroupSize | undefined>> = Symbol('fronticInputGroupSize')
