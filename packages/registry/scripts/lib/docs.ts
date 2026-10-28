import { composesOf, WITH } from '@frontic/library-contract/recipe'
import { docsPath, type ItemExport, type ItemLink, type ItemState } from '@frontic/registry-client/api'
import { parse } from 'vue/compiler-sfc'
import { servedRecipes, type ServedItem } from './served'

const ELEMENT = 1

/** Wrappers whose invalid look lives in the control they render, named by that control's item. */
export const INVALID_VIA: Record<string, string> = { 'date-picker': 'date-field', 'date-range-picker': 'date-field' }

/** Each block name in a recipe or tree, pairs included: a value's `with`, the axis and the values under it are no blocks, what each pair holds is.
 * None inside `link`, which styles the links in the part's content. */
function blockNames(node: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(node)) for (const value of node) blockNames(value, out)
  else if (node && typeof node === 'object')
    for (const [key, value] of Object.entries(node)) {
      if (key === 'link') continue
      if (key === WITH) {
        if (value && typeof value === 'object') for (const values of Object.values(value)) if (values && typeof values === 'object') for (const block of Object.values(values)) blockNames(block, out)
        continue
      }
      out.add(key)
      blockNames(value, out)
    }
  return out
}

const installedCode = (item: ServedItem) =>
  item.files
    .filter((f) => f.type !== 'registry:example')
    .map((f) => f.content)
    .join('\n')

/** Whether an item's recipes or classes read a checked state. */
export function readsChecked(item: ServedItem): boolean {
  const blocks = blockNames(servedRecipes(item))
  return blocks.has('checked') || blocks.has('checkedWithin') || /data-checked|state=checked|aria-checked/.test(installedCode(item))
}

/** The interaction states an item's recipes or its own classes give a look of their own. */
export function itemStates(item: ServedItem): ItemState[] {
  const code = installedCode(item)
  const blocks = blockNames(servedRecipes(item))
  const has: Record<ItemState, boolean> = {
    hover: blocks.has('hover') || /(?<![\w-])(?:group-)?hover:/.test(code),
    focus: blocks.has('focus') || /focus-visible:/.test(code),
    checked: readsChecked(item),
    disabled: /(?<![\w-])(?:aria-|data-)?disabled:/.test(code),
    invalid: blocks.has('invalid') || blocks.has('invalidWithin') || /aria-invalid:/.test(code) || Object.hasOwn(INVALID_VIA, item.name),
  }
  return (Object.keys(has) as ItemState[]).filter((state) => has[state])
}

const link = (item: ServedItem): ItemLink => ({ name: item.name, title: item.title ?? item.name, path: docsPath(item) })

/** The items each item is built from and the items built from it, in registry order. */
export function itemLinks(served: ServedItem[]): Record<string, { builtFrom: ItemLink[]; usedBy: ItemLink[] }> {
  const byName = new Map(served.map((item) => [item.name, item]))
  const deps = new Map(served.map((item) => [item.name, item.registryDependencies ?? []]))
  return Object.fromEntries(
    served.map((item) => [
      item.name,
      {
        builtFrom: deps.get(item.name)!.flatMap((name) => (byName.has(name) ? [link(byName.get(name)!)] : [])),
        usedBy: served.filter((other) => deps.get(other.name)!.includes(item.name)).map(link),
      },
    ]),
  )
}

/** Each shared recipe an item extends (in `library.recipes`, composed by no tree) or composes, extended first, each by name, with the other items whose served recipes hold it. */
export function sharedRecipeUses(served: ServedItem[]): Record<string, { recipe: string; composed: boolean; alsoIn: ItemLink[] }[]> {
  const holds = (item: ServedItem, recipe: string) => Object.hasOwn(item.library?.recipes ?? {}, recipe)
  return Object.fromEntries(
    served.map((item) => {
      const composes = composesOf(item)
      const entries = Object.keys(item.library?.recipes ?? {})
        .map((recipe) => ({ recipe, composed: composes.includes(recipe) }))
        .sort((a, b) => Number(a.composed) - Number(b.composed) || a.recipe.localeCompare(b.recipe))
      return [item.name, entries.map((entry) => ({ ...entry, alsoIn: served.filter((other) => other !== item && holds(other, entry.recipe)).map(link) }))]
    }),
  )
}

const LIBRARY = /^@library\/(?:components\/[^/]+|lib|composables)\/([\w-]+)$/
const statements = (text: string) => text.replaceAll(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')

/** The declaration of `name` in `text`: a type alias or const up to its end, an interface with its body. */
function declaration(text: string, name: string): string | undefined {
  const start = new RegExp(`^export (?:type|interface|const|function) ${name}\\b`, 'm').exec(text)
  if (!start) return undefined
  const rest = text.slice(start.index)
  if (/^export function/.test(rest))
    return rest
      .slice(0, rest.indexOf('{', rest.indexOf(')')))
      .replace(/^export /, '')
      .trim()
  if (/^export const \w+\s*=\s*(?:\([^)]*\)|\w+)\s*(?::[^=]+)?=>/.test(rest))
    return rest
      .slice(0, rest.indexOf('=>'))
      .replace(/^export /, '')
      .trim()
  if (/^export interface/.test(rest)) {
    let depth = 0
    for (let at = rest.indexOf('{'); at < rest.length; at++) {
      if (rest[at] === '{') depth++
      else if (rest[at] === '}' && --depth === 0) return rest.slice(0, at + 1).replace(/^export /, '')
    }
  }
  return rest
    .split(/\n(?=\S)/)[0]!
    .replace(/^export /, '')
    .trim()
}

/** The names a file exports besides its parts, each with where it comes from. `seen` guards `export *` chains. */
function exportsOf(item: ServedItem, path: string, seen: Set<string>, links: Map<string, ItemLink>): ItemExport[] {
  const file = item.files.find((f) => f.path === path)
  if (!file || seen.has(path)) return []
  seen.add(path)
  const text = statements(file.content)
  const folder = path.slice(0, path.lastIndexOf('/') + 1)
  const local = (specifier: string) => {
    const base = `${folder}${specifier.replace(/^\.\//, '')}`
    return item.files.find((f) => f.path === base || f.path === `${base}.ts`)?.path
  }
  const out: ItemExport[] = []
  for (const [, typeOnly, specifier] of text.matchAll(/^export (type )?\* from '([^']+)'/gm)) {
    const target = local(specifier!)
    if (target) out.push(...exportsOf(item, target, seen, links).map((entry) => (typeOnly ? { ...entry, type: true } : entry)))
  }
  for (const [, typeOnly, names, specifier] of text.matchAll(/^export (type )?\{([^}]*)\}(?: from '([^']+)')?/gm)) {
    for (const raw of names!
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)) {
      if (/^default as /.test(raw)) continue
      const type = Boolean(typeOnly) || raw.startsWith('type ')
      const [source, alias] = raw.replace(/^type /, '').split(/\s+as\s+/)
      const name = alias ?? source!
      const from = specifier ? links.get(LIBRARY.exec(specifier)?.[1] ?? '') : undefined
      const target = specifier?.startsWith('.') ? local(specifier) : undefined
      const definition = target ? declaration(item.files.find((f) => f.path === target)!.content, source!) : undefined
      out.push({ name, type, ...(from ? { from } : specifier && !specifier.startsWith('.') ? { package: specifier } : {}), ...(definition && { definition }) })
    }
  }
  for (const [, kind, name] of text.matchAll(/^export (type|interface|const|function) (\w+)/gm)) {
    out.push({ name: name!, type: kind === 'type' || kind === 'interface', definition: declaration(file.content, name!)! })
  }
  return out
}

/** What an item's barrel exports besides its parts, in the order it exports them: the types and helpers a project imports beside the components. Injection keys and the context types they carry are the parts' own plumbing and stay out. */
export function itemExports(item: ServedItem, served: ServedItem[]): ItemExport[] {
  const barrel = item.files.find((f) => f.path.endsWith(`/${item.name}/index.ts`))
  if (!barrel) return []
  const all = exportsOf(item, barrel.path, new Set(), new Map(served.map((other) => [other.name, link(other)])))
  const plumbing = new Set(all.flatMap((entry) => (entry.definition && /\bInjectionKey<\s*(\w+)/.test(entry.definition) ? [entry.name, /\bInjectionKey<\s*(\w+)/.exec(entry.definition)![1]!] : [])))
  const seen = new Set<string>()
  return all.filter((entry) => !plumbing.has(entry.name) && !seen.has(entry.name) && seen.add(entry.name))
}

type Node = { type: number; tag?: string; children?: Node[] }
type Tree = { tag: string; children: Tree[] }

const templateOf = (content: string) => parse(content).descriptor.template?.ast?.children as Node[] | undefined

/** The part elements under `nodes`, nested as the template nests them; other elements are looked through. */
function partTree(nodes: Node[] = [], parts: Set<string>): Tree[] {
  return nodes.flatMap((node) => {
    if (node.type !== ELEMENT) return []
    const children = partTree(node.children, parts)
    return parts.has(node.tag!) ? [{ tag: node.tag!, children }] : children
  })
}

/** Siblings of one part merged into one, holding every part any of them holds, in the order they first appear. */
function merged(trees: Tree[]): Tree[] {
  const byTag = new Map<string, Tree>()
  for (const tree of trees) {
    const known = byTag.get(tree.tag)
    if (known) known.children.push(...tree.children)
    else byTag.set(tree.tag, { tag: tree.tag, children: [...tree.children] })
  }
  return [...byTag.values()].map((tree) => ({ tag: tree.tag, children: merged(tree.children) }))
}

/** A tree with one entry per part among siblings, and each part that renders other parts itself opened up into them. */
function tidy(trees: Tree[], expand: (tag: string) => Tree[], open: Set<string>): Tree[] {
  return merged(trees).map((tree) => {
    const children = tree.children.length || open.has(tree.tag) ? tree.children : merged(expand(tree.tag))
    return { tag: tree.tag, children: tidy(children, expand, new Set([...open, tree.tag])) }
  })
}

const render = (trees: Tree[], depth = 0): string[] =>
  trees.flatMap((tree) => {
    const pad = '  '.repeat(depth)
    return tree.children.length ? [`${pad}<${tree.tag}>`, ...render(tree.children, depth + 1), `${pad}</${tree.tag}>`] : [`${pad}<${tree.tag} />`]
  })

/** How an item's parts nest, as its main example writes them, a part that renders other parts itself opened up into them; none for an item of one part. */
export function itemAnatomy(item: ServedItem, partNames: string[]): string | undefined {
  if (partNames.length < 2) return undefined
  const parts = new Set(partNames)
  const example = item.files.find((f) => f.path.endsWith(`/${item.name}.example.vue`))
  const partFile = (tag: string) => item.files.find((f) => f.path.endsWith(`/${tag}.vue`))
  const expand = (tag: string) => {
    const file = partFile(tag)
    return file ? partTree(templateOf(file.content), new Set([...parts].filter((part) => part !== tag))) : []
  }
  const trees = tidy(partTree(example ? templateOf(example.content) : [], parts), expand, new Set())
  const shown = new Set(render(trees).map((line) => /<\/?(\w+)/.exec(line)![1]))
  return shown.size > 1 ? render(trees).join('\n') : undefined
}
