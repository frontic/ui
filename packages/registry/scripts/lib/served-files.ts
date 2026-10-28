import { readFileSync } from 'node:fs'
import { dirname, matchesGlob, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { format, type FormatOptions, type OxfmtOverrideConfig } from 'oxfmt'
import { transform } from 'vue-metamorph'
import { sourceIconProblems } from './icon-imports'
import { sourcePath, type SourceItem } from './items'
import { licenceLines } from './licence'
import { makeTransformIconsPlugin } from './transform-icons'

const CONFIG = new URL('../../../../.oxfmtrc.json', import.meta.url)
const {
  $schema: _schema,
  ignorePatterns: _ignore,
  overrides = [],
  ...formatOptions
} = JSON.parse(readFileSync(CONFIG, 'utf8')) as FormatOptions & { $schema?: string; ignorePatterns?: string[]; overrides?: OxfmtOverrideConfig[] }

/** The registry's folder as the config's globs see it. */
const REGISTRY_DIR = relative(dirname(fileURLToPath(CONFIG)), fileURLToPath(new URL('../../', import.meta.url)))

/** The repo config's options for a registry file, `rel` from the registry's folder: oxfmt's `format()` ignores `overrides`, so they are applied here as the CLI applies them, later ones winning. */
export function formatOptionsFor(rel: string): FormatOptions {
  const path = `${REGISTRY_DIR}/${rel}`
  const matches = (globs: string[] = []) => globs.some((glob) => matchesGlob(path, glob))
  return overrides.filter((o) => matches(o.files) && !matches(o.excludeFiles)).reduce<FormatOptions>((options, o) => ({ ...options, ...o.options }), formatOptions)
}

/**
 * The file `frontic ui new` copies. Upstream follows the codemod with eslint --fix because
 * recast reprints quotes; frontic/ui formats with oxfmt, so the output meets format:check.
 */
export async function servedFiles(item: SourceItem): Promise<Record<string, string>> {
  const at = (file: string) => sourcePath(item, file)
  const problems = Object.entries(item.files).flatMap(([file, text]) => sourceIconProblems(at(file), text))
  if (problems.length) throw new Error(problems.join('\n'))
  const files: Record<string, string> = {}
  const licensed = (file: string, text: string) => `${licenceLines(item, file).join('\n')}\n${text}`
  for (const [file, text] of Object.entries(item.files)) {
    if (!text.includes('IconPlaceholder')) {
      files[file] = licensed(file, text)
      continue
    }
    const { code } = transform(text, file, [makeTransformIconsPlugin()])
    const { code: served, errors } = await format(file, code, formatOptionsFor(at(file)))
    if (errors.length) throw new Error(`${at(file)} failed to format: ${errors.map((e) => e.message).join('; ')}`)
    if (/IconPlaceholder|icon-placeholder/.test(served)) throw new Error(`${at(file)} still names IconPlaceholder after the transform`)
    files[file] = licensed(file, served)
  }
  return files
}
