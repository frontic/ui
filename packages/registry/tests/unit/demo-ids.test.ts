import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '../..')
const demos = ['ui', 'sections', 'templates'].flatMap((tier) =>
  readdirSync(join(root, tier)).flatMap((item) =>
    readdirSync(join(root, tier, item))
      .filter((file) => file.endsWith('.example.vue'))
      .map((file) => join(tier, item, file)),
  ),
)

describe('a demo', () => {
  // The variant matrix renders a demo once per cell on one page, so a fixed id repeats and a label's `for` finds the first cell's control.
  it('takes its ids from useId, never a fixed id or for', () => {
    expect(demos.filter((demo) => /\s(?:id|for)="[^"]*"/.test(readFileSync(join(root, demo), 'utf8')))).toEqual([])
  })
})
