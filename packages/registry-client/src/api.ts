import { importsOf, recipeMap } from '@frontic/library-contract/item'
import { composesOf } from '@frontic/library-contract/recipe'
import { z } from 'zod'
import type { RegistryFile, RegistryItem } from './schemas'

export const CLI = 'npx @frontic/ui'
export const MCP_NAME = 'frontic-ui'
export const MCP_URL = 'https://mcp.ui.frontic.com/mcp'
export const REGISTRY_URL = 'https://registry.ui.frontic.com/v1'
export const SITE_URL = 'https://ui.frontic.com'

/** The tiers search filters by, named for the folders `add` installs them to, each with its registry type. */
export const TIERS = { ui: 'registry:ui', sections: 'registry:component', templates: 'registry:block', lib: 'registry:lib', composables: 'registry:composable' } as const
export type Tier = keyof typeof TIERS
export const TIER_NAMES = Object.keys(TIERS) as [Tier, ...Tier[]]

/** The tier an item's registry type belongs to. */
export const tierOf = (type: string) => TIER_NAMES.find((tier) => TIERS[tier] === type)

export const propSchema = z.object({
  name: z.string(),
  type: z.string(),
  /** The type with its aliases resolved, when that differs: `AlertVariant` as its members. */
  fullType: z.string().optional(),
  required: z.boolean(),
  default: z.string().optional(),
  description: z.string().optional(),
})
export const partSchema = z.object({
  name: z.string(),
  aliases: z.array(z.string()).optional(),
  /** What the part is for, from the JSDoc on its default export. */
  description: z.string().optional(),
  /** The HTML element the part renders by default. */
  element: z.string().optional(),
  file: z.string(),
  slot: z.string().optional(),
  props: z.array(propSchema),
  events: z.array(z.object({ name: z.string(), type: z.string(), description: z.string().optional() })),
  slots: z.array(z.object({ name: z.string(), type: z.string().optional(), description: z.string().optional() })),
  /** The data attributes on the part's own element, to style or test it by. */
  dataAttributes: z.array(z.object({ name: z.string(), values: z.array(z.string()).optional(), description: z.string().optional() })).optional(),
  /** The CSS variables set on the part's own element or an element around it, to size or animate it by. */
  cssVariables: z.array(z.object({ name: z.string(), description: z.string().optional() })).optional(),
  /** The recipes the part wears that borrow shared families, with those families. */
  styling: z.array(z.object({ recipe: z.string(), families: z.array(z.string()) })).optional(),
})
export const ITEM_STATES = ['hover', 'focus', 'checked', 'disabled', 'invalid'] as const
export const itemLinkSchema = z.object({ name: z.string(), title: z.string(), path: z.string() })
export const itemExportSchema = z.object({
  name: z.string(),
  type: z.boolean(),
  /** The helper or item it is re-exported from. */
  from: itemLinkSchema.optional(),
  /** The npm package it is re-exported from. */
  package: z.string().optional(),
  /** Its declaration, when the item declares it. */
  definition: z.string().optional(),
})
export const itemApiSchema = z.object({
  install: z.string(),
  parts: z.array(partSchema),
  /** How the parts nest, as markup; none for an item of one part. */
  anatomy: z.string().optional(),
  /** The interaction states the item's recipes or classes give a look of their own. */
  states: z.array(z.enum(ITEM_STATES)).optional(),
  /** What the barrel exports besides the parts. */
  exports: z.array(itemExportSchema).optional(),
  builtFrom: z.array(itemLinkSchema).optional(),
  usedBy: z.array(itemLinkSchema).optional(),
  /** Each shared recipe the item extends or, when `composed`, puts on its own elements, with the other items that use it. */
  sharedRecipes: z.array(z.object({ recipe: z.string(), composed: z.boolean(), alsoIn: z.array(itemLinkSchema) })).optional(),
})

export type ApiProp = z.infer<typeof propSchema>
export type ApiPart = z.infer<typeof partSchema>
export type ItemApi = z.infer<typeof itemApiSchema>
export type ItemState = (typeof ITEM_STATES)[number]
/** Another item as the docs link it: `path` is where its docs live on the site, without `.md`. */
export type ItemLink = z.infer<typeof itemLinkSchema>
export type ItemExport = z.infer<typeof itemExportSchema>

/** The command that installs items with the public CLI. */
export const addCommand = (items: string[]) => `${CLI} add ${items.join(' ')}`

/** Where an item's docs live on the site, without `.md`: the folder `add` installs a component to, or a helper's file. */
export const docsPath = (item: Pick<RegistryItem, 'files'>) => item.files[0]!.path.replace(/(^components\/[^/]+\/[^/]+)\/.*$/, '$1').replace(/\.ts$/, '')

/** The items an item's main example imports besides the item itself: the ones its docs show the API of after its own. */
export function exampleItems(item: Pick<RegistryItem, 'name' | 'files'>): string[] {
  const main = examplesOf(item)[0]
  const names = main ? [...main.content.matchAll(/\bfrom\s+['"]@library\/components\/[^/]+\/([\w-]+)['"]/g)].map(([, name]) => name!) : []
  return [...new Set(names)].filter((name) => name !== item.name)
}

const CODE = /\.[cm]?[jt]sx?$/
const NOT_A_PACKAGE = /^(?:\.|\/|~|#|@\/|@library\/|@registry\/|node:)/
const PROVIDED = new Set(['vue', '@frontic/source'])
const packageOf = (specifier: string) =>
  specifier
    .split('/')
    .slice(0, specifier.startsWith('@') ? 2 : 1)
    .join('/')

/** The npm packages `files` (path to content) import, sorted: `zod` for `zod/v4`, without aliases, relative imports and the packages every project has. */
export function importedPackages(files: Record<string, string>): string[] {
  const names = Object.entries(files)
    .flatMap(([file, text]) => (file.endsWith('.vue') || CODE.test(file) ? importsOf(file, text).map((i) => i.specifier) : []))
    .filter((s) => !NOT_A_PACKAGE.test(s))
    .map(packageOf)
    .filter((p) => !PROVIDED.has(p))
  return [...new Set(names)].sort()
}

/** The package a served dependency names, without the version a pinned one carries. */
export const packageName = (dependency: string) => /^(@?[^@]+)/.exec(dependency)![1]!

/** The npm packages an item's main example imports that its own `dependencies` lack. Not `@lucide/vue`: a project has its icons in its own icon library. */
export function exampleNpmPackages(item: Pick<RegistryItem, 'name' | 'files' | 'dependencies'>): string[] {
  const main = examplesOf(item)[0]
  if (!main) return []
  const declared = new Set((item.dependencies ?? []).map(packageName))
  return importedPackages({ [main.path]: main.content }).filter((name) => !declared.has(name) && name !== '@lucide/vue')
}

// A table cell holds one line: a paragraph break and a list item become `<br>`, a soft break a space.
const cell = (text: string) =>
  text
    .replaceAll('|', '\\|')
    .replaceAll(/\n\s*\n/g, '<br><br>')
    .replaceAll(/\n(?=- )/g, '<br>')
    .replaceAll('\n', ' ')
const code = (text: string) => `\`${cell(text)}\``

/** An event's arguments as its tuple type lists them, without the brackets; none for an event that passes nothing. */
export const eventPayload = (type: string): string | undefined => type.replace(/^\[(.*)\]$/, '$1') || undefined

/** Whether a barrel only re-exports, so the files it names show everything it has: comments and `export … from` statements, nothing else. */
export const reExportsOnly = (content: string) =>
  !content
    .replaceAll(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
    .replaceAll(/export\s+(?:type\s+)?(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s+from\s+'[^']+'/g, '')
    .trim()

/** The files an item's source shows: the ones the CLI installs, the examples and a barrel that only re-exports left out. */
export const sourceFiles = (files: RegistryItem['files']) => files.filter((f) => f.type !== 'registry:example' && !(f.path.endsWith('/index.ts') && reExportsOnly(f.content)))

/** A data attribute's values as the union a selector picks from, `'open' | 'closed'`. */
export const attributeValues = (values?: string[]) => values?.map((value) => `'${value}'`).join(' | ')

/** The slots worth a row: a default slot that passes no slot props says nothing every component does not. */
export const documentedSlots = (part: ApiPart) => part.slots.filter((slot) => slot.name !== 'default' || slot.type)
const fence = (lang: string, text: string) => `\`\`\`${lang}\n${text.trimEnd()}\n\`\`\``
const language = (path: string) => (path.endsWith('.vue') ? 'vue' : 'ts')

/** An item's examples, the main `<name>.example.vue` first, then `<name>.<slug>.example.vue` by slug. */
export function examplesOf(item: Pick<RegistryItem, 'name' | 'files'>): RegistryFile[] {
  const main = `${item.name}.example.vue`
  const examples = item.files.filter((f) => f.type === 'registry:example')
  return [...examples.filter((f) => fileName(f.path) === main), ...examples.filter((f) => fileName(f.path) !== main).sort((a, b) => a.path.localeCompare(b.path))]
}

/** An example's slug: `sale` for `price.sale.example.vue`, `main` for the item's main example. */
export const exampleSlug = (item: Pick<RegistryItem, 'name'>, path: string) => fileName(path).slice(item.name.length + 1, -'.example.vue'.length) || 'main'

const fileName = (path: string) => path.slice(path.lastIndexOf('/') + 1)

/** The width examples are formatted at, the `*.example.vue` override in the repo's `.oxfmtrc.json`. */
export const EXAMPLE_WIDTH = 80

/** An import the alias made longer than `EXAMPLE_WIDTH`, one name per line as oxfmt prints it. */
const wrapImport = (line: string) => {
  const parts = line.length > EXAMPLE_WIDTH ? /^import (type )?\{ (.+) \} from ('[^']+')$/.exec(line) : null
  return parts
    ? `import ${parts[1] ?? ''}{\n${parts[2]!
        .split(', ')
        .map((name) => `  ${name},\n`)
        .join('')}} from ${parts[3]}`
    : line
}

/** An example as a project writes it: the item, the items it is built from and their lib and composables imported from where the CLI installs them with the default aliases, without the attribute pass-through the site's frames use. */
export const exampleUsage = (path: string, content: string) =>
  content
    .replaceAll(new RegExp("from '\\.'", 'g'), `from '@/${path.slice(0, path.lastIndexOf('/'))}'`)
    .replaceAll(/from '@library\/(components|lib|composables)\//g, "from '@/$1/")
    .replace(/\n*defineOptions\(\{ inheritAttrs: false \}\)\n/, '\n')
    .replaceAll(/\s+v-bind="\$attrs"/g, '')
    .split('\n')
    .map(wrapImport)
    .join('\n')

const list = (words: string[]) => (words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`)

/** Where `add` writes a component's manifest with the default aliases, beside its files: `components/<tier>/<name>/<name>.json`; none for a lib or composable item. */
const manifestPath = (item: RegistryItem) => {
  const folder = `/${item.name}/`
  const file = item.files.find((f) => f.path.startsWith('components/') && f.path.includes(folder))
  return file && `${file.path.slice(0, file.path.indexOf(folder) + folder.length)}${item.name}.json`
}

/** Where a recipe is defined: a shared recipe in its own `/recipes/<name>.json`, a tree in its component's manifest, `/components/<tier>/<item>/<item>.json#<tree>`. */
const recipeLink = (origin: string, recipe: string, manifest?: string) => `[${code(recipe)}](${origin}/${manifest === undefined ? `recipes/${recipe}.json` : `${manifest}#${recipe}`})`

const ALSO_IN_NAMED = 6

/** The other items that use a shared recipe, the first few by name and the rest as a count. */
const alsoIn = (names: string[]) => {
  if (!names.length) return 'no other item'
  const named = names.slice(0, ALSO_IN_NAMED).map(code)
  return `also ${names.length > ALSO_IN_NAMED ? `${named.join(', ')} and ${names.length - ALSO_IN_NAMED} more` : list(named)}`
}

/** Whether a Styling row's recipe is shared: one the item composes rather than one of its own trees. */
const isShared = (item: RegistryItem, recipe: string) => composesOf(item).includes(recipe)

const pascal = (name: string) => name.replace(/(^|-)(\w)/g, (_, _dash: string, letter: string) => letter.toUpperCase())

/** The part that wears a tree, as the item's API spells it: the item's main part for its root tree, `<Item><Part>` for the others. */
const treePart = (item: Documented, tree: string) => item.api?.parts.find((part) => part.name.toLowerCase() === pascal(tree).toLowerCase())?.name ?? pascal(tree)

/** Each part with the shared recipes its tree composes; a top-level `composes`, which only a stack's stored item carries, goes to the main part. */
function partsComposing(item: Documented): { part: string; recipes: string[] }[] {
  const byTree = Object.entries(item.recipes ?? {}).map(([tree, def]) => ({ tree, recipes: composesOf({ recipes: { [tree]: def } }) }))
  const root = byTree.find((entry) => entry.tree === item.name)
  const top = (item.composes ?? []).filter((recipe) => !root?.recipes.includes(recipe))
  if (top.length && root) root.recipes.push(...top)
  else if (top.length) byTree.unshift({ tree: item.name, recipes: top })
  return byTree.filter((entry) => entry.recipes.length).map((entry) => ({ part: treePart(item, entry.tree), recipes: entry.recipes }))
}

/** The shared recipes a part's recipe extends, each linked where it is defined. */
const extendsLine = (origin: string, uses: { recipe: string; families: string[] }[]) => {
  const named = uses.map(({ recipe, families }) =>
    families.length === 1 && families[0] === recipe ? recipeLink(origin, recipe) : `${code(recipe)}, which extends ${list(families.map((family) => recipeLink(origin, family)))}`,
  )
  const shared = uses.flatMap((use) => use.families).length
  return `Styling: ${named.join('; ')}. Change ${shared > 1 ? 'them' : 'it'} there and every part that extends ${shared > 1 ? 'them' : 'it'} follows.`
}

/** What a part is for, and the element it renders. */
export const partIntro = (part: ApiPart) => [part.description, part.element && `Renders a \`<${part.element}>\`.`].filter(Boolean).join(' ')

function partMarkdown(part: ApiPart, origin: string, level = 3): string[] {
  const out = [`${'#'.repeat(level)} ${part.name}`, '']
  const intro = partIntro(part)
  if (intro) out.push(intro, '')
  if (part.aliases?.length) out.push(`Also exported as ${part.aliases.map(code).join(', ')}.`, '')
  if (part.slot) out.push(`\`data-slot="${part.slot}"\` · \`${part.file}\``, '')
  if (part.styling?.length) out.push(extendsLine(origin, part.styling), '')
  if (part.props.length) {
    out.push('| Prop | Type | Default | Description |', '| --- | --- | --- | --- |')
    for (const prop of part.props)
      out.push(
        `| ${code(prop.name)}${prop.required ? ' (required)' : ''} | ${code(prop.type)}${prop.fullType && prop.name !== 'class' ? `: ${code(prop.fullType)}` : ''} | ${prop.default ? code(prop.default) : ''} | ${cell(prop.description ?? '')} |`,
      )
    out.push('')
  }
  if (part.events.length) {
    out.push('| Event | Payload | Description |', '| --- | --- | --- |')
    for (const event of part.events) {
      const args = eventPayload(event.type)
      out.push(`| ${code(event.name)} | ${args ? code(args) : ''} | ${cell(event.description ?? '')} |`)
    }
    out.push('')
  }
  const slots = documentedSlots(part)
  if (slots.length) {
    out.push('| Slot | Slot props | Description |', '| --- | --- | --- |')
    for (const slot of slots) out.push(`| ${code(slot.name)} | ${slot.type ? code(slot.type) : ''} | ${cell(slot.description ?? '')} |`)
    out.push('')
  }
  if (part.dataAttributes?.length) {
    out.push('| Data attribute | Values | Description |', '| --- | --- | --- |')
    for (const attribute of part.dataAttributes) {
      const values = attributeValues(attribute.values)
      out.push(`| ${code(attribute.name)} | ${values ? code(values) : ''} | ${cell(attribute.description ?? '')} |`)
    }
    out.push('')
  }
  if (part.cssVariables?.length) {
    out.push('| CSS variable | Description |', '| --- | --- |', ...part.cssVariables.map((variable) => `| ${code(variable.name)} | ${cell(variable.description ?? '')} |`), '')
  }
  return out
}

type Documented = RegistryItem & { api?: ItemApi }

const scalar = (value: string) => (/^\w[\w@./ -]*$/.test(value) ? value : JSON.stringify(value))
const yamlList = (key: string, values: string[]) => (values.length ? [`${key}:`, ...values.map((value) => `  - ${scalar(value)}`)] : [])

/** What a tool reads before the text: where the docs live, the tier, the install command, the files `add` writes and what it pulls in with them. */
function frontMatter(item: Documented, origin: string): string[] {
  const tier = tierOf(item.type)
  return [
    '---',
    `name: ${scalar(item.name)}`,
    ...(item.title ? [`title: ${scalar(item.title)}`] : []),
    `url: ${origin}/${docsPath(item)}.md`,
    ...(tier ? [`tier: ${tier}`] : []),
    `install: ${scalar(item.api?.install ?? addCommand([item.name]))}`,
    ...yamlList(
      'files',
      item.files.filter((f) => f.type !== 'registry:example').map((f) => f.path),
    ),
    ...yamlList('registryDependencies', item.registryDependencies ?? []),
    ...yamlList('dependencies', item.dependencies ?? []),
    '---',
    '',
  ]
}

const itemLink = (origin: string, link: ItemLink) => `[${link.title}](${origin}/${link.path}.md)`

/** What an item's barrel exports besides its parts: the import a project writes, then each name with its type or where it comes from. */
function exportsMarkdown(item: Documented, origin: string): string[] {
  const exports = item.api?.exports ?? []
  if (!exports.length) return []
  const names = exports.map((entry) => `${entry.type ? 'type ' : ''}${entry.name}`).join(', ')
  const rows: string[] = []
  const blocks: string[] = []
  const sources = new Map<string, string[]>()
  for (const entry of exports) {
    const name = code(entry.name)
    const source = entry.from ? itemLink(origin, entry.from) : entry.package && code(entry.package)
    if (source) {
      if (!sources.has(source)) {
        sources.set(source, [])
        rows.push(source)
      }
      sources.get(source)!.push(name)
    } else if (entry.definition && /^type \w+(?:<[^>]*>)? = [^\n]+$/.test(entry.definition)) rows.push(`- ${name}: ${code(entry.definition.replace(/^type \w+(?:<[^>]*>)? = /, ''))}`)
    else if (entry.definition) {
      rows.push(`- ${name}: below`)
      blocks.push(entry.definition)
    } else rows.push(`- ${name}`)
  }
  for (const [index, row] of rows.entries()) if (sources.has(row)) rows[index] = `- ${sources.get(row)!.join(', ')}: from ${row}`
  return ['## Exports', '', fence('ts', `import { ${names} } from '@/${docsPath(item)}'`), '', ...rows, '', ...(blocks.length ? [fence('ts', blocks.join('\n\n')), ''] : [])]
}

/** An item's reference as markdown: what the page copies, the MCP returns and the site serves at `<docsPath>.md`. Links point at `origin`; `deps` are the items its main example uses, whose API follows the item's own. */
export function itemMarkdown(item: Documented, { origin = SITE_URL, deps = [] }: { origin?: string; deps?: Documented[] } = {}): string {
  const api = item.api
  const out = [...frontMatter(item, origin), `# ${item.title ?? item.name}`, '']
  if (item.description) out.push(item.description, '')
  out.push('## Install', '', fence('sh', api?.install ?? addCommand([item.name])), '')
  if (api?.builtFrom?.length) out.push(`Built from: ${api.builtFrom.map((link) => itemLink(origin, link)).join(', ')}`, '')
  if (api?.usedBy?.length) out.push(`Used by: ${api.usedBy.map((link) => itemLink(origin, link)).join(', ')}`, '')
  if (item.dependencies?.length) out.push(`npm packages: ${item.dependencies.map(code).join(', ')}`, '')
  const [main, ...more] = examplesOf(item)
  if (main) {
    out.push('## Examples', '', fence('vue', exampleUsage(main.path, main.content)), '')
    if (more.length) out.push(`More examples: ${more.map((f) => `${code(exampleSlug(item, f.path))} (\`${f.path}\`)`).join(', ')}.`, '')
    const extra = exampleItems(item).filter((name) => !item.registryDependencies?.includes(name))
    if (extra.length) out.push(`The example also uses ${list(extra.map(code))}, which \`add ${item.name}\` leaves out: ${code(addCommand(extra))}.`, '')
    const npm = exampleNpmPackages(item)
    if (npm.length)
      out.push(
        `The example also imports ${npm.length > 1 ? 'the npm packages' : 'the npm package'} ${list(npm.map(code))}, which \`add ${item.name}\` leaves out: ${code(`npm install ${npm.join(' ')}`)}.`,
        '',
      )
  }
  if (api?.anatomy) out.push('## Anatomy', '', fence('vue', api.anatomy), '')
  if (api?.parts.length) out.push('## API reference', '', ...api.parts.flatMap((part) => partMarkdown(part, origin)))
  out.push(...exportsMarkdown(item, origin))
  const recipes = Object.entries(recipeMap(item)).filter(([, recipe]) => !isShared(item, recipe))
  const extended = (api?.sharedRecipes ?? []).filter((entry) => !entry.composed)
  const composers = partsComposing(item)
  if (recipes.length || composers.length || api?.states?.length || extended.length) {
    out.push('## Styling', '')
    const manifest = manifestPath(item)
    if (manifest && Object.keys(item.recipes ?? {}).length) out.push(`Recipes: in the component's manifest, \`${manifest}\`, beside its files (served at ${origin}/${manifest}).`, '')
    if (extended.length) out.push(`Extends: ${extended.map((entry) => `${recipeLink(origin, entry.recipe)} (${alsoIn(entry.alsoIn.map((link) => link.name))})`).join(', ')}.`, '')
    if (recipes.length) out.push('| Part | Recipe |', '| --- | --- |', ...recipes.map(([part, recipe]) => `| ${code(part)} | ${recipeLink(origin, recipe, manifestPath(item))} |`), '')
    for (const { part, recipes: composed } of composers) out.push(`${code(part)} composes ${composed.map((recipe) => recipeLink(origin, recipe)).join(', ')}.`, '')
    if (api?.states?.length) out.push(`States with a look of their own: ${list(api.states)}.`, '')
  }
  out.push('## Source', '', ...sourceFiles(item.files).flatMap((f) => [`\`${f.path}\``, '', fence(language(f.path), f.content), '']))
  const used = deps.filter((dep) => dep.api?.parts.length)
  if (used.length) {
    out.push('## API of the items the example uses', '')
    for (const dep of used)
      out.push(
        `### ${dep.title ?? dep.name}`,
        '',
        `${itemLink(origin, { name: dep.name, title: 'Full docs', path: docsPath(dep) })} · ${code(dep.api!.install)}`,
        '',
        ...dep.api!.parts.flatMap((part) => partMarkdown(part, origin, 4)),
      )
  }
  return `${out.join('\n').trimEnd()}\n`
}

/** The prompt that has a coding agent build with items through the frontic-ui MCP. */
export function buildPrompt({ items, goal }: { items: string[]; goal: string }): string {
  const list = items.map(code).join(', ')
  return [
    `Build ${goal.trim() || 'a feature'} with Frontic UI.`,
    '',
    `1. Use the \`${MCP_NAME}\` MCP server (${MCP_URL}). If it is not connected, add it first.`,
    `2. Call \`get_item_docs\` with ${list}, then with every item listed under "Built from", and read each one's docs: props, events, slots, types and the examples.`,
    `3. Install them: \`${addCommand(items)}\`.`,
    '4. Build it from those components, following their examples and passing data in the shapes their types define. Keep their props and slots; do not restyle them with your own classes.',
  ].join('\n')
}
