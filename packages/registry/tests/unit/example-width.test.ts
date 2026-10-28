import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { EXAMPLE_WIDTH, exampleUsage } from '@frontic/registry-client/api'
import { servedItems } from '../../scripts/build'
import type { ServedItem } from '../../scripts/lib/served'

const root = join(import.meta.dirname, '../..')
let served: ServedItem[]

beforeAll(async () => {
  served = await servedItems(root)
}, 120_000)

/** A line that is one string the formatter cannot break: a quoted literal, maybe a property's or the last in a list, an attribute's value, maybe closing its tag, or a comment ending in a URL. */
const UNBREAKABLE = [/^(?:[\w$]+: )?'[^']*',?$/, /^(?:[\w$]+: )?`[^`]*`,?$/, /^(?:[:@]?[\w.-]+=)?"[^"]*"(?: ?\/?>)?$/, /^(?:<!--|\/\/) .* https:\/\/\S+(?: -->)?$/]

/** Each line of `text` over the example width that is more than one unbreakable string, as `path:line: text`. */
const overflow = (path: string, text: string) =>
  text.split('\n').flatMap((line, i) => (line.length > EXAMPLE_WIDTH && !UNBREAKABLE.some((re) => re.test(line.trim())) ? [`${path}:${i + 1}: ${line}`] : []))

describe('example code', () => {
  it('fits the docs code pane as served: no line over 80 columns but a single string', () => {
    const examples = served.flatMap((item) => item.files.filter((file) => file.type === 'registry:example'))
    expect(examples.length).toBeGreaterThan(100)
    expect(examples.flatMap((file) => overflow(file.path, file.content))).toEqual([])
  })

  it('fits it as the Code pane and the markdown show it, imported from the install aliases', () => {
    const examples = served.flatMap((item) => item.files.filter((file) => file.type === 'registry:example'))
    expect(examples.flatMap((file) => overflow(file.path, exampleUsage(file.path, file.content)))).toEqual([])
  })

  it('counts a long string as unbreakable and long code as overflow', () => {
    const url = `'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/frost-escape-parka.jpg',`
    expect(overflow('a', `    ${url}`)).toEqual([])
    expect(overflow('a', `  src="${'x'.repeat(90)}"`)).toEqual([])
    expect(overflow('a', `  class="${'x'.repeat(90)}" />`)).toEqual([])
    expect(overflow('a', `const a = ${url}`)).toHaveLength(1)
    expect(overflow('a', `  <Badge variant="new" class="gap-2">${'x'.repeat(80)}</Badge>`)).toHaveLength(1)
    expect(overflow('a', '<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->')).toEqual([])
    expect(overflow('a', `<!-- ${'x'.repeat(90)} -->`)).toHaveLength(1)
  })
})
