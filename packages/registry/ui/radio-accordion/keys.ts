import type { AcceptableValue } from 'reka-ui'
import type { ComputedRef, InjectionKey, Ref } from 'vue'

export type RadioAccordionVariant = 'plain' | 'outline'

export const radioAccordionVariant: InjectionKey<Ref<RadioAccordionVariant>> = Symbol('radioAccordionVariant')

export interface RadioAccordionItemContext {
  value: Ref<AcceptableValue>
  disabled: Ref<boolean>
  checked: ComputedRef<boolean>
}

export const radioAccordionItem: InjectionKey<RadioAccordionItemContext> = Symbol('radioAccordionItem')
