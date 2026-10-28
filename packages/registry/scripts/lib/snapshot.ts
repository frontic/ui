// The look snapshot as text: one sorted line per element, context, property and value, suffixed with where it holds.
export type Combo = Record<string, string>

const VIEWPORT = 'viewport'
/** An axis's values among `combos`, in the order `order` first names them. */
const valuesOf = (combos: Combo[], axis: string, order: Combo[] = combos) => {
  const seen = new Set(combos.map((c) => c[axis]!))
  return [...new Set(order.map((c) => c[axis]!))].filter((v) => seen.has(v))
}
const axesOf = (combos: Combo[]) => [...new Set(combos.flatMap(Object.keys))].sort((a, b) => (a === VIEWPORT ? -1 : b === VIEWPORT ? 1 : a.localeCompare(b)))

/** Where a line holds among every combination its element is resolved at: empty for all of them, else `;`-separated
 * constraints, each naming the axes that narrow it (`desktop variant=solid,soft`), the fewest and shortest that cover it. */
export function constraints(holds: Combo[], all: Combo[]): string {
  return parts(holds, all, all).sort().join('; ')
}

const keyOf = (c: Combo, axes: string[]) => axes.map((a) => c[a]).join('\u0000')
const without = (combos: Combo[], axis: string) => [
  ...new Map(combos.map((c) => [JSON.stringify({ ...c, [axis]: undefined }), Object.fromEntries(Object.entries(c).filter(([a]) => a !== axis))])).values(),
]

function parts(holds: Combo[], within: Combo[], all: Combo[]): string[] {
  if (!holds.length) return []
  // An axis the line holds at every value of, wherever it holds at one, says nothing: leave it out.
  for (const axis of axesOf(within).filter((a) => valuesOf(within, a).length > 1)) {
    const rest = axesOf(within).filter((a) => a !== axis)
    const held = new Set(holds.map((c) => keyOf(c, rest)))
    const inside = new Map<string, number>()
    for (const c of within) inside.set(keyOf(c, rest), (inside.get(keyOf(c, rest)) ?? 0) + 1)
    const count = new Map<string, number>()
    for (const c of holds) count.set(keyOf(c, rest), (count.get(keyOf(c, rest)) ?? 0) + 1)
    if ([...held].every((k) => count.get(k) === inside.get(k))) return parts(without(holds, axis), without(within, axis), all)
  }
  const axes = axesOf(within)
  const picked = Object.fromEntries(axes.map((a) => [a, valuesOf(holds, a, all)]))
  const box = within.filter((c) => axes.every((a) => picked[a]!.includes(c[a]!)))
  if (box.length === holds.length) {
    const narrowing = axes.filter((a) => picked[a]!.length < valuesOf(all, a).length)
    return [narrowing.map((a) => (a === VIEWPORT ? picked[a]!.join(',') : `${a}=${picked[a]!.join(',')}`)).join(' ')]
  }
  // Split on each axis the line holds at several values of; each part keeps its value, as `within` narrows to it.
  const splits = axes
    .filter((a) => picked[a]!.length > 1)
    .map((split) =>
      picked[split]!.flatMap((v) =>
        parts(
          holds.filter((c) => c[split] === v),
          within.filter((c) => c[split] === v),
          all,
        ),
      ),
    )
  return splits.sort((a, b) => a.length - b.length || a.join('; ').length - b.join('; ').length)[0]!
}

/** An item's snapshot: a header line per approximate element, then every line sorted. */
export function snapshotText(elements: Map<string, { combos: Combo[]; lines: Map<string, Combo[]> }>, approximate: string[]): string {
  const head = [...new Set(approximate)].sort().map((e) => `# approximate: ${e}`)
  const body: string[] = []
  for (const [element, { combos, lines }] of elements)
    for (const [line, holds] of lines) {
      const where = constraints(holds, combos)
      body.push(`${element} | ${line}${where ? ` [${where}]` : ''}`)
    }
  return [...head, ...body.sort()].map((l) => `${l}\n`).join('')
}

/** The lines one snapshot has and the other lacks. */
export function snapshotDiff(before: string, after: string): { removed: string[]; added: string[] } {
  const [a, b] = [new Set(before.split('\n').filter(Boolean)), new Set(after.split('\n').filter(Boolean))]
  return { removed: [...a].filter((l) => !b.has(l)), added: [...b].filter((l) => !a.has(l)) }
}
