// SPDX-License-Identifier: FSL-1.1-MIT
// Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES
import type { UseEmblaCarouselType } from 'embla-carousel-vue'
import type { HTMLAttributes, UnwrapRef } from 'vue'
import type { Button } from '@library/components/ui/button'

type CarouselApi = UseEmblaCarouselType[1]
type ReInitParameters = Parameters<UseEmblaCarouselType[2]['reInit']>
type CarouselOptions = ReInitParameters[0]
type CarouselPlugin = ReInitParameters[1]

export type UnwrapRefCarouselApi = UnwrapRef<CarouselApi>

export interface CarouselProps {
  /** Embla options, e.g. `loop`, `align` or `slidesToScroll`. */
  opts?: CarouselOptions
  /** Embla plugins, e.g. autoplay. */
  plugins?: CarouselPlugin
  /** The scroll direction; the arrow keys follow it. */
  orientation?: 'horizontal' | 'vertical'
}

export interface CarouselEmits {
  /** Fires once on mount with the Embla API, for driving the carousel from outside. */
  'init-api': [payload: UnwrapRefCarouselApi]
}

export interface WithClassAsProps {
  class?: HTMLAttributes['class']
}

export interface CarouselButtonProps {
  /** The button style: solid, outline, soft, ghost or link. */
  variant?: InstanceType<typeof Button>['$props']['variant']
  /** The button colour role, e.g. neutral or brand. */
  color?: InstanceType<typeof Button>['$props']['color']
  /** The button's size; the `icon-*` sizes keep it a square icon button. */
  size?: InstanceType<typeof Button>['$props']['size']
}
