// SPDX-License-Identifier: FSL-1.1-MIT
import type { HTMLAttributes, InjectionKey } from 'vue'
import type { SwatchShape, SwatchSize } from '@library/components/ui/swatch'

export { default as SwatchGroup } from './SwatchGroup.vue'
export { default as SwatchGroupItem } from './SwatchGroupItem.vue'

export type SwatchGroupOrientation = 'horizontal' | 'vertical'

export interface SwatchGroupContext {
  size?: SwatchSize
  shape?: SwatchShape
  orientation: SwatchGroupOrientation
  labelClass?: HTMLAttributes['class']
}

export const SWATCH_GROUP_INJECTION_KEY = Symbol('swatch-group-context') as InjectionKey<SwatchGroupContext>
