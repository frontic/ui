// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useReturnFocus } from '../../lib/focus'

const scope = effectScope()
afterEach(() => (document.body.innerHTML = ''))

const outside = () =>
  new CustomEvent('interact-outside', { cancelable: true, detail: { originalEvent: new PointerEvent('pointerdown') } }) as Parameters<ReturnType<typeof useReturnFocus>['onInteractOutside']>[0]
const closeAutoFocus = () => new Event('close-auto-focus', { cancelable: true })

describe('the return of focus of a dialog Reka keeps mounted', () => {
  it('forgets what a close decided once the dialog opens again, so a later close Reka unmounts decides afresh', async () => {
    dispatchEvent(new Event('pointerdown'))
    document.body.innerHTML = '<button id="trigger">Open</button>'
    const trigger = document.getElementById('trigger')!
    const open = ref(true)
    const keptMounted = ref(true)
    const returnFocus = scope.run(() => useReturnFocus(() => trigger, { counts: () => true, open: () => open.value, keptMounted: () => keptMounted.value }))!
    // Closed by an outside click with no close-auto-focus after it, as when the content unmounts before Reka asks.
    returnFocus.onInteractOutside(outside())
    open.value = false
    await nextTick()
    open.value = true
    await nextTick()
    keptMounted.value = false
    open.value = false
    await nextTick()
    const event = closeAutoFocus()
    returnFocus.onCloseAutoFocus(event)
    expect([event.defaultPrevented, document.activeElement]).toEqual([true, trigger])
  })

  it('keeps focus where an outside click took it, also when Reka asks after its own exit', async () => {
    dispatchEvent(new Event('pointerdown'))
    document.body.innerHTML = '<button id="trigger">Open</button><input id="search">'
    const trigger = document.getElementById('trigger')!
    const open = ref(true)
    const returnFocus = scope.run(() => useReturnFocus(() => trigger, { counts: () => true, open: () => open.value, keptMounted: () => true }))!
    returnFocus.onInteractOutside(outside())
    document.getElementById('search')!.focus()
    open.value = false
    await nextTick()
    const event = closeAutoFocus()
    returnFocus.onCloseAutoFocus(event)
    expect([event.defaultPrevented, document.activeElement?.id]).toEqual([true, 'search'])
  })
})
