import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const example = readFileSync(join(import.meta.dirname, '../../ui/payment-card/payment-card.example.vue'), 'utf8')

describe('the payment card example', () => {
  it('checks each card field when the shopper leaves it, since it has no submit button to check them on', () => {
    const fields = [...example.matchAll(/<Field name="(\w+)"[^>]*>/g)].filter(([tag]) => tag.includes('required'))
    expect(fields.map(([, name]) => name)).toEqual(['number', 'expiry', 'cvc'])
    for (const [tag] of fields) expect(tag).toContain('validation-mode="onBlur"')
  })
})
