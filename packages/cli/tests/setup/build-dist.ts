import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const cli = join(import.meta.dirname, '../..')

/** Builds dist/ once per vitest run; the bundle and e2e tests read it and must not rebuild it under each other.
 * The e2e tests also serve the registry's built `public/v1`, which is not tracked, so a checkout without one builds it first. */
export default function setup() {
  execFileSync('pnpm', ['exec', 'tsdown'], { cwd: cli, stdio: 'pipe' })
  if (!existsSync(join(cli, '../registry/public/v1/index.json'))) {
    execFileSync('pnpm', ['--filter', '@frontic/registry', 'build'], { cwd: cli, stdio: 'pipe' })
  }
}
