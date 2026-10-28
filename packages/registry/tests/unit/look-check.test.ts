import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ownLook } from '../../scripts/lib/look'
import { lookVerdict, OPTIONS } from '../../scripts/lib/snapshot-run'

const root = join(import.meta.dirname, '../..')

describe('look against the snapshots', { timeout: 60_000 }, () => {
  it('reports a missing snapshot, writes it, then finds nothing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'look-'))
    expect(await lookVerdict(root, ['badge'], false, dir)).toEqual({ changed: [], missing: ['badge'], stale: [] })
    expect(await lookVerdict(root, ['badge'], true, dir)).toEqual({ changed: [], missing: [], stale: [] })
    expect(await lookVerdict(root, ['badge'], false, dir)).toEqual({ changed: [], missing: [], stale: [] })
  })
  it('names the line that changed', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'look-'))
    await lookVerdict(root, ['badge'], true, dir)
    const file = join(dir, 'badge.txt')
    const [first, ...rest] = readFileSync(file, 'utf8').split('\n')
    writeFileSync(file, [`${first} changed`, ...rest].join('\n'))
    expect(await lookVerdict(root, ['badge'], false, dir)).toEqual({ changed: [{ item: 'badge', removed: [`${first} changed`], added: [first] }], missing: [], stale: [] })
  })
  it('reports a snapshot no served item has on a full run, and leaves it alone on a run that names items', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'look-'))
    writeFileSync(join(dir, 'ghost.txt'), 'ghost | E | color: red\n')
    expect((await lookVerdict(root, ['badge'], true, dir)).stale).toEqual([])
    expect((await lookVerdict(root, [], false, dir, ['badge'])).stale).toEqual(['ghost'])
  })
  it('deletes a snapshot no served item has on a full write', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'look-'))
    writeFileSync(join(dir, 'ghost.txt'), 'ghost | E | color: red\n')
    expect((await lookVerdict(root, [], true, dir, ['badge'])).stale).toEqual([])
    expect(existsSync(join(dir, 'ghost.txt'))).toBe(false)
  })
  it('resolves a field label and title at every layout, none guessed from literals', async () => {
    const look = await ownLook(root, 'field', OPTIONS.field)
    expect(look.approximate.filter((e) => /label|title/.test(e))).toEqual([])
    expect(new Set(look.elements.get('field-label')!.combos.map((c) => c.layout))).toEqual(new Set(['default', 'card', 'beside']))
  })
})
