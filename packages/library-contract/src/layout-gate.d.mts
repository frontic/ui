export interface LayoutFinding {
  file: string
  line: number
  utility: string
  /** The recipe property that holds what the utility sets. */
  property: string
}
/** Variants that style a descendant or read one (`*:`, `**:`, `has-…`, `group-has-…`, `peer-has-…`, `[&…]:`, `in-…`, each also behind `not-`): the utility stays in the template. */
export const RELATIONAL_VARIANTS: readonly RegExp[]
/** Whether a variant styles a descendant or reads one. */
export function isRelational(variant: string): boolean
/** The recipe property a utility sets, or undefined when no recipe holds it or a relational variant keeps it in the template. */
export function heldProperty(utility: string): string | undefined
/** Every utility a recipe holds where a caller's class meets it: a class binding that also binds `props.class`, and the class on a root the caller's class falls through to, read from their strings and the cvas they call. There a caller's utility for the same property fights it, where it would beat a recipe. */
export function layoutGate(source: string, file: string): LayoutFinding[]
