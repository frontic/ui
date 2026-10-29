import type { Ref } from 'vue'
import { nextTick, onMounted, watch } from 'vue'
import { digitsOf } from './card'

/**
 * Shows the formatted text in place of what was typed, keeping the caret behind the digit it followed.
 * Input keeps its own copy of the value, so it is handed the typed text first: else a keystroke the formatting drops, such as a letter, would stay on screen.
 */
export async function retype(display: Ref<string>, input: HTMLInputElement | null | undefined, raw: string, formatted: string) {
  const caret = input?.selectionStart ?? raw.length
  const atEnd = caret >= raw.length
  const before = digitsOf(raw.slice(0, caret)).length
  display.value = raw
  await nextTick()
  display.value = formatted
  await nextTick()
  if (!input || document.activeElement !== input) return
  let position = formatted.length
  if (!atEnd) {
    let seen = 0
    position = [...formatted].findIndex((char) => /\d/.test(char) && ++seen > before)
    if (position === -1) position = formatted.length
  }
  input.setSelectionRange(position, position)
}

/** Keeps the input's own validity message in step with what is wrong with its value, so a Field around it shows the message. */
export function useValidityMessage(input: () => HTMLInputElement | null | undefined, message: Ref<string>) {
  const apply = () => input()?.setCustomValidity(message.value)
  watch(message, apply, { flush: 'sync' })
  onMounted(apply)
  return apply
}
