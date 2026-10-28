import type { FieldValidateFn } from 'reka-ui'
import type { InjectionKey, Ref } from 'vue'
import type { FieldOrientation } from '.'

/** How a Form validates a named Field inside it that has no `validate` of its own; undefined leaves the Field to its native checks. */
export const fronticFieldValidate: InjectionKey<(name: string) => FieldValidateFn | undefined> = Symbol('fronticFieldValidate')

/** The orientation of the Field around a label; a label beside its checkbox, radio or switch is set in sentence case. */
export const fronticFieldOrientation: InjectionKey<Ref<FieldOrientation>> = Symbol('fronticFieldOrientation')
