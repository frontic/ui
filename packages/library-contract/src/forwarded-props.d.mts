export interface ForwardedPropsProblem {
  file: string
  line: number
  /** The Reka part the props are bound onto. */
  part: string
  binding: string
}
/** Each `v-bind` of `props`, or of a `reactiveOmit` of them, straight onto a Reka part: Reka reads an explicit `undefined` as a value and loses its own default, so props reach it through `useForwardProps` or `useForwardPropsEmits`. */
export function forwardedPropsProblems(source: string, file: string): ForwardedPropsProblem[]
