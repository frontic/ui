// A component's cva against the tree its recipe makes: the classes each slot wears.
import ts from 'typescript'
import { TREE_COMPOSES, treeEntries, valueParts } from './recipe.mjs'

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

const QUOTED = /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g
/** Block comments, HTML comments and whole-line `//` comments: an apostrophe in one would pair with the quotes after it. */
const COMMENT = /\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|^[ \t]*\/\/.*$/gm
const withoutComments = (text) => text.replace(COMMENT, '')

/** Every class-like token in a file's quoted strings. */
export function* classTokens(text) {
  for (const match of withoutComments(text).matchAll(QUOTED)) {
    for (const raw of match[2].split(/\s+/)) {
      // `:class="['a b', props.class]"` leaves brackets, quotes and commas on the ends, `normalizeClass(['a b'])` its call too
      let token = raw.replace(/^[\w$.]+\((?=[[{'"`])/, '').replace(/^[({'"`]+|[)}'"`,]+$/g, '')
      // a bracket the token does not close is the array's, not an arbitrary variant's
      const count = (c) => token.split(c).length - 1
      while (token.startsWith('[') && count('[') > count(']')) token = token.slice(1).replace(/^['"`]+/, '')
      while (token.endsWith(']') && count(']') > count('[')) token = token.slice(0, -1).replace(/[)}'"`,]+$/, '')
      if (token) yield token
    }
  }
}

/** The end of the parenthesis opened at `start`, string literals skipped; -1 when it never closes. */
function closing(text, start) {
  let depth = 0
  let quote = ''
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (quote) quote = c === quote && text[i - 1] !== '\\' ? '' : quote
    else if (c === "'" || c === '"' || c === '`') quote = c
    else if (c === '(') depth++
    else if (c === ')' && --depth === 0) return i
  }
  return -1
}

/** The class tokens each element of a file receives: one group per class attribute, per class a prop hands on (`:container-class`) and per cva call. */
export function classGroups(source) {
  const text = withoutComments(source)
  const groups = []
  for (const match of text.matchAll(/(?<![\w:.-])(?::|v-bind:)?(?!data-)(?:[\w-]*-class|\w*Class|class)\s*=\s*"([^"]*)"/g)) groups.push([...classTokens(`"${match[1]}"`)])
  for (const match of text.matchAll(/\bcva\s*\(/g)) {
    const start = match.index + match[0].length - 1
    const end = closing(text, start)
    if (end > start) groups.push([...classTokens(text.slice(start, end + 1))])
  }
  return groups
}

/** A literal as written: strings, objects and arrays of them; undefined for anything computed. */
function literal(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal)
  if (!ts.isObjectLiteralExpression(node)) return undefined
  const out = {}
  for (const prop of node.properties) {
    if (!ts.isPropertyAssignment(prop) || !(ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))) continue
    out[prop.name.text] = literal(prop.initializer)
  }
  return out
}

/** Every cva call of a file's script, its two arguments read literally, with the line of the file it starts on. */
export function readCvas(text) {
  const blocks = text.includes('<script') ? [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => ({ text: m[1], at: m.index + m[0].indexOf(m[1]) })) : [{ text, at: 0 }]
  const found = []
  for (const block of blocks) {
    const source = ts.createSourceFile('component.ts', block.text, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
    const lineBefore = text.slice(0, block.at).split('\n').length - 1
    const visit = (node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'cva') {
        const [base, config] = node.arguments
        const read = config ? literal(config) : {}
        const line = lineBefore + source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
        found.push({ base: base ? literal(base) : undefined, config: isRecord(read) ? read : {}, line })
      } else ts.forEachChild(node, visit)
    }
    visit(source)
  }
  return found
}

const baseTokens = (cva) => (typeof cva.base === 'string' ? cva.base.split(/\s+/).filter(Boolean) : [])

/** What each cva slot of a tree's component holds: the base class, one class per axis value, the defaults. A pair is no slot. */
export function expectedClasses(name, tree) {
  const parts = valueParts(tree)
  return {
    base: tree.base === undefined ? null : `fui-${name}`,
    variants: Object.fromEntries(
      Object.entries(tree.variants ?? {}).map(([axis, values]) => [axis, Object.fromEntries(Object.keys(values).map((value) => [value, `fui-${name}-${parts.get(axis).get(value)}`]))]),
    ),
    defaultVariants: { ...(tree.defaults ?? {}) },
  }
}

/** Each file parsed once: its cva calls and the class tokens its elements wear. `files` maps paths to their text. */
export function indexComponents(files) {
  return Object.entries(files).map(([file, text]) => ({ file, text, cvas: readCvas(text), groups: classGroups(text) }))
}
const indexed = (source) => (Array.isArray(source) ? source : indexComponents(source))

const valueTokens = (cva) =>
  Object.values(isRecord(cva.config.variants) ? cva.config.variants : {}).flatMap((values) =>
    isRecord(values) ? Object.values(values).flatMap((v) => (typeof v === 'string' ? v.split(/\s+/).filter(Boolean) : [])) : [],
  )

/** The file a tree's class sits in: `main` when named, its first cva standing in for one without the class; else the file whose
 * cva base holds `fui-<name>`; else the cva whose values hold the tree's value classes (with `tree`, exactly those; without, any
 * `fui-<name>-…`); else a file wearing `fui-<name>` in a class attribute; null when none does. `source` is the files by path, or
 * their index from `indexComponents`. */
export function componentSite(name, source, { main, tree } = {}) {
  const cls = `fui-${name}`
  const index = indexed(source)
  if (main !== undefined) {
    const entry = index.find((e) => e.file === main)
    if (!entry) return null
    return { file: main, text: entry.text, cva: entry.cvas.find((cva) => baseTokens(cva).includes(cls)) ?? entry.cvas[0] ?? null }
  }
  for (const entry of index) {
    const own = entry.cvas.find((cva) => baseTokens(cva).includes(cls))
    if (own) return { file: entry.file, text: entry.text, cva: own }
  }
  const expected = tree ? new Set(Object.values(expectedClasses(name, tree).variants).flatMap((values) => Object.values(values))) : null
  const wearsValue = (token) => (expected ? expected.has(token) : token.startsWith(`${cls}-`))
  for (const entry of index) {
    const own = entry.cvas.find((cva) => valueTokens(cva).some(wearsValue))
    if (own) return { file: entry.file, text: entry.text, cva: own }
  }
  const worn = index.find((entry) => entry.groups.some((group) => group.includes(cls)))
  return worn ? { file: worn.file, text: worn.text, cva: null } : null
}

const sameStrings = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([k, v]) => b[k] === v)
const whenText = (when) =>
  `{ ${Object.entries(when)
    .map(([axis, value]) => `${axis}: ${value}`)
    .join(', ')} }`

const fileName = (file) => file.split('/').at(-1)

/** Where a component differs from what its tree makes: the cva's base, each value and the defaults; a compoundVariants entry wears
 * no recipe class. `source` is the component's files by path or their index; `main` names the file the tree's own component lives
 * in; `site` hands in the one `componentSite` found. With `utilityAxes`, a cva axis the tree lacks passes while its values wear
 * utilities only, a project's layout prop; one wearing a `fui-` class is still an axis the tree does not define. */
export function componentProblems(name, tree, source, { main, site: found, utilityAxes = false } = {}) {
  const site = found ?? componentSite(name, source, { main, tree })
  if (!site) return [`${name}: no file wears fui-${name}`]
  const { file, text, cva } = site
  const expected = expectedClasses(name, tree)
  if (!cva) {
    if (Object.keys(expected.variants).length || Object.keys(expected.defaultVariants).length) return [`${name}: ${fileName(file)} has no cva; its tree has variants`]
    return expected.base && !classGroups(text).some((group) => group.includes(expected.base)) ? [`${name}: ${fileName(file)} lacks ${expected.base}`] : []
  }
  const problems = []
  const base = baseTokens(cva)
  if (expected.base && !base.includes(expected.base)) problems.push(`${name}: the cva base lacks ${expected.base}`)
  for (const token of base) if (token.startsWith('fui-') && token !== expected.base) problems.push(`${name}: the cva base holds ${token}, which the tree does not put there`)
  const variants = isRecord(cva.config.variants) ? cva.config.variants : {}
  for (const [axis, values] of Object.entries(expected.variants)) {
    const own = isRecord(variants[axis]) ? variants[axis] : undefined
    if (!own) {
      problems.push(`${name}: variants.${axis} is missing`)
      continue
    }
    for (const [value, cls] of Object.entries(values)) {
      if (!Object.hasOwn(own, value)) problems.push(`${name}: variants.${axis}.${value} is missing`)
      else if (own[value] !== cls) problems.push(`${name}: variants.${axis}.${value} holds "${String(own[value])}"; the tree makes it "${cls}"`)
    }
    for (const value of Object.keys(own)) if (!Object.hasOwn(values, value)) problems.push(`${name}: variants.${axis}.${value} is a value the tree does not define`)
  }
  const wearsRecipe = (values) => (isRecord(values) ? Object.values(values) : []).some((v) => typeof v === 'string' && v.split(/\s+/).some((token) => token.startsWith('fui-')))
  for (const [axis, values] of Object.entries(variants))
    if (!Object.hasOwn(expected.variants, axis) && (!utilityAxes || wearsRecipe(values))) problems.push(`${name}: variants.${axis} is an axis the tree does not define`)
  for (const entry of (Array.isArray(cva.config.compoundVariants) ? cva.config.compoundVariants : []).filter(isRecord)) {
    const { class: cls, className, ...when } = entry
    const worn = String(cls ?? className ?? '')
      .split(/\s+/)
      .find((token) => token.startsWith('fui-'))
    if (worn) problems.push(`${name}: compoundVariants ${whenText(when)} wears ${worn}; a pair is a rule over its values, not a class`)
  }
  const defaults = isRecord(cva.config.defaultVariants) ? cva.config.defaultVariants : {}
  if (!sameStrings(defaults, expected.defaultVariants)) problems.push(`${name}: defaultVariants is ${JSON.stringify(defaults)}; the tree’s defaults are ${JSON.stringify(expected.defaultVariants)}`)
  return problems
}

/** Every tree of `recipes` (as readRecipeFolder returns them) against the library's component files, one `{ file, line, message }` per
 * mismatch, the line the cva starts on. A tree no file wears is not installed, so it has nothing to drift from; a cva axis of
 * utilities alone is the project's own prop. */
export function libraryComponentProblems(recipes, files) {
  const index = indexComponents(files)
  const problems = []
  for (const [name, tree] of Object.entries(recipes.trees ?? {})) {
    const site = componentSite(name, index, { tree })
    if (!site) continue
    for (const message of componentProblems(name, tree, index, { site, utilityAxes: true })) problems.push({ file: site.file, line: site.cva?.line ?? 1, message })
  }
  return problems
}

const RECIPE_CLASS = /(?<![\w-])fui-([A-Za-z](?:[A-Za-z0-9-]*[A-Za-z0-9])?)(?![\w-])/g

/** Every shared recipe an element wears that no tree composes where it should: an element carrying a tree of the item's own needs one of
 * those trees to compose it; an element carrying none answers to the item's root tree, `name`. `recipes` are the item's trees, `files` its
 * component files by path (examples left out by the caller), `flat` the shared recipes by name. One message per element and recipe. */
export function composesProblems(name, recipes, files, flat) {
  const owner = new Map()
  for (const [tree, def] of Object.entries(isRecord(recipes) ? recipes : {})) {
    owner.set(tree, tree)
    for (const entry of treeEntries(tree, def)) if (entry.layer !== 'compound') owner.set(entry.name, tree)
  }
  const composes = (tree) => (isRecord(recipes?.[tree]) && Array.isArray(recipes[tree][TREE_COMPOSES]) ? recipes[tree][TREE_COMPOSES] : [])
  const problems = []
  for (const [file, text] of Object.entries(files)) {
    for (const group of classGroups(text)) {
      const classes = [...new Set(group.flatMap((token) => [...token.matchAll(RECIPE_CLASS)].map((match) => match[1])))]
      const own = [...new Set(classes.filter((cls) => owner.has(cls)).map((cls) => owner.get(cls)))]
      for (const shared of classes.filter((cls) => !owner.has(cls) && Object.hasOwn(flat, cls))) {
        if (own.length ? own.some((tree) => composes(tree).includes(shared)) : composes(name).includes(shared)) continue
        problems.push(
          own.length
            ? `${file}: fui-${shared} sits on an element of ${own.join(', ')}; compose it there: "${own[0]}": { "composes": [..., "${shared}"] }`
            : `${file}: fui-${shared} sits on an element with no tree of its own, so it answers to ${name}; compose it there: "${name}": { "composes": [..., "${shared}"] }`,
        )
      }
    }
  }
  return [...new Set(problems)]
}
