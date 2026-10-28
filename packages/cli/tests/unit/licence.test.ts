import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const cli = join(import.meta.dirname, '../..')
const read = (file: string) => readFileSync(join(cli, file), 'utf8')

describe('the CLI’s licence', () => {
  it('is FSL-1.1-MIT, Frontic’s, and names shadcn-vue’s MIT notice for the code it took from it', () => {
    expect(JSON.parse(read('package.json')).license).toBe('FSL-1.1-MIT')
    expect(read('LICENSE')).toMatch(/^# Functional Source License, Version 1\.1, MIT Future License\n/)
    expect(read('LICENSE')).toContain('Copyright 2026 frontstack GmbH DBA Frontic')
    expect(read('THIRD-PARTY-NOTICES.md')).toContain('Copyright (c) 2023 unovue')
    expect(read('THIRD-PARTY-NOTICES.md')).toContain('VENDOR.md')
  })

  // npm pack runs in a child process; 5 s is not enough on a loaded runner.
  it('ships the licence and the notice in the package', { timeout: 30_000 }, () => {
    // npm 11 prints a list of packages, npm 12 an object keyed by package name.
    const packed = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: cli, encoding: 'utf8' }))
    const [pack] = Array.isArray(packed) ? packed : Object.values(packed)
    const files = pack.files.map((file: { path: string }) => file.path)
    expect(files).toContain('LICENSE')
    expect(files).toContain('THIRD-PARTY-NOTICES.md')
  })
})
