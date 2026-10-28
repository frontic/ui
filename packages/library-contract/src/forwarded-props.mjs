const REKA_IMPORT = /import\s*\{([^}]*)\}\s*from\s*'reka-ui'/g
const BINDING = /\sv-bind="([^"]+)"/g

/** Each `v-bind` of `props`, or of a `reactiveOmit` of them, straight onto a Reka part: Reka reads an explicit `undefined` as a value and loses its own default, so props reach it through `useForwardProps` or `useForwardPropsEmits`. */
export function forwardedPropsProblems(source, file) {
  const reka = new Set(
    [...source.matchAll(REKA_IMPORT)].flatMap((match) =>
      match[1]
        .split(',')
        .map((name) =>
          name
            .trim()
            .split(/\s+as\s+/)
            .at(-1),
        )
        .filter(Boolean),
    ),
  )
  const raw = new Set(['props', ...[...source.matchAll(/\bconst (\w+) = reactiveOmit\(/g)].map((match) => match[1])])
  const problems = []
  for (const match of source.matchAll(BINDING)) {
    const binding = match[1].trim()
    if (!raw.has(binding)) continue
    const part = [...source.slice(0, match.index).matchAll(/<([A-Za-z][\w.-]*)/g)].at(-1)?.[1]
    if (!part || !reka.has(part)) continue
    problems.push({ file, line: source.slice(0, match.index + 1).split('\n').length, part, binding })
  }
  return problems
}
