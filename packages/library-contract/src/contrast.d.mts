export type ContrastRole = 'text' | 'large' | 'icon' | 'ring'

/** One recipe colour measured against what it sits on: `over` and `under` as written, a page surface as `page.<surface>[,<surface>…]`, a translucent background as `<ref> on <ground>`. */
export interface ContrastPair {
  recipe: string
  /** The block under the recipe: `base`, `variants.<axis>.<value>[.with.<axis>.<value>]`, then a state or `link`; empty for a flat recipe itself. */
  at: string
  role: ContrastRole
  over: string
  under: string
  ratio: number
  needs: number
  /** The foreground as seen on its ground, as CSS `rgb()`. */
  fg: string
  /** The ground, as CSS `rgb()`. */
  bg: string
}

export type ContrastStandard = 'AA' | 'AAA'

/** WCAG minimums by level: text at 4.5:1 (AA) or 7:1 (AAA), large text at 3:1 or 4.5:1; an icon and the focus ring at 3:1 under both. */
export const CONTRAST_STANDARDS: Readonly<Record<ContrastStandard, Readonly<Record<ContrastRole, number>>>>

/** AA, the default level. */
export const CONTRAST_THRESHOLDS: Readonly<Record<ContrastRole, number>>

export interface ContrastOptions {
  /** The WCAG level each pair is held to; `AA` when omitted. Throws on any other value. */
  standard?: ContrastStandard
}

/** Every recipe colour measured against its ground, one per distinct pair at the shallowest block it appears in. */
export function recipeContrast(recipes: { flat?: Record<string, unknown>; trees?: Record<string, unknown> } | undefined, tokens: unknown, options?: ContrastOptions): ContrastPair[]

/** The pairs below their threshold. */
export function recipeContrastProblems(recipes: { flat?: Record<string, unknown>; trees?: Record<string, unknown> } | undefined, tokens: unknown, options?: ContrastOptions): ContrastPair[]

/** A pair as one line: `<recipe>.<at>: <role> <over> on <under> is <ratio>:1, needs <needs>:1`. */
export function contrastLine(pair: ContrastPair): string
