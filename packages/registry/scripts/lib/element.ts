import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { parse } from 'vue/compiler-sfc'

type Node = { type: number; tag?: string; props?: Prop[]; children?: Node[] }
type Prop = { type: number; name: string; value?: { content: string }; arg?: { content: string }; exp?: { content: string } }

const ELEMENT = 1
const ATTRIBUTE = 6
const DIRECTIVE = 7

/** Elements that render their children in place of themselves. */
const PASS_THROUGH = new Set(['template', 'Presence', 'Teleport', 'Transition', 'TransitionGroup', 'KeepAlive'])

/** Where the files a component imports live: the registry's source root and Reka's source. */
export type Roots = { registry: string; reka: string }

/** A data attribute an element carries, the component whose template sets it, and its static value or bound expression. */
/** `fixed` marks a value a child component takes from a literal prop its parent passes it, such as Button's `data-variant` under `variant="ghost"`. */
export type FoundAttribute = { name: string; from: string; value?: string; expression?: string; fixed?: true }

/** What a part's own element carries: its data attributes, and the CSS variables set on it or an element around it. */
type Found = { attributes: FoundAttribute[]; variables: Set<string> }

// A custom property a style sets: `--x: …` in a style attribute, `'--x': …` or `[`--x`]: …` in a style object.
const STYLE_VARIABLE = /(--[a-z][a-z0-9-]*)['"`]?(?:\s+as\s+any)?\]?\s*:/g
// Reka's floating layer sets these for every popper; each content part sets its own names from them.
const INTERNAL_VARIABLE = /^--reka-popper-/

/** A binding that passes a prop through: `size`, `props.size`, `props.size ?? 'default'`, `context?.size || size`. */
export const MIRROR = /^(?:props\.|context\?\.)?(\w+)(?:\s*\?\?\s*'[^']*'|\s*\|\|\s*(?!undefined\b)\w+)?$/

/** What a call site passes a component: each prop's static value or bound expression, by camelCase name. */
type Given = Record<string, { value?: string; expression?: string }>

const camel = (name: string) => name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase())

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/** The `.vue` file a barrel exports under `name`. */
function fromBarrel(barrel: string, name: string): string | undefined {
  if (!existsSync(barrel)) return undefined
  for (const [, names, file] of readFileSync(barrel, 'utf8').matchAll(/export\s*\{([^}]*)\}\s*from\s*'\.\/(\w+\.vue)'/g))
    if (new RegExp(`default as ${name}\\b`).test(names!)) return join(dirname(barrel), file!)
  return undefined
}

/** The barrel an import specifier names, seen from `file`. */
function barrelOf(specifier: string, file: string, roots: Roots): string | undefined {
  if (specifier === '.' || specifier === './index') return join(dirname(file), 'index.ts')
  if (/^\.\.?\//.test(specifier) && !specifier.endsWith('.vue')) return join(dirname(file), specifier, 'index.ts')
  if (specifier === 'reka-ui') return join(roots.reka, 'index.ts')
  if (specifier.startsWith('@library/components/')) return join(roots.registry, specifier.slice('@library/components/'.length), 'index.ts')
  if (specifier.startsWith('@/') && file.startsWith(roots.reka)) return join(roots.reka, specifier.slice(2), 'index.ts')
  return undefined
}

/** The `.vue` file a component tag in `file` renders, when it is one this walk can read. */
function resolve(tag: string, file: string, code: string, roots: Roots): string | undefined {
  for (const [, local, path] of code.matchAll(/import\s+(\w+)\s+from\s+'(\.\.?\/[^']+\.vue)'/g)) if (local === tag) return join(dirname(file), path!)
  for (const [, names, specifier] of code.matchAll(/import\s*\{([^}]*)\}\s*from\s*'([^']+)'/g)) {
    for (const entry of names!.split(',')) {
      const [original, local = original] = entry
        .replace(/^\s*type\s+/, '')
        .trim()
        .split(/\s+as\s+/)
      if (local !== tag) continue
      const barrel = barrelOf(specifier!, file, roots)
      if (!barrel) return undefined
      // Reka's root barrel re-exports each folder's barrel.
      if (barrel === join(roots.reka, 'index.ts')) return rekaExport(roots.reka, original!)
      return fromBarrel(barrel, original!)
    }
  }
  return undefined
}

const rekaFolders = new Map<string, string[]>()

/** The `.vue` file Reka exports under `name`, found through the folder barrels its root barrel re-exports. */
function rekaExport(reka: string, name: string): string | undefined {
  const folders = rekaFolders.get(reka) ?? [...readFileSync(join(reka, 'index.ts'), 'utf8').matchAll(/from '\.\/(\w+)'/g)].map(([, folder]) => folder!)
  rekaFolders.set(reka, folders)
  for (const folder of folders) {
    const found = fromBarrel(join(reka, folder, 'index.ts'), name)
    if (found) return found
  }
  return undefined
}

const elements = (nodes: Node[] = []) => nodes.filter((node) => node.type === ELEMENT)
const directive = (node: Node, name: string) => node.props?.find((prop) => prop.type === DIRECTIVE && prop.name === name)
const bound = (node: Node, name: string) => node.props?.find((prop) => prop.type === DIRECTIVE && prop.name === 'bind' && prop.arg?.content === name)
const attribute = (node: Node, name: string) => node.props?.find((prop) => prop.type === ATTRIBUTE && prop.name === name)

/** The first element and the `v-else-if`/`v-else` alternatives that follow it: what renders in its place. */
function alternatives(nodes: Node[] = []): Node[] {
  const [first, ...rest] = elements(nodes)
  if (!first) return []
  const out = [first]
  for (const node of rest) {
    if (!directive(node, 'else-if') && !directive(node, 'else')) break
    out.push(node)
  }
  return out
}

function descendants(nodes: Node[] = []): Node[] {
  return elements(nodes).flatMap((node) => [node, ...descendants(node.children)])
}

/** The elements in a component's template that its fallthrough attributes land on. */
function attrsTargets(nodes: Node[], code: string): Node[] {
  if (!/inheritAttrs:\s*false/.test(code)) return alternatives(nodes)
  return descendants(nodes).filter((node) => node.props?.some((prop) => prop.type === DIRECTIVE && prop.name === 'bind' && !prop.arg && /\$attrs\b/.test(prop.exp?.content ?? '')))
}

/** A part's own element: the one with the data-slot named after it, else the one its class lands on, else the template's root. */
function ownTargets(nodes: Node[], part: string): Node[] {
  const all = descendants(nodes)
  const own = all.find((node) => attribute(node, 'data-slot')?.value?.content === kebab(part)) ?? all.find((node) => /\bprops\.class\b/.test(bound(node, 'class')?.exp?.content ?? ''))
  return own ? [own] : alternatives(nodes)
}

const asChild = (node: Node) => attribute(node, 'as-child') ?? attribute(node, 'asChild') ?? ['true', ''].includes(bound(node, 'as-child')?.exp?.content ?? 'x')

/** The CSS variables an element's `style` sets. */
function styleVariables(node: Node, found: Found) {
  const style = attribute(node, 'style')?.value?.content ?? bound(node, 'style')?.exp?.content ?? ''
  for (const [, name] of style.matchAll(STYLE_VARIABLE)) if (!INTERNAL_VARIABLE.test(name!)) found.variables.add(name!)
}

/** The CSS variables a component's script sets with `style.setProperty`, by literal name or through a constant its local modules define. */
function scriptVariables(file: string, code: string, found: Found) {
  const constants = new Map<string, string>()
  for (const [, path] of code.matchAll(/from\s+'(\.\/[\w-]+)'/g)) {
    const module = join(dirname(file), `${path}.ts`)
    if (existsSync(module)) for (const [, key, name] of readFileSync(module, 'utf8').matchAll(/(\w+):\s*'(--[\w-]+)'/g)) constants.set(key!, name!)
  }
  for (const [, literal, key] of code.matchAll(/setProperty\(\s*(?:['"`](--[\w-]+)['"`]|\w+\.(\w+))/g)) {
    const name = literal ?? constants.get(key!)
    if (name && !INTERNAL_VARIABLE.test(name)) found.variables.add(name)
  }
}

/** The text between the `(` at `from` and the bracket that closes it. */
function parenthesised(text: string, from: number): string {
  let depth = 0
  for (let at = from; at < text.length; at++) {
    if (text[at] === '(') depth++
    else if (text[at] === ')' && --depth === 0) return text.slice(from + 1, at)
  }
  return ''
}

/** The data attributes a `v-bind` spread brings from a computed object the script builds: `'data-x': …` keys and `attrs['data-x'] = …` writes. */
function spreadAttributes(node: Node, code: string): Prop[] {
  const out: Prop[] = []
  for (const prop of node.props ?? []) {
    if (prop.type !== DIRECTIVE || prop.name !== 'bind' || prop.arg) continue
    for (const [, name] of (prop.exp?.content ?? '').matchAll(/(?:^|\.\.\.)\s*(\w+)\b/g)) {
      const at = new RegExp(`const ${name}\\s*=\\s*computed\\(`).exec(code)
      if (!at) continue
      const body = parenthesised(code, at.index + at[0].length - 1)
      for (const [, key, expression] of body.matchAll(/'(data-[\w-]+)':\s*([^,\n]+)/g)) out.push({ type: DIRECTIVE, name: 'bind', arg: { content: key! }, exp: { content: expression! } })
      for (const [, key, expression] of body.matchAll(/\[['"](data-[\w-]+)['"]\]\s*=\s*([^\n;]+)/g))
        out.push({ type: ATTRIBUTE, name: key!, value: { content: /^(['"])\1$/.test(expression!.trim()) ? '' : expression!.trim() } })
    }
  }
  return out
}

function visit(node: Node, file: string, code: string, roots: Roots, found: Found, seen: Set<string>, given: Given) {
  styleVariables(node, found)
  for (const prop of [...(node.props ?? []), ...spreadAttributes(node, code)]) {
    const name = prop.type === ATTRIBUTE ? prop.name : prop.name === 'bind' ? prop.arg?.content : undefined
    if (!name?.startsWith('data-') || name === 'data-slot' || name.startsWith('data-reka-') || found.attributes.some((f) => f.name === name)) continue
    const expression = prop.exp?.content?.trim() ?? ''
    // A prop this component mirrors takes what the call site passed it.
    const passed = prop.type === DIRECTIVE ? given[MIRROR.exec(expression)?.[1] ?? ''] : undefined
    const set = prop.type === ATTRIBUTE ? { value: prop.value?.content ?? '' } : (passed ?? { expression })
    found.attributes.push({ name, from: basename(file, '.vue'), ...set, ...(passed?.value !== undefined && { fixed: true as const }) })
  }
  const tag = node.tag!
  const inner = /^[A-Z]/.test(tag) ? resolve(tag, file, code, roots) : undefined
  if (inner) walk(inner, undefined, roots, found, seen, passedTo(node, given))
  if (PASS_THROUGH.has(tag) || asChild(node)) for (const child of alternatives(node.children)) visit(child, file, code, roots, found, seen, given)
}

/** The props a component element passes, its bound ones read through what this component was itself given. */
function passedTo(node: Node, given: Given): Given {
  const out: Given = {}
  for (const prop of node.props ?? []) {
    if (prop.type === ATTRIBUTE) out[camel(prop.name)] = { value: prop.value?.content ?? '' }
    else if (prop.name === 'bind' && prop.arg) {
      const expression = prop.exp?.content?.trim() ?? ''
      out[camel(prop.arg.content)] = given[MIRROR.exec(expression)?.[1] ?? ''] ?? { expression }
    }
  }
  return out
}

/** The elements around `target` in a template, outermost first. */
function around(nodes: Node[], target: Node): Node[] {
  for (const node of elements(nodes)) {
    if (node === target) return []
    const inside = around(node.children ?? [], target)
    if (inside.length || elements(node.children).includes(target)) return [node, ...inside]
  }
  return []
}

function walk(file: string, part: string | undefined, roots: Roots, found: Found, seen: Set<string>, given: Given = {}) {
  if (seen.has(file) || !existsSync(file)) return
  seen.add(file)
  const { descriptor } = parse(readFileSync(file, 'utf8'))
  const code = `${descriptor.script?.content ?? ''}\n${descriptor.scriptSetup?.content ?? ''}`
  const nodes = (descriptor.template?.ast?.children ?? []) as Node[]
  const targets = part ? ownTargets(nodes, part) : attrsTargets(nodes, code)
  for (const target of targets) {
    // CSS variables inherit, so one set on an element around the target reaches it too.
    for (const outer of around(nodes, target)) styleVariables(outer, found)
    visit(target, file, code, roots, found, seen, given)
  }
  if (targets.length) scriptVariables(file, code, found)
}

/**
 * What a part's own element carries, read from its template and every component it renders through, Reka's included: its data attributes,
 * and the CSS variables set on it or on an element around it.
 */
export function ownElement(file: string, part: string, roots: Roots): { attributes: FoundAttribute[]; variables: string[] } {
  const found: Found = { attributes: [], variables: new Set() }
  walk(file, part, roots, found, new Set())
  return { attributes: found.attributes.sort((a, b) => a.name.localeCompare(b.name)), variables: [...found.variables].sort() }
}
