<script lang="ts">
/** Joins related buttons into one connected group. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ButtonGroupOrientation } from '.'
import { computed, inject, provide } from 'vue'
import { BUTTON_GROUP_ORIENTATION } from './context'

const ORIENTATION: Record<ButtonGroupOrientation, string> = {
  horizontal: '*:not-first:rounded-s-none *:not-first:border-s-0 *:not-last:not-has-[+select[aria-hidden=true]:last-child]:rounded-e-none',
  vertical: 'flex-col *:w-full *:not-first:rounded-t-none *:not-first:border-t-0 *:not-last:rounded-b-none',
}

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
      /** Whether the buttons sit side by side or stacked, with the joined edges following; a nested group follows its parent's. */
      orientation?: ButtonGroupOrientation
    }
  >(),
  { as: 'div', orientation: undefined },
)

const parent = inject(BUTTON_GROUP_ORIENTATION, undefined)
const orientation = computed(() => props.orientation ?? parent?.value ?? 'horizontal')
provide(BUTTON_GROUP_ORIENTATION, orientation)
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    role="group"
    data-slot="button-group"
    :data-orientation="orientation"
    :class="[
      'fui-button-group *:focus-visible:relative *:focus-visible:z-10 [&>[data-slot=select-trigger]:not([class*=w-])]:w-fit [&>input]:flex-1 has-[>[data-slot=button-group]]:gap-2 [&>[data-slot=input]]:px-4 has-[>[data-variant=outline]]:[&>[data-slot=input-group]]:px-2.5 has-[>[data-variant=outline]]:[&>[role=combobox]]:px-2.5',
      ORIENTATION[orientation],
      props.class,
    ]"
  >
    <slot />
  </Primitive>
</template>
