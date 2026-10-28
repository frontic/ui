// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { AccountAccess } from '../../sections/account-access'

let app: ReturnType<typeof createApp> | undefined
const mount = async (props: Record<string, unknown> = {}) => {
  document.body.innerHTML = '<div id="app"></div>'
  const events: string[] = []
  app = createApp({
    render: () =>
      h(AccountAccess, {
        onDelete: () => events.push('delete'),
        onChangeEmail: (email: string) => events.push(`email:${email}`),
        onChangePassword: (password: string) => events.push(`password:${password}`),
        ...props,
      }),
  })
  app.mount('#app')
  await nextTick()
  return events
}
afterEach(() => app?.unmount())

const button = (name: string) => [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => (b.getAttribute('aria-label') ?? b.textContent!.trim()) === name)!
const settle = async () => {
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
  await nextTick()
}

describe('account access', () => {
  it('names the card in a heading', async () => {
    await mount()
    expect(document.querySelector('h3[data-slot=card-title]')!.textContent).toBe('Sign-in & security')
  })

  it('names each change button after what it changes', async () => {
    await mount({ email: 'lena@example.org', password: 'x' })
    expect([button('Change email'), button('Change password')].every(Boolean)).toBe(true)
  })

  it('keeps the email change off while the field holds the current address or nothing, and the password change off while it is empty', async () => {
    const events = await mount({ email: 'lena@example.org', currentEmail: 'lena@example.org' })
    expect(button('Change email').disabled).toBe(true)
    expect(button('Change password').disabled).toBe(true)
    const input = document.querySelector<HTMLInputElement>('input[type=email]')!
    input.value = 'lena@example.com'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    button('Change email').click()
    await nextTick()
    expect(events).toEqual(['email:lena@example.com'])
    expect(button('Change email').disabled).toBe(false)
  })

  it('follows a current address the shop loads after mount', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    const current = ref<string | undefined>(undefined)
    const email = ref('')
    app = createApp({ render: () => h(AccountAccess, { currentEmail: current.value, email: email.value }) })
    app.mount('#app')
    await nextTick()
    current.value = email.value = 'lena@example.org'
    await nextTick()
    expect(button('Change email').disabled).toBe(true)
  })

  it('asks before deleting, and deletes only on confirm', async () => {
    const events = await mount()
    button('Delete').click()
    await settle()
    expect(document.querySelector('[role=alertdialog]')!.textContent).toContain('Delete your account?')
    expect(events).toEqual([])
    button('Keep account').click()
    await settle()
    expect(events).toEqual([])
    expect(document.querySelector('[role=alertdialog]')).toBeNull()
    button('Delete').click()
    await settle()
    button('Delete account').click()
    await settle()
    expect(events).toEqual(['delete'])
  })

  it('deletes on the first click when the consumer confirms on its own', async () => {
    const events = await mount({ confirm: false })
    button('Delete').click()
    await settle()
    expect(document.querySelector('[role=alertdialog]')).toBeNull()
    expect(events).toEqual(['delete'])
  })
})
