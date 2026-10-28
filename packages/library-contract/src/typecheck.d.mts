export type TypecheckProblem = { file: string; line: number; column: number; ruleId: string; message: string; prop?: string }

export const LIBRARY_TSCONFIG: string
export function typecheckLibrary(options: {
  contentDir: string
  workDir: string
  overrides?: { item: string; example: string; data: Record<string, unknown> } | null
  /** Modules the library imports from its runtime, mapped to their types; `@library/*` and `@frontic/source` are the contract's own and refused. */
  paths?: Record<string, string[]>
  vueTscBin?: string
}): Promise<{ problems: TypecheckProblem[] }>
