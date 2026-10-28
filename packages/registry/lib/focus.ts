// SPDX-License-Identifier: FSL-1.1-MIT
import { defaultWindow } from '@vueuse/core'
import { watch } from 'vue'

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
 */
export function useReturnFocus(
  trigger: () => HTMLElement | undefined,
  options: { counts?: (event: OutsideEvent) => boolean; when?: () => boolean; defer?: boolean; open?: () => boolean; keptMounted?: () => boolean } = {},
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
          if (ahead === 'back' && !keyboard) focusWithoutRing(trigger())
        }
      },
      { flush: 'post' },
    )
  return {
    onInteractOutside(event: OutsideEvent) {
      if (!event.defaultPrevented && options.counts?.(event)) interacted = true
    },
    onCloseAutoFocus(event: Event) {
      const decided = ahead ?? verdict()
      if (event.defaultPrevented) return
      // Reka's non-modal content forgets the outside interaction once its own exit is over, which comes before the frame's.
      if (decided === 'stays') return event.preventDefault()
      if (keyboard || decided === 'reka') return
      event.preventDefault()
      const target = trigger()
      if (options.defer) setTimeout(() => focusWithoutRing(target), 0)
      else focusWithoutRing(target)
    },
  }
}
