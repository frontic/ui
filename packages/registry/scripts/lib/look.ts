import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { renderBaseCss, stylePresetPath } from '@frontic/library-contract/brand'
import { clsx } from 'clsx'
import { compile } from 'tailwindcss'
import { parse } from 'vue/compiler-sfc'
import { combosFor, comboKey, itemAxes, js, propAxes, scriptConsts, type Files } from './axes'
import { TIERS } from './items'
import type { Combo } from './snapshot'
import { readRegistryRecipes } from './recipes'

/** The part of Vue's template AST the check reads. */
interface TemplateNode {
  type: number
  tag?: string
  props?: { type: number; name: string; value?: { content: string }; arg?: { type: number; content?: string }; exp?: { type: number; content?: string } }[]
  children?: TemplateNode[]
}

/** One element of a template: its key, its tag and its class, static or bound. */
interface RawElement {
  key: string
  file: string
  tag: string
  staticClass: string
  boundClass: string | null
}

const attr = (node: TemplateNode, name: string): string | null => {
  for (const prop of node.props ?? []) {
    if (prop.type === 6 && prop.name === name) return prop.value?.content ?? ''
    if (prop.type === 7 && prop.name === 'bind' && prop.arg?.type === 4 && prop.arg.content === name && prop.exp?.type === 4) return `{{${prop.exp.content}}}`
  }
  return null
}

/** The elements a file's template renders, keyed by data-slot; an unslotted element with a class by its slotted ancestor and order. */
function templateElements(file: string, text: string): RawElement[] {
  if (!text.includes('<template')) return []
  const { descriptor } = parse(text, { filename: file })
  if (!descriptor.template) return []
  const out: RawElement[] = []
  const walk = (nodes: TemplateNode[], parent: string, counter: { n: number }) => {
    for (const element of nodes) {
      if (element.type !== 1) continue
      const written = attr(element, 'data-slot')
      // A slot a wrapper may replace, `:data-slot="$attrs['data-slot'] ?? 'input'"`, keys by its fallback.
      const slot = written?.startsWith('{{') ? (/\?\? '([\w-]+)'\}\}$/.exec(written)?.[1] ?? written) : written
      const classes = (element.props ?? []).flatMap((prop) => {
        if (prop.type === 6 && prop.name === 'class') return [JSON.stringify(prop.value?.content ?? '')]
        if (prop.type === 7 && prop.name === 'bind' && prop.arg?.type === 4 && prop.arg.content === 'class' && prop.exp?.type === 4) return [prop.exp.content!]
        return []
      })
      // A static `class` beside a bound `:class` joins it, as Vue merges them.
      const staticClass = classes.length > 1 ? `{{[${classes.join(', ')}]}}` : attr(element, 'class')
      const bound = staticClass?.startsWith('{{') ? staticClass.slice(2, -2) : null
      const key = slot && !slot.startsWith('{{') ? slot : `${parent} > [${counter.n}]`
      const hasClass = staticClass !== null
      if (slot || hasClass) {
        if (!slot) counter.n++
        out.push({ key, file, tag: element.tag ?? '', staticClass: bound === null ? (staticClass ?? '') : '', boundClass: bound })
      }
      walk(element.children ?? [], slot && !slot.startsWith('{{') ? slot : parent, slot ? { n: 0 } : counter)
    }
  }
  walk((descriptor.template.ast?.children ?? []) as unknown as TemplateNode[], file.replace(/\.vue$/, ''), { n: 0 })
  return out
}

/** Every element of an item's files, with the class it gets for a combination of axis values. */
export function sideElements(
  files: Files,
  extraScope: (combo: Record<string, unknown>) => Record<string, unknown> = () => ({}),
): Map<string, RawElement & { evaluate: (combo: Record<string, string>) => { cls: string; approximate: boolean } }> {
  const { values } = scriptConsts(files)
  const join = (...parts: unknown[]) => clsx(parts as never)
  const out = new Map<string, RawElement & { evaluate: (combo: Record<string, string>) => { cls: string; approximate: boolean } }>()
  for (const [file, text] of Object.entries(files)) {
    if (file.endsWith('.example.vue')) continue
    for (const raw of templateElements(file, text)) {
      const evaluate = (combo: Record<string, string>) => {
        if (raw.boundClass === null) return { cls: raw.staticClass, approximate: false }
        const typed = Object.fromEntries(Object.entries(combo).map(([k, v]) => [k, v === 'true' ? true : v === 'false' ? false : v]))
        const scope: Record<string, unknown> = { ...values, ...typed, ...extraScope(typed), cn: join, props: { ...typed }, $slots: { default: () => [] }, $attrs: {} }
        try {
          const fn = new Function(...Object.keys(scope), `return ${js(raw.boundClass)}`) as (...args: unknown[]) => unknown
          return { cls: clsx(fn(...Object.values(scope)) as never), approximate: false }
        } catch {
          return { cls: [...raw.boundClass.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g)].map((m) => m[2]).join(' '), approximate: true }
        }
      }
      let key = raw.key
      for (let n = 2; out.has(key); n++) key = `${raw.key} #${n}`
      out.set(key, { ...raw, key, evaluate })
    }
  }
  return out
}

const require = createRequire(import.meta.url)
const THEME = readFileSync(join(require.resolve('tailwindcss/package.json'), '..', 'theme.css'), 'utf8')
/** Tailwind's theme variables, for a stylesheet that reads one no utility of Tailwind's own emits (tw-animate-css's `--spacing`). */
const THEME_VARIABLES = new Map([...THEME.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)].map(([, name, value]) => [name!, value!.trim()]))
/** tw-animate-css, which the brand stylesheet imports: the enter, exit and collapsible motion its utilities set. */
const ANIMATE = readFileSync(join(import.meta.dirname, '../../node_modules/tw-animate-css/dist/tw-animate.css'), 'utf8')

let baseCss: string | null = null
/** The default brand's project stylesheet over Tailwind's default theme and tw-animate-css, which the recipes and utilities resolve against. */
function base(root: string): string {
  baseCss ??= `${THEME}\n${ANIMATE}\n${renderBaseCss(JSON.parse(readFileSync(stylePresetPath('default'), 'utf8')), readRegistryRecipes(root), { scope: 'project' }).replace(/^@import[^;]*;\n?/gm, '')}`
  return baseCss
}

type Decl = [selector: string, property: string, value: string]

const compiled = new Map<string, Promise<string>>()
/** Tailwind's CSS for one element's classes, compiled once per item: a compiler keeps every class it has built, so each class list gets its own. */
function compiledCss(root: string, classes: string[]): Promise<string> {
  const key = classes.join(' ')
  let css = compiled.get(key)
  if (!css) {
    css = compile(`${base(root)}\n@tailwind utilities;\n`).then((compiler) => compiler.build(classes))
    compiled.set(key, css)
  }
  return css
}

/** The width in px a `@media (width >= …)` or `(min-width: …)` query starts at; Infinity for any other at-rule. */
function minWidth(at: string): number {
  const m = /^@media \((?:width >= |min-width: ?)([\d.]+)(rem|px)\)$/.exec(at)
  return m ? Number(m[1]) * (m[2] === 'rem' ? 16 : 1) : Infinity
}

/** The width in px a `@container (width >= …)` query starts at; Infinity for any other at-rule. */
function containerMin(at: string): number {
  const m = /^@container(?: [\w-]+)? \((?:width >= |min-width: ?)([\d.]+)(rem|px)\)$/.exec(at)
  return m ? Number(m[1]) * (m[2] === 'rem' ? 16 : 1) : Infinity
}

/** Flattened declarations in document order; `@supports`, `@media (hover: hover)`, and width queries the viewport or container meets apply, other at-rules drop. `@property` yields its initial value. */
function declarations(css: string, viewport: number, container = viewport): { decls: Decl[]; initial: Map<string, string> } {
  const decls: Decl[] = []
  const initial = new Map<string, string>()
  const stack: (string | false | null)[] = []
  let property: string | null = null
  let buf = ''
  let skip = 0
  const add = (text: string) => {
    const at = text.indexOf(':')
    if (at <= 0) return
    if (property && text.slice(0, at).trim() === 'initial-value') initial.set(property, text.slice(at + 1).trim())
    const selector = stack.filter((s): s is string => typeof s === 'string').at(-1)
    if (!skip && selector) decls.push([selector, text.slice(0, at).trim(), text.slice(at + 1).trim()])
  }
  for (const ch of css) {
    if (ch === '{') {
      const sel = buf.trim()
      buf = ''
      if (sel.startsWith('@property')) {
        property = sel.slice('@property'.length).trim()
        stack.push(null)
        skip++
        continue
      }
      if (!skip && (sel.startsWith('@supports') || sel === '@media (hover: hover)' || sel.startsWith('@layer') || minWidth(sel) <= viewport || containerMin(sel) <= container)) {
        stack.push(false)
        continue
      }
      if (skip || sel.startsWith('@')) {
        skip++
        stack.push(null)
        continue
      }
      const parent = stack.filter((s): s is string => typeof s === 'string').at(-1)
      stack.push(parent ? (sel.includes('&') ? sel.replaceAll('&', parent) : `${parent} ${sel}`) : sel)
    } else if (ch === '}') {
      if (buf.trim()) add(buf.trim())
      buf = ''
      if (stack.pop() === null) {
        skip--
        property = null
      }
    } else if (ch === ';') {
      add(buf.trim())
      buf = ''
    } else buf += ch
  }
  return { decls, initial }
}

const escapeClass = (cls: string) => `.${cls.replace(/[^A-Za-z0-9_-]/g, (c) => `\\${c}`)}`

// Selector forms that mean one state, whichever way a utility or a recipe writes it.
const STATES: [RegExp, string][] = [
  [/:where\(\[data-state="(open|closed)"\]\)|:where\(\[data-(open|closed)\]:not\(\[data-\2="false"\]\)\)/g, ':$1$2'],
  [/:is\(\[data-state=checked\](?:,\[data-state=indeterminate\])?,\[data-state=on\],\[aria-checked=true\](?:,\[aria-checked=mixed\])?(?:,\[aria-pressed=true\])?\)/g, ':checked'],
  [/\[data-state="?(?:checked|on)"?\]|\[data-checked\]|\[aria-checked="?true"?\]|\[data-pressed\]|\[aria-pressed="?true"?\]/g, ':checked'],
  [/\[data-state="?unchecked"?\]|\[data-unchecked\]/g, ':unchecked'],
  [/:is\(\[data-state=open\],\[aria-expanded=true\]\)/g, ':open'],
  [/\[data-state="?open"?\]|\[aria-expanded="?true"?\]|\[data-open\]/g, ':open'],
  [/:is\(:open(?:,\s*:open)*\)/g, ':open'],
  [/\[data-active\]:not\(\[data-active=["']?false["']?\]\)|\[data-active=["']?true["']?\]/g, '[data-active]'],
  [/\[data-state="?closed"?\]|\[data-closed\]/g, ':closed'],
  [/:is\(\[data-selected=true\],\[aria-selected=true\],\[data-state=active\]\)/g, ':selected'],
  [/\[data-state="?active"?\]/g, ':selected'],
  [/\[data-highlighted\]/g, ':highlighted'],
  [/:focus-visible|:focus-within/g, ':focus'],
  // A focused control inside is focus-within, which reads as :focus.
  [/:has\(:focus\)/g, ':focus'],
  [/\[data-orientation="?(vertical|horizontal)"?\]/g, '[data-$1]'],
  [/:disabled|\[data-disabled(?:="?(?:true|)"?)?\]|\[aria-disabled="?true"?\]/g, ':disabled'],
  [/:is\(\[aria-invalid=true\],\[data-invalid\]\)/g, ':invalid'],
  [/\[aria-invalid="?true"?\]|\[data-invalid(?:="?(?:true|)"?)?\]/g, ':invalid'],
  [/^:is\(E \*\):where\(\[data-icon\]\)|^:where\(E \*\)\[data-icon\]|^:is\(E \*\)\[data-icon\]/g, 'E ICON'],
  [/ :where\(\[data-icon\]\)| svg(?::not\(\[class\*=['"]?size-['"]?\]\))?/g, ' ICON'],
]

/** A selector as the element's context: its classes as E, states named one way, a combo's own data attribute dropped; null when it is not this element's or another combo's. */
function context(selector: string, escaped: string[], combo: Record<string, string>): string | null {
  let s = selector
  let hit = false
  for (const e of escaped) {
    if (s.includes(e)) {
      s = s.replaceAll(e, 'E')
      hit = true
    }
  }
  if (!hit) return null
  // A pair's rule, `.fui-a:where(.fui-b)`: this element when it wears every class named, another combo's when not.
  s = s.replace(/E:where\(E+\)/g, 'E')
  if (/:where\((?:E-|\.fui-)/.test(s)) return null
  // A combo's attributes: a value an element has, or PRESENT / ABSENT for one it carries or not; a selector for another is not this combo's.
  for (const [axis, value] of Object.entries(combo)) {
    const name = axis.replace(/[-]/g, '\\-')
    const presence = value === 'PRESENT' || value === 'ABSENT'
    for (const match of s.matchAll(new RegExp(`\\[data-${name}=("?)([^"\\]]*)\\1\\]`, 'g'))) {
      const wanted = presence ? (value === 'PRESENT' ? match[2] !== 'false' : match[2] === 'false') : match[2] === value
      if (wanted === s.includes(`:not(${match[0]})`)) return null
    }
    s = s.replace(new RegExp(`:not\\(\\[data-${name}=("?)false\\1\\]\\)`, 'g'), '').replace(new RegExp(`\\[data-${name}=("?)[^"\\]]*\\1\\]`, 'g'), '')
    if (presence && new RegExp(`\\[data-${name}\\]`).test(s)) {
      if (value === 'ABSENT') return null
      s = s.replace(new RegExp(`\\[data-${name}\\]`, 'g'), '')
    }
  }
  for (const [form, state] of STATES) s = s.replace(form, state)
  s = s
    .replace(/\[([\w-]+)([*^$|~]?=)'([^']*)'\]/g, '[$1$2"$3"]')
    .replace(/\[([\w-]+)([*^$|~]?=)([^"'\]\s]+)\]/g, '[$1$2"$3"]')
    .replace(/\[([\w-]+)="true"\]/g, '[$1]')
    .replace(/:is\([\w-]*(:[\w-]+)\)/g, '$1')
    .replace(/:unchecked/g, '')
    .replace(/^:is\(E ICON\)$/, 'E ICON')
    .replace(/^:is\(E (>|~|\+) \*\)/, 'E $1 *')
    .replace(/^:is\(E \*\)(\[[^\]]+\])/, 'E $1')
    .replace(/^:is\((E.*?) > \*\)(?::is\((\[[^\]]+\])\)|(\[[^\]]+\]))/, '$1 > $2$3')
    .replace(/ > \*(\[[^\]]+\])/g, ' > $1')
    // Icons sit as direct children wherever either side styles them, so a child icon is the icon part.
    .replace(/^E > (?:ICON|\[data-icon\])/, 'E ICON')
    .replace(/\*:is\(([\w-]+)\)/g, '$1')
    .replace(/:has\(:is\(([^()]*)\)\)/g, ':has($1)')
    .replace(/\.group(?:\\\/[\w-]+)?(?![\w-])/g, 'GROUP')
    .replace(/:is\(:where\(GROUP\) \*\)/g, '')
    .replace(/(^|[\s>+~]):where\(([^()]+)\)/g, '$1$2')
    .replace(/\s+/g, ' ')
  return s
}

const px = (n: number) => `${+n.toFixed(3)}px`
const lengths = (value: string) =>
  value
    .replace(/#([0-9a-f])([0-9a-f])([0-9a-f])\b/gi, '#$1$1$2$2$3$3')
    .replace(/calc\((-?[\d.]+)(rem|px) \* (-?[\d.]+)\)/g, (_, n: string, unit: string, k: string) => `${Number(n) * Number(k)}${unit}`)
    .replace(/calc\((-?[\d.]+) \* (-?[\d.]+)(rem|px)\)/g, (_, k: string, n: string, unit: string) => `${Number(n) * Number(k)}${unit}`)
    .replace(/calc\((-?[\d.]+)px \+ (-?[\d.]+)px\)/g, (_, a: string, b: string) => px(Number(a) + Number(b)))
    .replace(/calc\((-?[\d.]+) \/ (-?[\d.]+)\)/g, (_, a: string, b: string) => String(+(Number(a) / Number(b)).toFixed(2)))
    .replace(/(?<![\w.#-])(-?\d*\.?\d+)rem\b/g, (_, n: string) => px(Number(n) * 16))
    .replace(/(?<![\w.#-])(-?\d*\.?\d+)px\b/g, (_, n: string) => px(Number(n)))
    .replace(/\s+/g, ' ')
    .trim()

type Side = 'top' | 'right' | 'bottom' | 'left'
/** Which physical sides a box shorthand or logical longhand sets, left to right. */
const BOX_SIDES: Record<string, Side[]> = {
  '': ['top', 'right', 'bottom', 'left'],
  '-inline': ['left', 'right'],
  '-block': ['top', 'bottom'],
  '-inline-start': ['left'],
  '-inline-end': ['right'],
  '-block-start': ['top'],
  '-block-end': ['bottom'],
  '-top': ['top'],
  '-right': ['right'],
  '-bottom': ['bottom'],
  '-left': ['left'],
}
/** A padding, margin or border longhand as the physical sides it sets: `padding-inline: 12px` sets padding-left and padding-right. */
function physical(p: string, v: string): [string, string][] {
  if (p === 'border-radius') {
    const values = v.split(/ (?![^()]*\))/)
    const corner = (i: number) => values[values.length === 1 ? 0 : values.length === 2 ? i % 2 : values.length === 3 ? (i === 3 ? 1 : i) : i]!
    return ['top-left', 'top-right', 'bottom-right', 'bottom-left'].map((c, i) => [`border-${c}-radius`, corner(i)])
  }
  const box = /^(padding|margin|border)((?:-(?:inline|block)(?:-(?:start|end))?|-(?:top|right|bottom|left))?)(-(?:width|style|color))?$/.exec(p)
  if (!box || (box[1] === 'border' && !box[3])) return [[p, v]]
  const [, kind, side = '', part = ''] = box
  const sides = BOX_SIDES[side]!
  const values = side === '' ? v.split(/ (?![^()]*\))/) : [v]
  const pick = (i: number) => (values.length === 1 ? values[0]! : values.length === 2 ? values[i % 2]! : values.length === 3 ? values[i === 3 ? 1 : i]! : values[i]!)
  return sides.map((name, i) => [`${kind}-${name}${part}`, side === '' ? pick(['top', 'right', 'bottom', 'left'].indexOf(name)) : pick(i)])
}

/** An `outline` shorthand as its width, style and colour; a longhand the context also sets wins, as it follows the shorthand. */
function outlineLonghands(decls: Map<string, string>): Map<string, string> {
  const outline = decls.get('outline')
  if (outline === undefined) return decls
  const out = new Map([...decls].filter(([p]) => p !== 'outline'))
  if (outline.trim() === 'none') return out
  const [width = '', style = '', ...color] = outline.trim().split(/\s+(?![^()]*\))/)
  for (const [p, v] of [
    ['outline-width', width],
    ['outline-style', style],
    ['outline-color', color.join(' ')],
  ] as const)
    if (v && !out.has(p)) out.set(p, v)
  return out
}

/** One context's declarations as a reader sees them: lengths in px, a percent opacity as a number, a ring as one value whether outline or box-shadow draws it. */
function canonical(decls: Map<string, string>): Map<string, string> {
  const out = new Map<string, string>()
  for (const [property, raw] of [...outlineLonghands(decls)].flatMap(([p, v]) => physical(p, v))) {
    // a `background` that is one colour reads as the colour itself
    const p = property === 'background' && !/url\(|gradient|\s/.test(raw.replace(/\([^)]*\)/g, '')) ? 'background-color' : property
    let v = lengths(raw)
    if (p === 'opacity' && v.endsWith('%')) v = String(Number(v.slice(0, -1)) / 100)
    if (p === 'translate') v = v.replace(/ 0(?:px)?$/, '')
    if (p === 'box-shadow') {
      const layers = v.split(/,(?![^()]*\))/).map((layer) => layer.trim())
      const ring = layers.find((layer) => /^0(?:px)? 0(?:px)? 0(?:px)? [\d.]+px /.test(layer))
      const rest = layers.filter((layer) => layer !== ring && !/^(?:0(?:px)? 0(?:px)? #0000|0(?:px)? 0(?:px)? 0(?:px)? 0(?:px)? (?:transparent|currentcolor))$/.test(layer))
      if (ring && !/^0(?:px)? 0(?:px)? 0(?:px)? 0px /.test(ring)) out.set('ring', ring.replace(/^0(?:px)? 0(?:px)? 0(?:px)? /, ''))
      v = rest.join(', ') || 'none'
    }
    out.set(p, v)
  }
  const style = out.get('outline-style')
  const width = out.get('outline-width')
  if (style === 'solid' && width && width !== '0px' && ['0px', undefined].includes(out.get('outline-offset'))) {
    out.set('ring', `${width} ${out.get('outline-color') ?? 'currentcolor'}`)
    for (const k of ['outline-style', 'outline-width', 'outline-color', 'outline-offset']) out.delete(k)
  }
  return out
}

/** The variables tw-animate-css's enter and exit keyframes read: the motion a fade, zoom, slide or spin utility sets. */
const MOTION_VARIABLE = /^--tw-(?:enter|exit)-/

/** Every declaration an element with `classes` gets, by context, every var() resolved; `--*` left out but the motion variables. */
export async function resolved(root: string, classes: string[], combo: Record<string, string> = {}, viewport = 0, container = viewport, extraCss = ''): Promise<Map<string, Map<string, string>>> {
  const css = (await compiledCss(root, classes)) + extraCss
  const { decls, initial } = declarations(css, viewport, container)
  const rootVars = new Map([...initial, ...decls.filter(([sel]) => sel.includes(':root') || sel.includes(':host')).map(([, p, v]) => [p, v] as [string, string])])
  const byContext = new Map<string, [string, string][]>()
  const escaped = [...classes].sort((a, b) => b.length - a.length).map(escapeClass)
  for (const [sel, p, v] of decls) {
    if (!escaped.some((e) => sel.includes(e))) continue
    const own = sel
      .split(/,(?![^()]*\))/)
      .map((part) => context(part.trim(), escaped, combo))
      .find((c) => c !== null)
    if (own == null) continue
    byContext.set(own, [...(byContext.get(own) ?? []), [p, v]])
  }
  const element = new Map(byContext.get('E') ?? [])
  const drawn = (list: [string, string][], scope: Map<string, string>) => {
    const resolve = (value: string, depth = 0): string =>
      depth > 20
        ? value
        : // `var(a)var(b)` is two tokens: keep them apart once each is replaced.
          value.replace(/\)(?=var\()/g, ') ').replace(/var\((--[\w-]+)(?:,\s*((?:[^()]|\((?:[^()]|\([^()]*\))*\))*))?\)/g, (_, name: string, fallback?: string) => {
            const found = scope.get(name) ?? element.get(name) ?? rootVars.get(name) ?? THEME_VARIABLES.get(name)
            return found !== undefined ? resolve(found, depth + 1) : fallback !== undefined ? resolve(fallback, depth + 1) : 'unset'
          })
    const own = new Map<string, string>()
    for (const [p, v] of list) {
      if (p.startsWith('--') && !MOTION_VARIABLE.test(p)) continue
      const value = resolve(v).replace(/\s*!important$/, '')
      // A property set again moves last, as the later declaration wins in the cascade and over the longhands between.
      const set = (name: string, v: string) => {
        own.delete(name)
        own.set(name, v)
      }
      if (p === 'border' || /^border-(?:top|right|bottom|left|inline|block)$/.test(p)) {
        const [w, st, ...color] = lengths(value).split(' ')
        set(`${p}-width`, w ?? '')
        set(`${p}-style`, st ?? '')
        set(`${p}-color`, color.join(' '))
      } else set(p, value)
    }
    return canonical(own)
  }
  const result = new Map<string, Map<string, string>>()
  for (const [ctx, list] of byContext) {
    const mine = sameElement(ctx) ? states(ctx) : []
    const combined = mine.length > 1 ? [...byContext].filter(([other]) => other !== ctx && other !== 'E' && sameElement(other) && states(other).every((t) => mine.includes(t))) : []
    const scope = new Map([...combined.flatMap(([, l]) => l), ...list])
    // what a combined state draws with a variable this context sets draws differently here
    const redrawn = combined.flatMap(([, l]) => {
      const alone = drawn(l, new Map(l))
      return [...drawn(l, scope)].filter(([p, v]) => alone.get(p) !== v)
    })
    result.set(ctx, new Map([...redrawn, ...drawn(list, scope)]))
  }
  return result
}

/** A same-element context's state tokens: `E:focus:invalid` → [':focus', ':invalid']. */
const states = (ctx: string): string[] => ctx.slice(1).match(/::?[\w-]+(?:\((?:[^()]|\([^()]*\))*\))?|\[[^\]]*\]/g) ?? []

/** Whether a context is the element itself in some state, not a descendant, a sibling or a pseudo-element. */
const sameElement = (ctx: string) => ctx.startsWith('E') && !ctx.includes('::') && !/[\s>+~](?![^()]*\))/.test(ctx)

type Look = Map<string, Map<string, string>>
const SLOT_CONTEXT = /^(?::is\(E >? ?\*\)|E >? ?\*?)\[data-slot="([\w-]+)"\](.*)$/

/** Declarations a parent sets on a slotted child (`*:data-[slot=x]:`) moved to that child, for the same combination or, without one, every combination it has. */
function moveToSlots(looks: Map<string, Map<string, Look>>): void {
  for (const [key, combos] of looks) {
    for (const [combo, look] of combos) {
      for (const [ctx, decls] of [...look]) {
        const match = SLOT_CONTEXT.exec(ctx)
        const target = match && looks.get(match[1]!)
        if (!match || !target || match[1] === key) continue
        look.delete(ctx)
        const viewport = combo.split(' ')[0]
        const into = target.has(combo) ? [target.get(combo)!] : [...target].filter(([k]) => k.split(' ')[0] === viewport).map(([, v]) => v)
        for (const child of into) {
          const at = `E${match[2]}`
          child.set(at, new Map([...(child.get(at) ?? []), ...decls]))
        }
      }
    }
  }
}

/** The widths each element is compared at: a phone, and a desktop past every default breakpoint. */
const VIEWPORTS = { phone: 375, desktop: 1536 }

/** What one item needs beyond its files to resolve its own look: axes no prop or cva names, script state a class expression
 * reads, attributes an axis value puts on the element, the width of the container each element's `@` variants query, and
 * widths beside phone and desktop. */
export interface OwnLookOptions {
  axes?: Record<string, string[]>
  scope?: (combo: Record<string, unknown>) => Record<string, unknown>
  attrs?: (combo: Record<string, string>) => Record<string, string>
  container?: (viewport: number, combo: Record<string, string>, element: string) => number
  viewports?: Record<string, number>
}

export interface OwnLook {
  item: string
  /** Per element, every combination it is resolved at (`viewport` and its axes) and each `<context> | <property>: <value>` line with the combinations it holds at. */
  elements: Map<string, { combos: Combo[]; lines: Map<string, Combo[]> }>
  /** Elements whose class expression reads script state the check cannot evaluate, resolved from every literal. */
  approximate: string[]
}

/** One item's resolved look: each element of its own files at every combination of the axes its class reads, at every width. */
export async function ownLook(root: string, item: string, options: OwnLookOptions = {}): Promise<OwnLook> {
  compiled.clear()
  const { axes: extraAxes = {}, scope, attrs = () => ({}), container = (viewport) => viewport, viewports = {} } = options
  const dir = TIERS.map((tier) => join(root, tier, item)).find((path) => existsSync(path))
  if (!dir) throw new Error(`${item} has no folder under ui/, sections/ or templates/`)
  const built: Files = Object.fromEntries(readdirSync(dir).map((file) => [file, readFileSync(join(dir, file), 'utf8')]))
  const widths = { ...VIEWPORTS, ...viewports }
  const looks = new Map<string, Map<string, Look>>()
  const combos = new Map<string, Combo>()
  const approximate: string[] = []
  const put = (element: string, combo: Combo, look: Look) => {
    const key = comboKey(combo)
    combos.set(key, combo)
    looks.set(element, (looks.get(element) ?? new Map()).set(key, look))
  }
  if (item === 'toast') {
    const classes = scriptConsts(built).values.classes as Record<string, string>
    const parts: [string, (type: string) => string, string[]][] = [
      ['toast', (type) => classes[type === 'default' ? 'toast' : type]!, ['default', 'info', 'success', 'warning', 'error']],
      ...(['title', 'description', 'content', 'icon', 'actionButton', 'cancelButton'] as const).map((part): [string, () => string, string[]] => [part, () => classes[part]!, ['']]),
    ]
    for (const [element, cls, types] of parts)
      for (const type of types)
        for (const [name, width] of Object.entries(widths)) put(element, { viewport: name, ...(type && { type }) }, await resolved(root, cls(type).split(/\s+/).filter(Boolean), {}, width, width))
  } else {
    const axes = itemAxes({}, built, extraAxes)
    const booleans = new Set([...propAxes(built).booleans].filter((axis) => !Object.hasOwn(extraAxes, axis)))
    const attributes = (combo: Combo) => ({
      ...Object.fromEntries(Object.entries(combo).map(([k, v]) => [k, booleans.has(k) ? (v === 'true' ? 'PRESENT' : 'ABSENT') : v])),
      ...attrs(combo),
    })
    for (const [key, element] of sideElements(built, scope)) {
      for (const combo of combosFor([element.boundClass ?? element.staticClass], axes, booleans)) {
        const { cls, approximate: guessed } = element.evaluate(combo)
        if (guessed) approximate.push(key)
        for (const [name, width] of Object.entries(widths))
          put(key, { viewport: name, ...combo }, await resolved(root, cls.split(/\s+/).filter(Boolean), attributes(combo), width, container(width, combo, key)))
      }
    }
    moveToSlots(looks)
  }
  const elements: OwnLook['elements'] = new Map()
  for (const [element, byCombo] of looks) {
    const lines = new Map<string, Combo[]>()
    for (const [key, look] of byCombo)
      for (const [ctx, decls] of look)
        for (const [p, v] of decls) {
          const line = `${ctx} | ${p}: ${v}`
          lines.set(line, [...(lines.get(line) ?? []), combos.get(key)!])
        }
    if (lines.size) elements.set(element, { combos: [...byCombo.keys()].map((key) => combos.get(key)!), lines })
  }
  return { item, elements, approximate: [...new Set(approximate)] }
}
