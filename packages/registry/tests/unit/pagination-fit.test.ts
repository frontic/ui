// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Pagination, PaginationContent, PaginationFirst, PaginationLast, PaginationNext, PaginationPrevious } from '../../ui/pagination'

const render = async (attrs: Record<string, unknown> = {}) => {
  const host = document.createElement('div')
  host.innerHTML = await renderToString(
    h(Pagination, { total: 100, itemsPerPage: 10, ...attrs }, () => h(PaginationContent, null, () => [h(PaginationFirst), h(PaginationPrevious), h(PaginationNext), h(PaginationLast)])),
  )
  return host
}

describe('a Pagination', () => {
  it('names its navigation landmark, and lets the page rename it', async () => {
    expect((await render()).querySelector('nav')!.getAttribute('aria-label')).toBe('Pagination')
    expect((await render({ 'aria-label': 'Search results pages' })).querySelector('nav')!.getAttribute('aria-label')).toBe('Search results pages')
    // A prop, as Previous and Next take theirs, so a project's check finds no raw text in it.
    expect((await render({ label: 'Seiten' })).querySelector('nav')!.getAttribute('aria-label')).toBe('Seiten')
  })

  it('shows the First, Previous, Next and Last words only where a full row of pages still fits beside them', async () => {
    const words = [...(await render()).querySelectorAll('button span')].map((span) => span.className)
    expect(words).toEqual(Array(4).fill('hidden @2xl/pagination:block'))
  })

  it('shows no sibling pages in its example, so the row with First and Last fits a phone', () => {
    const example = readFileSync(join(import.meta.dirname, '../../ui/pagination/pagination.example.vue'), 'utf8')
    expect(example).toContain(':sibling-count="0"')
  })
})
