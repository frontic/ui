/** `warning` reports an untyped recipe property: it renders, and never fails the build. */
export type LintProblem = { file: string; line: number; column: number; ruleId: string; message: string; severity: 'error' | 'warning' }

export function breakpointNames(baseCss: string): string[]
export function styleBlockClasses(source: string): string[]
/** Data attributes reka sets on what it renders, which a component may key a bare `data-*:` variant on. */
export const VENDOR_DATA_ATTRIBUTES: readonly string[]
/** The data attributes a file sets on what it renders: `data-x`, `:data-x="…"`, `'data-x': …`. */
export function dataAttributeNames(source: string): string[]
/** The `data-*` variants the theme declares, without their `data-`. */
export function themeDataVariants(baseCss: string): string[]
/** Where a project keeps its sources (globs), its installed components and the stylesheet that themes them, each relative to the project. */
export interface LintLayout {
  sources: string[]
  components: string
  theme: string
  /** What the theme is built from, as the unknown-class hint names it; the content repo's `styles/base.css` when omitted. */
  themeSource?: string
}
/** With a `layout`, a script that does not parse is a problem with the rule id `parse`, and only the `ui`, `sections` and `templates` folders under `components` count as installed items; without one, the content repo's layout applies. */
export function lintWorkspace(contentDir: string, options?: { files?: string[]; workDir?: string; layout?: LintLayout }): Promise<LintProblem[]>
/** The rule id of a component whose cva differs from its recipe tree. */
export const RECIPE_CLASSES: 'frontic/recipe-classes'
/** The rule a library component breaks by binding its props straight onto a Reka part. */
export const FORWARDED_PROPS: 'frontic/forwarded-props'
export function lintLibrary(contentDir: string, options?: { log?: (message: string) => void; workDir?: string }): Promise<LintProblem[]>
/** A problem to print; one without a severity is an error. */
export type ProblemLine = Omit<LintProblem, 'severity'> & { severity?: LintProblem['severity'] }
export function formatProblems(problems: ProblemLine[]): string
/** The problems that fail a build; one without a severity is an error. */
export function lintErrors<P extends ProblemLine>(problems: P[]): P[]
/** The build error for the errors among `problems`; with no error, for the warnings. */
export function lintFailure(problems: ProblemLine[]): Error & { logTail: string }
