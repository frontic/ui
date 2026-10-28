import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_DIR = fileURLToPath(new URL('..', import.meta.url))

/** A content dir resolving packages from this package's node_modules, and a work dir beside it. */
export async function createContent(prefix, { baseCss = '' } = {}) {
  const ws = await mkdtemp(path.join(PACKAGE_DIR, prefix))
  const content = path.join(ws, 'content')
  await mkdir(path.join(content, 'styles'), { recursive: true })
  await symlink(path.join(PACKAGE_DIR, 'node_modules'), path.join(content, 'node_modules'))
  await writeFile(path.join(content, 'styles', 'base.css'), baseCss)
  return { ws, content, workDir: path.join(ws, 'work') }
}
