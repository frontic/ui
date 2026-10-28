import { existsSync, promises as fs } from 'node:fs'
import { Command } from 'commander'
import { detectPackageManager } from 'nypm'
import path from 'pathe'
import { contrastProblems, readBrand, readRecipes, recipeContrastProblems, stylesheetCurrent } from '@/src/library'
import { getConfig, getRawConfig } from '@/src/utils/get-config'
import { getProjectInfo } from '@/src/utils/get-project-info'
import { handleError } from '@/src/utils/handle-error'
import { logger } from '@/src/utils/logger'

export type StylesheetStatus = 'current' | 'stale' | 'missing' | 'unchecked'

/** Everything an agent reads before touching the project. */
export async function projectReport(cwd: string) {
  const [projectInfo, packageManager, raw, config] = await Promise.all([getProjectInfo(cwd), detectPackageManager(cwd), getRawConfig(cwd), getConfig(cwd)])
  const paths = config?.resolvedPaths
  const installed = paths && existsSync(paths.ui) ? (await fs.readdir(paths.ui, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort() : []
  const brand = Boolean(paths && existsSync(paths.brand))
  const design = Boolean(paths && existsSync(paths.design))
  const recipePaths = config ? Object.values((await readRecipes(config)).paths) : []
  const recipes = recipePaths.length
  const recipeFiles = new Set(recipePaths).size
  // A brand.json that cannot be read, or a library that cannot be rendered, is reported, not thrown: info is what diagnoses the project.
  const brandError = config && brand ? await readBrand(config).then(() => null, (error: Error) => error.message) : null
  let stylesheetError: string | null = null
  let stylesheet: StylesheetStatus = brandError ? 'unchecked' : 'missing'
  if (!brandError && config && brand && existsSync(paths!.fronticCss)) {
    try {
      stylesheet = (await stylesheetCurrent(config)) ? 'current' : 'stale'
    } catch (error) {
      stylesheetError = (error as Error).message
      stylesheet = 'unchecked'
    }
  }
  const contrast = config && brand && !brandError ? await contrastProblems(config) : brandError ? null : []
  const recipeContrast = config && brand && !brandError ? await recipeContrastProblems(config) : brandError ? null : []
  return {
    framework: projectInfo.framework.name,
    packageManager: packageManager?.name ?? null,
    config: raw,
    library: config ? path.relative(cwd, paths!.library) : null,
    brand,
    brandError,
    design,
    installed,
    recipes,
    recipeFiles,
    stylesheet,
    stylesheetError,
    contrast,
    recipeContrast,
  }
}

export const info = new Command()
  .name('info')
  .description("show the project's config, library path, installed items, whether frontic.css is current and its contrast problems")
  .option('-c, --cwd <cwd>', 'the working directory. defaults to the current directory.', process.cwd())
  .option('--json', 'output as JSON.', false)
  .action(async (opts) => {
    try {
      const report = await projectReport(path.resolve(opts.cwd))
      if (opts.json) {
        process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
        return
      }
      logger.info(`framework: ${report.framework}`)
      logger.info(`package manager: ${report.packageManager ?? 'unknown'}`)
      logger.info(`components.json: ${report.config ? JSON.stringify(report.config, null, 2) : 'missing'}`)
      const brand = report.brandError ? `unreadable: ${report.brandError}` : report.brand ? 'present' : 'missing'
      logger.info(`library: ${report.library ?? 'none'} (brand.json ${brand}, DESIGN.md ${report.design ? 'present' : 'missing'}, ${report.recipes} recipes in ${report.recipeFiles} recipe files)`)
      logger.info(`frontic.css: ${report.stylesheet}${report.stylesheetError ? ` (${report.stylesheetError})` : ''}`)
      logger.info(`contrast: ${report.contrast && report.recipeContrast ? `${report.contrast.length} token pairs, ${report.recipeContrast.length} recipe colours below threshold` : 'not checked'}`)
      logger.info(`installed items (${report.installed.length})${report.installed.length ? `: ${report.installed.join(', ')}` : ''}`)
    } catch (error) {
      handleError(error)
    }
  })
