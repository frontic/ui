// Every recipe colour against what it sits on, at its WCAG 2.x threshold.
import { channels, colourOwners, composite, contrastRatio, resolveBrand, withBrandStyles } from './brand.mjs'
import { CONTRAST_PROPERTIES, EXTENDS, parseRef, RECIPE_STATES, resolveValue, treeParts, VALUE_SETS, WITH } from './recipe.mjs'

const isNode = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)

/** WCAG minimums by level: text at 4.5:1 (AA) or 7:1 (AAA), large text at 3:1 or 4.5:1; an icon and the focus ring at 3:1 under both. */
export const CONTRAST_STANDARDS = Object.freeze({
  AA: Object.freeze({ text: 4.5, large: 3, icon: 3, ring: 3 }),
  AAA: Object.freeze({ text: 7, large: 4.5, icon: 3, ring: 3 }),
})
/** AA, the default level. */
export const CONTRAST_THRESHOLDS = CONTRAST_STANDARDS.AA
/** What text with no background of its own, its tree's or a ground is measured on. */
const PAGE_SURFACES = ['background', 'card', 'popover']
/** A property set to currentColor here fills, strokes or backs the recipe with the text colour, so what shows is a graphic; a border in the text colour still leaves text to read. */
const PAINTS = ['fill', 'stroke', 'backgroundColor']
const ICON_COLOURS = ['iconColor', 'fill', 'stroke']
/** 24px, or 18.66px at 700: WCAG's large text, at 16px to the rem. */
const LARGE = { size: 24, boldSize: 18.66, bold: 700 }
const SKIPPED = ['disabled']

const css = (c) => `rgb(${[c.r, c.g, c.b].map(Math.round).join(' ')})`

/** Every colour the stylesheet declares, by its name, as 0–255 channels and alpha. */
function colourIndex(tokens) {
  const index = new Map()
  for (const [name, { token }] of colourOwners(tokens)) {
    const c = channels(token.$value)
    if (c) index.set(name, c)
  }
  return index
}

/** Each text style's size in px and weight. */
function textStyles(tokens) {
  const styles = new Map()
  for (const [name, token] of Object.entries(isNode(tokens) && isNode(tokens.text) ? tokens.text : {})) {
    const value = isNode(token) ? token.$value : null
    const size = isNode(value?.fontSize) ? value.fontSize.value * (value.fontSize.unit === 'rem' ? 16 : 1) : null
    if (!name.startsWith('$') && Number.isFinite(size)) styles.set(name, { size, weight: Number(value.fontWeight) || 400 })
  }
  return styles
}

/** `def` over `into`, a state or part block merged key by key. */
function over(into, def) {
  const out = { ...into }
  for (const [key, value] of Object.entries(def ?? {})) out[key] = isNode(value) && isNode(out[key]) ? { ...out[key], ...value } : value
  return out
}

/** The parts of a block measured on their own: the block, each state, the link part and its states. */
function contexts(block) {
  const out = [['', block]]
  for (const state of Object.keys(RECIPE_STATES)) if (isNode(block[state])) out.push([state, over(block, block[state])])
  if (isNode(block.link)) {
    const link = { ...block.link, backgroundColor: block.backgroundColor, ground: block.ground }
    out.push(['link', link])
    for (const state of Object.keys(RECIPE_STATES)) if (isNode(block.link[state])) out.push([`link.${state}`, over(link, block.link[state])])
  }
  return out
}

/** Every recipe colour measured against its ground: `{ recipe, at, role, over, under, ratio, needs, fg, bg }`, one per distinct pair at the shallowest path it appears; `fg` and `bg` are the two colours as seen, as CSS. */
export function recipeContrast(recipes, tokens, { standard = 'AA' } = {}) {
  const thresholds = CONTRAST_STANDARDS[standard]
  if (!thresholds) throw new Error(`unknown contrast standard: ${standard}`)
  const { flat = {}, trees = {} } = isNode(recipes) ? recipes : {}
  // The brand as the build sees it, derived hovers and all.
  const brand = resolveBrand(withBrandStyles(isNode(tokens) ? tokens : {})).brand
  const colours = colourIndex(brand)
  const styles = textStyles(brand)
  if (!colours.size) return []
  const colour = (value, under) => {
    const ref = parseRef(value)
    const c = ref?.group === 'colors' && !ref.problem ? colours.get(ref.name) : null
    if (!c) return null
    const alpha = c.alpha * (ref.alpha === undefined ? 1 : Number(ref.alpha) / 100)
    const own = { ...c, alpha }
    return under && alpha < 1 ? composite(own, under) : own
  }
  // Surfaces of one colour are one ground: `page.background,card,popover`.
  const page = []
  for (const name of PAGE_SURFACES.filter((n) => colours.has(n))) {
    const rgb = colours.get(name)
    const same = page.find((g) => ['r', 'g', 'b', 'alpha'].every((k) => g.rgb[k] === rgb[k]))
    if (same) same.name += `,${name}`
    else page.push({ name: `page.${name}`, rgb })
  }
  const owners = new Map(Object.entries(treeParts(Object.keys(trees))).flatMap(([owner, parts]) => parts.map((part) => [part, owner])))
  const resolved = (name) => resolveValue(isNode(trees[name]?.base) ? trees[name].base : {}, flat)

  /** What a block's text sits on: its own background over what lies under it, else its ground, else its tree's, else the page. */
  const grounds = (block, recipe) => {
    const named = parseRef(block.ground)?.group === 'colors' ? colour(block.ground) : null
    const ownerBase = owners.has(recipe) ? resolved(owners.get(recipe)) : null
    const under = named ? [{ name: block.ground, rgb: named }] : ownerBase && colour(ownerBase.backgroundColor) ? grounds(ownerBase, owners.get(recipe)) : page
    const fill = typeof block.backgroundColor === 'string' ? parseRef(block.backgroundColor) : null
    if (!fill || fill.group !== 'colors' || !colour(block.backgroundColor)) return under
    const opaque = colour(block.backgroundColor)
    if (opaque.alpha >= 1) return [{ name: block.backgroundColor, rgb: opaque }]
    return under.map((g) => ({ name: `${block.backgroundColor} on ${g.name}`, rgb: colour(block.backgroundColor, g.rgb) }))
  }

  const large = (block) => {
    const style = styles.get(parseRef(block.typography)?.name)
    if (!style) return false
    const weight = Number(VALUE_SETS.fontWeight[block.fontWeight] ?? style.weight)
    return style.size >= LARGE.size || (style.size >= LARGE.boldSize && weight >= LARGE.bold)
  }

  const pairs = []
  const seen = new Set()
  const measure = (recipe, at, block) => {
    if (block[CONTRAST_PROPERTIES.decorative] === true) return
    for (const [state, ctx] of contexts(block)) {
      const foregrounds = []
      if (typeof ctx.textColor === 'string') foregrounds.push(['textColor', PAINTS.some((p) => ctx[p] === 'currentColor') ? 'icon' : large(ctx) ? 'large' : 'text'])
      for (const prop of ICON_COLOURS) if (typeof ctx[prop] === 'string') foregrounds.push([prop, 'icon'])
      if (typeof ctx.placeholderColor === 'string') foregrounds.push(['placeholderColor', 'text'])
      if (typeof ctx.ringColor === 'string') foregrounds.push(['ringColor', 'ring'])
      if (recipe === 'focus-ring' && typeof ctx.outlineColor === 'string') foregrounds.push(['outlineColor', 'ring'])
      for (const [prop, role] of foregrounds) {
        if (!colour(ctx[prop])) continue
        for (const ground of role === 'ring' ? (ctx.ground ? grounds({ ground: ctx.ground }, recipe) : page) : grounds(ctx, recipe)) {
          const key = [recipe, role, ctx[prop], ground.name].join('|')
          if (seen.has(key)) continue
          seen.add(key)
          const fg = colour(ctx[prop])
          const ratio = contrastRatio(fg, ground.rgb)
          pairs.push({
            recipe,
            at: [at, state].filter(Boolean).join('.'),
            role,
            over: ctx[prop],
            under: ground.name,
            ratio,
            needs: thresholds[role],
            fg: css(composite(fg, ground.rgb)),
            bg: css(ground.rgb),
          })
        }
      }
    }
  }

  for (const [name, def] of Object.entries(flat)) if (isNode(def) && !SKIPPED.includes(name)) measure(name, '', def)
  for (const [name, tree] of Object.entries(trees)) {
    if (!isNode(tree)) continue
    const base = resolved(name)
    measure(name, 'base', base)
    const own = (def) => (({ [WITH]: _, [EXTENDS]: __, ...rest }) => rest)(resolveValue(def, flat))
    // A pair's element wears both values, so its block is the first value, the other axis's value, then the pair.
    // Breadth first: every value is measured before a pair that also wears it.
    const queue = Object.entries(isNode(tree.variants) ? tree.variants : {}).flatMap(([axis, values]) =>
      isNode(values) ? Object.entries(values).flatMap(([value, def]) => (isNode(def) ? [[`variants.${axis}.${value}`, base, def]] : [])) : [],
    )
    while (queue.length) {
      const [at, merged, def] = queue.shift()
      const block = over(merged, own(def))
      measure(name, at, block)
      if (!isNode(def[WITH])) continue
      for (const [axis, values] of Object.entries(def[WITH]))
        if (isNode(values))
          for (const [value, inner] of Object.entries(values)) {
            const other = tree.variants?.[axis]?.[value]
            if (isNode(inner)) queue.push([`${at}.${WITH}.${axis}.${value}`, isNode(other) ? over(block, own(other)) : block, inner])
          }
    }
  }
  return pairs
}

/** The pairs below their threshold. */
export const recipeContrastProblems = (recipes, tokens, options) => recipeContrast(recipes, tokens, options).filter((p) => p.ratio < p.needs)

/** A pair as one line: `<recipe>.<at>: <role> <over> on <under> is <ratio>:1, needs <needs>:1`. */
export const contrastLine = (p) => `${[p.recipe, p.at].filter(Boolean).join('.')}: ${p.role} ${p.over} on ${p.under} is ${p.ratio}:1, needs ${p.needs}:1`
