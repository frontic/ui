import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { forwardedPropsProblems } from '@frontic/library-contract/forwarded-props'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '../..')
const files = execFileSync('git', ['ls-files', 'ui', 'sections', 'templates'], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .filter((file) => file.endsWith('.vue'))

describe('every item', () => {
  it('forwards props through useForwardProps', () => {
    expect(files.flatMap((file) => forwardedPropsProblems(readFileSync(join(root, file), 'utf8'), file)).map((p) => `${p.file}:${p.line} ${p.part} v-bind="${p.binding}"`)).toEqual([])
  })
})
