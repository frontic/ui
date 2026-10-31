// library/brand.json + library/recipes/ → styles/base.css.

import { mkdir, readdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FOCUS_RING, LAYOUT_STEPS, parseRef, RECIPE_PARTS, convertRecipeFiles, readRecipeFiles, recipeEntries, RING_PROPERTIES, stepName, textStepValues } from './recipe.mjs'

export { isColorProperty, isRecipeDefinition, RECIPE_KEY, RECIPE_NAME, RECIPE_PARTS, RECIPE_PROPERTY, RECIPE_STATES, recipeValueProblem } from './recipe.mjs'

const HEADER = `/* Generated from the Design System's brand.json — do not edit.
 * Change the tokens and this file is rebuilt on the next build. */`

// DTCG (Design Tokens Format Module 2025.10): every token is {$value}, and a
// group's $type is inherited. keep in sync with apps/admin-ui/shared/utils/library/dtcg.ts

const LEGACY_FONT_SLOTS = [
  ['body', 'sans'],
  ['display', 'heading'],
]

// Tailwind v4's own namespace defaults, emitted when brand.json carries no override.
const DEFAULT_BREAKPOINTS = { sm: '40rem', md: '48rem', lg: '64rem', xl: '80rem', '2xl': '96rem' }
const DEFAULT_CONTAINERS = {
  '3xs': '16rem',
  '2xs': '18rem',
  xs: '20rem',
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  '6xl': '72rem',
  '7xl': '80rem',
}
const DEFAULT_SPACING = '0.25rem'

// `max-w-<name>` reads Tailwind's `--max-width-*` theme keys before `--container-*`: a container named like one gets that key too, so the
// brand's width wins. `w-`, `min-w-` and `max-w-<name>` also carry Tailwind's own keywords and spacing steps, which a container of the
// same name would override, so such a name is refused.
const MAX_WIDTH_KEYS = ['prose']
const WIDTH_KEYWORDS = ['none', 'screen', 'full', 'svw', 'lvw', 'dvw', 'svh', 'lvh', 'dvh', 'min', 'max', 'fit', 'px', 'auto']
const SPACING_STEP = /^\d+(\.\d+)?$/

/** Each container the brand names like one of Tailwind's own width keywords or spacing steps, as `container.<name>: <reason>`. */
export function brandContainerProblems(tokens) {
  const owner = (name) => (SPACING_STEP.test(name) ? `spacing step w-${name}` : name === 'auto' ? 'w-auto' : `max-w-${name}`)
  return members(isNode(tokens) && isNode(tokens.container) ? tokens.container : {})
    .map(([name]) => name)
    .filter((name) => WIDTH_KEYWORDS.includes(name) || SPACING_STEP.test(name))
    .map((name) => `container.${name}: it would override Tailwind's own ${owner(name)}, so a container cannot take that name`)
}

/** Each colour name two colour groups both hold, among the brand's own and the hovers the contract derives, as `{ name, at }`, each path in
 * `at` in the brand's order with whether the contract derived it: the stylesheet declares one property per name, so the later group would
 * override the earlier. A name only derived hovers share is left to the bases' report. */
export function brandColourNameDuplicates(tokens) {
  const paths = new Map()
  for (const [group, entries] of members(withBrandStyles(isNode(tokens) ? tokens : {}).color)) {
    for (const [name, token] of members(entries)) paths.set(name, [...(paths.get(name) ?? []), { path: `color.${group}.${name}`, derived: !!ext(token).derived }])
  }
  return [...paths].filter(([, at]) => at.length > 1 && at.some(({ derived }) => !derived)).map(([name, at]) => ({ name, at }))
}

/** Each of `brandColourNameDuplicates` as `<path>, <path>: both declare --fui-<name>; <reason>`, a derived hover's path marked `(derived)`. */
export function brandColourNameProblems(tokens) {
  return brandColourNameDuplicates(tokens).map(
    ({ name, at }) =>
      `${at.map(({ path, derived }) => (derived ? `${path} (derived)` : path)).join(', ')}: ${at.length > 2 ? 'each declares' : 'both declare'} --fui-${name}; a colour name is unique across the colour groups`,
  )
}

/** Each colour name the stylesheet declares as `--fui-<name>`, with the group and token that own it: of two groups holding a name the later
 * one, as the stylesheet's later declaration wins. It reads `tokens` as given: pass `withBrandStyles(brand)` to count the hovers the contract
 * derives. */
export function colourOwners(tokens) {
  const owners = new Map()
  for (const [group, entries] of members(isNode(tokens) ? tokens.color : undefined)) {
    for (const [name, token] of members(entries)) owners.set(name, { group, token })
  }
  return owners
}

const isNode = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)

// Group members are everything that is not a $-prefixed spec key.
function members(node) {
  if (!isNode(node)) return []
  return Object.entries(node).filter(([k, v]) => !k.startsWith('$') && isNode(v))
}

function ext(node) {
  const all = isNode(node) && node.$extensions
  return (isNode(all) && all['com.frontic.brand']) || {}
}

// A reference names a token by its path; the stack's resolver reads the same form.
const REFERENCE = /^\{([a-z0-9_-]+(?:\.[a-z0-9_-]+)*)\}$/i
const aliasPath = (v) => (typeof v === 'string' ? (REFERENCE.exec(v.trim())?.[1] ?? null) : null)
// Braces around anything that is not a reference: a name with a space, padding inside the braces. Padding outside them is trimmed.
const BRACED = /^\s*\{[\s\S]*\}\s*$/

const NAME = /^[a-z0-9-]+$/i

/** The custom property the stylesheet declares for the token at `path`, or null for one it declares none for or under another name. */
function propertyOf(path) {
  const parts = path.split('.')
  const leaf = parts.at(-1)
  if (!NAME.test(leaf)) return null
  if (parts.length === 3 && parts[0] === 'color') return `--fui-${leaf}`
  if (parts.length === 3 && parts[0] === 'font' && parts[1] === 'size') return `--fui-text-${leaf}`
  if (parts.length === 3 && parts[0] === 'font' && parts[1] === 'family') return `--fui-font-${leaf}`
  if (parts.length === 3 && parts[0] === 'font' && parts[1] === 'weight') return `--fui-font-weight-${leaf}`
  if (parts.length === 2 && parts[0] === 'radius') return leaf === 'base' ? '--fui-radius' : `--fui-radius-${leaf}`
  return null
}

// A reference `cssTokens` kept, as the var() of the property its target declares.
function aliasVar(v) {
  const path = aliasPath(v)
  const property = path && propertyOf(path)
  return property ? `var(${property})` : null
}

// The $type of each composite field DTCG gives one.
const FIELD_TYPES = {
  color: 'color',
  width: 'dimension',
  offset: 'dimension',
  offsetX: 'dimension',
  offsetY: 'dimension',
  blur: 'dimension',
  spread: 'dimension',
  fontSize: 'dimension',
  letterSpacing: 'dimension',
  fontFamily: 'fontFamily',
  fontWeight: 'fontWeight',
}

/** Every token of `doc` by its dotted path, with the $type it declares or inherits from its groups. */
function tokenIndex(doc) {
  const index = new Map()
  const walk = (node, at, type) => {
    for (const [key, child] of members(node)) {
      const path = at ? `${at}.${key}` : key
      const own = typeof child.$type === 'string' ? child.$type : type
      if (Object.hasOwn(child, '$value')) index.set(path, { node: child, type: own })
      else walk(child, path, own)
    }
  }
  walk(doc, '', typeof doc?.$type === 'string' ? doc.$type : undefined)
  return index
}

/** `doc` with every `{group.token}` reference replaced by its target's value, through chains, in a token's `$value` and in a composite's
 * fields (a border's colour, a shadow layer's, a text style's size), and in a text style's steps; and `problems`, one per reference that does not resolve, at its path:
 * `missing` (no such token), `cycle` (every reference on the loop) or `type` (a target of another $type than its slot, when both are known).
 * A reference that fails, or whose target fails, stays as written; only the root cause is listed. `doc` is not changed. */
export function resolveBrand(doc) {
  // JSON rather than structuredClone: an editor's reactive proxy is not cloneable, and a brand is JSON.
  const brand = isNode(doc) ? JSON.parse(JSON.stringify(doc)) : {}
  const index = tokenIndex(brand)
  const problems = []
  const reported = new Set()
  const fail = (path, kind, target) => {
    if (reported.has(path)) return
    reported.add(path)
    problems.push({ path, kind, target })
  }
  // A token without a $type of its own or its groups' takes its target's, as DTCG has an alias do.
  const typing = new Set()
  const typeOf = (path) => {
    const entry = index.get(path)
    if (!entry) return undefined
    if (entry.type || typing.has(path)) return entry.type
    typing.add(path)
    const target = aliasPath(entry.node.$value)
    const type = target ? typeOf(target) : undefined
    typing.delete(path)
    return type
  }
  const done = new Map()
  const visiting = []
  const hops = []
  // A value with each reference in it resolved: `ok` is false when one of them, or one it leads to, fails.
  const resolve = (value, at, slot) => {
    const target = aliasPath(value)
    if (!target && typeof value === 'string' && BRACED.test(value)) {
      fail(at, 'missing', value)
      return { value, ok: false }
    }
    if (target) {
      if (!index.has(target)) {
        fail(at, 'missing', target)
        return { value, ok: false }
      }
      const loop = visiting.indexOf(target)
      if (loop >= 0) {
        for (const hop of [...hops.slice(loop), { at, target }]) fail(hop.at, 'cycle', hop.target)
        return { value, ok: false }
      }
      const type = typeOf(target)
      if (slot !== undefined && type !== undefined && type !== slot) {
        fail(at, 'type', target)
        return { value, ok: false }
      }
      hops.push({ at, target })
      const resolved = token(target)
      hops.pop()
      return resolved.ok ? { value: JSON.parse(JSON.stringify(resolved.value)), ok: true } : { value, ok: false }
    }
    if (Array.isArray(value) || isNode(value)) {
      let ok = true
      const out = Array.isArray(value) ? [] : {}
      for (const [key, inner] of Object.entries(value)) {
        const next = resolve(inner, `${at}.${key}`, Array.isArray(value) ? undefined : FIELD_TYPES[key])
        out[key] = next.value
        ok &&= next.ok
      }
      return { value: out, ok }
    }
    return { value, ok: true }
  }
  const token = (path) => {
    if (done.has(path)) return done.get(path)
    const { node, type } = index.get(path)
    visiting.push(path)
    const result = resolve(node.$value, path, type)
    visiting.pop()
    // A token fails mid-walk only on a loop or on the way into one, so its result holds wherever the walk started.
    done.set(path, result)
    return result
  }
  for (const [path, { node }] of index) node.$value = token(path).value
  for (const [path, { node }] of index) {
    if (path.startsWith('text.')) for (const [at, step, key] of stepFields(node)) step[key] = resolve(step[key], `${path}.$extensions.com.frontic.brand.steps.${at}.${key}`, FIELD_TYPES[key]).value
  }
  return { brand, problems }
}

/** Each field a text style's steps set, as [breakpoint, step, field]. */
function stepFields(node) {
  const { steps } = ext(node)
  return isNode(steps) ? Object.entries(steps).flatMap(([at, step]) => (isNode(step) ? Object.keys(step).map((key) => [at, step, key]) : [])) : []
}

// The fields of a composite the stylesheet writes through `color()` or `dim()`, so a reference there can stay a var().
const VAR_FIELDS = ['color', 'width', 'offset', 'offsetX', 'offsetY', 'blur', 'spread', 'fontSize', 'fontFamily', 'fontWeight']
const VAR_GROUPS = ['color', 'radius', 'spacing']
const VAR_FONTS = ['size', 'family', 'weight']

const REFERENCE_PROBLEMS = { missing: 'which is no token', cycle: 'which leads back to it', type: 'a token of another $type' }
const DERIVED_HOVER = /^color\.[^.]+\.[^.]+-hover$/

/** Each brand reference that does not resolve, as `<path>: {target}, <reason>`. */
export const brandReferenceLines = (problems) =>
  problems.map(
    ({ path, kind, target }) =>
      `${path}: ${BRACED.test(target) ? target : `{${target}}`}, ${REFERENCE_PROBLEMS[kind]}${kind === 'missing' && DERIVED_HOVER.test(target) ? "; a derived hover can't be referenced, write it in brand.json" : ''}`,
  )

/** `tokens` as the stylesheet writes them: a reference stays a var() where the stylesheet declares its target under a property of its own
 * that no other token declares and that is not the one being written; any other, a breakpoint's or a container's included, since a query
 * cannot read a var, takes its resolved value. */
function cssTokens(tokens) {
  const { brand } = resolveBrand(tokens)
  const written = tokenIndex(tokens)
  const owners = new Map()
  for (const path of written.keys()) {
    const property = propertyOf(path)
    if (property) owners.set(property, [...(owners.get(property) ?? []), path])
  }
  const carried = (raw, declaring) => {
    const target = aliasPath(raw)
    const property = target && propertyOf(target)
    return !!property && property !== declaring && owners.get(property)?.length === 1 && owners.get(property)[0] === target
  }
  const pick = (raw, value, keep, declaring) => {
    if (aliasPath(raw)) return keep && carried(raw, declaring) ? raw : value
    if (Array.isArray(raw) || isNode(raw)) {
      const out = Array.isArray(raw) ? [] : {}
      for (const [key, inner] of Object.entries(raw)) out[key] = pick(inner, value?.[key], !Array.isArray(raw) && VAR_FIELDS.includes(key), null)
      return out
    }
    return value
  }
  for (const [path, { node }] of tokenIndex(brand)) {
    const [group, kind] = path.split('.')
    node.$value = pick(written.get(path).node.$value, node.$value, VAR_GROUPS.includes(group) || (group === 'font' && VAR_FONTS.includes(kind)), propertyOf(path))
    // A step writes a font size reference as that size's var, and any other value as CSS.
    const raw = ext(written.get(path).node).steps
    for (const [at, step, key] of stepFields(node)) step[key] = pick(raw[at][key], step[key], key === 'fontSize' && /^font\.size\./.test(aliasPath(raw[at][key]) ?? ''), null)
  }
  return brand
}

// A token declaration whose value still holds a brace: a reference the stylesheet could not resolve, as from `$extensions.raw`.
const BRACED_DECLARATION = /^\s*(--[\w-]+|[a-z-]+):[^;\n]*\{[^;\n]*;$/gm

// A colour token's hex: its own, or one from its sRGB components.
function hexOf(v) {
  return (
    v.hex ||
    `#${(v.components || [])
      .slice(0, 3)
      .map((n) =>
        Math.max(0, Math.min(255, Math.round(n * 255)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')}`
  )
}

const HEX6 = /^[0-9a-f]{6}$/i

/** A colour token as its 0–255 sRGB channels and alpha; null for anything that is not a six-digit-hex colour object. */
export function channels(v) {
  if (!isNode(v)) return null
  const raw = hexOf(v).slice(1)
  if (!HEX6.test(raw)) return null
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(raw.slice(i, i + 2), 16))
  return { r, g, b, alpha: typeof v.alpha === 'number' ? v.alpha : 1 }
}

function color(v) {
  if (typeof v === 'string') return aliasVar(v) ?? v
  if (!isNode(v)) return ''
  const c = channels(v)
  if (!c || c.alpha >= 1) return hexOf(v)
  return `rgb(${c.r} ${c.g} ${c.b} / ${c.alpha})`
}

// WCAG 2.x relative luminance of 0–255 sRGB channels.
function luminance({ r, g, b }) {
  const [R, G, B] = [r, g, b].map((n) => {
    const c = n / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

// `over` composited onto `under` at its alpha; `under` counts as opaque.
export function composite(over, under) {
  if (over.alpha >= 1) return over
  const mix = (a, b) => a * over.alpha + b * (1 - over.alpha)
  return { r: mix(over.r, under.r), g: mix(over.g, under.g), b: mix(over.b, under.b), alpha: 1 }
}

/** WCAG 2.x contrast ratio of `over` on `under`, to two decimals. */
export function contrastRatio(over, under) {
  const [light, dark] = [luminance(composite(over, under)), luminance(under)].sort((a, b) => b - a)
  return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100
}

// Groups whose `<name>` / `<name>-foreground` (`surface`: `background` / `foreground`) carry text, at AA's 4.5:1; a `<name>-hover` tone carries `<name>-foreground` too, and `foreground-hover` carries `background`.
const TEXT_GROUPS = ['action', 'status', 'commerce', 'surface', 'accent']
const TEXT_CONTRAST = 4.5
// Non-text UI against the surface background, at AA's 3:1. Only the focus ring: card borders are decorative, and a resting input edge at 3:1 would darken every field, so fields rely on their label and fill.
const EDGE_TOKENS = ['ring']
const EDGE_CONTRAST = 3

const foregroundOf = (name) => {
  const base = name.replace(/-hover$/, '')
  if (base === 'background') return 'foreground'
  if (base === 'foreground') return 'background'
  return `${base}-foreground`
}

// A hover the brand leaves out: oklab lightness 0.06 away from the colour on it, hue kept, chroma lowered into sRGB where the step leaves it.
const HOVER_STEP = 0.06
const HOVER_ROOM = [0.2, 0.92]
const HOVER_FLOOR = 0.3

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

// Björn Ottosson's oklab, from and to linear sRGB.
function oklab({ r, g, b }) {
  const [R, G, B] = [r, g, b].map((n) => toLinear(n / 255))
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  return { L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s }
}

function linearRgb({ L, a, b }) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
}

const inGamut = (rgb) => rgb.every((c) => c >= -1e-7 && c <= 1 + 1e-7)

/** The hover of `base` under `pair`: lightness stepped away from the pair, or to the floor or ceiling where that leaves no room; chroma searched down at that lightness and hue until the colour is in sRGB. */
function hoverColour(base, pair) {
  const { L, a, b } = oklab(base)
  let next = oklab(pair).L > L ? L - HOVER_STEP : L + HOVER_STEP
  if (next < HOVER_ROOM[0] || next > HOVER_ROOM[1]) next = L < 0.5 ? Math.max(L + HOVER_STEP, HOVER_FLOOR) : Math.min(L - HOVER_STEP, HOVER_ROOM[1])
  const chroma = Math.hypot(a, b)
  const hue = Math.atan2(b, a)
  const at = (c) => linearRgb({ L: next, a: c * Math.cos(hue), b: c * Math.sin(hue) })
  let rgb = at(chroma)
  if (!inGamut(rgb)) {
    let [low, high] = [0, chroma]
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2
      if (inGamut(at(mid))) low = mid
      else high = mid
    }
    rgb = at(low)
  }
  const [r, g, bl] = rgb.map((c) => Math.round(toGamma(Math.min(1, Math.max(0, c))) * 255))
  return { r, g, b: bl, alpha: 1 }
}

const hexToken = ({ r, g, b }) => ({
  colorSpace: 'srgb',
  components: [r, g, b].map((n) => Math.round((n / 255) * 1e4) / 1e4),
  hex: `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`,
})

/** The hover `<name>-hover` of a text group's entries: `{ token }` when it can be derived, `{ against, ratio }` when the derived hover would fall below AA on a foreground the base passes on, or undefined for a base it is not made for. */
function deriveHover(entries, name) {
  const token = entries[name]
  const pairName = foregroundOf(name)
  const base = isNode(token) ? channels(token.$value) : null
  const pair = isNode(entries[pairName]) ? channels(entries[pairName].$value) : null
  if (!base || base.alpha < 1 || !pair) return undefined
  const top = composite(pair, base)
  const hover = hoverColour(base, top)
  // With no room to step away, the hover steps toward its foreground and can lose the contrast its base has.
  const ratio = contrastRatio(top, hover)
  if (ratio < TEXT_CONTRAST && contrastRatio(top, base) >= TEXT_CONTRAST) return { against: pairName, ratio }
  return { token: { $value: hexToken(hover), $extensions: { 'com.frontic.brand': { derived: true } } } }
}

/** Whether `hover` keeps the contrast of the colour on the role `name` where its base has it. */
function keepsContrast(entries, name, hover) {
  const base = channels(entries[name]?.$value)
  const pair = channels(entries[foregroundOf(name)]?.$value)
  if (!base || !pair) return true
  const top = composite(pair, base)
  return contrastRatio(top, hover) >= TEXT_CONTRAST || contrastRatio(top, base) < TEXT_CONTRAST
}

/** The colours a component hovers, as `<group>.<name>`: the only ones the contract derives a hover for. */
export const HOVERED = Object.freeze(['action.primary', 'commerce.buy', 'commerce.checkout', 'status.destructive', 'surface.foreground'])

/** The colour groups with a hover filled in for each HOVERED colour the brand writes none for, marked derived: one whose base is a reference
 * to a colour with a hover, written or derived, takes that hover as a reference to it; any other's is derived from its base and the colour
 * on it, both as `resolved` reads them. A translucent base, a base without that colour, and a hover that would fail where its base passes
 * get none; a target's hover that would fail so leaves the colour its own. Every hover the brand writes stays, on any colour. */
function withHovers(color, resolved) {
  const out = { ...color }
  for (const group of TEXT_GROUPS) if (isNode(color[group])) out[group] = { ...color[group] }
  const hovers = new Map()
  const hoverOf = (group, name, seen = []) => {
    const key = `${group}.${name}`
    if (hovers.has(key)) return hovers.get(key)
    if (!isNode(color[group]?.[name])) return null
    const entries = resolved[group]
    if (isNode(color[group][`${name}-hover`])) return hovers.set(key, channels(entries[`${name}-hover`]?.$value)).get(key)
    if (!HOVERED.includes(key)) return hovers.set(key, null).get(key)
    const [root, targetGroup, target, ...deeper] = aliasPath(color[group][name].$value)?.split('.') ?? []
    const followed = root === 'color' && target && !deeper.length && !/-(hover|foreground)$/.test(target) && !seen.includes(key) ? hoverOf(targetGroup, target, [...seen, key]) : null
    if (followed && keepsContrast(entries, name, followed)) {
      out[group][`${name}-hover`] = { $value: `{color.${targetGroup}.${target}-hover}`, $extensions: { 'com.frontic.brand': { derived: true } } }
      return hovers.set(key, followed).get(key)
    }
    const token = deriveHover(entries, name)?.token
    if (token) out[group][`${name}-hover`] = token
    return hovers.set(key, token ? channels(token.$value) : null).get(key)
  }
  for (const key of HOVERED) hoverOf(...key.split('.'))
  return out
}

/** Each opacity token whose value is not an integer from 0 to 100, as `opacity.<name>: <reason>`. */
export function brandOpacityProblems(tokens) {
  const { opacity } = resolveBrand(tokens).brand
  return members(isNode(opacity) ? opacity : {})
    .filter(([, t]) => !(Number.isInteger(t.$value) && t.$value >= 0 && t.$value <= 100))
    .map(([name]) => `opacity.${name}: an opacity is an integer from 0 to 100`)
}

/** Every token pair of the brand whose WCAG 2.x contrast is below its threshold, sorted by group then name; a pair
 * with a missing or non-colour token is skipped. A translucent token is composited over the pair's other colour first. */
export function brandContrastProblems(tokens, { text = TEXT_CONTRAST } = {}) {
  const brand = resolveBrand(withBrandStyles(isNode(tokens) ? tokens : {})).brand
  const color = isNode(brand.color) ? brand.color : {}
  const token = (group, name) => channels(isNode(color[group]) && isNode(color[group][name]) ? color[group][name].$value : undefined)
  const problems = []
  const passes = (group, name, foreground) => {
    const [top, base] = [token(group, foreground), token(group, name)]
    return !!top && !!base && contrastRatio(top, base) >= text
  }
  // `over` is the text or edge colour, measured on `under` after compositing; the pair is named by the token checked.
  const check = (group, name, pair, over, under, needs) => {
    const top = token(...over)
    const base = token(...under)
    if (!top || !base) return
    const ratio = contrastRatio(top, base)
    if (ratio < needs) problems.push({ group, name, pair, ratio, needs })
  }
  for (const group of TEXT_GROUPS) {
    for (const [name] of members(color[group])) {
      if (name === 'foreground' || name.endsWith('-foreground')) continue
      const foreground = foregroundOf(name)
      // A derived hover whose base fails is left to the base's report; one whose base passes is measured, since a hover with no room steps toward its foreground.
      if (ext(color[group][name]).derived && !passes(group, name.replace(/-hover$/, ''), foreground)) continue
      check(group, name, `${group}.${name} / ${group}.${foreground}`, [group, foreground], [group, name], text)
    }
  }
  for (const name of EDGE_TOKENS) check('edge', name, `edge.${name} / surface.background`, ['edge', name], ['surface', 'background'], EDGE_CONTRAST)
  return problems.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name)).map(({ pair, ratio, needs }) => ({ pair, ratio, needs }))
}

function dim(v, raw) {
  if (raw) return raw
  if (typeof v === 'string') return aliasVar(v) ?? v
  if (!isNode(v) || typeof v.value !== 'number') return ''
  return `${v.value}${v.unit}`
}

function stack(v) {
  if (aliasVar(v)) return aliasVar(v)
  return (Array.isArray(v) ? v : [v])
    .filter((p) => typeof p === 'string' && p)
    .map((p) => (/\s/.test(p) ? `'${p}'` : p))
    .join(', ')
}

function colorVars(node) {
  return [...colourOwners({ color: node })].map(([name, { token }]) => `  --fui-${name}: ${color(token.$value)};`).join('\n')
}

function dimVars(node, prefix) {
  return members(node)
    .map(([k, t]) => `  --fui-${prefix}${k}: ${dim(t.$value, ext(t).raw)};`)
    .join('\n')
}

function radiusVars(node) {
  return members(node)
    .map(([k, t]) => {
      const v = dim(t.$value, ext(t).raw)
      return k === 'base' ? `  --fui-radius: ${v};` : `  --fui-radius-${k}: ${v};`
    })
    .join('\n')
}

function fontVars(node) {
  const rows = []
  for (const [slot, t] of members(node.family)) {
    rows.push(`  --fui-font-${slot}: ${stack(t.$value)};`)
  }
  // Pre-V1 slot names; experiences authored against them must keep building.
  for (const [legacy, slot] of LEGACY_FONT_SLOTS) {
    if (isNode(node.family?.[slot])) rows.push(`  --fui-font-${legacy}: var(--fui-font-${slot});`)
  }
  rows.push(dimVars(node.size, 'text-'))
  for (const [k, t] of members(node.weight)) {
    rows.push(`  --fui-font-weight-${k}: ${aliasVar(t.$value) ?? t.$value};`)
  }
  return rows.filter(Boolean).join('\n')
}

// keep in sync with fontFeatureCss in apps/admin-ui/shared/utils/library/brandText.ts
function featureCss(value) {
  const v = value.trim()
  if (!/^[a-z0-9]{4}(\s*,\s*[a-z0-9]{4})*$/i.test(v)) return v
  return v
    .split(',')
    .map((tag) => `"${tag.trim()}"`)
    .join(', ')
}

// Authored text from $extensions lands in a declaration; anything that could end it is dropped.
const safe = (v) => (typeof v === 'string' && /^[^;{}<>\n]+$/.test(v) ? v : '')

function textVars(node) {
  const rows = []
  for (const [name, t] of members(node)) {
    const v = isNode(t.$value) ? t.$value : {}
    const notes = ext(t)
    rows.push(
      `  --fui-text-${name}-family: ${stack(v.fontFamily)};`,
      `  --fui-text-${name}-size: ${dim(v.fontSize)};`,
      `  --fui-text-${name}-line-height: ${v.lineHeight};`,
      `  --fui-text-${name}-weight: ${aliasVar(v.fontWeight) ?? v.fontWeight};`,
      `  --fui-text-${name}-tracking: ${safe(notes.letterSpacing) || 'normal'};`,
      `  --fui-text-${name}-feature: ${safe(notes.fontFeature) ? featureCss(notes.fontFeature) : 'normal'};`,
      `  --fui-text-${name}-variation: ${safe(notes.fontVariation) || 'normal'};`,
    )
  }
  return rows.join('\n')
}

// A media query cannot read a custom property, so a step's width is resolved at build time:
// the brand's own breakpoint, Tailwind's default without one.
function stepWidth(breakpoints, at) {
  const own = members(breakpoints).find(([k]) => k === at)?.[1]
  return safe(own ? dim(own.$value, ext(own).raw) : '') || DEFAULT_BREAKPOINTS[at]
}

// A container query cannot read a custom property either: a layout step's width is the brand's own container size, Tailwind's default without one.
function containerWidth(containers, step) {
  const name = stepName(step)
  const own = members(containers).find(([k]) => k === name)?.[1]
  return safe(own ? dim(own.$value, ext(own).raw) : '') || DEFAULT_CONTAINERS[name]
}

/** Each text style's `steps` as an override of its size and line height inside the breakpoint's media query. */
function textStepBlocks(node, selector, breakpoints) {
  const rows = {}
  for (const [name, t] of members(node)) {
    const { values, problems } = textStepValues(name, ext(t).steps)
    if (problems.length) throw new Error(problems[0])
    for (const [at, step] of Object.entries(values)) {
      rows[at] ??= []
      if (step.fontSize) rows[at].push(`    --fui-text-${name}-size: ${step.fontSize};`)
      if (step.lineHeight) rows[at].push(`    --fui-text-${name}-line-height: ${step.lineHeight};`)
    }
  }
  return Object.entries(rows)
    .filter(([, lines]) => lines.length)
    .map(([at, lines]) => `@media (width >= ${stepWidth(breakpoints, at)}) {\n  ${selector} {\n${lines.join('\n')}\n  }\n}`)
    .join('\n\n')
}

function borderVars(node) {
  return members(node)
    .map(([name, t]) => {
      const v = isNode(t.$value) ? t.$value : {}
      const css = v.style === 'none' ? 'none' : `${dim(v.width)} ${v.style} ${color(v.color)}`
      return `  --fui-border-${name}: ${css};`
    })
    .join('\n')
}

function ringVars(node) {
  return members(node)
    .flatMap(([name, t]) => {
      const v = isNode(t.$value) ? t.$value : {}
      return [`  --fui-ring-${name}: ${dim(v.width)} ${v.style} ${color(v.color)};`, `  --fui-ring-${name}-offset: ${isNode(v.offset) ? dim(v.offset) : '0px'};`]
    })
    .join('\n')
}

function opacityVars(node) {
  return members(node)
    .map(([name, t]) => `  --fui-opacity-${name}: ${typeof t.$value === 'number' ? t.$value / 100 : 0};`)
    .join('\n')
}

function shadowLayers(t) {
  const inset = new Set(ext(t).inset || [])
  const layers = Array.isArray(t.$value) ? t.$value : []
  return layers.map((l, i) => ({ ...l, inset: inset.has(i) }))
}

function shadowCss(t) {
  const layers = shadowLayers(t)
  if (!layers.length) return 'none'
  return layers
    .map((l) => {
      const parts = [dim(l.offsetX), dim(l.offsetY), dim(l.blur), dim(l.spread), color(l.color)]
      return l.inset ? `inset ${parts.join(' ')}` : parts.join(' ')
    })
    .join(', ')
}

// Approximations so inset-shadow-<name> and drop-shadow-<name> stay on brand:
// every layer turned inward, and the outer layers without spread at half blur.
function insetShadowCss(t) {
  return shadowLayers(t)
    .map((l) => ['inset', dim(l.offsetX), dim(l.offsetY), dim(l.blur), dim(l.spread), color(l.color)].join(' '))
    .join(', ')
}

function dropShadowCss(t) {
  const layers = shadowLayers(t)
  const outer = layers.some((l) => !l.inset) ? layers.filter((l) => !l.inset) : layers
  return outer
    .map((l) => {
      const blur = isNode(l.blur) && typeof l.blur.value === 'number' ? `${l.blur.value / 2}${l.blur.unit}` : dim(l.blur)
      return [dim(l.offsetX), dim(l.offsetY), blur, color(l.color)].join(' ')
    })
    .join(', ')
}

function shadowVars(node) {
  return members(node)
    .map(([name, t]) => `  --fui-shadow-${name}: ${shadowCss(t)};`)
    .join('\n')
}

// url() so a logo can be a background; the JSON keeps the bare URL for <img>.
function logoVars(logo) {
  const rows = Object.entries(logo || {})
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => `  --fui-logo-${k}: url('${v}');`)
  return rows.length ? `\n  /* logo */\n${rows.join('\n')}\n` : ''
}

// Blank groups would otherwise leave stray empty lines in the output.
function block(...parts) {
  return parts.filter(Boolean).join('\n')
}

// `@theme inline` maps Tailwind's namespaces onto the `--fui-*` vars above, so a
// value stays single-sourced in the scoped block.

function themeColorVars(node) {
  return [...colourOwners({ color: node }).keys()].map((name) => `  --color-${name}: var(--fui-${name});`).join('\n')
}

function themeFontVars(font, textStyleNames) {
  const slots = members(font.family).map(([slot]) => slot)
  for (const [legacy, slot] of LEGACY_FONT_SLOTS) {
    if (isNode(font.family?.[slot]) && !textStyleNames.includes(legacy)) slots.push(legacy)
  }
  return slots.map((slot) => `  --font-${slot}: var(--fui-font-${slot});`).join('\n')
}

function themeTextVars(font, text) {
  const sizes = members(font.size).map(([k]) => k)
  const fontSlots = members(font.family).map(([k]) => k)
  const rows = sizes.map((k) => `  --text-${k}: var(--fui-text-${k});`)
  for (const [name] of members(text)) {
    if (sizes.includes(name)) continue
    rows.push(
      `  --text-${name}: var(--fui-text-${name}-size);`,
      `  --text-${name}--line-height: var(--fui-text-${name}-line-height);`,
      `  --text-${name}--font-weight: var(--fui-text-${name}-weight);`,
      `  --text-${name}--letter-spacing: var(--fui-text-${name}-tracking);`,
    )
    if (!fontSlots.includes(name)) {
      rows.push(`  --font-${name}: var(--fui-text-${name}-family);`)
    }
  }
  return rows.join('\n')
}

function themeWeightVars(node) {
  return members(node)
    .map(([k]) => `  --font-weight-${k}: var(--fui-font-weight-${k});`)
    .join('\n')
}

function themeRadiusVars(node) {
  return members(node)
    .map(([k]) => (k === 'base' ? `  --radius: var(--fui-radius);` : `  --radius-${k}: var(--fui-radius-${k});`))
    .join('\n')
}

// Literal, not a var ref: Tailwind can only splice `shadow-<color>` into a
// shadow it can parse.
function themeShadowVars(node) {
  const shadows = members(node)
  const rows = shadows.map(([k, t]) => `  --shadow-${k}: ${shadowCss(t)};`)
  for (const [k, t] of shadows.filter(([, t]) => shadowLayers(t).length)) {
    rows.push(`  --inset-shadow-${k}: ${insetShadowCss(t)};`)
    rows.push(`  --drop-shadow-${k}: ${dropShadowCss(t)};`)
  }
  return rows.join('\n')
}

// Media-query and container-query conditions are static at build time, so
// these three resolve to literal values rather than `var(--fui-*)` refs.
/** The container sizes a brand may reference as `{container.<name>}`: Tailwind's scale, then each name of its own the scale lacks. */
export function containerNames(tokens) {
  const own = members(isNode(tokens) ? tokens.container : undefined).map(([name]) => name)
  return [...new Set([...Object.keys(DEFAULT_CONTAINERS), ...own])]
}

/** Tailwind's container scale, name to size, as a copy. */
export function defaultContainers() {
  return { ...DEFAULT_CONTAINERS }
}

const BOOTSTRAP_BREAKPOINTS = Object.freeze({ sm: '576px', md: '768px', lg: '992px', xl: '1200px', '2xl': '1400px' })

/** A storefront platform's layout breakpoints, by `storefront.meta.source`: the fallback when a derive cannot read the shop's own. */
export const PLATFORM_BREAKPOINTS = Object.freeze({ 'shopware-6': BOOTSTRAP_BREAKPOINTS, shopware: BOOTSTRAP_BREAKPOINTS })

function literalDimEntries(node, defaults) {
  const entries = members(node)
  return entries.length ? entries.map(([k, t]) => [k, dim(t.$value, ext(t).raw)]) : Object.entries(defaults)
}

function literalDimVars(node, defaults, prefix) {
  return literalDimEntries(node, defaults)
    .map(([k, v]) => `  --${prefix}${k}: ${v};`)
    .join('\n')
}

function containerVars(node) {
  const problems = brandContainerProblems({ container: node })
  if (problems.length) throw new Error(problems.join('\n'))
  const entries = Object.entries({ ...DEFAULT_CONTAINERS, ...Object.fromEntries(literalDimEntries(node, {})) })
  const keys = entries.filter(([k]) => MAX_WIDTH_KEYS.includes(k)).map(([k, v]) => `  --max-width-${k}: ${v};`)
  return [...entries.map(([k, v]) => `  --container-${k}: ${v};`), ...keys].join('\n')
}

function spacingValue(node) {
  const base = isNode(node) && isNode(node.base) ? dim(node.base.$value, ext(node.base).raw) : ''
  return base || DEFAULT_SPACING
}

function spacingVar(node) {
  return `  --fui-spacing: ${spacingValue(node)};`
}

/** The text-style and radius names the brand's theme defines, as `text-<name>` and `rounded-<name>` (`base`: bare `rounded`). */
export function brandUtilities(brand) {
  const tokens = withBrandStyles(isNode(brand) ? brand : {})
  return { text: textStyleUtilities(tokens), rounded: members(tokens.radius).map(([name]) => name) }
}

// Only fontsource packages: a brand names what the runtime installs, so it may not name any other package.
const FONTSOURCE_PACKAGE = /^@fontsource(-variable)?\/[a-z0-9-]+$/

/** The fontsource package each font family names in `$extensions`, as `{ [package]: '*' }`; the runtime pins the version. */
export function fontPackages(brand) {
  const family = isNode(brand) && isNode(brand.font) ? brand.font.family : undefined
  const packages = members(family)
    .map(([, token]) => ext(token).fontsource)
    .filter((name) => typeof name === 'string' && FONTSOURCE_PACKAGE.test(name))
  return Object.fromEntries([...new Set(packages)].sort().map((name) => [name, '*']))
}

const textStyleUtilities = (tokens) => {
  const sizes = members(tokens.font?.size).map(([k]) => k)
  return members(tokens.text)
    .map(([name]) => name)
    .filter((name) => !sizes.includes(name))
}

function renderThemeBlock(tokens, { reset = true } = {}) {
  const font = tokens.font || {}
  const textStyleNames = textStyleUtilities(tokens)
  const resets = reset
    ? `  --color-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
  --inset-shadow-*: initial;
  --drop-shadow-*: initial;
  --text-*: initial;

`
    : ''
  return `@theme inline {
${resets}  /* color */
${themeColorVars(tokens.color)}

  /* type */
  --default-font-family: var(--fui-font-sans);
${block(themeFontVars(font, textStyleNames), themeTextVars(font, tokens.text), themeWeightVars(font.weight))}

  /* shape */
${block(themeRadiusVars(tokens.radius), themeShadowVars(tokens.shadow))}

  /* layout */
  --spacing: var(--fui-spacing);
${literalDimVars(tokens.breakpoint, DEFAULT_BREAKPOINTS, 'breakpoint-')}
${containerVars(tokens.container)}

  /* motion */
  --animate-progress-indeterminate: progress-indeterminate 1.5s ease-in-out infinite;
  @keyframes progress-indeterminate {
    from {
      transform: translateX(-66.667%) scaleX(0.333);
    }
    to {
      transform: translateX(66.667%) scaleX(0.333);
    }
  }
}`
}

/** Every `*.json` file under `dir`, dot-entries skipped, as paths relative to `root`, and a problem for each link that could be a
 * recipe file or folder but whose target is missing. */
async function jsonFiles(dir, root, seen = new Set(), problems = []) {
  const entries = await readdir(dir, { withFileTypes: true }).catch((error) => {
    if (error.code === 'ENOENT') return null
    throw error
  })
  if (!entries) return { files: [], problems }
  seen.add(await realpath(dir))
  const files = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    const relative = path.relative(root, full).split(path.sep).join('/')
    let isDirectory = entry.isDirectory()
    if (entry.isSymbolicLink()) {
      const target = await stat(full).catch((error) => error)
      if (target instanceof Error) {
        if (entry.name.endsWith('.json') || !path.extname(entry.name)) problems.push(`${relative}: a symlink whose target is missing (${target.code})`)
        continue
      }
      isDirectory = target.isDirectory()
    }
    if (isDirectory) {
      if (!seen.has(await realpath(full))) files.push(...(await jsonFiles(full, root, seen, problems)).files)
    } else if (entry.name.endsWith('.json')) files.push({ path: relative, text: await readFile(full, 'utf8') })
  }
  return { files, problems }
}

/** The recipe files under `dir`, read by `readRecipeFiles`; paths are relative to `root`, the library folder by default, so they read
 * `recipes/button.json` and each caller prefixes its own library folder. A missing `dir` holds no recipes. */
export async function readRecipeFolder(dir, { root = path.dirname(dir) } = {}) {
  const { files, problems } = await jsonFiles(dir, root)
  const read = readRecipeFiles(files)
  return { ...read, problems: [...problems, ...read.problems] }
}

/** The folders under `dir`, dot-entries skipped and links followed; none when `dir` is missing. */
async function folders(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch((error) => {
    if (error.code === 'ENOENT') return []
    throw error
  })
  const found = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const isDirectory = entry.isSymbolicLink() ? (await stat(path.join(dir, entry.name)).catch(() => null))?.isDirectory() : entry.isDirectory()
    if (isDirectory) found.push(entry.name)
  }
  return found
}

/** The text of each component manifest (`components/<tier>/<name>/<name>.json`), paths from the library folder, and a problem for
 * each manifest it cannot read. */
async function manifestTexts(libraryDir) {
  const files = []
  const problems = []
  for (const tier of await folders(path.join(libraryDir, 'components'))) {
    for (const name of await folders(path.join(libraryDir, 'components', tier))) {
      const relative = `components/${tier}/${name}/${name}.json`
      const text = await readFile(path.join(libraryDir, relative), 'utf8').catch((error) => error)
      if (!(text instanceof Error)) files.push({ path: relative, text })
      else if (text.code !== 'ENOENT') problems.push(`${relative}: cannot be read (${text.code})`)
    }
  }
  return { files, problems }
}

const MANIFEST_PATH = /^components\/([^/]+)\/([^/]+)\/\2\.json$/

/** The trees a component manifest holds under `recipes` as a recipe file, none when it holds no `recipes`, or a problem. */
function manifestRecipes(file, text) {
  let manifest
  try {
    manifest = JSON.parse(text)
  } catch {
    return { problem: `${file}: not JSON` }
  }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return { problem: `${file}: holds an item’s manifest, a JSON object` }
  if (manifest.recipes === undefined) return {}
  if (!manifest.recipes || typeof manifest.recipes !== 'object' || Array.isArray(manifest.recipes)) return { problem: `${file}: recipes: holds the item’s trees by name, a JSON object` }
  return { file: { path: file, text: JSON.stringify(manifest.recipes) } }
}

/** A library's recipes from its files' text by path from the library folder, whichever layout it is in or between: every JSON file
 * under `recipes/` (the `shared/` folder too) and the trees in each component manifest; a path with a dot-segment and any other file
 * are skipped. A recipe is a tree or flat by what it holds, not where it sits. A name defined twice is a problem naming both files, and
 * the newer layout's definition is the one read: a component manifest over `recipes/`, `recipes/` over `recipes/shared/`. */
export function readLibraryRecipeFiles(files) {
  const recipes = []
  const manifests = []
  const read = { flat: {}, trees: {}, paths: {}, problems: [] }
  for (const [file, text] of Object.entries(files)) {
    if (file.split('/').some((part) => part.startsWith('.'))) continue
    if (file.startsWith('recipes/') && file.endsWith('.json')) recipes.push({ path: file, text })
    else if (MANIFEST_PATH.test(file)) {
      const { file: trees, problem } = manifestRecipes(file, text)
      if (problem) read.problems.push(problem)
      else if (trees) manifests.push(trees)
    }
  }
  const shared = (file) => file.path.startsWith('recipes/shared/')
  for (const layout of [manifests, recipes.filter((file) => !shared(file)), recipes.filter(shared)]) {
    const { flat, trees, paths, problems } = readRecipeFiles(layout)
    read.problems.push(...problems)
    for (const [name, file] of Object.entries(paths)) {
      if (Object.hasOwn(read.paths, name)) read.problems.push(`${file}: ${name}: defined in ${read.paths[name]} too`)
      else {
        read.paths[name] = file
        if (Object.hasOwn(trees, name)) read.trees[name] = trees[name]
        else read.flat[name] = flat[name]
      }
    }
  }
  return read
}

/** `readLibraryRecipeFiles` over the files of `<root>/library`; a file it cannot read is a problem. A missing library holds no recipes. */
export async function readLibraryRecipes(root) {
  const libraryDir = path.join(root, 'library')
  const folder = await jsonFiles(path.join(libraryDir, 'recipes'), libraryDir)
  const manifests = await manifestTexts(libraryDir)
  const read = readLibraryRecipeFiles(Object.fromEntries([...folder.files, ...manifests.files].map((file) => [file.path, file.text])))
  return { ...read, problems: [...folder.problems, ...manifests.problems, ...read.problems] }
}

function recipeVars(entries) {
  const rows = entries.flatMap(({ recipe, vars }) => vars.filter((v) => !v.reset && !v.local).map(({ suffix, declaration }) => `  --fui-${recipe}-${suffix}: ${declaration};`))
  return rows.length ? `\n  /* recipes */\n${rows.join('\n')}\n` : ''
}

// Tailwind sorts a rule by the property this names and drops it: base, then values, then every utility, so a
// passed class wins on any property; no utility starts on these properties but its own. A pair's rule nests in
// each of its values, so the copy in whichever value Tailwind orders last comes after both.
const SORT_FIRST = { base: 'container-type', value: 'pointer-events' }

// The focus ring takes the colours its element's value recipe sets, its own without one.
const RING_READS = { 'outline-color': RING_PROPERTIES.ringColor, 'border-color': RING_PROPERTIES.ringBorderColor }
const RING_REGISTRATIONS = Object.values(RING_PROPERTIES)
  .map((name) => `@property ${name} {\n  syntax: '*';\n  inherits: false;\n}`)
  .join('\n\n')

/** The ring's colour on the element: the one its value recipe sets, the shared ring's own without one. */
const RING_COLOR = `var(${RING_PROPERTIES.ringColor}, var(--fui-${FOCUS_RING}-outline-color))`

// At rest a ringed element already holds the ring's colour at zero width, so a transition grows the ring, never fades it in from currentColor.
const RING_REST = `@layer base {\n  :where([class*='fui-${FOCUS_RING}']) {\n    outline: 0 solid ${RING_COLOR};\n  }\n}`

// A local declaration reads a variable the element itself carries (a Reka popup's size), which a root variable would resolve too early.
const flatDeclaration = (recipe, property, suffix, local) => {
  if (local) return local
  const own = `var(--fui-${recipe}-${suffix})`
  return recipe === FOCUS_RING && RING_READS[property] ? `var(${RING_READS[property]}, ${own})` : own
}

// A recipe's declarations at `indent`: the flat ones, then each part variable it redeclares (a base resets it to the part's own
// declaration, a value points it at its own variable), then each nested var inside its selector, then each step inside its container query.
function ruleLines(recipe, vars, widths, indent) {
  const pad = ' '.repeat(indent)
  const lines = vars
    .filter((v) => !v.media)
    .flatMap(({ suffix, properties, declaration, local }) => (properties ?? []).map((property) => `${pad}${property}: ${flatDeclaration(recipe, property, suffix, local && declaration)};`))
  for (const { suffix, declaration, part, partSuffix, reset } of vars) if (part) lines.push(`${pad}--fui-${part}-${partSuffix}: ${reset ? declaration : `var(--fui-${recipe}-${suffix})`};`)
  const nestedLines = new Map()
  for (const { suffix, nested } of vars) {
    if (!nested) continue
    const group = nestedLines.get(nested.selector) ?? []
    group.push(...nested.properties.map((property) => `${pad}  ${property}: var(--fui-${recipe}-${suffix});`))
    nestedLines.set(nested.selector, group)
  }
  for (const [selector, group] of nestedLines) {
    // A pseudo-element draws only with content; the fallback draws it where no after: utility registers --tw-content.
    const content = selector === RECIPE_PARTS.after ? [`${pad}  content: var(--tw-content, '');`] : []
    lines.push(`${pad}${selector} {`, ...content, ...group, `${pad}}`)
  }
  for (const step of LAYOUT_STEPS) {
    const stepped = vars
      .filter((v) => v.media === step)
      .flatMap(({ suffix, properties, declaration, local }) => properties.map((property) => `${pad}  ${property}: ${local ? declaration : `var(--fui-${recipe}-${suffix})`};`))
    if (stepped.length) lines.push(`${pad}@container (width >= ${widths[step]}) {`, ...stepped, `${pad}}`)
  }
  return lines
}

// One `@utility fui-<name>` per base, value and flat recipe; a pair renders as a rule in each of its values, selecting the others.
function recipeUtilities(entries, widths) {
  const pairs = new Map()
  for (const entry of entries) if (entry.layer === 'compound') for (const cls of entry.classes) pairs.set(cls, [...(pairs.get(cls) ?? []), entry])
  const utilities = entries
    .filter(({ layer }) => layer !== 'compound')
    .map(({ recipe, layer, vars }) => {
      const lines = [`  --tw-sort: ${SORT_FIRST[layer]};`, ...ruleLines(recipe, vars, widths, 2)]
      for (const pair of pairs.get(recipe) ?? []) {
        const inner = ruleLines(pair.recipe, pair.vars, widths, 4)
        if (inner.length)
          lines.push(
            `  &:where(${pair.classes
              .filter((cls) => cls !== recipe)
              .map((cls) => `.fui-${cls}`)
              .join('')}) {`,
            ...inner,
            `  }`,
          )
      }
      // Tailwind drops --tw-sort and refuses a utility with nothing else; no token name holds `_`, so this reads as no one's.
      if (lines.length === 1) lines.push('  --fui_empty: initial;')
      return `@utility fui-${recipe} {\n${lines.join('\n')}\n}`
    })
    .join('\n\n')
  // The rest rule reads the ring's outline colour, so a ring drawn without one (a shadow ring) gets none.
  const ringed = entries.some(({ recipe, vars }) => recipe === FOCUS_RING && vars.some(({ suffix }) => suffix === 'outline-color'))
  return utilities && `${utilities}\n\n${RING_REGISTRATIONS}${ringed ? `\n\n${RING_REST}` : ''}`
}

// Reka's states, sides and motions as named variants, so enter, exit and side-aware animations need no arbitrary variant.
const STATE_VARIANTS = [
  ['data-open', ['[data-state="open"]', '[data-open]:not([data-open="false"])']],
  ['data-closed', ['[data-state="closed"]', '[data-closed]:not([data-closed="false"])']],
  ...['delayed-open', 'visible', 'hidden', 'indeterminate'].map((state) => [`data-state-${state}`, [`[data-state="${state}"]`]]),
  ...['top', 'right', 'bottom', 'left'].map((side) => [`data-side-${side}`, [`[data-side="${side}"]`]]),
  ...['from', 'to'].map((way) => [`data-motion-${way}`, [`[data-motion^="${way}-"]`]]),
  ...['from-start', 'from-end', 'to-start', 'to-end'].map((motion) => [`data-motion-${motion}`, [`[data-motion="${motion}"]`]]),
]
const CUSTOM_VARIANTS = STATE_VARIANTS.map(([name, selectors]) => `@custom-variant ${name} {\n${selectors.map((s) => `  &:where(${s}) {\n    @slot;\n  }`).join('\n')}\n}`).join('\n\n')

// `project` is a developer's own app: its Tailwind namespaces keep their defaults. `container` is the rule making the container a layout step
// falls back to querying: the experience root itself, since a body rule never reaches a shadow host's body and must not contain a host app's;
// the page where the brand owns the document.
// A shadow host is inline by default, where containment does not apply, so the experience scope makes it block-level; a
// hidden host stays hidden, since an author display rule would otherwise beat the browser's [hidden] rule.
// Preflight sets the document's font and text defaults on `html, :host`. An experience root mounted in the light DOM is neither, so its text
// would inherit <html>'s, where the brand's variables are undefined: the root takes the same defaults itself, from the brand's theme.
const EXPERIENCE_ROOT_BASE = `@layer base {
  :where(.frontic-experience-root) {
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    tab-size: 4;
    font-family: --theme(--default-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
    font-feature-settings: --theme(--default-font-feature-settings, normal);
    font-variation-settings: --theme(--default-font-variation-settings, normal);
    -webkit-tap-highlight-color: transparent;
  }
}
`

// Inline-size containment gives the container no intrinsic width, so a mount sized by its content (a flex item, an inline-block, a
// float) would collapse to zero: the experience container takes its containing block's width instead, margins respected where
// `stretch` or a prefixed form of it applies. It sits in the base layer, so a merchant's own sizing of the mount, layered or not, wins.
const EXPERIENCE_CONTAINER = `@layer base {
  :where(.frontic-experience-root, :host) {
    container-type: inline-size;
    inline-size: 100%;
    inline-size: -webkit-fill-available;
    inline-size: -moz-available;
    inline-size: stretch;
  }
}`

const BODY_CONTAINER = `body {\n  container-type: inline-size;\n}`

const SCOPES = {
  experience: { selector: ':where(.frontic-experience-root, :host)', reset: true, container: EXPERIENCE_CONTAINER, host: true },
  root: { selector: ':root', reset: true, container: BODY_CONTAINER },
  project: { selector: ':root', reset: false, container: BODY_CONTAINER },
}

/** The text styles, borders and shadows generic recipes may name; a brand without one renders this. */
export const BRAND_STYLES = {
  text: {
    heading: {
      $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 1.5, unit: 'rem' }, fontWeight: 600, lineHeight: 1.25 },
      $extensions: { 'com.frontic.brand': { family: 'heading' } },
    },
    body: { $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 1, unit: 'rem' }, fontWeight: 400, lineHeight: 1.5 }, $extensions: { 'com.frontic.brand': { family: 'sans' } } },
    ui: { $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 0.875, unit: 'rem' }, fontWeight: 500, lineHeight: 1.43 }, $extensions: { 'com.frontic.brand': { family: 'sans' } } },
    small: {
      $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 0.875, unit: 'rem' }, fontWeight: 400, lineHeight: 1.43 },
      $extensions: { 'com.frontic.brand': { family: 'sans' } },
    },
    caption: {
      $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 0.75, unit: 'rem' }, fontWeight: 500, lineHeight: 1.33 },
      $extensions: { 'com.frontic.brand': { family: 'sans' } },
    },
    control: {
      $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 1, unit: 'rem' }, fontWeight: 400, lineHeight: 1.5 },
      $extensions: { 'com.frontic.brand': { family: 'sans', steps: { md: { fontSize: { value: 0.875, unit: 'rem' }, lineHeight: 1.43 } } } },
    },
    display: {
      $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 2.25, unit: 'rem' }, fontWeight: 400, lineHeight: '2.5rem' },
      $extensions: { 'com.frontic.brand': { family: 'sans' } },
    },
    headline: {
      $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 1.5, unit: 'rem' }, fontWeight: 400, lineHeight: '2rem' },
      $extensions: { 'com.frontic.brand': { family: 'sans' } },
    },
    'page-title': {
      $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 1.5, unit: 'rem' }, fontWeight: 600, lineHeight: '2rem' },
      $extensions: { 'com.frontic.brand': { family: 'heading' } },
    },
    title: {
      $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 1.25, unit: 'rem' }, fontWeight: 600, lineHeight: '1.75rem' },
      $extensions: { 'com.frontic.brand': { family: 'heading' } },
    },
    subheading: {
      $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 1.125, unit: 'rem' }, fontWeight: 600, lineHeight: '1.75rem' },
      $extensions: { 'com.frontic.brand': { family: 'heading' } },
    },
    lead: {
      $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 1.125, unit: 'rem' }, fontWeight: 400, lineHeight: 'calc(1.75 / 1.125)' },
      $extensions: { 'com.frontic.brand': { family: 'sans' } },
    },
    copy: {
      $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 0.875, unit: 'rem' }, fontWeight: 400, lineHeight: '1.5rem' },
      $extensions: { 'com.frontic.brand': { family: 'sans' } },
    },
    note: {
      $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 0.8125, unit: 'rem' }, fontWeight: 400, lineHeight: 1.43 },
      $extensions: { 'com.frontic.brand': { family: 'sans' } },
    },
    description: {
      $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 0.875, unit: 'rem' }, fontWeight: 400, lineHeight: 1.625 },
      $extensions: { 'com.frontic.brand': { family: 'sans' } },
    },
    micro: {
      $value: { fontFamily: ['system-ui', 'sans-serif'], fontSize: { value: 0.625, unit: 'rem' }, fontWeight: 500, lineHeight: 1.33 },
      $extensions: { 'com.frontic.brand': { family: 'sans' } },
    },
  },
  border: {
    default: { $value: { width: { value: 1, unit: 'px' }, style: 'solid', color: '{color.edge.border}' } },
    strong: { $value: { width: { value: 1, unit: 'px' }, style: 'solid', color: '{color.surface.foreground}' } },
    focus: { $value: { width: { value: 2, unit: 'px' }, style: 'solid', color: '{color.edge.ring}' } },
    frame: { $value: { width: { value: 4, unit: 'px' }, style: 'solid', color: '{color.surface.background}' } },
    'frame-thin': { $value: { width: { value: 2, unit: 'px' }, style: 'solid', color: '{color.surface.background}' } },
  },
  ring: {
    hairline: { $value: { width: { value: 1, unit: 'px' }, style: 'solid', color: '{color.edge.border}', offset: { value: 0, unit: 'px' } } },
    focus: { $value: { width: { value: 2, unit: 'px' }, style: 'solid', color: '{color.edge.ring}', offset: { value: 0, unit: 'px' } } },
    wide: { $value: { width: { value: 3, unit: 'px' }, style: 'solid', color: '{color.edge.ring}', offset: { value: 0, unit: 'px' } } },
    outset: { $value: { width: { value: 2, unit: 'px' }, style: 'solid', color: '{color.edge.ring}', offset: { value: 2, unit: 'px' } } },
    frame: { $value: { width: { value: 2, unit: 'px' }, style: 'solid', color: '{color.surface.background}', offset: { value: 0, unit: 'px' } } },
    none: { $value: { width: { value: 0, unit: 'px' }, style: 'solid', color: 'transparent', offset: { value: 0, unit: 'px' } } },
  },
  opacity: Object.fromEntries([50, 60, 90, 100].map((n) => [String(n), { $value: n }])),
  shadow: {
    xs: {
      $value: [
        {
          color: { colorSpace: 'srgb', components: [0, 0, 0], hex: '#000000', alpha: 0.05 },
          offsetX: { value: 0, unit: 'px' },
          offsetY: { value: 1, unit: 'px' },
          blur: { value: 2, unit: 'px' },
          spread: { value: 0, unit: 'px' },
        },
      ],
    },
  },
}

const onOwnFamily = (tokens, style) => {
  const own = tokens.font?.family?.[style.$extensions['com.frontic.brand'].family]?.$value
  return own === undefined ? style : { ...style, $value: { ...style.$value, fontFamily: structuredClone(own) } }
}

/** The brand with a copy of every BRAND_STYLES member it lacks, a filled text style on the brand's own family, and every hover colour it leaves out derived. */
export function withBrandStyles(tokens) {
  const shadow = { $type: 'shadow', ...(isNode(tokens.shadow) ? tokens.shadow : {}) }
  for (const [name, style] of Object.entries(BRAND_STYLES.shadow)) if (!isNode(shadow[name])) shadow[name] = structuredClone(style)
  const text = { $type: 'typography', ...(isNode(tokens.text) ? tokens.text : {}) }
  for (const [name, style] of Object.entries(BRAND_STYLES.text)) if (!isNode(text[name])) text[name] = onOwnFamily(tokens, structuredClone(style))
  const border = { $type: 'border', ...(isNode(tokens.border) ? tokens.border : {}) }
  for (const [name, style] of Object.entries(BRAND_STYLES.border)) if (!isNode(border[name])) border[name] = structuredClone(style)
  const ring = { $type: 'ring', ...(isNode(tokens.ring) ? tokens.ring : {}) }
  for (const [name, style] of Object.entries(BRAND_STYLES.ring)) if (!isNode(ring[name])) ring[name] = structuredClone(style)
  const opacity = { $type: 'number', ...(isNode(tokens.opacity) ? tokens.opacity : {}) }
  for (const [name, step] of Object.entries(BRAND_STYLES.opacity)) if (!isNode(opacity[name])) opacity[name] = structuredClone(step)
  return { ...tokens, ...(isNode(tokens.color) && { color: withHovers(tokens.color, resolveBrand(tokens).brand.color) }), text, border, ring, opacity, shadow }
}

// The brand group a recipe reference group resolves in; spacing, container and components resolve outside the brand.
const REF_BRAND_GROUPS = { rounded: 'radius', border: 'border', ring: 'ring', opacity: 'opacity', shadow: 'shadow', typography: 'text' }

/** Every recipe reference to a token the brand does not define, as `{ recipe, at, ref }`, one per recipe and reference at its first path, sorted by recipe then path. */
export function recipeTokenProblems(recipes, brand) {
  const tokens = withBrandStyles(isNode(brand) ? brand : {})
  const resolved = resolveBrand(tokens).brand
  const colours = colourOwners(tokens)
  // Why a hover of a HOVERED colour the brand leaves out has no derived value: its base passes on its foreground, the derived hover would not.
  const underived = (name) => {
    if (!name.endsWith('-hover')) return undefined
    const base = name.slice(0, -'-hover'.length)
    const group = colours.get(base)?.group
    const result = group && HOVERED.includes(`${group}.${base}`) && deriveHover(resolved.color[group], base)
    return result && !result.token ? result : undefined
  }
  const defined = (ref) => (ref.group === 'colors' ? colours.has(ref.name) : !Object.hasOwn(REF_BRAND_GROUPS, ref.group) || isNode(tokens[REF_BRAND_GROUPS[ref.group]]?.[ref.name]))
  const found = []
  const walk = (recipe, value, at) => {
    if (typeof value === 'string') {
      const ref = parseRef(value)
      if (ref && !ref.problem && !defined(ref)) {
        const why = ref.group === 'colors' ? underived(ref.name) : undefined
        found.push({ recipe, at: at.join('.'), ref: value.trim(), ...(why && { underived: why }) })
      }
    } else if (isNode(value) || Array.isArray(value)) for (const [key, inner] of Object.entries(value)) walk(recipe, inner, [...at, key])
  }
  for (const group of [recipes?.flat, recipes?.trees]) for (const [name, def] of Object.entries(isNode(group) ? group : {})) walk(name, def, [])
  const seen = new Set()
  return found.sort((a, b) => a.recipe.localeCompare(b.recipe) || a.at.localeCompare(b.at)).filter((p) => !seen.has(`${p.recipe} ${p.ref}`) && seen.add(`${p.recipe} ${p.ref}`))
}

/** Each reference the brand writes that does not resolve, read as written: a hover the contract derives is no token yet, so a reference to
 * one is `missing`, as the stack's resolver finds it on the stored brand. */
export function brandReferenceProblems(brand) {
  return resolveBrand(brand).problems
}

/** Throws on a brand reference that does not resolve, every one listed at its path, on a colour name two groups hold, and on a token declaration that would still hold a
 * brace, rather than write either into the stylesheet. A logo URL and the recipes are not token values, and a brace there is theirs. */
export function renderBaseCss(brand, recipes = {}, { scope = 'experience' } = {}) {
  const problems = brandReferenceProblems(brand)
  if (problems.length) throw new Error(`brand references that do not resolve:\n${brandReferenceLines(problems).join('\n')}`)
  const names = brandColourNameProblems(brand)
  if (names.length) throw new Error(`brand colours that share a name:\n${names.join('\n')}`)
  const tokens = cssTokens(withBrandStyles(brand))
  const target = SCOPES[scope]
  if (!target) throw new Error(`unknown brand CSS scope: ${scope}`)
  const { selector, reset, container, host } = target
  const recipeData = recipeEntries(recipes)
  const utilities = recipeUtilities(recipeData, Object.fromEntries(LAYOUT_STEPS.map((step) => [step, containerWidth(tokens.container, step)])))
  const steps = textStepBlocks(tokens.text, selector, tokens.breakpoint)
  const color = colorVars(tokens.color)
  const type = block(fontVars(tokens.font || {}), textVars(tokens.text))
  const shape = block(radiusVars(tokens.radius), borderVars(tokens.border), ringVars(tokens.ring), opacityVars(tokens.opacity), shadowVars(tokens.shadow))
  const layout = spacingVar(tokens.spacing)
  const theme = renderThemeBlock(tokens, { reset })
  const braced = [...[color, type, shape, layout, steps, theme].join('\n').matchAll(BRACED_DECLARATION)].map(([line]) => line.trim())
  if (braced.length) throw new Error(`brand values that are not CSS:\n${braced.join('\n')}`)
  return `${HEADER}
${selector} {
  box-sizing: border-box;

  /* color */
${color}

  /* type */
${type}

  /* shape */
${shape}

  /* layout */
${layout}
${logoVars(ext(tokens).logo)}${recipeVars(recipeData)}}
${steps ? `\n${steps}\n` : ''}
${theme}

${container}
${host ? `\n:host {\n  display: block;\n}\n\n:host([hidden]) {\n  display: none;\n}\n\n${EXPERIENCE_ROOT_BASE}` : ''}
${CUSTOM_VARIANTS}
${utilities ? `\n${utilities}\n` : ''}`
}

export const PROJECT_STYLESHEET_HEADER = '/* Generated by Frontic. The CLI overwrites this file; do not edit it. */'

/** `fonts`: the font packages the project has installed. Each one the brand names is imported under the header, before any rule, so its
 * @font-face reaches the page; a package the project lacks is left out, since its import would not resolve. */
export function renderProjectStylesheet(tokens, recipes = {}, { fonts = [] } = {}) {
  const imports = Object.keys(fontPackages(tokens))
    .filter((name) => fonts.includes(name))
    .map((name) => `@import '${name}';\n`)
    .join('')
  return `${PROJECT_STYLESHEET_HEADER}\n${imports}${renderBaseCss(tokens, recipes, { scope: 'project' })}`
}

const DEFAULT_PRESET = 'default'

function readPreset(dir, file) {
  const id = file.slice(0, -'.json'.length)
  const at = path.join(dir, file)
  const { name } = ext(JSON.parse(readFileSync(at, 'utf8')))
  if (typeof name !== 'string' || !name) throw new Error(`style preset ${id} has no $extensions name`)
  return Object.freeze({ id, name, path: at })
}

/** The brands a project can start its library from: every file in style-presets/ beside this module, `default` first.
 * Read on each call, so a bundle hosting this code finds the folder beside itself. */
export function stylePresets() {
  const dir = fileURLToPath(new URL('./style-presets/', import.meta.url))
  return Object.freeze(
    readdirSync(dir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => readPreset(dir, file))
      .sort((a, b) => Number(b.id === DEFAULT_PRESET) - Number(a.id === DEFAULT_PRESET) || (a.id < b.id ? -1 : 1)),
  )
}

export function stylePresetPath(id) {
  const presets = stylePresets()
  const preset = presets.find((p) => p.id === id)
  if (!preset) throw new Error(`unknown style preset: ${id}; one of ${presets.map((p) => p.id).join(', ')}`)
  return preset.path
}

const defaultLog = (message) => console.error(`[brand-css] ${message}`)

async function readBrandTokens(tokenPath, log) {
  if (!existsSync(tokenPath)) return JSON.parse(await readFile(stylePresetPath(DEFAULT_PRESET), 'utf8'))
  try {
    return JSON.parse(await readFile(tokenPath, 'utf8'))
  } catch (err) {
    log(`library/brand.json is invalid, using the default brand: ${err.message}`)
    return JSON.parse(await readFile(stylePresetPath(DEFAULT_PRESET), 'utf8'))
  }
}

/** Never an error: a missing or broken library/brand.json renders the default brand.
 * A valid-JSON-but-wrong-shape brand.json still throws out of renderBaseCss — callers log that one. */
export async function buildBrandCss(contentDir, { log = defaultLog, scope } = {}) {
  const tokens = await readBrandTokens(path.join(contentDir, 'library', 'brand.json'), log)
  const recipes = await readLibraryRecipes(contentDir)
  for (const problem of recipes.problems) log(problem)
  const cssPath = path.join(contentDir, 'styles', 'base.css')
  const next = renderBaseCss(tokens, recipes, { scope })
  // Skip an identical write so a watcher doesn't loop on its own output.
  if (existsSync(cssPath) && (await readFile(cssPath, 'utf8')) === next) {
    return false
  }
  await mkdir(path.dirname(cssPath), { recursive: true })
  await writeFile(cssPath, next)
  return true
}

/** Converts a library's `recipes/` from one recipe per file to recipes by name (`convertRecipeFiles`), item names from the library's
 * `registry.json`. With `check` it writes nothing and returns the same plan. A problem leaves the folder as it was. */
export async function convertRecipeFolder(libraryDir, { check = false } = {}) {
  const { files, problems } = await jsonFiles(path.join(libraryDir, 'recipes'), libraryDir)
  if (problems.length) return { writes: [], removes: [], problems }
  const registry = await readFile(path.join(libraryDir, 'registry.json'), 'utf8').catch((error) => {
    if (error.code === 'ENOENT') return '{}'
    throw error
  })
  const items = (JSON.parse(registry).items ?? []).map((item) => item.name)
  const plan = convertRecipeFiles(files, items)
  if (check || plan.problems.length) return plan
  for (const { path: file, text } of plan.writes) {
    await mkdir(path.dirname(path.join(libraryDir, file)), { recursive: true })
    await writeFile(path.join(libraryDir, file), text)
  }
  for (const file of plan.removes) await rm(path.join(libraryDir, file))
  return plan
}
