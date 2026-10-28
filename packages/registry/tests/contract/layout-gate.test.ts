import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { layoutGate } from '@frontic/library-contract/layout-gate'
import { classTokens } from '@frontic/library-contract/components'
import { describe, expect, it } from 'vitest'
import { TEMPLATE_LAYOUT } from '../../scripts/lib/template-layout'

const root = join(import.meta.dirname, '../..')
const files = execFileSync('git', ['ls-files', 'ui', 'sections', 'templates'], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .filter((file) => file.endsWith('.vue'))
const texts = new Map(files.map((file) => [file, readFileSync(join(root, file), 'utf8')]))
const findings = files.flatMap((file) => layoutGate(texts.get(file)!, file))

/** On: a layout utility beside props.class fails the contract unless TEMPLATE_LAYOUT keeps it. */
const ENFORCED = true

describe('the layout gate over the registry', () => {
  it('finds no layout utility beside props.class but the ones TEMPLATE_LAYOUT keeps', () => {
    const held = findings.filter((f) => !Object.hasOwn(TEMPLATE_LAYOUT[f.file] ?? {}, f.utility))
    console.info(`layout gate: ${held.length} utilities in ${new Set(held.map((f) => f.file)).size} files, ${findings.length - held.length} kept`)
    expect(ENFORCED ? held : []).toEqual([])
  })

  it('keeps only utilities the file still carries', () => {
    const stale = Object.entries(TEMPLATE_LAYOUT).flatMap(([file, kept]) => {
      const tokens = new Set(texts.has(file) ? classTokens(texts.get(file)!) : [])
      return Object.keys(kept)
        .filter((utility) => !tokens.has(utility))
        .map((utility) => `${file}: ${utility}`)
    })
    expect(stale).toEqual([])
  })
})
