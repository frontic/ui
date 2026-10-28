import type { InjectionKey, Ref } from 'vue'

export interface SearchContext {
  query: Ref<string>
  loading: Ref<boolean>
  submit: () => void
  /** Closes the panel, and the overlay around it, while a link navigates. */
  close: () => void
  /** Puts a query in the field and highlights its "Search for" row, as typing does. */
  run: (query: string) => void
  select: (value: unknown) => void
}

export const searchContext: InjectionKey<SearchContext> = Symbol('search')

/** Set by SearchOverlay, so SearchInput shows its Cancel button. */
export const searchOverlay: InjectionKey<{ cancelLabel: Ref<string>; close: () => void }> = Symbol('search-overlay')
