import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { addCommand, type ApiPart, type ItemApi } from '@frontic/registry-client/api'
import { createChecker, createCheckerByJson, type ComponentMeta } from 'vue-component-meta'
import { STATE_RECIPES } from '@frontic/library-contract/recipe'
import { itemAnatomy, itemExports, itemLinks, itemStates, sharedRecipeUses } from './docs'
import { DATA_ATTRIBUTE_DESCRIPTIONS, DATA_ATTRIBUTE_VALUES, VALUE_FUNCTIONS, variableDescription } from './element-docs'
import { MIRROR, ownElement, type FoundAttribute, type Roots } from './element'
import { familyUses } from './families'
import type { ServedItem } from './served'
import { THIRD_PARTY_DESCRIPTIONS, THIRD_PARTY_EVENTS } from './third-party-props'

const PART = /export\s*\{([^}]*)\}\s*from\s*'\.\/(\w+\.vue)'/g
const DATA_SLOT = /\sdata-slot="([^"]+)"/g
/** An element's opening tag, quoted attribute values read whole. */
const TAG = /<[\w.-]+(?:\s+[^\s"'>=]+(?:="[^"]*"|='[^']*')?)*\s*\/?>/g

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const tagsOf = (source: string) => [...source.slice(source.indexOf('<template>') + '<template>'.length).matchAll(TAG)].map(([tag]) => tag)
const slotOf = (tag: string) => [...tag.matchAll(DATA_SLOT)][0]?.[1]

/** The part's own element: the one with the data-slot named after it, else the one its class lands on, else the template's root. */
function ownTag(name: string, source: string): string | undefined {
  const tags = tagsOf(source)
  return tags.find((tag) => slotOf(tag) === kebab(name)) ?? tags.find((tag) => /\bprops\.class\b/.test(tag)) ?? tags[0]
}

/** The part's own data-slot: the one named after it, else the one on the element its class lands on. */
function partSlot(name: string, source: string): string | undefined {
  const slots = tagsOf(source).flatMap((tag) => [...tag.matchAll(DATA_SLOT)].map((match) => match[1]!))
  return slots.find((slot) => slot === kebab(name)) ?? slotOf(tagsOf(source).find((tag) => /\bprops\.class\b/.test(tag)) ?? '')
}

const VUE_BUILT_INS = new Set(['component', 'slot', 'template', 'transition', 'keep-alive', 'teleport'])

/** A Reka component's runtime props, when the part imports it from reka-ui. */
type RuntimeProp = { type?: unknown; default?: unknown }
type Reka = Record<string, { props?: Record<string, RuntimeProp> } | undefined>
const rekaProps = (reka: Reka, component: string, source: string) => {
  const imported = [...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*'reka-ui'/g)].some(([, names]) => names!.split(',').some((n) => n.trim() === component))
  return imported ? reka[component]?.props : undefined
}

/** A runtime default as code; a factory (an object or array default) has none to show. */
const literal = (value: unknown) => (typeof value === 'string' ? `'${value}'` : typeof value === 'boolean' || typeof value === 'number' ? String(value) : undefined)

// Reka ships one bundled declaration file, which renames a duplicate type `Direction$1`.
const unbundled = (text: string) => text.replace(/\b(\w+)\$\d+\b/g, '$1')

/** A type or default as the source reads it: single quotes, without the undefined an optional prop adds, and without null unless the prop takes it. */
const tidy = (text: string, keepNull = false) =>
  unbundled(text)
    .replaceAll('"', "'")
    .split(' | ')
    .filter((member) => member !== 'undefined' && (keepNull || member !== 'null'))
    .join(' | ')

const VARIANT_MEMBER = /^(?:'[^']*'|boolean|true|false)$/

/** Whether a prop's null is meant: the wrapped Reka prop takes it, or the type holds more than the string literals and booleans a cva variant is, to which VariantProps adds null. */
function takesNull(prop: ComponentMeta['props'][number], runtime: RuntimeProp | undefined): boolean {
  if (runtime && (runtime.type === null || (Array.isArray(runtime.type) && runtime.type.includes(null)))) return true
  return tidy(prop.type)
    .split(' | ')
    .some((member) => !VARIANT_MEMBER.test(member))
}

/** A union type with its aliases resolved to their members, when that reads differently from the declared type; booleans stay `boolean`. */
function fullTypeOf(prop: ComponentMeta['props'][number], keepNull: boolean): string | undefined {
  const schema = prop.schema
  if (typeof schema !== 'object' || schema.kind !== 'enum' || !schema.schema) return undefined
  const members = schema.schema.map((member) => (typeof member === 'string' ? member : member.type))
  const full = tidy(members.join(' | '), keepNull).replace('false | true', 'boolean')
  return full === tidy(prop.type, keepNull) ? undefined : full
}

/** The default a wrapped primitive documents in its `@defaultValue` tag, as code. */
const documentedDefault = (tags: { name: string; text?: string }[]) => tags.find((tag) => tag.name === 'defaultValue')?.text?.replace(/^`(.*)`$/, '$1')

/** The default a prop really has: the part's own, else Reka's runtime one, else the documented one, else false for a boolean Vue casts.
 * Reka sets an explicit undefined to tell an unset prop from false (an uncontrolled `open`) or to inherit a provider's value, which its docs then give.
 * A boolean Reka declares without a default may still default to true: Reka forwards it unset to an inner component, whose default its docs carry.
 * Reka documents `as` once, as div, for every component. */
function defaultOf(prop: ComponentMeta['props'][number], runtime: RuntimeProp | undefined): string | undefined {
  if (prop.default !== undefined) return prop.default
  const value = runtime && typeof runtime.default !== 'function' ? literal(runtime.default) : undefined
  if (value !== undefined) return value
  const documented = prop.name === 'as' ? undefined : documentedDefault(prop.tags)
  if (documented !== undefined) return documented
  const unsetOnPurpose = runtime !== undefined && 'default' in runtime
  return !unsetOnPurpose && (runtime ? [runtime.type].flat().includes(Boolean) : tidy(prop.type) === 'boolean') ? 'false' : undefined
}

/** The source file a served path was built from. */
const sourcePath = (root: string, path: string) => join(root, path.replace(/^components\//, ''))

type Use = { recipe: string; families: string[] }

/** The uses whose recipe the part's source wears as its `fui-` class. */
const wornBy = (source: string, uses: Use[]) => uses.filter(({ recipe }) => new RegExp(`(?<![\\w-])fui-${recipe}(?![\\w-])`).test(source))

/** The text between `open` at `from` and the bracket that closes it. */
function enclosed(text: string, from: number, open: string, close: string): string {
  let depth = 0
  for (let at = from; at < text.length; at++) {
    if (text[at] === open) depth++
    else if (text[at] === close && --depth === 0) return text.slice(from + 1, at)
  }
  return ''
}

/** A declaration from `from` to the `;` that ends it, outside any bracket. */
function statement(text: string, from: number): string {
  let depth = 0
  for (let at = from; at < text.length; at++) {
    if ('{<(['.includes(text[at]!)) depth++
    else if ('}>)]'.includes(text[at]!) && text[at - 1] !== '=') depth--
    else if (text[at] === ';' && depth === 0) return text.slice(from, at)
  }
  return text.slice(from)
}

/** A JSDoc block as one line, its tags left out. */
const docText = (doc: string) =>
  doc
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter((line) => line && !line.startsWith('@'))
    .join(' ')

const MEMBER_DOC = /\/\*\*([\s\S]*?)\*\/\s*(?:'([^']+)'|"([^"]+)"|([\w$]+))\??\s*:/g

/** Where a type or interface is declared in `text`: its body, with what it extends. */
function declaration(text: string, name: string): string | undefined {
  const head = new RegExp(`\\b(?:type ${name}(?:<[^>]*>)?\\s*=\\s*|interface ${name}(?:<[^>]*>)?([^{]*)\\{)`).exec(text)
  if (!head) return undefined
  const end = head.index + head[0].length
  return head[0].startsWith('type') ? statement(text, end) : `${head[1] ?? ''}{${enclosed(text, end - 1, '{', '}')}}`
}

/**
 * Each event's JSDoc, read from the type a part gives `defineEmits`: its own members, and the members of every `…Emits` type it names,
 * followed through the part's item folder and Reka's declarations. vue-component-meta loses these: it reads the `emit` signature Vue
 * generates, which carries none.
 */
function eventDocs(source: string, declarations: string): Record<string, string> {
  const call = source.indexOf('defineEmits<')
  if (call < 0) return {}
  const docs: Record<string, string> = {}
  const seen = new Set<string>()
  const collect = (text: string) => {
    for (const [, doc, quoted, doubled, bare] of text.matchAll(MEMBER_DOC)) docs[quoted ?? doubled ?? bare!] ??= docText(doc!)
    for (const [, type] of text.matchAll(/\b([A-Z]\w*Emits)\b/g)) {
      if (seen.has(type!)) continue
      seen.add(type!)
      const body = declaration(source, type!) ?? declaration(declarations, type!)
      if (body) collect(body)
    }
  }
  collect(enclosed(source, call + 'defineEmits'.length, '<', '>'))
  return docs
}

/** What a `v-model` update event does, from the model it updates. */
function modelEvent(event: string): string | undefined {
  const model = /^update:(.+)$/.exec(event)?.[1]
  if (!model) return undefined
  return `Fires with the new value when \`${model}\` changes; \`${model === 'modelValue' ? 'v-model' : `v-model:${model}`}\` binds it.`
}

function partApi(root: string, meta: ComponentMeta, [name, ...aliases]: string[], path: string, uses: Use[], reka: Reka, rekaTypes: string, roots: Roots, components: Record<string, string>): ApiPart {
  const source = readFileSync(sourcePath(root, path), 'utf8')
  const declaresClass = /\bclass\?:/.test(source)
  const styling = wornBy(source, uses)
  const description = markdown(components[name!])?.replace(/\s+/g, ' ')
  const folder = dirname(sourcePath(root, path))
  const local = readdirSync(folder)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => readFileSync(join(folder, file), 'utf8'))
    .join('\n')
  const events = eventDocs(source, `${local}\n${rekaTypes}`)
  const component = ownTag(name!, source)?.match(/^<([\w.-]+)/)?.[1]
  const declaredAs = meta.props.find((prop) => prop.name === 'as')?.default?.match(/^['"]([a-z][a-z0-9]*)['"]$/)?.[1]
  const runtime = component ? rekaProps(reka, component, source) : undefined
  const runtimeAs = typeof runtime?.as?.default === 'string' ? runtime.as.default : undefined
  const own = ownElement(sourcePath(root, path), name!, roots)
  // A value a child takes from a fixed prop is how the part is built, not an option it offers.
  const attributes = own.attributes.filter((found) => !found.fixed).map((found) => attributeApi(found, meta.props))
  const variables = own.variables.map((variable) => ({ name: variable, ...(variableDescription(variable) && { description: variableDescription(variable) }) }))
  const element = declaredAs ?? (component && /^[a-z][a-z0-9]*$/.test(component) && !VUE_BUILT_INS.has(component) ? component : runtimeAs)
  return {
    name: name!,
    ...(aliases.length ? { aliases } : {}),
    ...(description && { description }),
    ...(element && { element }),
    file: path.split('/').pop()!,
    slot: partSlot(name!, source),
    props: meta.props
      .filter((prop) => !prop.global || (prop.name === 'class' && declaresClass))
      .map((prop) => ({ ...prop, default: defaultOf(prop, runtime?.[prop.name]), keepNull: takesNull(prop, runtime?.[prop.name]) }))
      .map((prop) => ({
        name: prop.name,
        type: tidy(prop.type, prop.keepNull),
        ...(fullTypeOf(prop, prop.keepNull) && { fullType: fullTypeOf(prop, prop.keepNull) }),
        required: prop.required,
        ...(prop.default !== undefined && { default: tidy(prop.default) }),
        ...(describe(name!, prop) && { description: markdown(describe(name!, prop)) }),
      })),
    events: meta.events.map((event) => {
      const description = markdown(events[event.name]) || THIRD_PARTY_EVENTS[`${name}.${event.name}`] || modelEvent(event.name)
      return { name: event.name, type: unbundled(event.type), ...(description && { description }) }
    }),
    slots: meta.slots.map((slot) => ({
      name: slot.name,
      ...(slot.type !== '{}' && slot.type !== 'any' && { type: unbundled(slot.type) }),
      ...(slot.description && { description: markdown(slot.description) }),
    })),
    ...(attributes.length > 0 && { dataAttributes: attributes }),
    ...(variables.length > 0 && { cssVariables: variables }),
    ...(styling.length > 0 && { styling }),
  }
}

// A binding that only switches the attribute on: `x ? '' : undefined`, `x || undefined`, `x && ''`.
const PRESENCE = /\?\s*(?:''|true|'true')\s*:\s*undefined|\?\s*undefined\s*:\s*''|\|\|\s*undefined|&&\s*''$/

/** A prop type's members, when every one is a string literal. */
const literalMembers = (type: string) => {
  const members = type.split(' | ').map((member) => /^'([^']*)'$/.exec(member.trim())?.[1])
  return members.every((member) => member !== undefined) ? (members as string[]) : undefined
}

/** A data attribute's values and description: read from its binding where it can be, else from the shared tables. */
function attributeApi(found: FoundAttribute, props: ComponentMeta['props']) {
  const key = `${found.from}.${found.name}`
  const expression = found.expression?.replace(/\s+/g, ' ').trim()
  const mirrored = expression !== undefined && MIRROR.exec(expression) ? props.find((prop) => prop.name === MIRROR.exec(expression)![1] || prop.name === expression.split(/\W+/).pop()) : undefined
  const presence = found.value === '' || (expression !== undefined && PRESENCE.test(expression))
  // Every quoted string, but one the binding only compares against.
  const literals = expression ? [...expression.matchAll(/([=!]==?\s*)?'([^']*)'/g)].flatMap(([, compared, value]) => (compared || !value ? [] : [value!])) : []
  const helper = expression === undefined ? undefined : Object.entries(VALUE_FUNCTIONS).find(([fn]) => expression.startsWith(`${fn}(`))?.[1]
  const values = presence
    ? undefined
    : found.value
      ? [found.value]
      : literals.length && !MIRROR.test(expression!)
        ? [...new Set(literals)]
        : (helper ?? DATA_ATTRIBUTE_VALUES[key] ?? (mirrored && literalMembers(tidy(fullTypeOf(mirrored, false) ?? mirrored.type))) ?? DATA_ATTRIBUTE_VALUES[found.name])
  const description = DATA_ATTRIBUTE_DESCRIPTIONS[key] ?? (mirrored && `Carries the \`${mirrored.name}\` prop.`) ?? DATA_ATTRIBUTE_DESCRIPTIONS[found.name]
  return { name: found.name, ...(values?.length && { values }), ...(description && { description }) }
}

/** `class` means the same on every part, so it is described once here rather than in 353 files. */
const CLASS_DESCRIPTION = "Classes added to the part's own element, after its recipe classes."

/** Who owns a host a library's JSDoc links to: its "our" guide reads as that owner's on this site. */
const LINK_OWNERS: Record<string, string> = {
  'reka-ui.com': 'Reka UI',
  'vueuse.org': 'VueUse',
  'embla-carousel.com': 'Embla Carousel',
  'vue-sonner.vercel.app': 'Vue Sonner',
  'tanstack.com': 'TanStack',
  'vuejs.org': 'Vue',
}
const ownerOf = (url: string) => {
  const host = URL.canParse(url) ? new URL(url).hostname.replace(/^www\./, '') : ''
  return LINK_OWNERS[host]
}

/** JSDoc as plain markdown: Reka's `<br>` a paragraph break, a `{@link url}` a link named by the url, a library's "our" link named by its owner. */
const markdown = (text: string | undefined) =>
  text
    ?.replace(/\s*<br\s*\/?>\s*/g, '\n\n')
    .replace(/\{@link\s+(\S+?)\s*\}/g, (_, url: string) => `[${url.replace(/^https?:\/\//, '')}](${url})`)
    .replace(/\b([Oo])ur(\s+\[[^\]]*\]\(([^)\s]+)\))/g, (match, _o: string, link: string, url: string) => (ownerOf(url) ? `${ownerOf(url)}'s${link}` : match))
    .trim()

/** A prop's description: its own JSDoc, else the one written for a library prop that has none, else the shared one for `class`. */
const describe = (part: string, prop: { name: string; description: string }) =>
  prop.description || THIRD_PARTY_DESCRIPTIONS[`${part}.${prop.name}`] || (prop.name === 'class' ? CLASS_DESCRIPTION : undefined)

const CHECKER = { forceUseTs: true, printer: { newLine: 1 }, schema: true } as const
const cache = new Map<string, Record<string, ItemApi>>()

/** Every served item's reference, read from its source: the parts its index exports with their props, events, slots and the shared families they borrow, how they nest, the states it styles, what else it exports, the items it is built from and used by, and its install command. The same sources give the same references, so a second build in one process reuses them. */
export async function itemApis(root: string, served: ServedItem[]): Promise<Record<string, ItemApi>> {
  const key = createHash('sha1').update(root).update(JSON.stringify(served)).digest('hex')
  const hit = cache.get(key)
  if (hit) return hit
  const config = join(root, 'tsconfig.source.json')
  const checker = existsSync(config) ? createChecker(config, CHECKER) : createCheckerByJson(root, { include: ['ui', 'sections', 'templates'] }, CHECKER)
  const names = served.map((item) => item.name)
  const reka = (await import('reka-ui')) as unknown as Reka
  // Reka's declarations, where its emits types carry their JSDoc.
  const rekaDist = dirname(createRequire(join(root, 'package.json')).resolve('reka-ui'))
  const roots = { registry: root, reka: join(dirname(rekaDist), 'src') }
  const rekaTypes = readdirSync(rekaDist)
    .filter((file) => file.endsWith('.d.ts'))
    .map((file) => readFileSync(join(rekaDist, file), 'utf8'))
    .join('\n')
  const links = itemLinks(served)
  const sharedUses = sharedRecipeUses(served)
  const apis: Record<string, ItemApi> = Object.fromEntries(
    served.map((item) => {
      const uses = familyUses(item, names)
        .map(({ recipe, families }) => ({ recipe, families: families.filter((family) => !(STATE_RECIPES as readonly string[]).includes(family)) }))
        .filter(({ families }) => families.length)
      const barrel = item.files.find((f) => f.path.endsWith(`/${item.name}/index.ts`))
      const folder = barrel?.path.slice(0, -'index.ts'.length) ?? ''
      // Each part's one-sentence purpose, from the item's manifest.
      const manifest = barrel && sourcePath(root, `${folder}${item.name}.json`)
      const components = manifest && existsSync(manifest) ? ((JSON.parse(readFileSync(manifest, 'utf8')) as { components?: Record<string, string> }).components ?? {}) : {}
      const parts = [...(barrel?.content.matchAll(PART) ?? [])].flatMap(([, names, file]) => {
        const exported = [...names!.matchAll(/default as (\w+)/g)].map(([, name]) => name!)
        if (!exported.length) return []
        const path = `${folder}${file}`
        return [partApi(root, checker.getComponentMeta(sourcePath(root, path)), exported, path, uses, reka, rekaTypes, roots, components)]
      })
      const anatomy = itemAnatomy(
        item,
        parts.flatMap((part) => [part.name, ...(part.aliases ?? [])]),
      )
      const states = itemStates(item)
      const exports = itemExports(item, served)
      const { builtFrom, usedBy } = links[item.name]!
      const api: ItemApi = {
        install: addCommand([item.name]),
        parts,
        ...(anatomy && { anatomy }),
        ...(states.length > 0 && { states }),
        ...(exports.length > 0 && { exports }),
        ...(builtFrom.length > 0 && { builtFrom }),
        ...(usedBy.length > 0 && { usedBy }),
        ...(sharedUses[item.name]!.length > 0 && { sharedRecipes: sharedUses[item.name] }),
      }
      return [item.name, api]
    }),
  )
  cache.set(key, apis)
  return apis
}
