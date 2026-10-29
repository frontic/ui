import type { InjectionKey, Ref } from 'vue'
import type { InputGroupSize } from '.'

/** The group's height, which the input inside it takes too. */
export const fronticInputGroupSize: InjectionKey<Ref<InputGroupSize | undefined>> = Symbol('fronticInputGroupSize')
