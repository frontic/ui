<script lang="ts">
/** A one-page checkout: contact, delivery, shipping method and payment beside an order summary that folds into a bar on narrow screens. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { PaymentCardBrand } from '@library/components/ui/payment-card'
import type { AppliedDiscount, CheckoutOption, CheckoutValues, PaymentMethod, PolicyLink, ShippingMethod } from './checkout'
import type { CartLine } from './types'
import { computed, reactive, ref, toRef, useId, useSlots, watch } from 'vue'
import { Alert, AlertDescription } from '@library/components/ui/alert'
import { Badge } from '@library/components/ui/badge'
import { Button } from '@library/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@library/components/ui/card'
import { Checkbox } from '@library/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@library/components/ui/collapsible'
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldTitle } from '@library/components/ui/field'
import { Form } from '@library/components/ui/form'
import { Image } from '@library/components/ui/image'
import { Input } from '@library/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@library/components/ui/input-group'
import { NativeSelect, NativeSelectOption } from '@library/components/ui/native-select'
import { OrderSummary } from '@library/components/sections/order-summary'
import { PromoCodeField } from '@library/components/sections/promo-code'
import { PaymentCard, PaymentCardCvc, PaymentCardExpiry, PaymentCardNumber } from '@library/components/ui/payment-card'
import { cartCurrency, discounted, itemCount, MINUS_SIGN, shippingFor, subtotal } from '@library/lib/cart'
import { formatPrice, type PriceType } from '@library/lib/format'
import { Price } from '@library/components/ui/price'
import { RadioAccordion, RadioAccordionContent, RadioAccordionItem, RadioAccordionTrigger } from '@library/components/ui/radio-accordion'
import { Separator } from '@library/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@library/components/ui/tooltip'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { useLocale } from 'reka-ui'

const props = withDefaults(
  defineProps<{
    /** The order's lines, listed in the summary. */
    items?: CartLine[]
    /** Prefills the form, e.g. with a signed-in shopper's address. */
    defaultValues?: Partial<CheckoutValues>
    /** ISO 4217 code for the totals while there are no items; otherwise the first item's currency. */
    currency?: string
    /** BCP 47 locale the prices are formatted in; the ConfigProvider's when left out. */
    locale?: string
    /** Shown as the store's name above the form when no `logo` slot is given; nothing shows when both are empty. */
    storeName?: string
    /** The choices in the country selects; `value` is the country code the form sends. */
    countries?: CheckoutOption[]
    /** The country selected at first, by `value`; `defaultValues.country` takes precedence. */
    defaultCountry?: string
    /** Countries, by `value`, whose addresses ask for the building number in a field of its own. */
    houseNumberCountries?: string[]
    /** The shipping methods offered once the address is complete. */
    shippingMethods?: ShippingMethod[]
    /** The payment methods, one row each; picking one reveals its details. */
    paymentMethods?: PaymentMethod[]
    /** The payment method, by `value`, that reveals the card fields. */
    cardMethod?: string
    /** Codes and gift cards on the order, each a removable badge and taken off the total. */
    discounts?: AppliedDiscount[]
    /** The tax rate included in the prices, e.g. `0.19`; the total's tax note hides when left out. */
    taxRate?: number
    /** Where the sign-in link beside the contact heading goes; the link hides when left out. */
    signInHref?: string
    /** Links under the pay button, e.g. the refund and privacy policies. */
    policyLinks?: PolicyLink[]
    /** Shown beside the store name, e.g. that the checkout is encrypted; hidden when empty. */
    secureLabel?: string
    /** Shown as the contact card's heading. */
    contactTitle?: string
    /** Shown under the contact card's heading; hidden when empty. */
    contactDescription?: string
    /** Shown on the sign-in link. */
    signInLabel?: string
    /** Shown as the email field's label. */
    emailLabel?: string
    /** Shown in the tooltip beside the email field. */
    emailHelp?: string
    /** Shown beside the newsletter checkbox. */
    newsletterLabel?: string
    /** Shown as the delivery card's heading. */
    deliveryTitle?: string
    /** Shown under the delivery card's heading; hidden when empty. */
    deliveryDescription?: string
    /** Shown as the country select's label. */
    countryLabel?: string
    /** Shown as the first-name field's label. */
    firstNameLabel?: string
    /** Shown as the last-name field's label. */
    lastNameLabel?: string
    /** Shown as the address field's label while the building number has a field of its own. */
    streetLabel?: string
    /** Shown as the address field's label while it holds the building number too. */
    addressLabel?: string
    /** Shown as the building number field's label. */
    houseNumberLabel?: string
    /** Shown as the label of the optional second address line. */
    apartmentLabel?: string
    /** Shown as the postal code field's label. */
    zipLabel?: string
    /** Shown as the city field's label. */
    cityLabel?: string
    /** Shown as the phone field's label. */
    phoneLabel?: string
    /** Shown in the tooltip beside the phone field. */
    phoneHelp?: string
    /** Shown under the phone field; hidden when empty. */
    phoneNote?: string
    /** Shown as the shipping method section's heading. */
    shippingTitle?: string
    /** Shown in place of the shipping methods until the address is complete. */
    shippingPending?: string
    /** Shown in place of a shipping price of zero. */
    freeLabel?: string
    /** Shown as the payment section's heading. */
    paymentTitle?: string
    /** Shown under the payment heading; hidden when empty. */
    paymentDescription?: string
    /** The card brands whose marks show in the number field, such as the ones the shop accepts. */
    cardBrands?: PaymentCardBrand[]
    /** Shown as the card number field's label. */
    cardNumberLabel?: string
    /** Shown as the card expiry field's label. */
    expiryLabel?: string
    /** Shown as the card security code field's label. */
    cvcLabel?: string
    /** Shown in the tooltip beside the security code field. */
    cvcHelp?: string
    /** Shown as the cardholder name field's label. */
    cardNameLabel?: string
    /** Shown beside the checkbox that bills the shipping address; unticking it reveals the billing address. */
    billingSameLabel?: string
    /** Shown as the billing address's heading. */
    billingTitle?: string
    /** Shown beside the checkbox that saves the shopper's details. */
    rememberLabel?: string
    /** Shown as the label of the phone field the remember checkbox reveals. */
    rememberPhoneLabel?: string
    /** Shown under the remember checkbox's label, e.g. what saving the details means; hidden when empty. */
    rememberNote?: string
    /** Shown on the button that submits the order. */
    payLabel?: string
    /** Shown as the summary card's heading and on the bar that folds it out on narrow screens. */
    summaryLabel?: string
    /** Shown as the discount field's label. */
    discountLabel?: string
    /** Shown in the empty discount field. */
    discountPlaceholder?: string
    /** Shown under the discount field, e.g. which codes can be combined. */
    discountHint?: string
    /** Shown on the button that applies the discount code. */
    applyLabel?: string
    /** Shown on the button that reveals the discount field at the foot of the form on narrow screens. */
    addDiscountLabel?: string
    /** Builds the screen-reader name of the button that removes an applied code from its row label. */
    removeDiscountLabel?: (label: string) => string
    /** Shown next to the subtotal. */
    subtotalLabel?: string
    /** Shown next to the shipping cost. */
    shippingLabel?: string
    /** Shown in place of the shipping cost until a method is chosen. */
    shippingUnknown?: string
    /** Put before each amount an applied code takes off. */
    minusSign?: string
    /** Shown next to the order total. */
    totalLabel?: string
    /** Builds the item count beside the summary's heading and under the total at the foot of the form on narrow screens. */
    itemCountLabel?: (count: number) => string
    /** Builds the note under the total from the included tax, already formatted. */
    taxNote?: (tax: string) => string
    /** Builds each line's quantity text in the summary, e.g. `Qty: 2`. */
    quantityLabel?: (quantity: number) => string
    class?: HTMLAttributes['class']
  }>(),
  {
    items: () => [],
    currency: 'EUR',
    storeName: '',
    countries: () => [
      { value: 'DE', label: 'Germany' },
      { value: 'AT', label: 'Austria' },
      { value: 'CH', label: 'Switzerland' },
      { value: 'GB', label: 'United Kingdom' },
      { value: 'US', label: 'United States' },
    ],
    defaultCountry: 'DE',
    houseNumberCountries: () => ['DE', 'AT', 'CH', 'NL'],
    shippingMethods: () => [
      { value: 'standard', label: 'Standard', description: '3 to 5 working days', amount: 499, freeFrom: 10000 },
      { value: 'express', label: 'Express', description: 'Next working day', amount: 1290 },
    ],
    paymentMethods: () => [
      { value: 'card', label: 'Credit card' },
      { value: 'paypal', label: 'PayPal', description: 'After you click Pay now, PayPal opens to finish your purchase.' },
    ],
    cardMethod: 'card',
    discounts: () => [],
    policyLinks: () => [],
    secureLabel: 'Secure checkout',
    contactTitle: 'Contact',
    contactDescription: 'We send the order confirmation here.',
    signInLabel: 'Sign in',
    emailLabel: 'Email',
    emailHelp: 'We send your order confirmation and shipping updates here.',
    newsletterLabel: 'Email me with news and offers',
    deliveryTitle: 'Delivery',
    deliveryDescription: 'Where should we send your order?',
    countryLabel: 'Country/Region',
    firstNameLabel: 'First name',
    lastNameLabel: 'Last name',
    streetLabel: 'Street',
    addressLabel: 'Address',
    houseNumberLabel: 'Building number',
    apartmentLabel: 'Apartment, suite, etc. (optional)',
    zipLabel: 'Postal code',
    cityLabel: 'City',
    phoneLabel: 'Phone',
    phoneHelp: 'In case we need to reach you about your order.',
    phoneNote: 'Please use your mobile phone number.',
    shippingTitle: 'Shipping method',
    shippingPending: 'Enter your shipping address to view available shipping methods.',
    freeLabel: 'Free',
    paymentTitle: 'Payment',
    paymentDescription: 'All transactions are secure and encrypted.',
    cardBrands: () => ['visa', 'mastercard', 'amex'],
    cardNumberLabel: 'Card number',
    expiryLabel: 'Expiration date',
    cvcLabel: 'Security code',
    cvcHelp: 'The 3 or 4 digits on the back of your card.',
    cardNameLabel: 'Name on card',
    billingSameLabel: 'Use shipping address as billing address',
    billingTitle: 'Billing address',
    rememberLabel: 'Save my details for a faster checkout',
    rememberPhoneLabel: 'Mobile phone (optional)',
    rememberNote: 'Next time we text you a code and fill in the rest.',
    payLabel: 'Pay now',
    summaryLabel: 'Order summary',
    discountLabel: 'Discount code or gift card',
    applyLabel: 'Apply',
    addDiscountLabel: 'Add discount',
    discountPlaceholder: 'Enter a code',
    removeDiscountLabel: (label: string) => `Remove ${label}`,
    subtotalLabel: 'Subtotal',
    shippingLabel: 'Shipping',
    shippingUnknown: 'Enter shipping address',
    minusSign: MINUS_SIGN,
    totalLabel: 'Total',
    itemCountLabel: (count: number) => (count === 1 ? '1 item' : `${count} items`),
    taxNote: (tax: string) => `Including ${tax} in taxes`,
    quantityLabel: (quantity: number) => `Qty: ${quantity}`,
  },
)
const locale = useLocale(toRef(() => props.locale))

const emit = defineEmits<{
  /** Fires with a copy of the form's values when the shopper pays; a field of a section the shopper closed, such as the card fields under another payment method, is empty. */
  'place-order': [values: CheckoutValues]
  /** Fires with the trimmed code when the shopper applies a non-empty discount code. */
  'apply-discount': [code: string]
  /** Fires with an applied code when the shopper removes it. */
  'remove-discount': [discount: AppliedDiscount]
}>()

defineSlots<{
  /** Replaces the store name above the form, e.g. with the store's logo. */
  logo?: () => unknown
}>()

const form = reactive<CheckoutValues>({
  email: '',
  newsletter: false,
  country: props.defaultCountry,
  firstName: '',
  lastName: '',
  address: '',
  houseNumber: '',
  apartment: '',
  zip: '',
  city: '',
  phone: '',
  shippingMethod: props.shippingMethods[0]?.value ?? '',
  paymentMethod: props.paymentMethods[0]?.value ?? '',
  cardNumber: '',
  expiry: '',
  cvc: '',
  cardName: '',
  billingSameAsShipping: true,
  billingFirstName: '',
  billingLastName: '',
  billingAddress: '',
  billingZip: '',
  billingCity: '',
  billingCountry: props.defaultValues?.country ?? props.defaultCountry,
  remember: false,
  rememberPhone: '',
  ...props.defaultValues,
})

const keepChoice = (key: 'shippingMethod' | 'paymentMethod', options: { value: string }[]) => {
  if (!options.some((option) => option.value === form[key])) form[key] = options.find((option) => option.value === props.defaultValues?.[key])?.value ?? options[0]?.value ?? ''
}
watch(
  () => props.shippingMethods,
  (methods) => keepChoice('shippingMethod', methods),
  { immediate: true },
)
watch(
  () => props.paymentMethods,
  (methods) => keepChoice('paymentMethod', methods),
  { immediate: true },
)

const summaryOpen = ref(false)
const discountOpen = ref(false)
const breakdownOpen = ref(false)
const discountCode = ref('')

const slots = useSlots()
const branded = computed(() => Boolean(slots.logo || props.storeName || props.secureLabel))

const uid = useId()
const id = (name: string) => `${uid}-${name}`

const splitHouseNumber = computed(() => props.houseNumberCountries.includes(form.country))
const addressComplete = computed(() => Boolean(form.address && form.zip && form.city && (!splitHouseNumber.value || form.houseNumber)))

/** The form's values as the shopper sees them: a field a hidden section keeps its value in goes out empty. */
function placeOrder() {
  const paysByCard = form.paymentMethod === props.cardMethod
  const billsElsewhere = paysByCard && !form.billingSameAsShipping
  const values: CheckoutValues = {
    ...form,
    houseNumber: splitHouseNumber.value ? form.houseNumber : '',
    cardNumber: paysByCard ? form.cardNumber : '',
    expiry: paysByCard ? form.expiry : '',
    cvc: paysByCard ? form.cvc : '',
    cardName: paysByCard ? form.cardName : '',
    billingSameAsShipping: !billsElsewhere,
    billingFirstName: billsElsewhere ? form.billingFirstName : '',
    billingLastName: billsElsewhere ? form.billingLastName : '',
    billingAddress: billsElsewhere ? form.billingAddress : '',
    billingZip: billsElsewhere ? form.billingZip : '',
    billingCity: billsElsewhere ? form.billingCity : '',
    billingCountry: billsElsewhere ? form.billingCountry : '',
    rememberPhone: form.remember ? form.rememberPhone : '',
  }
  emit('place-order', values)
}

const totalCurrency = computed(() => cartCurrency(props.items, props.currency))
const units = computed(() => itemCount(props.items))
const itemsTotal = computed(() => subtotal(props.items, props.currency))
const afterPromos = computed(() => discounted(itemsTotal.value, props.discounts, 'promo'))
const methodAmount = (method: ShippingMethod) => shippingFor(afterPromos.value, method.amount, method.freeFrom).amount
const shippingMethod = computed(() => (addressComplete.value ? props.shippingMethods.find((method) => method.value === form.shippingMethod) : undefined))
const shipping = computed(() => (shippingMethod.value ? methodAmount(shippingMethod.value) : 0))
// A gift card pays part of the order, so the tax stays on the price after promo codes only.
const taxed = computed(() => afterPromos.value.amount + shipping.value)
const total = computed(() => discounted(itemsTotal.value, props.discounts).amount + shipping.value)
const tax = computed(() => (props.taxRate ? Math.round(taxed.value - taxed.value / (1 + props.taxRate)) : 0))

const summary = computed(() => ({
  title: props.summaryLabel,
  items: props.items,
  currency: totalCurrency.value,
  discounts: props.discounts,
  shippingCents: shipping.value,
  shippingNote: shippingMethod.value ? undefined : props.shippingUnknown,
  showTax: false,
  countLabel: props.itemCountLabel,
  quantityLabel: props.quantityLabel,
  subtotalLabel: props.subtotalLabel,
  shippingLabel: props.shippingLabel,
  freeShippingLabel: props.freeLabel,
  totalLabel: props.totalLabel,
  totalNote: tax.value ? props.taxNote(text(tax.value)) : undefined,
  minusSign: props.minusSign,
  locale: locale.value,
}))
const codes = computed(() => ({
  applied: props.discounts,
  codeLabel: props.discountLabel,
  placeholder: props.discountPlaceholder,
  applyLabel: props.applyLabel,
  hint: props.discountHint,
  removeLabel: props.removeDiscountLabel,
  onApply: applyDiscount,
  onRemove: (discount: AppliedDiscount) => emit('remove-discount', discount),
}))
const money = (amount: number): PriceType => ({ ...itemsTotal.value, amount })
const text = (amount: number) => formatPrice(money(amount), locale.value)

function applyDiscount(code: string) {
  emit('apply-discount', code)
  discountCode.value = ''
}
</script>

<template>
  <TooltipProvider>
    <div data-slot="checkout-page" :class="['fui-checkout-page-root @container/checkout', props.class]">
      <div class="grid grid-cols-1 @4xl/checkout:grid-cols-5">
        <div v-if="branded" class="flex flex-col @4xl/checkout:col-span-3 @4xl/checkout:col-start-1 @4xl/checkout:row-start-1">
          <div class="flex w-full max-w-2xl items-center justify-between gap-4 self-center px-5 py-6 @md:px-4 @4xl/checkout:self-end @4xl/checkout:px-10 @4xl/checkout:pt-10 @4xl/checkout:pb-0">
            <slot name="logo">
              <span data-slot="logo" class="fui-logo">{{ storeName }}</span>
            </slot>
            <Badge v-if="secureLabel" variant="success" size="sm">
              <IconPlaceholder lucide="LockIcon" tabler="IconLock" hugeicons="SquareLock02Icon" phosphor="LockKeyIcon" remixicon="RiLockLine" data-icon />
              {{ secureLabel }}
            </Badge>
          </div>
        </div>

        <aside data-slot="checkout-page-summary" class="fui-checkout-page-summary @4xl/checkout:col-span-2 @4xl/checkout:col-start-4 @4xl/checkout:row-span-2 @4xl/checkout:row-start-1">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-4 px-4 py-4 outline-none focus-visible:fui-focus-ring @4xl/checkout:hidden"
            :aria-expanded="summaryOpen"
            :aria-controls="id('summary')"
            @click="summaryOpen = !summaryOpen"
          >
            <span data-slot="checkout-page-summary-toggle" class="fui-checkout-page-summary-toggle flex items-center">
              {{ summaryLabel }}
              <IconPlaceholder
                lucide="ChevronDownIcon"
                tabler="IconChevronDown"
                hugeicons="ArrowDown01Icon"
                phosphor="CaretDownIcon"
                remixicon="RiArrowDownSLine"
                data-icon
                :class="['transition-transform', summaryOpen && 'rotate-180']"
              />
            </span>
            <Price size="lg" :price="money(total)" :locale="locale" class="text-current" />
          </button>

          <!-- Below @4xl the bar above names the summary, so the card's heading hides. -->
          <div
            :id="id('summary')"
            :class="[
              summaryOpen ? 'block' : 'hidden',
              'pb-4 @md:px-4 @max-4xl/checkout:[&_[data-slot=card-header]]:hidden @4xl/checkout:sticky @4xl/checkout:top-0 @4xl/checkout:block @4xl/checkout:max-w-lg @4xl/checkout:px-10 @4xl/checkout:py-10',
            ]"
          >
            <OrderSummary v-bind="summary">
              <template #title>
                <h2>{{ summaryLabel }}</h2>
              </template>
              <template #codes>
                <PromoCodeField v-model="discountCode" v-bind="codes" />
              </template>
            </OrderSummary>
          </div>
        </aside>

        <main class="flex flex-col @4xl/checkout:col-span-3 @4xl/checkout:col-start-1 @4xl/checkout:row-start-2">
          <div
            :class="[
              'flex w-full max-w-2xl flex-col gap-6 self-center py-6 @md:px-4 @4xl/checkout:self-end @4xl/checkout:px-10 @4xl/checkout:pb-10',
              branded ? '@4xl/checkout:pt-6' : '@4xl/checkout:pt-10',
            ]"
          >
            <Form class="flex flex-col gap-6" @form-submit="placeOrder">
              <Card>
                <CardHeader>
                  <CardTitle
                    ><h2>{{ contactTitle }}</h2></CardTitle
                  >
                  <CardDescription v-if="contactDescription" :class="signInHref && 'col-span-2'">{{ contactDescription }}</CardDescription>
                  <CardAction v-if="signInHref" class="col-start-2 row-start-1">
                    <Button as="a" :href="signInHref" variant="link" size="sm">{{ signInLabel }}</Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field name="email">
                      <FieldLabel>{{ emailLabel }}</FieldLabel>
                      <InputGroup>
                        <InputGroupAddon>
                          <IconPlaceholder lucide="MailIcon" tabler="IconMail" hugeicons="MailIcon" phosphor="EnvelopeSimpleIcon" remixicon="RiMailLine" data-icon />
                        </InputGroupAddon>
                        <InputGroupInput v-model="form.email" type="email" autocomplete="email" required />
                        <InputGroupAddon align="inline-end">
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <InputGroupButton size="icon-xs" :aria-label="emailHelp">
                                <IconPlaceholder lucide="CircleQuestionMarkIcon" tabler="IconHelpCircle" hugeicons="HelpCircleIcon" phosphor="QuestionIcon" remixicon="RiQuestionLine" data-icon />
                              </InputGroupButton>
                            </TooltipTrigger>
                            <TooltipContent>{{ emailHelp }}</TooltipContent>
                          </Tooltip>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldError />
                    </Field>
                    <Field orientation="horizontal">
                      <Checkbox :id="id('newsletter')" v-model="form.newsletter" name="newsletter" />
                      <FieldLabel :for="id('newsletter')">{{ newsletterLabel }}</FieldLabel>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle
                    ><h2>{{ deliveryTitle }}</h2></CardTitle
                  >
                  <CardDescription v-if="deliveryDescription">{{ deliveryDescription }}</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field name="country">
                      <FieldLabel>{{ countryLabel }}</FieldLabel>
                      <NativeSelect v-model="form.country" autocomplete="country" class="w-full">
                        <NativeSelectOption v-for="country in countries" :key="country.value" :value="country.value">{{ country.label }}</NativeSelectOption>
                      </NativeSelect>
                    </Field>
                    <div class="grid gap-4 @md:grid-cols-2">
                      <Field name="firstName">
                        <FieldLabel>{{ firstNameLabel }}</FieldLabel>
                        <Input v-model="form.firstName" autocomplete="given-name" />
                      </Field>
                      <Field name="lastName">
                        <FieldLabel>{{ lastNameLabel }}</FieldLabel>
                        <Input v-model="form.lastName" autocomplete="family-name" required />
                        <FieldError />
                      </Field>
                    </div>
                    <div :class="['grid gap-4', splitHouseNumber && '@md:grid-cols-3']">
                      <Field name="address" :class="splitHouseNumber && '@md:col-span-2'">
                        <FieldLabel>{{ splitHouseNumber ? streetLabel : addressLabel }}</FieldLabel>
                        <Input v-model="form.address" autocomplete="address-line1" required />
                        <FieldError />
                      </Field>
                      <Field v-if="splitHouseNumber" name="houseNumber">
                        <FieldLabel>{{ houseNumberLabel }}</FieldLabel>
                        <Input v-model="form.houseNumber" required />
                        <FieldError />
                      </Field>
                    </div>
                    <Field name="apartment">
                      <FieldLabel>{{ apartmentLabel }}</FieldLabel>
                      <Input v-model="form.apartment" autocomplete="address-line2" />
                    </Field>
                    <div class="grid gap-4 @md:grid-cols-2">
                      <Field name="zip">
                        <FieldLabel>{{ zipLabel }}</FieldLabel>
                        <Input v-model="form.zip" autocomplete="postal-code" required />
                        <FieldError />
                      </Field>
                      <Field name="city">
                        <FieldLabel>{{ cityLabel }}</FieldLabel>
                        <Input v-model="form.city" autocomplete="address-level2" required />
                        <FieldError />
                      </Field>
                    </div>
                    <Field name="phone">
                      <FieldLabel>{{ phoneLabel }}</FieldLabel>
                      <InputGroup>
                        <InputGroupAddon>
                          <IconPlaceholder lucide="PhoneIcon" tabler="IconPhone" hugeicons="Call02Icon" phosphor="PhoneIcon" remixicon="RiPhoneLine" data-icon />
                        </InputGroupAddon>
                        <InputGroupInput v-model="form.phone" type="tel" autocomplete="tel" />
                        <InputGroupAddon align="inline-end">
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <InputGroupButton size="icon-xs" :aria-label="phoneHelp">
                                <IconPlaceholder lucide="CircleQuestionMarkIcon" tabler="IconHelpCircle" hugeicons="HelpCircleIcon" phosphor="QuestionIcon" remixicon="RiQuestionLine" data-icon />
                              </InputGroupButton>
                            </TooltipTrigger>
                            <TooltipContent>{{ phoneHelp }}</TooltipContent>
                          </Tooltip>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldDescription v-if="phoneNote">{{ phoneNote }}</FieldDescription>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle
                    ><h2>{{ shippingTitle }}</h2></CardTitle
                  >
                </CardHeader>
                <CardContent class="flex flex-col gap-4">
                  <RadioAccordion v-if="addressComplete" v-model="form.shippingMethod" name="shippingMethod" required variant="outline">
                    <RadioAccordionItem v-for="method in shippingMethods" :key="method.value" :value="method.value">
                      <RadioAccordionTrigger>
                        <span class="flex flex-1 flex-col">
                          <span>{{ method.label }}</span>
                          <span v-if="method.description" data-slot="meta" class="fui-meta">{{ method.description }}</span>
                        </span>
                        <Badge v-if="methodAmount(method) === 0" variant="success" size="sm">{{ freeLabel }}</Badge>
                        <Price align="end" v-else size="sm" :price="money(methodAmount(method))" :locale="locale" />
                      </RadioAccordionTrigger>
                    </RadioAccordionItem>
                  </RadioAccordion>
                  <Alert v-else variant="neutral" :icon="false">
                    <AlertDescription>{{ shippingPending }}</AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle
                    ><h2>{{ paymentTitle }}</h2></CardTitle
                  >
                  <CardDescription v-if="paymentDescription">{{ paymentDescription }}</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioAccordion v-model="form.paymentMethod" name="paymentMethod" required variant="outline">
                    <RadioAccordionItem v-for="method in paymentMethods" :key="method.value" :value="method.value">
                      <RadioAccordionTrigger>
                        <span class="flex-1">{{ method.label }}</span>
                        <span v-if="method.marks?.length" class="flex flex-wrap justify-end gap-1">
                          <Badge v-for="mark in method.marks.slice(0, 2)" :key="mark" size="sm">{{ mark }}</Badge>
                          <Badge v-if="method.marks.length > 2" size="sm">+{{ method.marks.length - 2 }}</Badge>
                        </span>
                      </RadioAccordionTrigger>
                      <RadioAccordionContent v-if="method.value === cardMethod">
                        <PaymentCard>
                          <FieldGroup>
                            <Field name="cardNumber">
                              <FieldLabel>{{ cardNumberLabel }}</FieldLabel>
                              <PaymentCardNumber v-model="form.cardNumber" :brands="cardBrands" required />
                              <FieldError />
                            </Field>
                            <div class="grid gap-x-4 gap-y-10 @md:grid-cols-2">
                              <Field name="expiry">
                                <FieldLabel>{{ expiryLabel }}</FieldLabel>
                                <PaymentCardExpiry v-model="form.expiry" required />
                                <FieldError />
                              </Field>
                              <Field name="cvc">
                                <FieldLabel>{{ cvcLabel }}</FieldLabel>
                                <PaymentCardCvc v-model="form.cvc" required>
                                  <template #end>
                                    <Tooltip>
                                      <TooltipTrigger as-child>
                                        <InputGroupButton size="icon-xs" :aria-label="cvcHelp">
                                          <IconPlaceholder
                                            lucide="CircleQuestionMarkIcon"
                                            tabler="IconHelpCircle"
                                            hugeicons="HelpCircleIcon"
                                            phosphor="QuestionIcon"
                                            remixicon="RiQuestionLine"
                                            data-icon
                                          />
                                        </InputGroupButton>
                                      </TooltipTrigger>
                                      <TooltipContent>{{ cvcHelp }}</TooltipContent>
                                    </Tooltip>
                                  </template>
                                </PaymentCardCvc>
                                <FieldError />
                              </Field>
                            </div>
                            <Field name="cardName">
                              <FieldLabel>{{ cardNameLabel }}</FieldLabel>
                              <Input v-model="form.cardName" autocomplete="cc-name" required />
                              <FieldError />
                            </Field>
                            <Field orientation="horizontal">
                              <Checkbox :id="id('billing')" v-model="form.billingSameAsShipping" name="billingSameAsShipping" />
                              <FieldLabel :for="id('billing')">{{ billingSameLabel }}</FieldLabel>
                            </Field>
                            <template v-if="!form.billingSameAsShipping">
                              <h3 data-slot="section-title" class="fui-section-title">{{ billingTitle }}</h3>
                              <Field name="billingCountry">
                                <FieldLabel>{{ countryLabel }}</FieldLabel>
                                <NativeSelect v-model="form.billingCountry" autocomplete="billing country" class="w-full">
                                  <NativeSelectOption v-for="country in countries" :key="country.value" :value="country.value">{{ country.label }}</NativeSelectOption>
                                </NativeSelect>
                              </Field>
                              <div class="grid gap-x-4 gap-y-10 @md:grid-cols-2">
                                <Field name="billingFirstName">
                                  <FieldLabel>{{ firstNameLabel }}</FieldLabel>
                                  <Input v-model="form.billingFirstName" autocomplete="billing given-name" />
                                </Field>
                                <Field name="billingLastName">
                                  <FieldLabel>{{ lastNameLabel }}</FieldLabel>
                                  <Input v-model="form.billingLastName" autocomplete="billing family-name" required />
                                  <FieldError />
                                </Field>
                              </div>
                              <Field name="billingAddress">
                                <FieldLabel>{{ addressLabel }}</FieldLabel>
                                <Input v-model="form.billingAddress" autocomplete="billing address-line1" required />
                                <FieldError />
                              </Field>
                              <div class="grid gap-x-4 gap-y-10 @md:grid-cols-2">
                                <Field name="billingZip">
                                  <FieldLabel>{{ zipLabel }}</FieldLabel>
                                  <Input v-model="form.billingZip" autocomplete="billing postal-code" required />
                                  <FieldError />
                                </Field>
                                <Field name="billingCity">
                                  <FieldLabel>{{ cityLabel }}</FieldLabel>
                                  <Input v-model="form.billingCity" autocomplete="billing address-level2" required />
                                  <FieldError />
                                </Field>
                              </div>
                            </template>
                          </FieldGroup>
                        </PaymentCard>
                      </RadioAccordionContent>
                      <RadioAccordionContent v-else-if="method.description">{{ method.description }}</RadioAccordionContent>
                    </RadioAccordionItem>
                  </RadioAccordion>
                </CardContent>
              </Card>

              <Card>
                <CardContent class="flex flex-col gap-4">
                  <FieldLabel :for="id('remember')">
                    <Field orientation="horizontal">
                      <Checkbox :id="id('remember')" v-model="form.remember" name="remember" />
                      <FieldContent>
                        <FieldTitle>{{ rememberLabel }}</FieldTitle>
                        <FieldDescription v-if="rememberNote">{{ rememberNote }}</FieldDescription>
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                  <Field v-if="form.remember" name="rememberPhone">
                    <FieldLabel>{{ rememberPhoneLabel }}</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <IconPlaceholder lucide="SmartphoneIcon" tabler="IconDeviceMobile" hugeicons="SmartPhone01Icon" phosphor="DeviceMobileIcon" remixicon="RiSmartphoneLine" data-icon />
                      </InputGroupAddon>
                      <InputGroupInput v-model="form.rememberPhone" type="tel" autocomplete="tel" />
                    </InputGroup>
                  </Field>

                  <div class="flex flex-col gap-4 @4xl/checkout:hidden">
                    <Collapsible v-if="!breakdownOpen" v-model:open="discountOpen" class="flex flex-col gap-3">
                      <CollapsibleTrigger as-child>
                        <Button type="button" variant="ghost" color="neutral" size="sm" class="self-start">
                          <IconPlaceholder lucide="TicketPercentIcon" tabler="IconRosetteDiscount" hugeicons="CouponPercentIcon" phosphor="TicketIcon" remixicon="RiCoupon3Line" data-icon />
                          {{ addDiscountLabel }}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <PromoCodeField v-model="discountCode" v-bind="codes" />
                      </CollapsibleContent>
                    </Collapsible>

                    <Separator />

                    <Collapsible v-model:open="breakdownOpen">
                      <CollapsibleTrigger class="flex w-full items-center gap-4 text-start">
                        <div v-if="items[0]?.image" data-slot="checkout-page-total-image" class="fui-checkout-page-total-image shrink-0 overflow-hidden">
                          <Image :src="items[0].image" :alt="items[0].name" class="size-full object-cover" />
                        </div>
                        <span class="flex flex-1 flex-col">
                          <span data-slot="total" class="fui-total">{{ totalLabel }}</span>
                          <span data-slot="meta" class="fui-meta">{{ itemCountLabel(units) }}</span>
                        </span>
                        <Price align="end" size="lg" :price="money(total)" :locale="locale" />
                        <IconPlaceholder
                          lucide="ChevronDownIcon"
                          tabler="IconChevronDown"
                          hugeicons="ArrowDown01Icon"
                          phosphor="CaretDownIcon"
                          remixicon="RiArrowDownSLine"
                          data-icon
                          :class="['transition-transform', breakdownOpen && 'rotate-180']"
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div class="pt-4">
                          <OrderSummary v-bind="summary" surface="bare" :show-header="false" :show-total="false">
                            <template #codes>
                              <PromoCodeField v-model="discountCode" v-bind="codes" />
                            </template>
                          </OrderSummary>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" color="checkout" size="lg" class="w-full">
                    <IconPlaceholder lucide="LockIcon" tabler="IconLock" hugeicons="SquareLock02Icon" phosphor="LockKeyIcon" remixicon="RiLockLine" data-icon />
                    {{ payLabel }}
                    <Price :price="money(total)" size="sm" :locale="locale" class="text-current" />
                  </Button>
                </CardFooter>
              </Card>
            </Form>

            <nav v-if="policyLinks.length">
              <ul class="flex flex-wrap justify-center gap-x-4 gap-y-2">
                <li v-for="link in policyLinks" :key="link.href">
                  <a :href="link.href" data-slot="link" class="fui-link">{{ link.label }}</a>
                </li>
              </ul>
            </nav>
          </div>
        </main>
      </div>
    </div>
  </TooltipProvider>
</template>
