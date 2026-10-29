import type { Product } from '@library/lib/product'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'

/** The swatch a product card has selected, starting at the product itself, and the image that goes with it. */
export function useProductSibling(product: MaybeRefOrGetter<Product>) {
  const selected = ref(toValue(product).key ?? toValue(product).siblings?.items?.[0]?.key ?? '')
  const sibling = computed(() => toValue(product).siblings?.items?.find((item) => item.key === selected.value))
  const cover = computed(() => sibling.value?.cover?.src ?? toValue(product).cover?.src ?? '/placeholder.svg')
  return { selected, sibling, cover }
}
