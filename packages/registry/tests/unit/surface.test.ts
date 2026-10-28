import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '../..')
const pascal = (item: string) => item.replace(/(?:^|-)(\w)/g, (_, c: string) => c.toUpperCase())

/** Each section's and template's main file: its path, component name and lines. */
const items = () =>
  ['sections', 'templates'].flatMap((tier) =>
    readdirSync(join(root, tier)).map((item) => {
      const file = join(tier, item, `${pascal(item)}.vue`)
      return { file, name: pascal(item), lines: readFileSync(join(root, file), 'utf8').split('\n') }
    }),
  )

const rootTag = (lines: string[]) => lines.find((line) => /^ {2}<\w/.test(line)) ?? ''
const cardRooted = () => items().filter(({ lines }) => /^ {2}<Card[\s>]/.test(rootTag(lines)))

/** The opening tag starting at line `i`, joined over the lines up to its `>`. */
const openingTag = (lines: string[], i: number) => {
  const end = lines.findIndex((line, k) => k >= i && /[^-]>$/.test(line.trimEnd()))
  return lines.slice(i, end + 1).join(' ')
}

describe('a Card-rooted section', () => {
  it('declares a surface prop, raised by default, and hands it to its Card', () => {
    const sections = cardRooted()
    expect(sections.length).toBeGreaterThan(0)
    expect(sections.filter(({ lines }) => !lines.some((line) => /^\s+surface\?: 'raised' \| 'bare'$/.test(line))).map(({ file }) => file)).toEqual([])
    expect(sections.filter(({ lines }) => !lines.some((line) => /^\s+surface: 'raised',$/.test(line))).map(({ file }) => file)).toEqual([])
    expect(sections.filter(({ lines }) => !/\s:surface="(?:props\.)?surface"/.test(rootTag(lines))).map(({ file, lines }) => `${file}: ${rootTag(lines).trim()}`)).toEqual([])
  })
})

describe('a Card-rooted section placed inside a Card', () => {
  it('is bare, so it sits flush in the surface around it', () => {
    const names = new Set(cardRooted().map(({ name }) => name))
    const raised: string[] = []
    for (const { file, lines } of items()) {
      lines.forEach((line, i) => {
        const tag = /^(\s*)<(\w+)[\s>]/.exec(line)
        if (!tag || !names.has(tag[2]!)) return
        let indent = tag[1]!.length
        const ancestors: string[] = []
        for (let j = i - 1; j >= 0; j--) {
          const above = /^(\s*)<(\w+)/.exec(lines[j]!)
          if (above && above[1]!.length < indent) {
            ancestors.push(above[2]!)
            indent = above[1]!.length
          }
        }
        if (ancestors.some((name) => name === 'Card' || name === 'CardContent') && !/\ssurface="bare"/.test(openingTag(lines, i))) raised.push(`${file}:${i + 1}: <${tag[2]}`)
      })
    }
    expect(raised).toEqual([])
  })
})
