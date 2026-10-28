import type { Ref } from 'vue'
import { injectFieldRootContext } from 'reka-ui'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export interface FieldControlOptions<Forwarded extends object = Record<string, unknown>> {
  props: { modelValue?: unknown; defaultValue?: unknown; name?: string; disabled?: boolean; required?: boolean }
  /** The props and listeners the control forwards to its Reka root. */
  forwarded: Ref<Forwarded>
  /** The control's root, for focus that moves inside it. */
  root?: Readonly<Ref<{ $el: HTMLElement } | null>>
  /** The element the Field focuses when its label is clicked or validation fails. */
  element: (root: HTMLElement | undefined) => HTMLElement | null | undefined
  /** The id the control is given; the Field's id when it returns undefined. Left out, the control takes no id. */
  id?: () => string | undefined
  /** `focusin` for a group, whose focus moves between its items; `focus` for a single element; `none` when the control reports focus itself. */
  focus?: 'focusin' | 'focus' | 'none'
  /** `root` names and describes the root; `none` when the control puts aria elsewhere. */
  aria?: 'root' | 'none'
  /** Whether the root carries the Field's data attributes. */
  state?: boolean
  /** The value the Field validates, from the control's model value. */
  normalize?: (value: unknown) => unknown
  isFilled?: (value: unknown) => boolean
}

/** Joins a control to the Field around it, as Reka's TagGroup does: the props to bind on its root and the listener for its changes. */
export function useFieldControl<Forwarded extends object>(options: FieldControlOptions<Forwarded>) {
  const { props, forwarded, root, focus = 'focusin', aria = 'root', state = true, normalize = (value) => value ?? undefined } = options
  const field = injectFieldRootContext(null)
  const value = ref(normalize(props.modelValue ?? props.defaultValue))
  const id = options.id && (() => options.id!() ?? field?.fieldId.value)

  const focusListeners = () => {
    if (!field || focus === 'none') return {}
    if (focus === 'focusin')
      return {
        onFocusin: () => field.handleControlFocus(),
        onFocusout: (event: FocusEvent) => !root?.value?.$el.contains(event.relatedTarget as Node | null) && field.handleControlBlur(),
      }
    const own = forwarded.value as { onFocus?: (event: FocusEvent) => void; onBlur?: (event: FocusEvent) => void }
    return {
      onFocus: (event: FocusEvent) => {
        field.handleControlFocus()
        own.onFocus?.(event)
      },
      onBlur: (event: FocusEvent) => {
        field.handleControlBlur()
        own.onBlur?.(event)
      },
    }
  }

  const joined = computed<Forwarded & Record<string, unknown>>(() =>
    field
      ? {
          ...(state ? field.dataAttributes.value : {}),
          ...forwarded.value,
          ...(id ? { id: id() } : {}),
          name: props.name ?? field.name.value,
          disabled: props.disabled || field.disabled.value,
          required: props.required || field.required.value,
          ...(aria === 'root'
            ? {
                'aria-labelledby': field.labelId.value,
                'aria-describedby': field.describedBy.value,
                'aria-invalid': (field.invalid.value && !field.disabled.value) || undefined,
              }
            : {}),
          ...focusListeners(),
        }
      : (forwarded.value as Forwarded & Record<string, unknown>),
  )

  function sync(next: unknown) {
    value.value = normalize(next)
    field?.handleControlInput({ value: value.value })
  }
  // A controlled value arrives through the watcher once the parent takes it.
  const report = (next: unknown) => props.modelValue === undefined && sync(next)
  watch(
    () => props.modelValue,
    (next) => normalize(next) !== value.value && sync(next),
  )

  let unregister: (() => void) | undefined
  onMounted(() => {
    unregister = field?.registerControl({
      ...(id ? { id } : {}),
      element: () => options.element(root?.value?.$el) ?? undefined,
      getValue: () => value.value,
      isFilled: options.isFilled,
      required: () => !!props.required,
    })
  })
  onBeforeUnmount(() => unregister?.())

  return { joined, report, field }
}

/** A group's picked item among its enabled ones, else its first: where the Field sends focus. */
export function pickedItem(root: HTMLElement | undefined, selector: string, picked: (item: HTMLElement) => boolean) {
  const items = [...(root?.querySelectorAll<HTMLElement>(`${selector}:not(:disabled)`) ?? [])]
  return items.find(picked) ?? items[0]
}

/** A radio group's checked radio, else its first. */
export const checkedRadio = (root: HTMLElement | undefined) => pickedItem(root, '[role=radio]', (item) => item.getAttribute('aria-checked') === 'true')
