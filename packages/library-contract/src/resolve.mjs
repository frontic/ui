// A package's own dependencies, found as Node would; their package.json files are not exported.
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const PACKAGE_DIR = path.dirname(HERE)

/** The folder `name` is installed in, searched from `from` upwards. */
export function installedDir(name, from = HERE) {
  for (let dir = from; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', name)
    if (existsSync(path.join(candidate, 'package.json'))) return candidate
    if (path.dirname(dir) === dir) throw new Error(`${name} is not installed beside ${from}`)
  }
}
