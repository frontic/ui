// @vitest-environment happy-dom
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { readRegistryRecipes } from '../../scripts/lib/recipes'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '../../ui/avatar'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
const sizes = (slot: string) => [...document.querySelectorAll(`[data-slot="${slot}"]`)].map((el) => el.getAttribute('data-size'))
afterEach(() => app?.unmount())

describe('an AvatarGroup', () => {
  it('sizes its avatars, their fallbacks and its count, unless one sets its own', async () => {
    await mount(() =>
      h(AvatarGroup, { size: 'lg' }, () => [
        h(Avatar, null, () => h(AvatarFallback, null, () => 'LB')),
        h(Avatar, { size: 'sm' }, () => h(AvatarFallback, null, () => 'SM')),
        h(AvatarGroupCount, null, () => '+3'),
      ]),
    )
    expect(sizes('avatar')).toEqual(['lg', 'sm'])
    expect(sizes('avatar-group-count')).toEqual(['lg'])
    const fallbacks = [...document.querySelectorAll('[data-slot="avatar-fallback"]')]
    expect(fallbacks[0]!.classList.contains('fui-avatar-fallback-lg')).toBe(true)
    expect(fallbacks[1]!.classList.contains('fui-avatar-fallback-sm')).toBe(true)
    expect(document.querySelector('.fui-avatar-group-count-lg')).not.toBeNull()
  })

  it('leaves md to avatars when it sets no size, and rings only grouped ones', async () => {
    await mount(() => [h(AvatarGroup, null, () => [h(Avatar), h(AvatarGroupCount)]), h(Avatar)])
    expect(sizes('avatar')).toEqual(['md', 'md'])
    expect(sizes('avatar-group-count')).toEqual(['md'])
    expect([...document.querySelectorAll('[data-slot="avatar"]')].map((el) => el.classList.contains('fui-avatar-ring'))).toEqual([true, false])
  })
})

describe('an AvatarGroupCount', () => {
  it('reads at its neighbouring fallback’s text style in every size', () => {
    const { trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))
    const text = (name: string) => {
      const sizes = trees[name]!.variants!.size as Record<string, { typography?: string; fontWeight?: string }>
      return Object.fromEntries(Object.entries(sizes).map(([size, value]) => [size, [value.typography, value.fontWeight]]))
    }
    expect(text('avatar-group-count')).toEqual(text('avatar-fallback'))
  })
})
