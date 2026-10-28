import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const rootOf = (name: string) => readFileSync(join(import.meta.dirname, `../../ui/${name}/${name}.example.vue`), 'utf8').match(/<template>\s*(<[^>]*>)/)![1]!

// A field is as wide as its parent: an example rooted in one fills its card and sits at the left of it, however little it shows.
describe('an example rooted in a field', () => {
  it.each(['combobox', 'radio-group', 'rating-input', 'input-otp'])('%s sizes its field to its content, so a card centres it', (name) => {
    const classes =
      rootOf(name)
        .match(/class="([^"]*)"/)?.[1]
        ?.split(' ') ?? []
    expect(rootOf(name)).toMatch(/^<Field\b/)
    expect(classes).toEqual(expect.arrayContaining(['w-fit', 'max-w-full']))
  })
})
