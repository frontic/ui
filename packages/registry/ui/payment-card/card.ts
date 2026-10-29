import cardValidator from 'card-validator'
import creditCardType from 'credit-card-type'

/** A card scheme the number field recognises from the first digits. */
export type PaymentCardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay' | 'maestro' | 'elo' | 'mir'

export interface PaymentCardScheme {
  brand: PaymentCardBrand
  /** The lengths a full number may have, shortest first. */
  lengths: number[]
  /** Where a space goes as the number is typed, by digit count. */
  gaps: number[]
  /** The security code's length. */
  cvc: number
}

/** Braintree's card type for each brand. */
const TYPES: Record<PaymentCardBrand, string> = {
  visa: 'visa',
  mastercard: 'mastercard',
  amex: 'american-express',
  discover: 'discover',
  diners: 'diners-club',
  jcb: 'jcb',
  unionpay: 'unionpay',
  maestro: 'maestro',
  elo: 'elo',
  mir: 'mir',
}
const BRANDS = new Map(Object.entries(TYPES).map(([brand, type]) => [type, brand as PaymentCardBrand]))

const UNKNOWN = { lengths: [16, 19], gaps: [4, 8, 12] }

/** Keeps the digits of what was typed or pasted. */
export const digitsOf = (text: string) => text.replace(/\D/g, '')

/** The scheme a number belongs to, once its first digits tell one brand. */
export function paymentCardScheme(digits: string): PaymentCardScheme | undefined {
  const card = digits ? cardValidator.number(digits).card : null
  const brand = card && BRANDS.get(card.type)
  return brand ? { brand, lengths: card.lengths, gaps: card.gaps, cvc: card.code.size } : undefined
}

/** Cuts a number to its scheme's longest length and spaces it the way the card prints it. */
export function formatPaymentCardNumber(digits: string): string {
  const { lengths, gaps } = paymentCardScheme(digits) ?? UNKNOWN
  const kept = digits.slice(0, lengths.at(-1))
  return [...kept].map((digit, index) => (index > 0 && gaps.includes(index) ? ` ${digit}` : digit)).join('')
}

/** What keeps a number from being a card's: too few digits, or digits no card has; a number as long as its card's shortest that still fails is invalid, not short. */
export function paymentCardNumberProblem(digits: string): 'incomplete' | 'invalid' | undefined {
  if (!digits) return undefined
  const { isValid, isPotentiallyValid, card } = cardValidator.number(digits)
  if (isValid) return undefined
  return isPotentiallyValid && digits.length < (card?.lengths[0] ?? Infinity) ? 'incomplete' : 'invalid'
}

/** The security code's shortest and longest length: the brand's, or three to four while the brand is not known. */
export function paymentCardCvcLengths(brand: PaymentCardBrand | undefined): { min: number; max: number } {
  const cvc = brand && creditCardType.getTypeInfo(TYPES[brand]).code.size
  return cvc ? { min: cvc, max: cvc } : { min: 3, max: 4 }
}

/** Writes an expiry as MM/YY while it is typed; a first digit above 1 is a month on its own. */
export function formatPaymentCardExpiry(text: string): string {
  let digits = digitsOf(text)
  if (/^[2-9]/.test(digits)) digits = `0${digits}`
  digits = digits.slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

/** What keeps an MM/YY expiry from being a card's: too few digits, no such month or year, or a month already past. */
export function paymentCardExpiryProblem(expiry: string): 'incomplete' | 'invalid' | 'expired' | undefined {
  const digits = digitsOf(expiry)
  if (!digits) return undefined
  if (digits.length < 4) return 'incomplete'
  if (cardValidator.expirationDate(`${digits.slice(0, 2)}/${digits.slice(2)}`).isValid) return undefined
  if (!cardValidator.expirationMonth(digits.slice(0, 2)).isValid) return 'invalid'
  return Number(digits.slice(2)) <= new Date().getFullYear() % 100 ? 'expired' : 'invalid'
}
