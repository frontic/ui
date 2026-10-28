import { existsSync, promises as fs } from 'node:fs'
import { diffLines } from 'diff'
import path from 'pathe'
import { iconLibrary } from '@/src/constants'
import { compileStylesheet, installFonts, type PlannedRecipe, planRecipes, type RecipePlan, writeRecipes } from '@/src/library'
import { iconMap, resolveItems, type RegistryFile, type RegistryItem } from '@/src/registry'
import type { Config } from '@/src/schema'
import { highlighter } from '@/src/utils/highlighter'
import { logger } from '@/src/utils/logger'
import { updateDependencies } from '@/src/utils/updaters/update-dependencies'
import { installedContent, resolveFilePath, updateFiles, type FileReport } from '@/src/utils/updaters/update-files'

export interface InstallOptions {
  /** Replace installed files that differ and recipes the user edited. */
  overwrite?: boolean
  /** Skip a differing file without asking. */
  yes?: boolean
  silent?: boolean
  /** Print the plan and write nothing. */
  dryRun?: boolean
  /** Print the file diffs and write nothing. */
  diff?: boolean
}

export interface InstallReport {
  items: string[]
  files: FileReport
  dependencies: string[]
  recipes: { added: PlannedRecipe[]; replaced: PlannedRecipe[]; kept: PlannedRecipe[] }
  stylesheet: { written: boolean; path: string; warnings: string[] } | null
}

/** The files an item installs: everything but its demo. */
export const installedFiles = (item: RegistryItem): RegistryFile[] => item.files.filter((file) => file.type !== 'registry:example')

/** The npm packages the items need in this project: the Lucide package becomes the project's icon library, which the icon transform rewrites the imports to. */
export function itemDependencies(items: RegistryItem[], config: Config): string[] {
  const source = iconLibrary('lucide')!
  const target = iconLibrary(config.iconLibrary) ?? source
  return [...new Set(items.flatMap((item) => item.dependencies ?? []).flatMap((name) => (name === source.packages[0] ? target.packages : [name])))]
}

/** Installs the items and their registry dependencies: files, npm packages, each component's manifest with its own recipes beside its files, the shared recipes into `library/recipes/`, then frontic.css. */
export async function installItems(names: string[], config: Config, options: InstallOptions = {}): Promise<InstallReport> {
  if (!existsSync(config.resolvedPaths.brand)) throw new Error(`${config.resolvedPaths.brand} is missing; run ${highlighter.info('init --force')} to set up the library before adding items`)
  const items = await resolveItems(names)
  const icons = await iconMap()
  const recipes = await planRecipes(config, items, { overwrite: options.overwrite })
  const dependencies = itemDependencies(items, config)

  if (options.dryRun || options.diff) {
    const files: FileReport = { filesCreated: [], filesUpdated: [], filesSkipped: [] }
    for (const item of items) {
      for (const file of installedFiles(item)) {
        const target = resolveFilePath(file, config)
        const relative = path.relative(config.resolvedPaths.cwd, target)
        const content = await installedContent(file, config, icons)
        const existing = existsSync(target) ? await fs.readFile(target, 'utf8') : null
        if (existing === null) files.filesCreated.push(relative)
        else if (existing === content || !options.overwrite) files.filesSkipped.push(relative)
        else files.filesUpdated.push(relative)
        if (options.diff && existing !== content) printDiff(relative, existing, content)
      }
    }
    const report = { items: items.map((item) => item.name), files, dependencies, recipes: pick(recipes), stylesheet: null }
    if (!options.diff) printPlan(report)
    return report
  }

  const files: FileReport = { filesCreated: [], filesUpdated: [], filesSkipped: [] }
  for (const item of items) {
    const report = await updateFiles(installedFiles(item), config, { overwrite: options.overwrite, yes: options.yes, silent: options.silent, iconMap: icons })
    files.filesCreated.push(...report.filesCreated)
    files.filesUpdated.push(...report.filesUpdated)
    files.filesSkipped.push(...report.filesSkipped)
  }
  await updateDependencies(dependencies, config, { silent: options.silent })
  await writeRecipes(recipes.writes)
  await installFonts(config, { silent: options.silent })
  const stylesheet = await compileStylesheet(config).catch((error: Error) => {
    throw new Error(`Installed ${items.map((item) => item.name).join(', ')}, but frontic.css was not rebuilt:\n${error.message}\nFix it, then run build.`)
  })

  const report: InstallReport = { items: items.map((item) => item.name), files, dependencies, recipes: pick(recipes), stylesheet }
  if (!options.silent) printReport(report, config)
  return report
}

const pick = ({ added, replaced, kept }: RecipePlan) => ({ added, replaced, kept })

/** `card-image (components/ui/card/card.json)`. */
const named = ({ name, file }: PlannedRecipe) => `${name} (${file})`

function printPlan(report: InstallReport) {
  logger.break()
  logger.info(`Would install: ${report.items.join(', ')}`)
  const list = (label: string, entries: string[]) => {
    if (!entries.length) return
    logger.log(`  ${label}:`)
    for (const entry of entries) logger.log(`    ${entry}`)
  }
  list('Files to create', report.files.filesCreated)
  list('Files to overwrite', report.files.filesUpdated)
  list('Files kept (use --overwrite to replace)', report.files.filesSkipped)
  list('Packages', report.dependencies)
  list('Recipes to add', report.recipes.added.map(named))
  list('Recipes to replace', report.recipes.replaced.map(named))
  list('Recipes kept (use --overwrite to replace)', report.recipes.kept.map(named))
  logger.break()
}

function printReport(report: InstallReport, config: Config) {
  const summary = (label: string, recipes: PlannedRecipe[]) => (recipes.length ? `${label} ${recipes.map(named).join(', ')}` : '')
  const recipes = [summary('added', report.recipes.added), summary('replaced', report.recipes.replaced), summary('kept', report.recipes.kept)].filter(Boolean).join('; ')
  logger.info(`Recipes${recipes ? `: ${recipes}` : ': none'}`)
  const stylesheet = path.relative(config.resolvedPaths.cwd, report.stylesheet!.path)
  logger.info(report.stylesheet!.written ? `Wrote ${stylesheet}` : `${stylesheet} is current`)
  for (const warning of report.stylesheet!.warnings) logger.warn(warning)
  logger.break()
}

export function printDiff(file: string, existing: string | null, content: string) {
  logger.break()
  logger.info(`--- ${file}`)
  for (const part of diffLines(existing ?? '', content)) {
    if (part.added) process.stdout.write(highlighter.success(part.value))
    else if (part.removed) process.stdout.write(highlighter.error(part.value))
    else process.stdout.write(part.value)
  }
}
