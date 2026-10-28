// SPDX-License-Identifier: FSL-1.1-MIT
import type { Ref } from 'vue'
import type { PaymentCardBrand } from './card'
import { createContext } from 'reka-ui'

/** The brand PaymentCardNumber detected, for the security code's length and the logos. */
export const [injectPaymentCardContext, providePaymentCardContext] = createContext<{ brand: Ref<PaymentCardBrand | undefined> }>('PaymentCard')
