// A library item's files and the shape a save holds it to. Imports nothing: admin-ui's
// browser bundle loads it too.
const TIER_FOLDER = {
  'registry:ui': 'ui',
  'registry:component': 'sections',
  'registry:block': 'templates',
}
const FLAT_FOLDER = {
  'registry:lib': 'lib',
  'registry:composable': 'composables',
}
const NAME = /^[a-z0-9][a-z0-9-]*$/
// keep in step with ITEM_PATH and ITEM_IMPORT in apps/admin-ui/shared/utils/library/registry.ts
const ITEM_FOLDER = /^components\/(?:ui|sections|templates)\/[^/]+/
export const IMPORT = /(?<!["'`])(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)(["'])([^"'\n]+)\1/g
const SCRIPT = /<script\b[^>]*>([\s\S]*?)<\/script>/g
const STATEMENT = /(?<!["'`])\bimport\s+(?:([A-Za-z_$][\w$]*)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s*(["'])([^"']+)\3/g

export function itemFolder(item) {
  const tier = TIER_FOLDER[item?.type]
  return tier && NAME.test(item?.name ?? '') ? `components/${tier}/${item.name}` : null
}

/** A lib or composable item's one file, `<folder>/<name>.ts`; null for a component. */
export function flatFile(item) {
  const folder = FLAT_FOLDER[item?.type]
  return folder && NAME.test(item?.name ?? '') ? `${folder}/${item.name}.ts` : null
}

export function pascalName(name) {
  return name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())
}

function listed(item, path, type) {
  return (item?.files ?? []).some((f) => f?.path === path && f?.type === type) ? path : null
}

export function mainFile(item) {
  const folder = itemFolder(item)
  return folder && listed(item, `${folder}/${pascalName(item.name)}.vue`, item.type)
}

/** The item's main example, `<folder>/<name>.example.vue`, picked by path. */
export function exampleFile(item) {
  const folder = itemFolder(item)
  return folder && listed(item, `${folder}/${item.name}.example.vue`, 'registry:example')
}

/** Whether `path` names one of the item's further examples, `<folder>/<name>.<slug>.example.vue`. */
function isExtraExample(item, folder, path) {
  const prefix = `${folder}/${item.name}.`
  if (!path.startsWith(prefix) || !path.endsWith('.example.vue')) return false
  const slug = path.slice(prefix.length, -'.example.vue'.length)
  return NAME.test(slug) && slug !== 'example' && slug !== 'main'
}

export function barrelFile(item) {
  const folder = itemFolder(item)
  return folder && listed(item, `${folder}/index.ts`, item.type)
}

/** A file's code with comments removed; a .vue file's script blocks only. */
export function importCode(file, text) {
  const code = file.endsWith('.vue') ? [...text.matchAll(SCRIPT)].map((m) => m[1]).join('\n') : text
  let out = ''
  let quote = null
  for (let i = 0; i < code.length; i++) {
    const c = code[i]
    if (quote) {
      out += c
      if (c === '\\') out += code[++i] ?? ''
      else if (c === quote) quote = null
    } else if (c === '"' || c === "'" || c === '`') {
      quote = c
      out += c
    } else if (c === '/' && code[i + 1] === '/') {
      const end = code.indexOf('\n', i)
      i = end === -1 ? code.length : end - 1
    } else if (c === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2)
      i = end === -1 ? code.length : end + 1
    } else {
      out += c
    }
  }
  return out
}

/** The library-root path a specifier points at, or null when it leaves the library. */
export function importTarget(file, specifier) {
  if (specifier.startsWith('@library/')) return specifier.slice('@library/'.length)
  if (specifier !== '.' && !specifier.startsWith('./') && !specifier.startsWith('../')) return null
  const parts = file.split('/').slice(0, -1)
  for (const part of specifier.split('/')) {
    if (part === '' || part === '.') continue
    if (part !== '..') parts.push(part)
    else if (parts.pop() === undefined) return null
  }
  return parts.join('/')
}

// Longer than any real open tag; bounds the quote-aware scan on a file of unclosed `<script`s.
const SCRIPT_TAG_LIMIT = 1024

/** The offset past the `>` closing the `<script` tag at `from`, quotes skipped within the limit;
 * else past the first `>` after it, so an odd tag over-reports. `firstGt`: first `>` at or after. */
function scriptOpenEnd(text, from, firstGt) {
  const limit = Math.min(text.length, from + SCRIPT_TAG_LIMIT)
  for (let i = from + '<script'.length; i < limit; i++) {
    const c = text[i]
    if (c === '>') return i + 1
    if (c === '"' || c === "'") {
      const close = text.indexOf(c, i + 1)
      if (close === -1 || close >= limit) break
      i = close
    }
  }
  const gt = firstGt(from)
  return gt === -1 ? -1 : gt + 1
}

/** A .vue file's script bodies as [start, end) offsets; any other file whole. */
export function codeSpans(file, text) {
  if (!file.endsWith('.vue')) return [[0, text.length]]
  let gt = -2
  // Offsets only grow, so each `>` is searched for once across the file.
  const firstGt = (from) => {
    if (gt !== -1 && gt < from) gt = text.indexOf('>', from)
    return gt
  }
  const spans = []
  for (let at = text.indexOf('<script'); at !== -1; at = text.indexOf('<script', at + 1)) {
    if (/[\w$-]/.test(text[at + '<script'.length] ?? '')) continue
    if (spans.length && at < spans.at(-1)[1]) continue
    const start = scriptOpenEnd(text, at, firstGt)
    if (start === -1) break
    const close = text.indexOf('</script>', start)
    spans.push([start, close === -1 ? text.length : close])
  }
  return spans
}

const OPENS_SPECIFIER = /(?:^|[^\w$.])(?:from|import)$/
const OPENS_CALL = /(?:^|[^\w$.])import$/

/** Whether `code`, the masked code before a string, ends in `from`, `import` or the call form of `import`. */
function opensSpecifier(code) {
  const before = code.trimEnd()
  return before.endsWith('(') ? OPENS_CALL.test(before.slice(0, -1).trimEnd()) : OPENS_SPECIFIER.test(before)
}

/** `text` with everything that cannot hold an import blanked, positions kept: comments, a
 * .vue file outside its script bodies, and every string that is not an import's specifier. */
export function importMask(file, text) {
  const out = text.split('')
  const blank = (from, to) => {
    for (let i = from; i < to; i++) if (out[i] !== '\n') out[i] = ' '
  }
  let at = 0
  for (const [start, end] of codeSpans(file, text)) {
    blank(at, start)
    at = end
    // The last few characters of masked code, whitespace runs collapsed: enough for opensSpecifier.
    let tail = ''
    const push = (c) => {
      const next = /\s/.test(c) ? (tail.endsWith(' ') ? tail : tail + ' ') : tail + c
      tail = next.length > 16 ? next.slice(-16) : next
    }
    for (let i = start; i < end; i++) {
      const c = text[i]
      if (c === '/' && text[i + 1] === '/') {
        const stop = text.indexOf('\n', i)
        const to = stop === -1 || stop > end ? end : stop
        blank(i, to)
        push(' ')
        i = to - 1
      } else if (c === '/' && text[i + 1] === '*') {
        const stop = text.indexOf('*/', i + 2)
        const to = stop === -1 || stop + 2 > end ? end : stop + 2
        blank(i, to)
        push(' ')
        i = to - 1
      } else if (c === '"' || c === "'" || c === '`') {
        // A ' or " string ends with its line, so a lone quote costs one line at most.
        let close = i + 1
        while (close < end && text[close] !== c && (c === '`' || text[close] !== '\n')) {
          close += text[close] === '\\' ? 2 : 1
        }
        if (c === '`' || !opensSpecifier(tail)) {
          blank(i, Math.min(close + 1, end))
          push(' ')
        } else {
          push(c)
        }
        i = Math.min(close, end - 1)
      } else {
        push(c)
      }
    }
  }
  blank(at, text.length)
  return out.join('')
}

/** Every import specifier in `file`, with the line and column of its opening quote. */
export function importsOf(file, text) {
  return [...importMask(file, text).matchAll(IMPORT)].map((m) => {
    const before = text.slice(0, m.index + m[0].length - m[2].length - 2).split('\n')
    return { specifier: m[2], line: before.length, column: before.at(-1).length + 1 }
  })
}

/** Imports that reach into another item's folder past its barrel. `file` is a library-root
 * path, or a content path whose relative imports reach the library as `library/…`. */
export function deepImportProblems(file, text) {
  const own = ITEM_FOLDER.exec(file)?.[0] ?? null
  const problems = []
  for (const { specifier, line, column } of importsOf(file, text)) {
    const target = importTarget(file, specifier)?.replace(/^library\//, '')
    const folder = target && ITEM_FOLDER.exec(target)?.[0]
    if (!folder || folder === own || target === folder) continue
    problems.push({
      specifier,
      folder,
      line,
      column,
      message: `${file} imports ${specifier}; import the item's folder, @library/${folder}`,
    })
  }
  return problems
}

function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/** Local names the example binds to its main, by file or through the barrel. */
function mainBindings(examplePath, code, folder, main) {
  const names = []
  for (const [, fallback, named, , specifier] of code.matchAll(STATEMENT)) {
    const target = importTarget(examplePath, specifier)
    if (target === `${folder}/${main}.vue` || target === `${folder}/${main}`) {
      if (fallback) names.push(fallback)
    }
    if (target === folder || target === `${folder}/index` || target === `${folder}/index.ts`) {
      for (const part of (named ?? '').split(',')) {
        const [imported, local] = part.trim().split(/\s+as\s+/)
        if (imported === main) names.push(local ?? imported)
      }
    }
  }
  return names
}

function tagForwards(template, name) {
  const dashed = kebab(name)
  for (const tag of new Set(dashed.includes('-') ? [name, dashed] : [name])) {
    const open = new RegExp(`<${tag}(?=[\\s/>])((?:[^>"']|"[^"]*"|'[^']*')*)>`, 'g')
    for (const [, attrs] of template.matchAll(open)) {
      if (/(?:^|\s)v-bind=(["'])\s*\$attrs\s*\1\s*\/?\s*$/.test(attrs)) return true
    }
  }
  return false
}

/** The example turns attribute inheritance off and hands `$attrs` to the main's tag, as its
 * last attribute so a forwarded value beats the tag's own. */
export function forwardsAttrs({ examplePath, exampleText, folder, main }) {
  const code = importCode(examplePath, exampleText)
  if (!/defineOptions\s*\(\s*\{[^}]*\binheritAttrs\s*:\s*false\b/.test(code)) return false
  const template = exampleText.replace(SCRIPT, '').replace(/<!--[\s\S]*?-->/g, '')
  return mainBindings(examplePath, code, folder, main).some((name) => tagForwards(template, name))
}

/** A lib or composable item is the one file `<folder>/<name>.ts` and maps no recipe. */
function flatShapeProblems({ item, files }) {
  const problem = (message) => ({ path: 'files', message })
  const path = flatFile(item)
  if (!path) return []
  const kind = FLAT_FOLDER[item.type]
  const problems = []
  const listed = item.files ?? []
  if (listed.length !== 1 || listed[0]?.path !== path || listed[0]?.type !== item.type) {
    problems.push(problem(`a ${kind} item is exactly one file, ${path} of type ${item.type}; found ${listed.map((f) => f?.path).join(', ') || 'none'}`))
  }
  if (Object.keys(recipeMap(item)).length) problems.push(problem(`a ${kind} item has no recipes; ${item.name} has some`))
  for (const { path: file } of listed) {
    const text = files[file]
    if (typeof text !== 'string') continue
    for (const deep of deepImportProblems(file, text)) problems.push(problem(deep.message))
  }
  return problems
}

/** The library-save rules for one item. `files` holds texts by library-root path;
 * a text rule skips a file whose text is missing. */
export function itemShapeProblems({ item, files }) {
  const problems =
    item?.meta?.frontic?.recipes === undefined
      ? []
      : [{ path: 'meta', message: `${item.name} carries meta.frontic.recipes, the map before 0.13.0; list its own trees under recipes and its shared recipes under composes` }]
  return [...problems, ...(FLAT_FOLDER[item?.type] ? flatShapeProblems : folderShapeProblems)({ item, files })]
}

/** A component item's folder: its barrel, main, examples and imports. */
function folderShapeProblems({ item, files }) {
  const folder = itemFolder(item)
  if (!folder) return []
  const problem = (message) => ({ path: 'files', message })
  const problems = []
  const main = mainFile(item)
  const pascal = pascalName(item.name)
  const barrel = barrelFile(item)
  if (!barrel) problems.push(problem(`needs ${folder}/index.ts of type ${item.type}`))
  const barrelText = barrel ? files[barrel] : null
  if (main && typeof barrelText === 'string') {
    const exported = new RegExp(`(["'])\\./${pascal}\\.vue\\1`)
    if (!exported.test(importCode(barrel, barrelText))) problems.push(problem(`${barrel} must export ./${pascal}.vue`))
  }
  const example = exampleFile(item)
  if (!example) problems.push(problem(`needs its main example, ${folder}/${item.name}.example.vue of type registry:example`))
  for (const { path } of (item.files ?? []).filter((f) => f?.type === 'registry:example')) {
    if (path !== example && !isExtraExample(item, folder, path)) {
      problems.push(problem(`${path} is no example of ${item.name}; a further example is ${folder}/${item.name}.<slug>.example.vue`))
    }
  }
  const exampleText = example ? files[example] : null
  if (main && example && typeof exampleText === 'string') {
    if (!forwardsAttrs({ examplePath: example, exampleText, folder, main: pascal })) {
      problems.push(problem(`${example} must call defineOptions({ inheritAttrs: false }) and put v-bind="$attrs" last on <${pascal}>`))
    }
  }
  for (const { path } of item.files ?? []) {
    const text = files[path]
    if (typeof text !== 'string') continue
    for (const deep of deepImportProblems(path, text)) problems.push(problem(deep.message))
  }
  return problems
}

const RECIPE_CLASS = /(?<![\w-])fui-([A-Za-z](?:[A-Za-z0-9-]*[A-Za-z0-9])?)(?![\w-])/g

/** Every `fui-<name>` class written out in `text`, once, in order. */
export function recipeClasses(text) {
  return [...new Set([...text.matchAll(RECIPE_CLASS)].map((match) => match[1]))]
}

const TREE_KEYS = ['base', 'variants', 'defaults', 'keepAxis']
const isNode = (def) => typeof def === 'object' && def !== null && !Array.isArray(def)
const isTree = (def) => isNode(def) && (TREE_KEYS.some((key) => Object.hasOwn(def, key)) || Object.hasOwn(def, 'composes'))

/** The shared recipes an item's elements wear, as recipe.mjs's `composesOf` reads them: each tree's `composes`, then a top-level one. */
const composedBy = (recipes, composes) => [
  ...new Set([...Object.values(isNode(recipes) ? recipes : {}).flatMap((def) => (isNode(def) && Array.isArray(def.composes) ? def.composes : [])), ...(Array.isArray(composes) ? composes : [])]),
]

/** An item's recipes by part: `default` for its tree named after it, `<part>` for each `<item>-<part>` tree that makes a class (a tree holding
 * only `composes` makes none), and each recipe it composes under its own name. A served item's `shared` families are
 * not parts. */
export function recipeMap({ name, recipes = {}, composes }) {
  const map = {}
  for (const [tree, def] of Object.entries(recipes ?? {})) {
    if (!isTree(def) || !TREE_KEYS.some((key) => Object.hasOwn(def, key))) continue
    if (tree === name) map.default = tree
    else if (tree.startsWith(`${name}-`)) map[tree.slice(name.length + 1)] = tree
  }
  for (const recipe of composedBy(recipes, composes)) map[recipe] = recipe
  return map
}

/** The files that may hold an item's recipe classes: all but its examples. */
export function recipeFiles(item) {
  return (item.files ?? []).filter((file) => file.type !== 'registry:example').map((file) => file.path)
}

/** Every recipe an item maps appears as a `fui-<name>` class in one of its recipe files. */
export function recipeClassProblems(registry, texts) {
  const problems = []
  for (const [index, item] of (registry.items ?? []).entries()) {
    const read = recipeFiles(item)
      .map((file) => texts[file])
      .filter((text) => typeof text === 'string')
    if (!read.length) continue
    const used = new Set(read.flatMap(recipeClasses))
    for (const recipe of new Set(Object.values(recipeMap(item)))) {
      if (used.has(recipe)) continue
      problems.push({ path: `items[${index}].recipes`, message: `${item.name} has the recipe "${recipe}", but none of its files has a fui-${recipe} class` })
    }
  }
  return problems
}
