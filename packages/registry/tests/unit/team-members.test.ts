// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { TeamMembers } from '../../sections/team-members'

let app: ReturnType<typeof createApp> | undefined
const mount = async (props: Record<string, unknown> = {}) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({
    render: () =>
      h(TeamMembers, {
        roles: [
          { value: 'owner', label: 'Owner' },
          { value: 'editor', label: 'Editor' },
        ],
        ...props,
      }),
  })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

describe('team members', () => {
  it('names the card in a heading and keeps the seat count beside it at every width', async () => {
    await mount({ seats: '5 of 10 seats' })
    expect(document.querySelector('h3[data-slot=card-title]')!.textContent).toBe('Team')
    expect([...document.querySelector('[data-slot=card-action]')!.classList]).toEqual(expect.arrayContaining(['col-start-2', 'row-start-1']))
  })
})
