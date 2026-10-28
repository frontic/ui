import type { InjectionKey, Ref } from 'vue'
import type { ButtonGroupOrientation } from '.'

export const BUTTON_GROUP_ORIENTATION: InjectionKey<Ref<ButtonGroupOrientation>> = Symbol('button-group-orientation')
