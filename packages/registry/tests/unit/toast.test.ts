// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Toast, toast, Toaster } from '../../ui/toast'
import ToastDemo from '../../ui/toast/toast.example.vue'

let app: ReturnType<typeof createApp> | undefined
const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 20))
    await nextTick()
  }
}
const mount = async (component: Parameters<typeof createApp>[0]) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp(component)
  app.mount('#app')
  await settle()
}
afterEach(() => {
  toast.dismiss()
  app?.unmount()
})

describe('the toast item', () => {
  it('exports Toast to mount, Toaster as its shadcn name, and toast() to call, from one place', () => {
    expect(Toaster).toBe(Toast)
    expect(typeof toast.success).toBe('function')
  })

  it('brings vue-sonner’s stylesheet, which pins the toasts to a screen corner and slides them in', () => {
    expect(readFileSync(join(import.meta.dirname, '../../ui/toast/Toast.vue'), 'utf8')).toMatch(/<style>\s*@import 'vue-sonner\/style\.css';/)
  })

  it('dresses a toast’s action in the house action look', async () => {
    await mount({ render: () => h(Toast) })
    toast('Removed from cart', { action: { label: 'Undo', onClick: () => {} } })
    await settle()
    const item = document.querySelector<HTMLElement>('[data-sonner-toast]')!
    expect(item.className.split(' ')).toContain('fui-toast')
    expect(item.querySelector('.fui-toast-action')!.textContent).toBe('Undo')
    expect(item.innerHTML).not.toMatch(/sonner-|size-4/)
  })
})

describe('the toast demo', () => {
  it('confirms an add to cart with the cart line that was added and a way to the cart', async () => {
    await mount(ToastDemo)
    document.querySelector<HTMLElement>('[data-slot="button"]')!.click()
    await settle()
    const item = document.querySelector<HTMLElement>('[data-sonner-toast]')!
    expect(item.className.split(' ')).toEqual(expect.arrayContaining(['fui-toast', 'fui-toast-positive']))
    expect(item.querySelector('.fui-toast-title')!.textContent).toBe('Added to cart')
    const line = item.querySelector('.fui-toast-description [data-slot="item"]')!
    expect(line.querySelector('img')!.getAttribute('src')).toContain('polar-light-ski-jacket')
    expect(line.querySelector('[data-slot="item-title"]')!.textContent).toBe('Polar Light Ski Jacket')
    expect(line.querySelector('[data-slot="item-description"]')!.textContent).toBe('Dusty pink · M')
    expect(line.textContent).toContain('€79.00')
    expect(item.querySelector<HTMLAnchorElement>('a[href="#cart"]')!.textContent!.trim()).toBe('View cart')
    item.querySelector<HTMLAnchorElement>('a[href="#cart"]')!.click()
    await settle()
    expect(document.querySelector('[data-sonner-toast]')?.getAttribute('data-removed')).not.toBe('false')
  })
})
