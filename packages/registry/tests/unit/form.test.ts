// @vitest-environment happy-dom
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { z } from 'zod'
import { Field, FieldError } from '../../ui/field'
import { Form } from '../../ui/form'
import FormDemo from '../../ui/form/form.example.vue'
import Input from '../../ui/input/Input.vue'
import { readRegistryRecipes } from '../../scripts/lib/recipes'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
  await nextTick()
}
afterEach(() => app?.unmount())

const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}
const submit = async () => {
  const event = new Event('submit', { cancelable: true, bubbles: true })
  document.querySelector('form')!.dispatchEvent(event)
  await settle()
  return event
}
const type = async (name: string, value: string) => {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await settle()
}
const errors = () => [...document.querySelectorAll('[data-slot="field-error"]')].map((node) => node.textContent?.trim())

const named = (name: string, extra: Record<string, unknown> = {}) => h(Field, { name, ...extra }, () => [h(Input), h(FieldError)])

describe('a Form with a schema', () => {
  it('shows each field its own schema messages on submit and keeps the values back', async () => {
    const onFormSubmit = vi.fn()
    await mount(() => h(FormDemo, { onFormSubmit }))
    const event = await submit()
    expect(errors()).toEqual(['Enter the name for the parcel.', 'Enter a full email address, like you@example.com.', 'Enter a five-digit postcode.', 'Choose how we deliver the parcel.'])
    expect(event.defaultPrevented).toBe(true)
  })

  it('hands over the values once they pass', async () => {
    const onFormSubmit = vi.fn()
    const schema = z.object({ name: z.string().min(1, 'Name it.') })
    await mount(() => h(Form, { schema, onFormSubmit }, () => named('name')))
    await type('name', 'Anna')
    await submit()
    expect(errors()).toEqual([])
    expect(onFormSubmit).toHaveBeenCalledWith({ name: 'Anna' }, expect.anything())
  })

  it("lets a field's own validate win over the schema", async () => {
    const schema = z.object({ name: z.string().min(1, 'From the schema.') })
    await mount(() => h(Form, { schema }, () => named('name', { validate: () => 'From the field.' })))
    await submit()
    expect(errors()).toEqual(['From the field.'])
  })

  it('checks across fields, since the schema sees every value', async () => {
    const schema = z.object({ email: z.string(), repeat: z.string() }).refine((v) => v.email === v.repeat, { path: ['repeat'], message: 'The emails differ.' })
    await mount(() => h(Form, { schema }, () => [named('email'), named('repeat')]))
    await type('email', 'anna@example.com')
    await type('repeat', 'anna@example.org')
    await submit()
    expect(errors()).toEqual(['The emails differ.'])
  })

  it('shows a nested issue on the field with its dotted name', async () => {
    const schema = z.object({ address: z.object({ city: z.string().min(1, 'Enter the city.') }) })
    await mount(() => h(Form, { schema }, () => named('address.city')))
    await submit()
    expect(errors()).toEqual(['Enter the city.'])
  })

  it('holds the submit back on an issue no field shows, and hands its message to the slot', async () => {
    const onFormSubmit = vi.fn()
    const schema = z.object({ email: z.string(), repeat: z.string() }).refine((v) => v.email === v.repeat, 'The emails differ.')
    await mount(() => h(Form, { schema, onFormSubmit }, { default: ({ errors: unshown }: { errors: string[] }) => [named('email'), named('repeat'), h(FieldError, { errors: unshown })] }))
    await type('email', 'anna@example.com')
    await type('repeat', 'anna@example.org')
    await submit()
    expect(onFormSubmit).not.toHaveBeenCalled()
    expect(errors()).toEqual(['The emails differ.'])

    await type('repeat', 'anna@example.com')
    await submit()
    expect(onFormSubmit).toHaveBeenCalledWith({ email: 'anna@example.com', repeat: 'anna@example.com' }, expect.anything())
    expect(errors()).toEqual([])
  })
})

describe('a Form with a schema and no formSubmit listener', () => {
  it('holds the browser back on an issue no field shows, then submits natively with the button that sent it', async () => {
    const send = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function (this: HTMLFormElement) {
      sent.push(Object.fromEntries(new FormData(this)))
    })
    const sent: Record<string, FormDataEntryValue>[] = []
    const schema = z.object({ email: z.string(), repeat: z.string() }).refine((v) => v.email === v.repeat, 'The emails differ.')
    await mount(() =>
      h(
        Form,
        { schema },
        {
          default: ({ errors: unshown }: { errors: string[] }) => [named('email'), named('repeat'), h(FieldError, { errors: unshown }), h('button', { type: 'submit', name: 'intent', value: 'save' })],
        },
      ),
    )
    await type('email', 'anna@example.com')
    await type('repeat', 'anna@example.org')
    expect((await submit()).defaultPrevented).toBe(true)
    expect(send).not.toHaveBeenCalled()
    expect(errors()).toEqual(['The emails differ.'])

    await type('repeat', 'anna@example.com')
    const event = new SubmitEvent('submit', { cancelable: true, bubbles: true, submitter: document.querySelector('button') })
    document.querySelector('form')!.dispatchEvent(event)
    await settle()
    expect(errors()).toEqual([])
    expect(sent).toEqual([{ email: 'anna@example.com', repeat: 'anna@example.com', intent: 'save' }])
    expect(document.querySelectorAll('input[name="intent"]')).toHaveLength(0)
    send.mockRestore()
  })
})

describe('a Form with a schema whose submit the consumer handles', () => {
  const schema = z.object({ name: z.string() })

  it('stays on the page when the submit handler prevented the default', async () => {
    const send = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
    const onSubmit = vi.fn((event: Event) => event.preventDefault())
    await mount(() => h(Form, { schema, onSubmit }, () => named('name')))
    await submit()
    expect(onSubmit).toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
    send.mockRestore()
  })

  it("sends to the button's own action, method, encoding and target, and puts the form's back", async () => {
    const seen: Record<string, string | null>[] = []
    const send = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function (this: HTMLFormElement) {
      seen.push(Object.fromEntries(['action', 'method', 'enctype', 'target'].map((name) => [name, this.getAttribute(name)])))
    })
    await mount(() =>
      h(Form, { schema, action: '/save', method: 'post' }, () => [
        named('name'),
        h('button', { type: 'submit', formaction: '/delete', formmethod: 'get', formenctype: 'text/plain', formtarget: '_blank' }),
      ]),
    )
    document.querySelector('form')!.dispatchEvent(new SubmitEvent('submit', { cancelable: true, bubbles: true, submitter: document.querySelector('button') }))
    await settle()
    expect(seen).toEqual([{ action: '/delete', method: 'get', enctype: 'text/plain', target: '_blank' }])
    const form = document.querySelector('form')!
    expect([form.getAttribute('action'), form.getAttribute('method'), form.getAttribute('enctype'), form.getAttribute('target')]).toEqual(['/save', 'post', null, null])
    send.mockRestore()
  })
})

describe('a Form', () => {
  it('lets the browser submit when nobody listens to formSubmit', async () => {
    await mount(() => h(Form, null, () => named('name')))
    expect((await submit()).defaultPrevented).toBe(false)
  })

  it('shows a server error on the field it names', async () => {
    await mount(() => h(Form, { errors: { postcode: "We don't ship to this postcode yet." } }, () => named('postcode')))
    await settle()
    expect(errors()).toEqual(["We don't ship to this postcode yet."])
  })
})

describe('a Form in a flex column', () => {
  // Its field groups are size containers with no width of their own, so a form sized to its content shrinks to its button.
  it('takes the width it sits in', async () => {
    await mount(() => h(Form))
    expect(document.querySelector('form')!.classList.contains('fui-form')).toBe(true)
    expect(readRegistryRecipes(join(import.meta.dirname, '../..')).trees.form!.base).toMatchObject({ width: 'full' })
  })
})
