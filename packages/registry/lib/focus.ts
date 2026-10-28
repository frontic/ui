// SPDX-License-Identifier: FSL-1.1-MIT
import { defaultWindow } from '@vueuse/core'
import { type FunctionalComponent, h, Transition, type TransitionProps, watch } from 'vue'

let keyboard = false
defaultWindow?.addEventListener('keydown', () => (keyboard = true), { capture: true, passive: true })
defaultWindow?.addEventListener('pointerdown', () => (keyboard = false), { capture: true, passive: true })

/** Whether the last input was a key rather than a pointer, tracked from load so it holds the input that opened an overlay. */
export function usingKeyboard(): boolean {
  return keyboard
}

type OutsideEvent = CustomEvent<{ originalEvent: PointerEvent | FocusEvent }>

/** Whether a pointer press is a right click, or a control-click that opens the same menu on a Mac. */
export function isRightClick(event: PointerEvent | FocusEvent): boolean {
  return 'button' in event && (event.button === 2 || (event.button === 0 && event.ctrlKey))
}

// Focusing the element that already has focus changes nothing, its ring included.
function focusWithoutRing(target: HTMLElement | undefined) {
  if (target && target !== target.ownerDocument.activeElement) target.focus({ preventScroll: true, focusVisible: false })
}

/**
 * Gives focus back to an overlay's trigger where Reka would, but after a pointer without a focus ring: Chrome and Safari ring a script's focus until something on the page took focus from a pointer,
 * which is so for an overlay open on load and for a select, whose trigger a click never focuses. After a key, Reka's return stays, ring and all.
 * `counts` names the outside interactions after which Reka leaves focus where it went, `when` whether Reka gives focus back to the trigger at all, `defer` keeps Reka's return a task later.
 * `open` and `keptMounted` name a dialog Reka keeps mounted as it closes, which then focuses its trigger the moment it closes, outside any event that could be cancelled: the trigger is focused first, so Reka's focus changes nothing.
 * `leaves` names an overlay that leaves through a transition: focus goes back once `afterLeave` says it has left, not as it starts leaving.
 */
export function useReturnFocus(
  trigger: () => HTMLElement | undefined,
  options: { counts?: (event: OutsideEvent) => boolean; when?: () => boolean; defer?: boolean; open?: () => boolean; keptMounted?: () => boolean; leaves?: () => boolean } = {},
) {
  let interacted = false
  // `back`: focus goes to the trigger; `stays`: an outside interaction took it, so Reka must not move it; `reka`: Reka decides.
  const verdict = (): 'back' | 'stays' | 'reka' => {
    const result = interacted ? 'stays' : (options.when?.() ?? true) ? 'back' : 'reka'
    interacted = false
    return result
  }
  // What the close of a kept-mounted dialog decided, which Reka's close-auto-focus that follows it keeps.
  let ahead: ReturnType<typeof verdict> | undefined
  const { open, keptMounted } = options
  if (open && keptMounted)
    watch(
      open,
      (isOpen) => {
        if (isOpen) ahead = undefined
        else if (keptMounted()) {
          ahead = verdict()
          if (ahead === 'back' && !keyboard && !options.leaves?.()) focusWithoutRing(trigger())
        }
      },
      { flush: 'post' },
    )
  // Closed and left are both needed, in either order: Reka asks for focus a task after it closes, the transition ends when its animation does.
  let held: 'key' | 'pointer' | 'stays' | undefined
  let left = false
  const giveBack = () => {
    if (!held || !left) return
    const target = trigger()
    if (held === 'key') target?.focus({ preventScroll: true })
    else if (held === 'pointer') focusWithoutRing(target)
    held = undefined
    left = false
  }
  return {
    onInteractOutside(event: OutsideEvent) {
      if (!event.defaultPrevented && options.counts?.(event)) interacted = true
    },
    onCloseAutoFocus(event: Event) {
      const decided = ahead ?? verdict()
      // A close the caller already kept focus on is held as staying, so its afterLeave is spent on this close, not the next.
      if (options.leaves?.()) {
        if (event.defaultPrevented) held = 'stays'
        else {
          event.preventDefault()
          held = decided !== 'back' ? 'stays' : keyboard ? 'key' : 'pointer'
        }
        giveBack()
        return
      }
      if (event.defaultPrevented) return
      // Reka's non-modal content forgets the outside interaction once its own exit is over, which comes before the frame's.
      if (decided === 'stays') return event.preventDefault()
      if (keyboard || decided === 'reka') return
      event.preventDefault()
      const target = trigger()
      if (options.defer) setTimeout(() => focusWithoutRing(target), 0)
      else focusWithoutRing(target)
    },
    afterLeave() {
      left = true
      giveBack()
    },
  }
}

type Hook = ((el: Element, done: () => void) => void) | ((el: Element) => void)
const run = (hook: Hook | Hook[], el: Element, done?: () => void) => {
  for (const each of [hook].flat()) (each as (el: Element, done?: () => void) => void)(el, done)
}

// Inside Reka's dialog content, Vue calls an element's enter hooks twice per enter, in browsers too. Each of the caller's runs once until the element leaves.
const began = new WeakSet<Element>()
const ended = new WeakSet<Element>()
const entering = new WeakMap<Element, (() => void)[] | 'done'>()

function beginOnce(hook: Hook | Hook[]) {
  return (el: Element) => {
    if (began.has(el)) return
    began.add(el)
    run(hook, el)
  }
}

function endOnce(hook: Hook | Hook[]) {
  return (el: Element) => {
    if (ended.has(el)) return
    ended.add(el)
    run(hook, el)
  }
}

// Keeps the hook's arity: Vue waits for `done` only from a hook that takes it, and times a CSS transition itself otherwise.
function enterOnce(hook: Hook | Hook[]) {
  if (![hook].flat().some((each) => each.length > 1))
    return (el: Element) => {
      if (entering.has(el)) return
      entering.set(el, 'done')
      run(hook, el)
    }
  return (el: Element, done: () => void) => {
    const state = entering.get(el)
    if (state === 'done') return done()
    if (state) return void state.push(done)
    entering.set(el, [done])
    run(hook, el, () => {
      const dones = entering.get(el)
      entering.set(el, 'done')
      if (Array.isArray(dones)) for (const each of dones) each()
    })
  }
}

/** The caller's transition with each enter hook run once per enter, and `left` called once the element has left. */
function overlayHooks(transition: TransitionProps, left: () => void): TransitionProps {
  const { onBeforeEnter, onEnter, onAfterEnter, onBeforeAppear, onAppear, onAfterAppear, onBeforeLeave, onAfterLeave } = transition
  return {
    ...transition,
    onBeforeEnter: onBeforeEnter && beginOnce(onBeforeEnter),
    onEnter: onEnter && enterOnce(onEnter),
    onAfterEnter: onAfterEnter && endOnce(onAfterEnter),
    onBeforeAppear: onBeforeAppear && beginOnce(onBeforeAppear),
    onAppear: onAppear && enterOnce(onAppear),
    onAfterAppear: onAfterAppear && endOnce(onAfterAppear),
    onBeforeLeave: (el: Element) => {
      began.delete(el)
      ended.delete(el)
      entering.delete(el)
      if (onBeforeLeave) run(onBeforeLeave, el)
    },
    onAfterLeave: (el: Element) => {
      if (onAfterLeave) run(onAfterLeave, el)
      left()
    },
  }
}

/** Vue's Transition with `transition`'s props, its enter hooks run once per enter and `left` called once its child has left; without `transition`, its one child as it is. */
export const OverlayTransition: FunctionalComponent<{ transition?: TransitionProps; left: () => void }> = (props, { slots }) => {
  const [child] = slots.default?.() ?? []
  if (!props.transition) return child
  return h(Transition, overlayHooks(props.transition, props.left), () => child)
}
OverlayTransition.props = ['transition', 'left']
