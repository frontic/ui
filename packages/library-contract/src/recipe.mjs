// What a recipe and a text style step may be: the rules the brand build renders by and a library save checks.
// Loads no node: builtin, so the stack's client imports it.

const isNode = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)

/** What a recipe name and each of its property names must match to render. */
export const RECIPE_KEY = /^[A-Za-z][A-Za-z0-9-]*$/

/** The recipe names and property names a library save takes. */
export const RECIPE_NAME = /^[a-z][a-z0-9-]*$/
export const RECIPE_PROPERTY = /^[a-z][A-Za-z0-9]*$/

/** Every state a recipe may nest, and the selector it renders under; attribute states last, so they win ties. */
export const RECIPE_STATES = Object.freeze({
  hover: '&:hover',
  active: '&:active',
  pressed: '&:active:not([aria-haspopup])',
  focus: '&:focus-visible',
  checked: '&:is([data-state=checked],[data-state=indeterminate],[data-state=on],[aria-checked=true],[aria-checked=mixed],[aria-pressed=true])',
  checkedWithin: '&:has([data-state=checked])',
  focusWithin: '&:has(:focus-visible)',
  invalidWithin: '&:has([aria-invalid=true])',
  highlighted: '&[data-highlighted]',
  placeholderShown: '&[data-placeholder]',
  open: '&:is([data-state=open],[aria-expanded=true])',
  selected: '&:is([data-selected=true],[aria-selected=true],[data-state=active])',
  invalid: '&:is([aria-invalid=true],[data-invalid])',
  current: '&[data-active]:not([data-active=false])',
})

/** Every part a recipe may nest, and the selector it renders under; `link` is every link inside, at the recipe's own weight. */
export const RECIPE_PARTS = Object.freeze({
  file: '&::file-selector-button',
  after: '&::after',
  link: '& :where(a)',
})

/** The parts a state may nest in: the state renders on the part's own element. */
const STATEFUL_PARTS = Object.freeze({ link: 'a' })

/** The states and parts together: every block a recipe may nest. */
export const RECIPE_BLOCKS = Object.freeze({ ...RECIPE_STATES, ...RECIPE_PARTS })

/** Properties with no CSS property of their own: each sets `color` on what its selector reaches. */
export const RECIPE_NESTED_PROPERTIES = Object.freeze({
  placeholderColor: Object.freeze({ selector: '&::placeholder', properties: Object.freeze(['color']) }),
  iconColor: Object.freeze({ selector: '& svg', properties: Object.freeze(['color']) }),
})

/** Properties that hide a part of the element, each taking only the values listed, set on the element and under its selector at once. */
export const HIDE_PROPERTIES = Object.freeze({
  scrollbar: Object.freeze({
    values: Object.freeze(['none']),
    properties: Object.freeze(['scrollbar-width']),
    nested: Object.freeze({ selector: '&::-webkit-scrollbar', properties: Object.freeze(['display']) }),
  }),
})

/** Properties the contrast check reads and the stylesheet never renders: `decorative` keeps a recipe or value out of the check,
 * `ground` names the colour it sits on when that is no page surface. */
export const CONTRAST_PROPERTIES = Object.freeze({ decorative: 'decorative', ground: 'ground' })

/** The shared focus ring, which a value recipe may colour for its own element. */
export const FOCUS_RING = 'focus-ring'

/** The shared state recipes, each applied behind a variant over the value recipe. */
export const STATE_RECIPES = Object.freeze([FOCUS_RING, 'disabled', 'invalid'])

/** Properties a value recipe sets at its top level to colour the shared focus ring, and the variable each sets on the element. */
export const RING_PROPERTIES = Object.freeze({
  ringColor: '--fui-ring-color',
  ringBorderColor: '--fui-ring-border-color',
})

/** The keys that make a recipe a component tree; a recipe holding none of them, nor `composes`, is a flat recipe. */
export const TREE_KEYS = Object.freeze(['base', 'variants', 'defaults', 'keepAxis'])

/** The optional key of a tree listing the shared recipes its element wears, each a flat recipe; it renders nothing. A tree may hold only it. */
export const TREE_COMPOSES = 'composes'

/** The key a tree's value holds a compound under: another axis mapped to the values the pair takes. */
export const WITH = 'with'

/** The key a value names the families it extends under, a name or a list of them. */
export const EXTENDS = 'extends'

/** The key a value or a with block reshapes the tree's parts under: each part tree (`card-header` of `card`) mapped to the layout its base takes. */
export const PARTS = 'parts'

/** The axis a component's sizes ride on by convention; layout may sit on any axis's values. */
export const SIZE_AXIS = 'size'

/** Properties that size and space an element, each taking a `{spacing.<n>}` step (the widths a `{container.<name>}` size too), and the CSS properties each sets.
 * `bleedX`, `bleedY` and the one-sided `bleedTop`, `bleedBottom`, `bleedStart` and `bleedEnd` set the margin to the negative of the step, so a value never writes a minus sign. */
export const LAYOUT_PROPERTIES = Object.freeze({
  height: Object.freeze(['height']),
  minHeight: Object.freeze(['min-height']),
  width: Object.freeze(['width']),
  minWidth: Object.freeze(['min-width']),
  maxWidth: Object.freeze(['max-width']),
  size: Object.freeze(['width', 'height']),
  padding: Object.freeze(['padding']),
  paddingX: Object.freeze(['padding-inline']),
  paddingY: Object.freeze(['padding-block']),
  paddingTop: Object.freeze(['padding-top']),
  paddingBottom: Object.freeze(['padding-bottom']),
  paddingStart: Object.freeze(['padding-inline-start']),
  paddingEnd: Object.freeze(['padding-inline-end']),
  margin: Object.freeze(['margin']),
  marginX: Object.freeze(['margin-inline']),
  marginY: Object.freeze(['margin-block']),
  marginTop: Object.freeze(['margin-top']),
  marginBottom: Object.freeze(['margin-bottom']),
  marginStart: Object.freeze(['margin-inline-start']),
  marginEnd: Object.freeze(['margin-inline-end']),
  bleedX: Object.freeze(['margin-inline']),
  bleedY: Object.freeze(['margin-block']),
  bleedTop: Object.freeze(['margin-top']),
  bleedBottom: Object.freeze(['margin-bottom']),
  bleedStart: Object.freeze(['margin-inline-start']),
  bleedEnd: Object.freeze(['margin-inline-end']),
  gap: Object.freeze(['gap']),
})

/** The property a tree's base sets to make its element the container its parts and descendants query. */
export const CONTAIN = 'contain'
/** The values `contain` takes: the inline axis only, so a contained element keeps its height. */
export const CONTAIN_VALUES = Object.freeze(['inline-size'])
const CONTAIN_PROPERTIES = Object.freeze(['container-type'])

/** Blocks that size what sits inside the element, or the element beside an edge icon, each with its selector and the layout properties it takes. */
export const LAYOUT_PARTS = Object.freeze({
  icon: Object.freeze({ selector: '& :where([data-icon])', properties: Object.freeze(['size']) }),
  iconStart: Object.freeze({ selector: '&:has([data-icon=inline-start])', properties: Object.freeze(['paddingStart']) }),
  iconEnd: Object.freeze({ selector: '&:has([data-icon=inline-end])', properties: Object.freeze(['paddingEnd']) }),
})

/** The container widths a layout value may step at: a value's `'@md'` block holds what its layout becomes once the nearest container is `container.md` wide. */
export const LAYOUT_STEPS = Object.freeze(['@sm', '@md', '@lg'])

/** The keywords a size takes besides a step, each rendering the CSS of the Tailwind utility it replaces: `width: full` is `w-full`. */
const SIZES = Object.freeze({ full: '100%', fit: 'fit-content', auto: 'auto', max: 'max-content', min: 'min-content' })
const HEIGHTS = Object.freeze({ ...SIZES, svh: '100svh' })
const MARGINS = Object.freeze({ auto: 'auto' })
/** The keywords each layout property takes besides a step: sizes take `full`, `fit`, `auto`, `max` and `min` (`max-width: auto` is no CSS),
 * heights `svh` too, margins `auto`. A bleed, a padding and a gap take steps only. */
export const LAYOUT_KEYWORDS = Object.freeze({
  height: HEIGHTS,
  minHeight: HEIGHTS,
  width: SIZES,
  minWidth: SIZES,
  maxWidth: Object.freeze(Object.fromEntries(Object.entries(SIZES).filter(([keyword]) => keyword !== 'auto'))),
  size: SIZES,
  margin: MARGINS,
  marginX: MARGINS,
  marginY: MARGINS,
  marginTop: MARGINS,
  marginBottom: MARGINS,
  marginStart: MARGINS,
  marginEnd: MARGINS,
})

/** The Reka component whose variables a popup keyword reads, by the item name a tree's name is or starts with: `autocomplete-content` reads combobox's. */
export const REKA_POPUPS = Object.freeze({
  select: 'select',
  combobox: 'combobox',
  autocomplete: 'combobox',
  'dropdown-menu': 'dropdown-menu',
  'context-menu': 'context-menu',
  menubar: 'menubar',
  popover: 'popover',
  'hover-card': 'hover-card',
  tooltip: 'tooltip',
  'navigation-menu': 'navigation-menu',
  'mega-menu': 'navigation-menu',
})
/** The popup keywords, each with the variable part it reads: `trigger` the trigger's size, `available` the room beside it, `viewport` the viewport's size. */
const REKA_KEYWORDS = Object.freeze({ trigger: 'trigger', available: 'content-available', viewport: 'viewport' })
/** The keywords each Reka component sets the variables of. */
const REKA_SETS = (component) => (component === 'navigation-menu' ? ['viewport'] : ['trigger', 'available'])
/** The properties a popup keyword sizes, each with the axis of the variable it reads. */
const REKA_AXES = Object.freeze({ width: 'width', minWidth: 'width', maxWidth: 'width', height: 'height', minHeight: 'height' })
const isRekaKeyword = (prop, text) => Object.hasOwn(REKA_AXES, prop) && Object.hasOwn(REKA_KEYWORDS, text)
/** The Reka component a tree's popup keywords read, or undefined for a tree that is no popup's. */
export function rekaPopup(name) {
  const owner = treeOwner(String(name ?? ''), Object.keys(REKA_POPUPS))
  return owner === undefined ? undefined : REKA_POPUPS[owner]
}
const REKA_READS = 'reads a variable Reka sets on a popup'
const rekaPlace = (keyword) => `${keyword} ${REKA_READS}; it sits in the popup’s own tree`
/** Why a tree may not hold a popup keyword, or null. */
function rekaKeywordProblem(name, keyword) {
  const component = rekaPopup(name)
  if (component === undefined) return `${keyword} ${REKA_READS}; ${name} is no popup’s tree (${Object.keys(REKA_POPUPS).join(', ')})`
  const own = REKA_SETS(component)
  return own.includes(keyword) ? null : `${keyword} ${REKA_READS}; ${component} sets ${own.join(' and ')} only`
}
/** A popup keyword's variable for the tree `name`, or null when the tree is no popup's or its popup sets none. */
const rekaVariable = (name, prop, keyword) => (rekaKeywordProblem(name, keyword) ? null : `var(--reka-${rekaPopup(name)}-${REKA_KEYWORDS[keyword]}-${REKA_AXES[prop]})`)

const isLayout = (prop) => Object.hasOwn(LAYOUT_PROPERTIES, prop)
const isBleed = (prop) => prop.startsWith('bleed')
/** The layout properties that may take a `{container.<name>}` width as well as a spacing step. */
const WIDTH_PROPERTIES = Object.freeze(['width', 'minWidth', 'maxWidth'])
const isStep = (key) => LAYOUT_STEPS.includes(key)
/** A step's name without its `@`: what its variables and the brand's `container` group carry. */
export const stepName = (step) => step.slice(1)
const STEP_LIST = `${LAYOUT_STEPS.slice(0, -1)
  .map((step) => `'${step}'`)
  .join(', ')} or '${LAYOUT_STEPS.at(-1)}'`

/** Properties that take a colour token besides any whose name ends in Color. */
export const COLOR_PROPERTIES = Object.freeze(['color', 'background', 'fill', 'stroke'])
/** A property that takes a colour reference: `color`, `background`, `fill`, `stroke` or any `*Color`. */
export const isColorProperty = (prop) => COLOR_PROPERTIES.includes(prop) || prop.endsWith('Color')

/** The one token group each non-colour property takes; a colour property takes `colors`, any other is free-form. */
export const PROPERTY_GROUP = Object.freeze({
  typography: 'typography',
  border: 'border',
  borderTop: 'border',
  borderRight: 'border',
  borderBottom: 'border',
  borderLeft: 'border',
  borderStart: 'border',
  borderEnd: 'border',
  rounded: 'rounded',
  borderTopLeftRadius: 'rounded',
  borderTopRightRadius: 'rounded',
  borderBottomRightRadius: 'rounded',
  borderBottomLeftRadius: 'rounded',
  shadow: 'shadow',
  outline: 'ring',
  opacity: 'opacity',
})

/** The keywords a property of a token group takes besides a reference to that group. */
export const VALUE_KEYWORDS = Object.freeze({
  colors: Object.freeze(['transparent', 'currentColor']),
  shadow: Object.freeze(['none']),
  border: Object.freeze(['none']),
})

/** The keywords a property takes instead of a number or a length, each with the CSS value it renders. */
const same = (...values) => Object.freeze(Object.fromEntries(values.map((value) => [value, value])))
const FLEX_ALIGN = Object.freeze({ start: 'flex-start', end: 'flex-end' })
const SPACE = Object.freeze({ between: 'space-between', around: 'space-around', evenly: 'space-evenly' })
const counted = (render) => Object.freeze(Object.fromEntries(Array.from({ length: 12 }, (_, i) => [String(i + 1), render(i + 1)])))
const spans = Object.freeze({ ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`span ${i + 1}`, `span ${i + 1} / span ${i + 1}`])), full: '1 / -1' })

/** Keyword properties that lay out an element and its children, each value rendering the CSS of the Tailwind utility it replaces: `gridColumns: 3` is `grid-cols-3`, `gridColumn: full` is `col-span-full`. */
export const ARRANGE_VALUES = {
  display: same('block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid', 'contents', 'none'),
  flexDirection: same('row', 'row-reverse', 'column', 'column-reverse'),
  flexWrap: same('wrap', 'nowrap', 'wrap-reverse'),
  alignItems: Object.freeze({ ...FLEX_ALIGN, ...same('center', 'baseline', 'stretch') }),
  alignSelf: Object.freeze({ ...same('auto'), ...FLEX_ALIGN, ...same('center', 'stretch', 'baseline') }),
  alignContent: Object.freeze({ ...same('normal', 'center'), ...FLEX_ALIGN, ...SPACE, ...same('baseline', 'stretch') }),
  justifyContent: Object.freeze({ ...same('normal'), ...FLEX_ALIGN, ...same('center'), ...SPACE, ...same('stretch') }),
  justifyItems: same('normal', 'start', 'end', 'center', 'stretch'),
  justifySelf: Object.freeze({ ...same('auto'), ...FLEX_ALIGN, ...same('center', 'stretch') }),
  placeItems: same('start', 'end', 'center', 'baseline', 'stretch'),
  placeContent: Object.freeze({ ...same('center', 'start', 'end'), ...SPACE, ...same('baseline', 'stretch') }),
  flex: Object.freeze({ 1: '1', auto: 'auto', initial: '0 auto', none: 'none' }),
  flexGrow: same('0', '1'),
  flexShrink: same('0', '1'),
  gridColumns: counted((n) => `repeat(${n}, minmax(0, 1fr))`),
  gridRows: counted((n) => `repeat(${n}, minmax(0, 1fr))`),
  gridColumn: spans,
  gridRow: spans,
}
/** The CSS property each layout keyword sets where its name does not say it. */
const ARRANGE_PROPERTIES = Object.freeze({ gridColumns: ['grid-template-columns'], gridRows: ['grid-template-rows'] })
/** Whether a property is a layout keyword: it steps at the container like the spacing properties, and sits wherever a keyword may. */
export const isArrange = (prop) => Object.hasOwn(ARRANGE_VALUES, prop)
/** Whether a property may step at the container: the layout properties, the layout keywords and the text alignment. */
const isStepped = (prop) => isLayout(prop) || isArrange(prop) || prop === 'textAlign'

export const VALUE_SETS = Object.freeze({
  fontWeight: Object.freeze({ normal: '400', medium: '500', semibold: '600', bold: '700' }),
  lineHeight: Object.freeze({ none: '1', tight: '1.25', snug: '1.375', normal: '1.5', relaxed: '1.625', loose: '2' }),
  letterSpacing: Object.freeze({ tighter: '-0.05em', tight: '-0.025em', normal: '0em', wide: '0.025em', wider: '0.05em', widest: '0.1em' }),
  textDecorationLine: Object.freeze({ none: 'none', underline: 'underline', 'line-through': 'line-through' }),
  visibility: Object.freeze({ visible: 'visible', hidden: 'hidden', collapse: 'collapse' }),
  textAlign: Object.freeze({ left: 'left', center: 'center', right: 'right', start: 'start', end: 'end', justify: 'justify' }),
  textTransform: Object.freeze({ none: 'none', uppercase: 'uppercase', lowercase: 'lowercase', capitalize: 'capitalize' }),
  ...ARRANGE_VALUES,
})

const RING_MESSAGE = 'width, style and offset live in the ring token: outline: {ring.<name>}'
const BORDER_MESSAGE = 'width and style live in the border token: border: {border.<name>}'
/** Properties a recipe may not set, each with the token that carries its value. */
export const REFUSED_PROPERTIES = Object.freeze({
  fontSize: 'a size comes from a text style: typography: {typography.<name>}',
  borderWidth: BORDER_MESSAGE,
  borderStyle: BORDER_MESSAGE,
  outlineWidth: RING_MESSAGE,
  outlineStyle: RING_MESSAGE,
  outlineOffset: RING_MESSAGE,
  textUnderlineOffset: 'not a recipe property; a text style may carry it later',
  corner: 'not a recipe property',
  font: 'a shorthand of the text style: typography: {typography.<name>}, with fontWeight, lineHeight and letterSpacing keywords',
  transform: 'a move comes from translate: {spacing.<n>}, one or two axes',
  textDecoration: 'the line comes from textDecorationLine: none, underline, line-through',
  borderRadius: 'a radius comes from rounded: {rounded.<name>}',
  boxShadow: 'a shadow comes from shadow: {shadow.<name>}',
})

const TRANSLATE_AXES = 'translate takes one or two axes: {spacing.<n>}, -{spacing.<n>}, 0, full, -full'
const translateAxis = (axis) => {
  if (axis === '0') return '0'
  if (axis === 'full') return '100%'
  if (axis === '-full') return '-100%'
  const negative = axis.startsWith('-')
  const ref = parseRef(negative ? axis.slice(1) : axis)
  if (!ref || ref.group !== 'spacing' || ref.problem) return null
  const step = refVar('spacing', ref.name)
  return negative ? `calc(-1 * ${step})` : step
}
/** The rendered translate, or null when an axis is not one a recipe may write. */
const translateValue = (text) => {
  const axes = text.split(/\s+/)
  if (axes.length > 2) return null
  const rendered = axes.map(translateAxis)
  return rendered.includes(null) ? null : rendered.join(' ')
}

const orList = (items) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} or ${items.at(-1)}` : items.join(''))
/** Why free text on a property of a token group is refused, or null when the property has no group. */
function groupedTextProblem(prop, text) {
  if (isColorProperty(prop)) {
    const keywords = prop === 'stroke' || prop === 'fill' ? [...VALUE_KEYWORDS.colors, 'none'] : VALUE_KEYWORDS.colors
    return keywords.includes(text) ? null : `${text} — ${prop} takes ${orList(['{colors.<name>}', '{colors.<name>/<NN>}', ...keywords])}`
  }
  const group = PROPERTY_GROUP[prop]
  if (!group) return null
  const keywords = VALUE_KEYWORDS[group] ?? []
  return keywords.includes(text) ? null : `${text} — ${prop} takes ${orList([`{${group}.<name>}`, ...keywords])}`
}

const kebab = (key) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

const REF_SHAPE = /^\{([^{}]*)\}$/
/** The token groups a recipe value may reference. */
export const REF_GROUPS = Object.freeze(['colors', 'rounded', 'border', 'ring', 'opacity', 'shadow', 'typography', 'components', 'spacing', 'container'])
const TOKEN_NAME = /^[A-Za-z0-9-]+$/
const COMPONENT_NAME = /^[a-z][a-z0-9-]*\.[A-Za-z0-9-]+$/
const PERCENT = /^(?:100|[1-9]?[0-9])$/
const SPACING_STEP = /^(?:px|(?:0|[1-9][0-9]?)(?:\.25|\.5|\.75)?)$/
const isSpacingStep = (name) => SPACING_STEP.test(name) && (name === 'px' || Number(name) <= 96)
// Authored text lands inside a declaration; anything that could end it is refused.
const SAFE_VALUE = /^[^;{}<>\n]+$/

/** A `{group.name}` or `{colors.name/NN}` reference as its parts, with the problem that keeps it from rendering; null for a value that is no reference. */
export function parseRef(value) {
  const match = typeof value === 'string' ? REF_SHAPE.exec(value.trim()) : null
  if (!match) return null
  const dot = match[1].indexOf('.')
  const group = dot >= 0 ? match[1].slice(0, dot) : match[1]
  const rest = dot >= 0 ? match[1].slice(dot + 1) : ''
  const slash = rest.indexOf('/')
  const ref = slash >= 0 ? { group, name: rest.slice(0, slash), alpha: rest.slice(slash + 1) } : { group, name: rest }
  const problem = !REF_GROUPS.includes(group)
    ? `{${group}.…} is not a token group a recipe may reference`
    : group === 'spacing' && !isSpacingStep(ref.name)
      ? 'not a spacing step: {spacing.<n>}, <n> from 0 to 96 in quarters, or {spacing.px}'
      : group !== 'spacing' && !(group === 'components' ? COMPONENT_NAME : TOKEN_NAME).test(ref.name)
        ? `not a token reference: {${group}.<name>}, {colors.<name>/<NN>} for an alpha`
        : ref.alpha !== undefined && group !== 'colors'
          ? 'an alpha follows a {colors.…} token only'
          : ref.alpha !== undefined && !PERCENT.test(ref.alpha)
            ? 'the alpha after / is a whole percent from 0 to 100'
            : null
  return problem ? { ...ref, problem } : ref
}

/** Why a recipe value would not render, as `<value> — <reason>`, or null. */
export function recipeValueProblem(prop, value) {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : ''
  if (!text) return 'empty — a value is a string or a number'
  if (Object.hasOwn(REFUSED_PROPERTIES, prop)) return `${prop} — ${REFUSED_PROPERTIES[prop]}`
  if (prop === 'translate') return translateValue(text) ? null : `${text} — ${TRANSLATE_AXES}`
  if (isArrange(prop)) return Object.hasOwn(VALUE_SETS[prop], text) ? null : `${text} — ${prop} takes ${Object.keys(VALUE_SETS[prop]).join(', ')}`
  const ref = parseRef(text)
  if (prop === CONTRAST_PROPERTIES.ground) return ref?.group === 'colors' && !ref.problem && ref.alpha === undefined ? null : `${text} — ground takes {colors.<name>}`
  if (ref?.problem) return `${text} — ${ref.problem}`
  if (ref?.alpha !== undefined && !isColorProperty(prop)) return `${text} — an alpha applies to a colour property only`
  if (ref?.group === 'typography' && prop !== 'typography') return `${text} — a text style expands on typography only`
  if (ref?.group === 'ring' && prop !== 'outline') return `${text} — a ring token sets outline only`
  if (ref?.group === 'opacity' && prop !== 'opacity') return `${text} — an opacity token sets opacity only`
  if (ref?.group === 'spacing' && !isLayout(prop)) return `${text} — a spacing step sets a layout property only`
  if (ref?.group === 'container' && !WIDTH_PROPERTIES.includes(prop)) return `${text} — a container size sets width, minWidth or maxWidth only`
  const wanted = isColorProperty(prop) ? 'colors' : PROPERTY_GROUP[prop]
  if (ref && ref.group !== 'components' && wanted && ref.group !== wanted) return `${text} — ${prop} takes {${wanted}.<name>}`
  if (isLayout(prop) && ref?.group !== 'spacing' && !(ref?.group === 'container' && WIDTH_PROPERTIES.includes(prop))) {
    if (!ref && (Object.hasOwn(LAYOUT_KEYWORDS[prop] ?? {}, text) || isRekaKeyword(prop, text))) return null
    const keywords = [...Object.keys(LAYOUT_KEYWORDS[prop] ?? {}), ...(Object.hasOwn(REKA_AXES, prop) ? Object.keys(REKA_KEYWORDS) : [])]
    return `${text} — a layout property takes {spacing.<n>}${WIDTH_PROPERTIES.includes(prop) ? ' or {container.<name>}' : ''}${keywords.length ? `; ${prop} also takes ${orList(keywords)}` : ''}`
  }
  if (!ref) {
    const grouped = groupedTextProblem(prop, text)
    if (grouped) return grouped
  }
  const set = VALUE_SETS[prop]
  if (set && !Object.hasOwn(set, text)) return `${text} — ${prop} takes ${Object.keys(set).join(', ')}`
  const hide = HIDE_PROPERTIES[prop]
  if (hide && !hide.values.includes(text)) return `${text} — ${prop} takes ${hide.values.join(', ')} only`
  if (!ref && !SAFE_VALUE.test(text)) return `${text} — ; { } < > and line breaks cannot sit in a value`
  return null
}

const BLOCK_NAMES = [...Object.keys(RECIPE_BLOCKS), ...Object.keys(LAYOUT_PARTS)]
/** The block a flat property's variable would collide with: `fileColor` and `file: { color }` both name `-file-color`, `mdGap` and `'@md': { gap }` both `-md-gap`. */
export const collidingBlock = (prop) =>
  Object.hasOwn(RECIPE_NESTED_PROPERTIES, prop)
    ? undefined
    : (BLOCK_NAMES.find((block) => kebab(prop).startsWith(`${kebab(block)}-`)) ?? LAYOUT_STEPS.find((step) => kebab(prop).startsWith(`${stepName(step)}-`)))

/** Whether a property inside `block` would style an element a pseudo-element part cannot hold. */
export const reachesInsidePart = (block, prop) => Object.hasOwn(RECIPE_PARTS, block) && Object.hasOwn(RECIPE_NESTED_PROPERTIES, prop)

const kindOf = (block) => (Object.hasOwn(RECIPE_PARTS, block) ? 'part' : Object.hasOwn(RECIPE_STATES, block) ? 'state' : undefined)
const isScalar = (value) => (typeof value === 'string' && value.length > 0 && value.length <= 500) || Number.isFinite(value)

const LAYOUT_PLACE = 'a layout property sits in a component tree, or in a family it extends; never in a state'
const PARTS_PLACE = `${PARTS} sit on a value or a ${WITH} block`
const PARTS_SHAPE = `${PARTS} maps a part of the tree to a block of layout properties`
const PARTS_ONLY = `a ${PARTS} block sets layout properties only`
const OLD_STEP = "a step is written '@md' and widens at the component’s container; md stepped at the viewport"
const UNKNOWN_STEP = `a step is ${STEP_LIST}`
const COMPOUNDS_MOVED = `compounds moved under their first value as ${WITH}`
const USE_MOVED = `use moved to ${EXTENDS}, the family by name`
const WITH_PLACE = 'belongs to a component tree’s value; a flat recipe never carries it'
const RING_PLACE = 'colours the focus ring; a component’s own value sets it, never a family or a shared state recipe'
const CONTAIN_PLACE = `${CONTAIN} sits on a base`
const CONTAIN_VALUE = `${CONTAIN} is ${CONTAIN_VALUES.join(' or ')}`

function propertyProblems(at, prop, value, block, name, layout, base = false) {
  if (prop === 'use') return [{ path: at, message: USE_MOVED }]
  if (!RECIPE_PROPERTY.test(prop) || prop.length > 64) return [{ path: at, message: 'not a recipe property the library accepts' }]
  if (Object.hasOwn(CONTRAST_PROPERTIES, prop)) {
    if (block) return [{ path: at, message: `${prop} sits at the top level of a recipe or a value` }]
    if (prop === CONTRAST_PROPERTIES.decorative) return value === true ? [] : [{ path: at, message: 'decorative is true or left out' }]
  }
  if (prop === CONTAIN) {
    if (block || !base) return [{ path: at, message: CONTAIN_PLACE }]
    return CONTAIN_VALUES.includes(value) ? [] : [{ path: at, message: CONTAIN_VALUE }]
  }
  if (!block && name !== undefined && Object.hasOwn(RING_PROPERTIES, prop)) return [{ path: at, message: RING_PLACE }]
  if (Object.hasOwn(LAYOUT_PARTS, block ?? '')) {
    if (!LAYOUT_PARTS[block].properties.includes(prop)) return [{ path: at, message: `the ${block} part takes ${LAYOUT_PARTS[block].properties.join(', ')} only` }]
  } else if (isLayout(prop)) {
    if (block) return [{ path: at, message: 'a layout property sits at the top level or in the icon part' }]
    if (!layout) return [{ path: at, message: LAYOUT_PLACE }]
  }
  const collides = !block && collidingBlock(prop)
  if (collides) return [{ path: at, message: `its variable collides with the ${collides} block’s; set it inside ${collides}` }]
  if (block && Object.hasOwn(HIDE_PROPERTIES, prop)) return [{ path: at, message: `hides the element’s ${prop}; it sits at the top level` }]
  if (block && Object.hasOwn(RING_PROPERTIES, prop)) return [{ path: at, message: 'sets the focus ring’s colour on the element; it sits at the top level' }]
  if (block && reachesInsidePart(block, prop)) return [{ path: at, message: `styles an element inside; the ${block} part has none` }]
  if (!isScalar(value)) return [{ path: at, message: 'must be a string of 1 to 500 characters or a number' }]
  const problem = recipeValueProblem(prop, value)
  if (problem) return [{ path: at, message: problem }]
  return name !== undefined && isRekaKeyword(prop, String(value).trim()) ? [{ path: at, message: rekaPlace(String(value).trim()) }] : []
}

const FAMILY = /^[a-z][a-z0-9-]*$/

const rawUses = (value) => {
  const raw = isNode(value) ? value[EXTENDS] : undefined
  return raw === undefined ? [] : Array.isArray(raw) ? raw : [raw]
}
const malformedUses = (value) => rawUses(value).filter((entry) => typeof entry !== 'string' || !FAMILY.test(entry.trim()))

/** A bare name or list where a value block belongs: the message naming the block to write, or null. */
const bareName = (value) => {
  if (typeof value !== 'string' && !(Array.isArray(value) && value.length)) return null
  const names = Array.isArray(value) ? `[${value.map(String).join(', ')}]` : value
  return `a value is a block; write ${EXTENDS}: ${names} inside it`
}

/** The family names a value's `extends` key holds, a name or a list of them; malformed entries are left out. */
export const parseExtends = (value) => rawUses(value).flatMap((entry) => (typeof entry === 'string' && FAMILY.test(entry.trim()) ? [entry.trim()] : []))

/** A value in its full form, `{ extends?: string[], …properties }`; null for anything that is no value, a bare name included. */
export function normalizeRecipe(value) {
  if (!isNode(value)) return null
  const { [EXTENDS]: _, [WITH]: __, ...own } = value
  return Object.hasOwn(value, EXTENDS) ? { [EXTENDS]: parseExtends(value), ...own } : own
}

function stepProblems(step, value, flat = false) {
  if (!isNode(value) || !Object.keys(value).length) return [{ path: step, message: 'a step is a block of one or more layout properties' }]
  return Object.entries(value).flatMap(([prop, inner]) => {
    const at = `${step}.${prop}`
    if (!isStepped(prop)) return [{ path: at, message: `a step sets layout properties and textAlign only, from the component’s ${step} container width` }]
    if (!isScalar(inner)) return [{ path: at, message: 'must be a string of 1 to 500 characters or a number' }]
    const problem = recipeValueProblem(prop, inner)
    if (problem) return [{ path: at, message: problem }]
    return flat && isRekaKeyword(prop, String(inner).trim()) ? [{ path: at, message: rekaPlace(String(inner).trim()) }] : []
  })
}

/** A parts block's problems: each part a block of layout properties, each with a value that renders. */
function partsProblems(parts) {
  if (!isNode(parts) || !Object.keys(parts).length) return [{ path: PARTS, message: PARTS_SHAPE }]
  return Object.entries(parts).flatMap(([part, block]) => {
    const at = `${PARTS}.${part}`
    if (!isNode(block) || !Object.keys(block).length) return [{ path: at, message: 'a part is a block of one or more layout properties' }]
    return Object.entries(block).flatMap(([prop, inner]) => {
      if (!isLayout(prop)) return [{ path: `${at}.${prop}`, message: PARTS_ONLY }]
      if (!isScalar(inner)) return [{ path: `${at}.${prop}`, message: 'must be a string of 1 to 500 characters or a number' }]
      const problem = recipeValueProblem(prop, inner) ?? (isRekaKeyword(prop, String(inner).trim()) ? rekaPlace(String(inner).trim()) : null)
      return problem ? [{ path: `${at}.${prop}`, message: problem }] : []
    })
  })
}

function definitionProblems(def, name, layout, base = false) {
  const problems = []
  const flat = name !== undefined
  for (const [prop, value] of Object.entries(def)) {
    if (prop === WITH) {
      if (flat) problems.push({ path: prop, message: WITH_PLACE })
      continue
    }
    if (prop === PARTS) {
      if (flat) problems.push({ path: prop, message: WITH_PLACE })
      else if (base) problems.push({ path: prop, message: PARTS_PLACE })
      else problems.push(...partsProblems(value))
      continue
    }
    if (prop === 'md') {
      problems.push({ path: prop, message: OLD_STEP })
      continue
    }
    if (prop.startsWith('@') && !isStep(prop)) {
      problems.push({ path: prop, message: UNKNOWN_STEP })
      continue
    }
    if (isStep(prop)) {
      problems.push(...(layout ? stepProblems(prop, value, flat) : [{ path: prop, message: LAYOUT_PLACE }]))
      continue
    }
    const kind = kindOf(prop)
    const part = Object.hasOwn(LAYOUT_PARTS, prop)
    if (part && !layout) {
      problems.push({ path: prop, message: LAYOUT_PLACE })
      continue
    }
    if (!kind && !part) {
      problems.push(...propertyProblems(prop, prop, value, null, name, layout, base))
      continue
    }
    const label = kind ?? 'part'
    if (!isNode(value) || !Object.keys(value).length) {
      problems.push({ path: prop, message: `a ${label} is a block of one or more properties` })
      continue
    }
    for (const [inner, innerValue] of Object.entries(value)) {
      const innerKind = kindOf(inner) ?? (Object.hasOwn(LAYOUT_PARTS, inner) ? 'part' : undefined)
      if (innerKind === 'state' && Object.hasOwn(STATEFUL_PARTS, prop)) {
        if (!isNode(innerValue) || !Object.keys(innerValue).length) problems.push({ path: `${prop}.${inner}`, message: 'a state is a block of one or more properties' })
        else
          for (const [deep, deepValue] of Object.entries(innerValue)) {
            const deepKind = kindOf(deep) ?? (Object.hasOwn(LAYOUT_PARTS, deep) ? 'part' : undefined)
            if (deepKind) problems.push({ path: `${prop}.${inner}.${deep}`, message: `a ${deepKind} inside a state` })
            else problems.push(...propertyProblems(`${prop}.${inner}.${deep}`, deep, deepValue, prop, name, layout))
          }
      } else if (innerKind) problems.push({ path: `${prop}.${inner}`, message: `a ${innerKind} inside a ${label}` })
      else problems.push(...propertyProblems(`${prop}.${inner}`, inner, innerValue, prop, name, layout))
    }
  }
  return problems
}

/** Every reason a recipe would not render as written, each with its path; [] when it renders whole.
 * Named, a flat recipe: no extends, with, parts or ring colour, and no layout on a shared state or a ringed family. Unnamed, a value block,
 * `{ extends?, …properties }`; `{}` sets nothing. */
export function recipeProblems(def, name) {
  if (name === undefined) {
    const bare = bareName(def)
    if (bare) return [{ path: '', message: bare }]
    const value = normalizeRecipe(def)
    if (!value) return [{ path: '', message: 'a recipe is a block of one or more properties' }]
    if (malformedUses(def).length) return [{ path: EXTENDS, message: 'names a family, or a list of them' }]
    const { [EXTENDS]: _, ...own } = value
    return definitionProblems(own, undefined, true)
  }
  if (!isNode(def) || !Object.keys(def).length) return [{ path: '', message: 'a recipe is a block of one or more properties' }]
  if (Object.hasOwn(def, 'use')) return [{ path: 'use', message: USE_MOVED }]
  if (Object.hasOwn(def, EXTENDS)) return [{ path: EXTENDS, message: 'a flat recipe extends no other; a component tree’s values do' }]
  return definitionProblems(def, name, familyLayout(name, def))
}

/** A recipe value as served and saved, `{ extends?, …properties }`: each property, state and part renders as written. */
export const isRecipeDefinition = (def) => recipeProblems(def).length === 0

/** Whether a recipe is a component tree: it holds a tree key, or only `composes`, which names what its element wears and renders nothing. */
export const isTree = (entry) => isNode(entry) && (TREE_KEYS.some((key) => Object.hasOwn(entry, key)) || Object.hasOwn(entry, TREE_COMPOSES))

/** A name-to-recipe map as its flat recipes and its component trees. */
export function splitRecipes(components) {
  const flat = {}
  const trees = {}
  for (const [name, entry] of Object.entries(isNode(components) ? components : {})) (isTree(entry) ? trees : flat)[name] = entry
  return { flat, trees }
}

/** Where a project recipe file says its schema. */
export const RECIPE_SCHEMA_URL = 'https://registry.ui.frontic.com/recipe.schema.json'

/** A file's basename without `.json`. */
const fileBase = (path) =>
  path
    .split('/')
    .pop()
    .replace(/\.json$/, '')

/** Where an item's manifest says its schema: the registry's source manifests, a project's component manifests and a stack's stored items. */
export const ITEM_SCHEMA_URL = 'https://registry.ui.frontic.com/item.schema.json'

/** The keys of an item's manifest, in the order it is written; a project's component manifest holds neither `name` nor `categories`. */
export const ITEM_MANIFEST_KEYS = Object.freeze(['$schema', 'name', 'title', 'description', 'categories', 'recipes', 'composes'])

/** A manifest's `name`, when it has one, against the folder it sits in, which names the item; the schema cannot see the folder. */
export function manifestNameProblems(manifest, folder) {
  const name = isNode(manifest) ? manifest.name : undefined
  return name === undefined || name === folder ? [] : [`name: ${JSON.stringify(name)} is not the item's folder name, ${folder}`]
}

/** The keys of `manifest`, and of each of its trees, that sit out of order ({@link ITEM_MANIFEST_KEYS}, {@link TREE_KEY_ORDER}); others are not ordered. */
export function manifestOrderProblems(manifest) {
  const known = Object.keys(isNode(manifest) ? manifest : {}).filter((key) => ITEM_MANIFEST_KEYS.includes(key))
  const expected = [...known].sort((a, b) => ITEM_MANIFEST_KEYS.indexOf(a) - ITEM_MANIFEST_KEYS.indexOf(b))
  const own = known.join() === expected.join() ? [] : [`keys run ${known.join(', ')}; a manifest orders them ${expected.join(', ')}`]
  return [...own, ...treeOrderProblems(isNode(manifest) ? manifest.recipes : undefined).map((problem) => `recipes: ${problem}`)]
}

/** An item's manifest as a file holds it: `$schema` first, then {@link ITEM_MANIFEST_KEYS} in order, any other key after them as given,
 * each tree's keys in {@link TREE_KEY_ORDER}, two-space JSON and a final newline. */
export function itemManifestText(manifest) {
  const { $schema: _schema, ...rest } = isNode(manifest) ? manifest : {}
  const ordered = { $schema: ITEM_SCHEMA_URL }
  for (const key of ITEM_MANIFEST_KEYS) if (key !== '$schema' && Object.hasOwn(rest, key)) ordered[key] = rest[key]
  if (isNode(ordered.recipes)) ordered.recipes = Object.fromEntries(Object.entries(ordered.recipes).map(([name, def]) => [name, orderedTree(def)]))
  for (const [key, value] of Object.entries(rest)) if (!Object.hasOwn(ordered, key)) ordered[key] = value
  return `${JSON.stringify(ordered, null, 2)}\n`
}

/** Recipes by name as a project's recipe file holds them: `$schema` first, the names in the order given, two-space JSON, a final newline. */
export const recipeFileText = (recipes) => `${JSON.stringify({ $schema: RECIPE_SCHEMA_URL, ...recipes }, null, 2)}\n`

const byPath = (files) => [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))

const ONE_RECIPE_KEYS = new Set([...TREE_KEYS, TREE_COMPOSES, WITH, EXTENDS, PARTS])
const NESTED_NAMES = new Set([...Object.keys(RECIPE_BLOCKS), ...Object.keys(LAYOUT_PARTS), ...LAYOUT_STEPS])

/** Whether a recipe file's object holds one recipe, the 0.9 shape, rather than recipes by name: it has a tree key, no key that could
 * name a recipe, or only keys a recipe nests (`hover`, `link`) while none is the file's own name. */
export function isOneRecipeFile(value, path) {
  const entries = Object.entries(value).filter(([key]) => key !== '$schema')
  if (entries.length === 0) return false
  if (entries.some(([key]) => ONE_RECIPE_KEYS.has(key))) return true
  const named = entries.filter(([key, def]) => RECIPE_NAME.test(key) && isNode(def)).map(([key]) => key)
  return named.length === 0 || (named.every((key) => NESTED_NAMES.has(key)) && !named.includes(fileBase(path)))
}

/** A recipe file's text as an object, or the problem that keeps it out. */
function parseRecipeFile({ path, text }) {
  let value
  try {
    value = JSON.parse(text)
  } catch (error) {
    return { problem: `${path}: not JSON: ${error.message}` }
  }
  return isNode(value) ? { value } : { problem: `${path}: holds recipes by name, a JSON object` }
}

/** Recipe files, each holding recipes by name: the flat recipes, the trees, each name's file, and every problem as `<path>: <reason>` or
 * `<path>: <name>: <reason>`. A file in the one-recipe shape defines nothing; a bad key leaves its siblings; of two files defining one
 * name, the first by path wins. */
export function readRecipeFiles(files) {
  const flat = {}
  const trees = {}
  const paths = {}
  const problems = []
  for (const file of byPath(files)) {
    const { value, problem } = parseRecipeFile(file)
    if (problem) {
      problems.push(problem)
      continue
    }
    if (isOneRecipeFile(value, file.path)) {
      problems.push(`${file.path}: holds one recipe, the 0.9 shape; a recipe file holds recipes by name: { "${fileBase(file.path)}": { … } }`)
      continue
    }
    for (const [name, def] of Object.entries(value)) {
      if (name === '$schema') continue
      if (!RECIPE_NAME.test(name)) problems.push(`${file.path}: ${name}: is not a recipe name: lowercase letters, digits and dashes`)
      else if (!isNode(def)) problems.push(`${file.path}: ${name}: holds a recipe, a JSON object`)
      else if (Object.hasOwn(paths, name)) problems.push(`${file.path}: ${name}: defined in ${paths[name]} too`)
      else {
        ;(isTree(def) ? trees : flat)[name] = def
        paths[name] = file.path
      }
    }
  }
  return { flat, trees, paths, problems }
}

/** The 0.9 one-recipe files of a library's `recipes/` (paths from the library root) as files of recipes by name: each tree in the file
 * of the item that owns it (`treeOwner` over `itemNames`, else the outermost tree that prefixes it, else its own), each flat recipe in
 * `recipes/shared/<name>.json`. `removes` lists the old files no write replaces. A converted folder yields nothing; a folder holding
 * both shapes, a file that cannot be read or a name defined twice yields only problems. */
export function convertRecipeFiles(files, itemNames) {
  const none = { writes: [], removes: [], problems: [] }
  const problems = []
  const old = []
  const converted = []
  for (const file of byPath(files)) {
    const { value, problem } = parseRecipeFile(file)
    if (problem) problems.push(problem)
    else if (isOneRecipeFile(value, file.path)) {
      const { $schema: _schema, ...def } = value
      old.push({ path: file.path, name: fileBase(file.path), def })
    } else converted.push(file.path)
  }
  if (!problems.length && old.length && converted.length) problems.push(`recipes: holds both shapes, ${converted[0]} converted and ${old[0].path} not; convert from one shape`)
  const seen = {}
  for (const { path, name } of problems.length ? [] : old) {
    if (!RECIPE_NAME.test(name)) problems.push(`${path}: ${name} is not a recipe name: lowercase letters, digits and dashes`)
    else if (Object.hasOwn(seen, name)) problems.push(`${path}: ${name}: defined in ${seen[name]} too`)
    else seen[name] = path
  }
  if (problems.length) return { ...none, problems }
  if (!old.length) return none
  const trees = old.filter((recipe) => isTree(recipe.def)).map((recipe) => recipe.name)
  const outermost = (tree) => {
    let owner = tree
    for (
      let next;
      (next = treeOwner(
        owner,
        trees.filter((name) => name !== owner),
      )) !== undefined;
    )
      owner = next
    return owner
  }
  const groups = new Map()
  const writes = []
  for (const { name, def } of old) {
    if (!isTree(def)) {
      writes.push({ path: `recipes/shared/${name}.json`, text: recipeFileText({ [name]: def }) })
      continue
    }
    const owner = treeOwner(name, itemNames) ?? outermost(name)
    if (!groups.has(owner)) groups.set(owner, {})
    groups.get(owner)[name] = def
  }
  for (const [owner, recipes] of groups) {
    const names = Object.keys(recipes).sort((a, b) => (a === owner ? -1 : b === owner ? 1 : a < b ? -1 : 1))
    writes.push({ path: `recipes/${owner}.json`, text: recipeFileText(Object.fromEntries(names.map((name) => [name, recipes[name]]))) })
  }
  writes.sort((a, b) => (a.path < b.path ? -1 : 1))
  const written = new Set(writes.map((write) => write.path))
  return { writes, removes: old.map((recipe) => recipe.path).filter((path) => !written.has(path)), problems: [] }
}

/** The file a recipe problem is about: the one defining the recipe name the line leads with (`fui-` or `recipe ` dropped). */
export function recipeFileOf(message, paths) {
  const name = /^(?:recipe |fui-)?([a-z][a-z0-9-]*)[.:]/.exec(message)?.[1]
  return name !== undefined && Object.hasOwn(paths, name) ? paths[name] : undefined
}

const MERGED_BLOCKS = new Set([...Object.keys(RECIPE_BLOCKS), ...Object.keys(LAYOUT_PARTS), ...LAYOUT_STEPS])

/** The CSS properties a stepped property renders. */
const steppedCss = (prop) => LAYOUT_PROPERTIES[prop] ?? ARRANGE_PROPERTIES[prop] ?? [kebab(prop)]

/** The box edges each padding or margin property writes, top and bottom read as the block edges. */
const BOX_EDGES = {
  '': ['block-start', 'block-end', 'inline-start', 'inline-end'],
  block: ['block-start', 'block-end'],
  inline: ['inline-start', 'inline-end'],
  top: ['block-start'],
  bottom: ['block-end'],
  'inline-start': ['inline-start'],
  'inline-end': ['inline-end'],
}
/** The longhands each CSS shorthand a stepped property renders sets. */
const CSS_LONGHANDS = { flex: ['flex-grow', 'flex-shrink', 'flex-basis'], 'place-items': ['align-items', 'justify-items'], 'place-content': ['align-content', 'justify-content'] }

/** The longhands a stepped property writes: two properties that share one set the same CSS. */
function longhands(prop) {
  return steppedCss(prop).flatMap((css) => {
    const box = /^(padding|margin)(?:-(.+))?$/.exec(css)
    const edges = box && BOX_EDGES[box[2] ?? '']
    return edges ? edges.map((edge) => `${box[1]}-${edge}`) : (CSS_LONGHANDS[css] ?? [css])
  })
}

/** `def` over `into`, each property it sets moved after what it overrides, so its declaration comes last.
 * The CSS a property `def` sets is its own at every step: `into`'s step values writing any of it drop, a step block left empty with them. */
function merge(into, def) {
  const owned = new Set(Object.keys(def).filter(isStepped).flatMap(longhands))
  const keep = ([prop]) => !longhands(prop).some((css) => owned.has(css))
  for (const step of LAYOUT_STEPS) {
    if (!isNode(into[step]) || Object.entries(into[step]).every(keep)) continue
    const kept = Object.entries(into[step]).filter(keep)
    if (kept.length) into[step] = Object.fromEntries(kept)
    else delete into[step]
  }
  for (const [prop, value] of Object.entries(def)) {
    const block = MERGED_BLOCKS.has(prop) && isNode(value) && isNode(into[prop]) ? Object.fromEntries(Object.entries(into[prop]).filter(([key]) => !Object.hasOwn(value, key))) : null
    delete into[prop]
    into[prop] = block ? { ...block, ...value } : value
  }
  return into
}

const usable = (families, name) => isNode(families?.[name]) && !isTree(families[name]) && !STATE_RECIPES.includes(name)

const ringed = (def) => Object.keys(def).some((prop) => Object.hasOwn(RING_PROPERTIES, prop))

/** Whether a flat recipe's layout renders: a family's does, a shared state's or a ringed family's never. */
const familyLayout = (name, def) => !STATE_RECIPES.includes(name) && !ringed(def)

/** A value with every family it extends inlined in order, its own properties over them. */
export function resolveValue(value, families) {
  const { [EXTENDS]: use = [], ...own } = normalizeRecipe(value) ?? {}
  const merged = {}
  for (const name of use) if (usable(families, name)) merge(merged, families[name])
  return merge(merged, own)
}

const axesOf = (tree) => (isNode(tree.variants) ? Object.entries(tree.variants).filter(([, values]) => isNode(values)) : [])

/** The name part each axis value takes in a class: the bare value, or `<axis>-<value>` where another axis has the value
 * too or the tree's `keepAxis` lists it. */
export function valueParts(tree) {
  const axes = axesOf(isNode(tree) ? tree : {})
  const kept = new Set(Array.isArray(tree?.keepAxis) ? tree.keepAxis : [])
  const seen = new Map()
  for (const [, values] of axes) for (const value of Object.keys(values)) seen.set(value, (seen.get(value) ?? 0) + 1)
  const part = (axis, value) => (seen.get(value) > 1 || kept.has(value) ? `${axis}-${value}` : value)
  return new Map(axes.map(([axis, values]) => [axis, new Map(Object.keys(values).map((value) => [value, part(axis, value)]))]))
}

/** A pair's name, which its variables carry: the tree's name and the pair's value parts, axes in the tree's order. */
export function pairName(name, tree, when, parts = valueParts(tree)) {
  return [
    name,
    ...axesOf(tree)
      .map(([axis]) => axis)
      .filter((axis) => Object.hasOwn(when, axis))
      .map((axis) => parts.get(axis)?.get(when[axis]) ?? `${axis}-${when[axis]}`),
  ].join('-')
}

/** Every pair a tree writes, each as the values it wears, in path order, and its block; a block holding only `with` is a path, not a pair. */
function withPairs(tree) {
  const pairs = []
  const walk = (when, def) => {
    if (!isNode(def?.[WITH])) return
    for (const [axis, values] of Object.entries(def[WITH])) {
      if (!isNode(values) || Object.hasOwn(when, axis)) continue
      for (const [value, block] of Object.entries(values)) {
        const pair = { ...when, [axis]: value }
        if (Object.keys(normalizeRecipe(block) ?? {}).length || !isNode(block)) pairs.push({ when: pair, def: block })
        walk(pair, block)
      }
    }
  }
  for (const [axis, values] of axesOf(tree)) for (const [value, def] of Object.entries(values)) walk({ [axis]: value }, def)
  return pairs
}

/** Every class a tree makes, in cascade order, with its layer, whether it may set layout, and its resolved recipe. A pair's entry
 * carries the values it wears and their class names: its rule nests in each of them, selecting the others. */
export function treeEntries(name, tree, families = {}) {
  if (!isNode(tree)) return []
  const parts = valueParts(tree)
  const entries = []
  if (tree.base !== undefined) entries.push({ name, layer: 'base', layout: true, def: resolveValue(tree.base, families) })
  for (const [axis, values] of axesOf(tree)) {
    for (const [value, def] of Object.entries(values)) entries.push({ name: `${name}-${parts.get(axis).get(value)}`, layer: 'value', layout: true, def: resolveValue(def, families) })
  }
  const axes = axesOf(tree).map(([axis]) => axis)
  for (const { when, def } of withPairs(tree)) {
    const ordered = Object.fromEntries(axes.filter((axis) => Object.hasOwn(when, axis)).map((axis) => [axis, when[axis]]))
    const classes = Object.entries(ordered).map(([axis, value]) => `${name}-${parts.get(axis)?.get(value) ?? `${axis}-${value}`}`)
    entries.push({ name: pairName(name, tree, when, parts), layer: 'compound', layout: true, def: resolveValue(def, families), when: ordered, classes })
  }
  return entries
}

/** Each property a resolved block sets, as its path through states, parts and steps, with the value it sets; the contrast markers render nothing and are left out. */
function propertyPaths(def, prefix = '') {
  const paths = new Map()
  for (const [key, value] of Object.entries(def ?? {})) {
    if (key === WITH || Object.hasOwn(CONTRAST_PROPERTIES, key)) continue
    const path = prefix ? `${prefix}.${key}` : key
    if (isNode(value)) for (const [inner, set] of propertyPaths(value, path)) paths.set(inner, set)
    else paths.set(path, JSON.stringify(value))
  }
  return paths
}

/** Every property two values of different axes both set, to different values, where no `with` pair of exactly those two values sets
 * it too: which one wins is then the axes' order, not a decision. One entry per tree, value pair and property path. */
export function axisCollisions(recipes) {
  const families = recipes?.flat ?? {}
  const collisions = []
  for (const [name, tree] of Object.entries(recipes?.trees ?? {})) {
    if (!isNode(tree)) continue
    const axes = axesOf(tree).map(([axis, values]) => [axis, Object.entries(values).map(([value, def]) => [value, propertyPaths(resolveValue(def, families))])])
    const decided = new Map()
    for (const { when, def } of withPairs(tree)) {
      const key = Object.entries(when)
        .map(([axis, value]) => `${axis}.${value}`)
        .sort()
        .join(' ')
      const paths = decided.get(key) ?? new Set()
      for (const path of propertyPaths(resolveValue(def, families)).keys()) paths.add(path)
      decided.set(key, paths)
    }
    for (const [i, [axisA, valuesA]] of axes.entries()) {
      for (const [axisB, valuesB] of axes.slice(i + 1)) {
        for (const [valueA, pathsA] of valuesA) {
          for (const [valueB, pathsB] of valuesB) {
            const values = [`${axisA}.${valueA}`, `${axisB}.${valueB}`]
            const pair = decided.get([...values].sort().join(' '))
            for (const [property, set] of pathsA) {
              if (pathsB.has(property) && pathsB.get(property) !== set && !pair?.has(property)) collisions.push({ recipe: name, values, property })
            }
          }
        }
      }
    }
  }
  return collisions
}

/** One resolved flat recipe per class a tree makes, keyed by its name (the class is `fui-<name>`), every use inlined. */
export const flattenTree = (name, tree, families = {}) => Object.fromEntries(treeEntries(name, tree, families).map((entry) => [entry.name, entry.def]))

const TREE_KEY_LIST = `${TREE_KEYS.slice(0, -1).join(', ')} and ${TREE_KEYS.at(-1)}`
/** The keys only a component tree's value may hold, which a flat recipe never carries. */
export const TREE_ONLY = Object.freeze([EXTENDS, WITH, PARTS, ...Object.keys(RING_PROPERTIES)])

/** A value's problems; a base, an axis value or a with block may override what a family it extends sets.
 * A base or an axis value may be `{}`, or hold only `with`: its class exists and sets nothing of its own; only a base holds `contain`. */
function valueProblems(at, value, families, { empty = false, base = false } = {}) {
  const bare = bareName(value)
  if (bare) return [`${at}: ${bare}`]
  const full = normalizeRecipe(value)
  if (!full) return [`${at}: a value is a block of properties, with the families it extends`]
  const problems = []
  const bad = malformedUses(value)
  if (bad.length) problems.push(`${at}.${EXTENDS}: names a family, or a list of them, not ${bad.map(String).join(', ')}`)
  const { [EXTENDS]: use = [], ...own } = full
  for (const family of use) {
    if (STATE_RECIPES.includes(family)) problems.push(`${at}.${EXTENDS}: ${family} is a shared state; a component applies it behind its variant`)
    else if (!usable(families, family)) problems.push(`${at}.${EXTENDS}: ${family} is not a flat recipe`)
    else if (ringed(families[family])) problems.push(`${at}.${EXTENDS}: ${family} colours the focus ring; a component’s own value sets it, never a family`)
  }
  if (!use.length && !Object.keys(own).length && !empty) problems.push(`${at}: a value is a block of properties, with the families it extends`)
  problems.push(...definitionProblems(own, undefined, true, base).map(({ path, message }) => `${at}.${path}: ${message}`))
  return problems
}

/** Every reason a component tree would not render as written, as `<path>: <reason>`; [] when it renders whole.
 * `families` are the flat recipes beside it, which its values may extend by name. */
export function treeProblems(name, tree, families = {}) {
  if (!isNode(tree)) return [`${name}: a component tree is a block of ${TREE_KEY_LIST}`]
  const problems = []
  for (const key of Object.keys(tree))
    if (!TREE_KEYS.includes(key) && key !== 'compounds' && key !== TREE_COMPOSES) problems.push(`${name}.${key}: not a tree key; a component tree holds ${TREE_KEY_LIST}`)
  if (Object.hasOwn(tree, TREE_COMPOSES)) {
    const listed = composesListProblems(`${name}.${TREE_COMPOSES}`, tree[TREE_COMPOSES])
    problems.push(...listed)
    if (!listed.length)
      for (const recipe of new Set(tree[TREE_COMPOSES])) if (!isNode(families[recipe]) || isTree(families[recipe])) problems.push(`${name}.${TREE_COMPOSES}: ${recipe} is not a shared recipe`)
  }
  if (tree.base !== undefined) problems.push(...valueProblems(`${name}.base`, tree.base, families, { empty: true, base: true }))
  const axes = new Map()
  if (tree.variants !== undefined && !isNode(tree.variants)) problems.push(`${name}.variants: maps each axis to an object of values`)
  for (const [axis, values] of Object.entries(isNode(tree.variants) ? tree.variants : {})) {
    if (!RECIPE_NAME.test(axis)) problems.push(`${name}.variants.${axis}: not an axis name the library accepts`)
    if (!isNode(values)) {
      problems.push(`${name}.variants.${axis}: an axis is an object of values`)
      continue
    }
    axes.set(axis, new Set(Object.keys(values)))
  }
  const withProblems = (at, def, path) => {
    if (!isNode(def) || !Object.hasOwn(def, WITH)) return
    if (!isNode(def[WITH]) || !Object.keys(def[WITH]).length) {
      problems.push(`${at}.${WITH}: maps another axis to the values the pair takes`)
      return
    }
    for (const [axis, values] of Object.entries(def[WITH])) {
      const here = `${at}.${WITH}.${axis}`
      if (axis === path.at(-1)) problems.push(`${here}: a with block names another axis, never the value’s own`)
      else if (path.includes(axis)) problems.push(`${here}: a with block names another axis, never one already on its path`)
      else if (!axes.has(axis)) problems.push(`${here}: names no axis of variants`)
      else if (!isNode(values)) problems.push(`${here}: an axis is an object of values`)
      else
        for (const [value, block] of Object.entries(values)) {
          if (!axes.get(axis).has(value)) problems.push(`${here}.${value}: names no value of variants.${axis}`)
          problems.push(...valueProblems(`${here}.${value}`, block, families, { empty: isNode(block) && isNode(block[WITH]) }))
          withProblems(`${here}.${value}`, block, [...path, axis])
        }
    }
  }
  for (const [axis, values] of Object.entries(isNode(tree.variants) ? tree.variants : {})) {
    if (!isNode(values)) continue
    for (const [value, def] of Object.entries(values)) {
      if (!RECIPE_NAME.test(value)) problems.push(`${name}.variants.${axis}.${value}: not a value name the library accepts`)
      problems.push(...valueProblems(`${name}.variants.${axis}.${value}`, def, families, { empty: true }))
      withProblems(`${name}.variants.${axis}.${value}`, def, [axis])
    }
  }
  const names = (at, when) =>
    Object.entries(when)
      .filter(([axis, value]) => !axes.get(axis)?.has(value))
      .map(([axis]) => `${name}.${at}.${axis}: names no value of variants.${axis}`)
  if (tree.keepAxis !== undefined && !Array.isArray(tree.keepAxis)) problems.push(`${name}.keepAxis: a list of values whose class keeps its axis`)
  for (const value of Array.isArray(tree.keepAxis) ? tree.keepAxis : [])
    if (![...axes.values()].some((values) => values.has(value))) problems.push(`${name}.keepAxis: ${value} names no value of variants`)
  if (tree.defaults !== undefined && !isNode(tree.defaults)) problems.push(`${name}.defaults: maps an axis to its default value`)
  if (isNode(tree.defaults)) problems.push(...names('defaults', tree.defaults))
  if (Object.hasOwn(tree, 'compounds')) problems.push(`${name}.compounds: ${COMPOUNDS_MOVED}`)
  const blocks = [...(isNode(tree.base) ? [['base', tree.base]] : []), ...valueBlocks(tree)]
  for (const [at, def] of blocks) {
    const scalars = [
      ...Object.entries(def).map(([prop, value]) => [prop, prop, value]),
      ...LAYOUT_STEPS.flatMap((step) => Object.entries(isNode(def[step]) ? def[step] : {}).map(([prop, value]) => [`${step}.${prop}`, prop, value])),
    ]
    for (const [path, prop, value] of scalars) {
      const text = typeof value === 'string' ? value.trim() : ''
      const problem = isRekaKeyword(prop, text) && rekaKeywordProblem(name, text)
      if (problem) problems.push(`${name}.${at}.${path}: ${problem}`)
    }
  }
  for (const { name: made } of treeEntries(name, tree, families)) if (Object.hasOwn(families, made)) problems.push(`${name}: its class fui-${made} is also a flat recipe’s`)
  return problems
}

/** Every reason `list` is not a composes list: a non-empty array of recipe names, each once. */
function composesListProblems(at, list) {
  if (!Array.isArray(list) || !list.length || list.some((recipe) => typeof recipe !== 'string')) return [`${at}: lists shared recipe names, and is left out when empty`]
  const problems = list.filter((recipe) => !RECIPE_NAME.test(recipe)).map((recipe) => `${at}: ${recipe} is not a recipe name: lowercase letters, digits and dashes`)
  for (const recipe of new Set(list.filter((recipe, i) => list.indexOf(recipe) !== i))) problems.push(`${at}: ${recipe} is listed twice`)
  return problems
}

/** The shared recipes an item's elements wear: each tree's `composes`, in tree order, then a top-level `composes` a stack's stored item may
 * still carry; each name once. */
export function composesOf({ recipes, composes } = {}) {
  const names = []
  for (const def of Object.values(isNode(recipes) ? recipes : {})) if (isNode(def) && Array.isArray(def[TREE_COMPOSES])) names.push(...def[TREE_COMPOSES])
  if (Array.isArray(composes)) names.push(...composes)
  return [...new Set(names.filter((name) => typeof name === 'string'))]
}

/** The keys of a tree, in the order it is written: what it composes first, then its style. */
export const TREE_KEY_ORDER = Object.freeze([TREE_COMPOSES, ...TREE_KEYS])

/** Each tree whose keys run out of {@link TREE_KEY_ORDER}, as one message per tree; keys it does not order are left out. */
export function treeOrderProblems(recipes) {
  const problems = []
  for (const [name, def] of Object.entries(isNode(recipes) ? recipes : {})) {
    if (!isNode(def)) continue
    const known = Object.keys(def).filter((key) => TREE_KEY_ORDER.includes(key))
    const expected = [...known].sort((a, b) => TREE_KEY_ORDER.indexOf(a) - TREE_KEY_ORDER.indexOf(b))
    if (known.join() !== expected.join()) problems.push(`${name}: keys run ${known.join(', ')}; a tree orders them ${expected.join(', ')}`)
  }
  return problems
}

/** A tree with its keys in {@link TREE_KEY_ORDER}, any other key after them as given. */
export function orderedTree(def) {
  if (!isNode(def)) return def
  const out = {}
  for (const key of TREE_KEY_ORDER) if (Object.hasOwn(def, key)) out[key] = def[key]
  for (const [key, value] of Object.entries(def)) if (!Object.hasOwn(out, key)) out[key] = value
  return out
}

/** The item a tree belongs to: the longest item name that is the tree's name or prefixes it, so input-group's trees are never input's. */
export function treeOwner(tree, items) {
  let owner
  for (const item of items) if ((tree === item || tree.startsWith(`${item}-`)) && item.length > (owner?.length ?? 0)) owner = item
  return owner
}

/** The part trees of each tree: every other tree whose longest owner among the rest is it (`card-header` is a part of `card`). */
export function treeParts(names) {
  const parts = Object.fromEntries(names.map((name) => [name, []]))
  for (const tree of names) {
    const owner = treeOwner(
      tree,
      names.filter((name) => name !== tree),
    )
    if (owner !== undefined) parts[owner].push(tree)
  }
  return parts
}

/** Every value and with block of a tree with its path under the tree, `variants.<axis>.<value>[.with.<axis>.<value>…]`. */
function valueBlocks(tree) {
  const blocks = []
  const walk = (at, def) => {
    if (!isNode(def)) return
    blocks.push([at, def])
    if (!isNode(def[WITH])) return
    for (const [axis, values] of Object.entries(def[WITH])) if (isNode(values)) for (const [value, block] of Object.entries(values)) walk(`${at}.${WITH}.${axis}.${value}`, block)
  }
  for (const [axis, values] of axesOf(isNode(tree) ? tree : {})) for (const [value, def] of Object.entries(values)) walk(`variants.${axis}.${value}`, def)
  return blocks
}

// `-link` stays a name (breadcrumb-link, item-link); a recipe set that writes one variable twice is refused by recipeSetProblems.
const NAMED_FOR_BLOCK = new RegExp(
  `-(?:${Object.keys(RECIPE_BLOCKS)
    .filter((block) => !Object.hasOwn(STATEFUL_PARTS, block))
    .map(kebab)
    .join('|')})$`,
)

/** Why a recipe name is refused, or null; a state or part is a block inside the value recipe, never a recipe of its own. */
export function recipeNameProblem(name) {
  if (!RECIPE_NAME.test(name)) return 'not a recipe name the library accepts'
  if (NAMED_FOR_BLOCK.test(name)) return 'states and parts live inside the value recipe, as a block named for them'
  return null
}

const TYPE_PARTS = [
  ['font-family', 'family'],
  ['font-size', 'size'],
  ['line-height', 'line-height'],
  ['font-weight', 'weight'],
  ['letter-spacing', 'tracking'],
  ['font-feature-settings', 'feature'],
  ['font-variation-settings', 'variation'],
]

function refVar(group, name) {
  if (group === 'colors') return `var(--fui-${name})`
  if (group === 'rounded') return name === 'base' ? 'var(--fui-radius)' : `var(--fui-radius-${name})`
  if (group === 'border') return `var(--fui-border-${name})`
  if (group === 'ring') return `var(--fui-ring-${name})`
  if (group === 'opacity') return `var(--fui-opacity-${name})`
  if (group === 'shadow') return `var(--fui-shadow-${name})`
  if (group === 'spacing') return name === 'px' ? '1px' : `calc(var(--fui-spacing) * ${name})`
  if (group === 'container') return `var(--container-${name})`
  if (group === 'components') {
    const dot = name.indexOf('.')
    return dot > 0 ? `var(--fui-${name.slice(0, dot)}-${kebab(name.slice(dot + 1))})` : null
  }
  return null
}

// A recipe sub-token's CSS properties, for the `@utility fui-<name>` it feeds; an extra prop
// (e.g. borderColor) falls through to its kebab-case form, already a CSS property name.
const RECIPE_PROPERTIES = {
  backgroundColor: ['background-color'],
  textColor: ['color'],
  rounded: ['border-radius'],
  shadow: ['box-shadow'],
  outline: ['outline'],
  borderStart: ['border-inline-start'],
  borderEnd: ['border-inline-end'],
  ...LAYOUT_PROPERTIES,
  ...ARRANGE_PROPERTIES,
}

/** A value's CSS, or null when it does not render; `owner` is the tree a popup keyword reads its Reka component from. */
function declarationOf(prop, value, owner) {
  if (recipeValueProblem(prop, value)) return null
  if (prop === 'translate') return translateValue(String(value).trim())
  const ref = parseRef(value)
  if (!ref && isRekaKeyword(prop, String(value).trim())) return rekaVariable(owner, prop, String(value).trim())
  if (!ref && isLayout(prop)) return LAYOUT_KEYWORDS[prop]?.[String(value).trim()] ?? null
  if (!ref) return VALUE_SETS[prop]?.[value] ?? value
  if (ref.alpha !== undefined) return `color-mix(in oklab, var(--fui-${ref.name}) ${ref.alpha}%, transparent)`
  const declaration = refVar(ref.group, ref.name)
  return declaration && isBleed(prop) ? `calc(-1 * ${declaration})` : declaration
}

/** One recipe's flat properties, or one block's under its selector; layout only where `layout` allows it, ring colours on a tree's value, `contain` on a base. */
function propertyEntries(props, block = null, { layout = false, tree = false, base = false, owner } = {}, state = null) {
  const prefix = block ? `${kebab(block)}-${state ? `${kebab(state)}-` : ''}` : ''
  const part = block ? LAYOUT_PARTS[block] : null
  const selector = !block ? null : state ? `& :where(${STATEFUL_PARTS[block]}${RECIPE_STATES[state].slice(1)})` : (part?.selector ?? RECIPE_BLOCKS[block])
  const vars = []
  for (const [prop, raw] of Object.entries(props)) {
    if (!RECIPE_KEY.test(prop) || prop === PARTS || Object.hasOwn(RECIPE_BLOCKS, prop) || Object.hasOwn(LAYOUT_PARTS, prop) || isStep(prop) || Object.hasOwn(CONTRAST_PROPERTIES, prop)) continue
    if (part ? !part.properties.includes(prop) : Object.hasOwn(LAYOUT_PROPERTIES, prop) && (block || !layout)) continue
    if (Object.hasOwn(RING_PROPERTIES, prop) && (block || !tree)) continue
    if (Object.hasOwn(HIDE_PROPERTIES, prop) && block) continue
    if (prop === CONTAIN) {
      if (base && !block && CONTAIN_VALUES.includes(raw)) vars.push({ suffix: CONTAIN, declaration: raw, properties: CONTAIN_PROPERTIES })
      continue
    }
    if (block ? reachesInsidePart(block, prop) : collidingBlock(prop)) continue
    const value = typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw.trim() : ''
    if (!value) continue
    const ref = parseRef(value)
    if (prop === 'typography' && ref?.group === 'typography' && !ref.problem) {
      for (const [typePart, token] of TYPE_PARTS) {
        const nested = selector ? { nested: { selector, properties: [typePart] } } : { properties: [typePart] }
        vars.push({ suffix: `${prefix}${typePart}`, declaration: `var(--fui-text-${ref.name}-${token})`, typed: true, ...nested })
      }
      continue
    }
    if (prop === 'outline' && ref?.group === 'ring' && !ref.problem) {
      for (const [property, declaration] of [
        ['outline', refVar('ring', ref.name)],
        ['outline-offset', `var(--fui-ring-${ref.name}-offset)`],
      ]) {
        const where = selector ? { nested: { selector, properties: [property] } } : { properties: [property] }
        vars.push({ suffix: `${prefix}${property}`, declaration, shorthand: true, ...where })
      }
      continue
    }
    const declaration = declarationOf(prop, value, owner)
    if (!declaration) continue
    if (isRekaKeyword(prop, value)) {
      vars.push({ suffix: kebab(prop), declaration, properties: RECIPE_PROPERTIES[prop], local: true })
      continue
    }
    const hide = HIDE_PROPERTIES[prop]
    if (hide) {
      vars.push({ suffix: kebab(prop), declaration, properties: hide.properties, nested: hide.nested })
      continue
    }
    const own = RECIPE_NESTED_PROPERTIES[prop]
    const properties = own?.properties ?? RECIPE_PROPERTIES[prop] ?? (RING_PROPERTIES[prop] ? [RING_PROPERTIES[prop]] : [kebab(prop)])
    const nested = selector ? { selector: own ? `${selector}${own.selector.slice(1)}` : selector, properties } : own ? { selector: own.selector, properties } : null
    vars.push({ suffix: `${prefix}${kebab(prop)}`, declaration, ...(nested ? { nested } : { properties }) })
  }
  // An explicit property takes the slot of the typography part it names, whatever the key order.
  const typed = new Map(vars.filter((v) => v.typed).map((v) => [v.suffix, v]))
  // The ring shorthand resets outline-color, so it comes before any colour the recipe sets on the outline.
  return [...vars.filter((v) => v.shorthand), ...vars.filter((v) => !v.shorthand)]
    .filter((v) => {
      const part = !v.typed && typed.get(v.suffix)
      if (part) part.declaration = v.declaration
      return !part
    })
    .map(({ typed: _, shorthand: __, ...v }) => v)
}

/** A step's layout properties, each rendering inside the step's container query; `media` carries the step key. */
function stepEntries(props, step, owner) {
  return Object.entries(props).flatMap(([prop, raw]) => {
    const value = typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw.trim() : ''
    const declaration = isStepped(prop) && value ? declarationOf(prop, value, owner) : null
    const local = isRekaKeyword(prop, value) ? { local: true } : {}
    return declaration ? [{ suffix: `${stepName(step)}-${kebab(prop)}`, declaration, media: step, properties: steppedCss(prop), ...local }] : []
  })
}

/** A value's parts block as the variables it writes: each a part's base variable set to the value's own, with no property of its own. */
function partEntries(parts, names) {
  if (!isNode(parts)) return []
  return Object.entries(parts).flatMap(([part, block]) => {
    if (!names.includes(part) || !isNode(block)) return []
    return Object.entries(block).flatMap(([prop, raw]) => {
      const value = typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw.trim() : ''
      const declaration = isLayout(prop) && value ? declarationOf(prop, value) : null
      return declaration ? [{ suffix: `${part}-${kebab(prop)}`, declaration, properties: [], part, partSuffix: kebab(prop) }] : []
    })
  })
}

/** One recipe's sub-tokens as `{ suffix, declaration, properties | nested, media?, part?, local? }`, its state and part blocks nested under their selector,
 * its steps under their container width, its parts block as the part variables it redeclares where `options.parts` names the tree's parts. */
function recipeVarsOf(props, options) {
  const vars = propertyEntries(props, null, options)
  for (const block of Object.keys(RECIPE_BLOCKS)) {
    if (!isNode(props[block])) continue
    vars.push(...propertyEntries(props[block], block, options))
    if (Object.hasOwn(STATEFUL_PARTS, block)) for (const state of Object.keys(RECIPE_STATES)) if (isNode(props[block][state])) vars.push(...propertyEntries(props[block][state], block, options, state))
  }
  if (options.layout) {
    for (const part of Object.keys(LAYOUT_PARTS)) if (isNode(props[part])) vars.push(...propertyEntries(props[part], part, options))
    if (options.parts && !options.base) vars.push(...partEntries(props[PARTS], options.parts))
    for (const step of LAYOUT_STEPS) if (isNode(props[step])) vars.push(...stepEntries(props[step], step, options.owner))
  }
  return vars
}

/** Every class the recipes make, flat recipes first, then each tree's classes resolved from the families it uses,
 * each with the layer it sorts in, feeding the `@utility fui-<name>` it declares. */
export function recipeEntries(recipes = {}) {
  const shape = Object.keys(recipes).find((key) => !['flat', 'trees', 'paths', 'problems'].includes(key))
  if (shape !== undefined) throw new Error(`renderBaseCss takes { flat, trees }, as readRecipeFiles returns them; "${shape}" is neither`)
  const { flat = {}, trees = {} } = recipes
  const result = []
  // A `use` key in a value or any block of it; an axis or a value may be named use.
  const blockUsesUse = (def) =>
    isNode(def) &&
    (Object.hasOwn(def, 'use') ||
      Object.entries(def).some(([key, inner]) =>
        key === WITH ? isNode(inner) && Object.values(inner).some((values) => isNode(values) && Object.values(values).some(blockUsesUse)) : blockUsesUse(inner),
      ))
  const treeUsesUse = (tree) =>
    isNode(tree) && (blockUsesUse(tree.base) || (isNode(tree.variants) && Object.values(tree.variants).some((values) => isNode(values) && Object.values(values).some(blockUsesUse))))
  // The first value of a tree written as a bare name or list, in base, an axis value or a with block.
  const bareIn = (def) =>
    bareName(def) ??
    (isNode(def) && isNode(def[WITH])
      ? Object.values(def[WITH])
          .flatMap((values) => (isNode(values) ? Object.values(values) : []))
          .map(bareIn)
          .find(Boolean)
      : null)
  const treeBare = (tree) =>
    isNode(tree)
      ? (bareIn(tree.base) ??
        Object.values(isNode(tree.variants) ? tree.variants : {})
          .flatMap((values) => (isNode(values) ? Object.values(values) : []))
          .map(bareIn)
          .find(Boolean))
      : null
  for (const [recipe, props] of Object.entries(flat)) if (blockUsesUse(props)) throw new Error(`recipe ${recipe}: ${USE_MOVED}`)
  for (const [recipe, tree] of Object.entries(trees)) {
    if (treeUsesUse(tree)) throw new Error(`recipe ${recipe}: ${USE_MOVED}`)
    const bare = treeBare(tree)
    if (bare) throw new Error(`recipe ${recipe}: ${bare}`)
  }
  for (const [recipe, props] of Object.entries(flat)) {
    if (!isNode(props)) throw new Error(`recipe ${recipe}: neither a flat recipe nor a component tree`)
    const treeOnly = Object.keys(props).find((key) => TREE_ONLY.includes(key))
    if (treeOnly) throw new Error(`recipe ${recipe}: ${treeOnly} belongs to a component tree’s value; a flat recipe never carries it`)
    if (!RECIPE_KEY.test(recipe)) continue
    const vars = recipeVarsOf(props, { layout: familyLayout(recipe, props), tree: false })
    if (vars.length) result.push({ recipe, layer: 'base', vars })
  }
  const parts = treeParts(Object.keys(trees))
  const bases = new Map()
  const overrides = new Map()
  for (const [name, tree] of Object.entries(trees)) {
    if (!RECIPE_KEY.test(name)) continue
    if (isNode(tree) && Object.hasOwn(tree, 'compounds')) throw new Error(`recipe ${name}: ${COMPOUNDS_MOVED}`)
    for (const { name: recipe, layer, layout, def, ...pair } of treeEntries(name, tree, flat)) {
      if (!RECIPE_KEY.test(recipe)) continue
      const entry = { recipe, layer, vars: recipeVarsOf(def, { layout, tree: true, base: layer === 'base', parts: parts[name], owner: name }), ...pair }
      result.push(entry)
      if (layer === 'base') bases.set(name, entry)
      for (const { part, partSuffix } of entry.vars) if (part) overrides.set(`${name}\0${part}\0${partSuffix}`, { tree: name, part, partSuffix })
    }
  }
  // A part variable a value overrides inherits into a nested tree of the same kind, so the base utility starts every tree
  // at the part's own base declaration; the value's override on the same element then wins by the layer order.
  for (const { tree, part, partSuffix } of overrides.values()) {
    const own = bases.get(part)?.vars.find((v) => v.suffix === partSuffix && !v.media && !v.part && v.properties)
    if (own && bases.has(tree)) bases.get(tree).vars.push({ declaration: own.declaration, properties: [], part, partSuffix, reset: true })
  }
  return result
}

/** A property a table types: a keyword set, a token group, a colour, layout, a hide enum, translate, contain or the focus ring's colour.
 * Its value is checked against the table, and an editor can offer what the table lists. */
export const isTypedProperty = (prop) =>
  Object.hasOwn(VALUE_SETS, prop) ||
  Object.hasOwn(PROPERTY_GROUP, prop) ||
  isColorProperty(prop) ||
  Object.hasOwn(HIDE_PROPERTIES, prop) ||
  isLayout(prop) ||
  prop === 'translate' ||
  prop === CONTAIN ||
  Object.hasOwn(RING_PROPERTIES, prop) ||
  Object.hasOwn(CONTRAST_PROPERTIES, prop)

const STRUCTURE = new Set(['defaults', EXTENDS, 'keepAxis'])
/** Each untyped property the recipes set, as `<path>: <reason>`. It renders as written; a refused one is a problem, never a warning. */
export function designWarnings(recipes = {}) {
  const { flat = {}, trees = {} } = isNode(recipes) ? recipes : {}
  const warnings = []
  const walk = (node, at) => {
    for (const [key, value] of Object.entries(node)) {
      if (STRUCTURE.has(key)) continue
      if (isNode(value)) walk(value, `${at}.${key}`)
      else if (isScalar(value) && !isTypedProperty(key) && !Object.hasOwn(REFUSED_PROPERTIES, key))
        warnings.push(`${at}.${key}: ${key} is not a typed recipe property; it renders as written, with no check on its value`)
    }
  }
  for (const [name, def] of [...Object.entries(flat), ...Object.entries(trees)]) if (isNode(def)) walk(def, name)
  return warnings
}

/** Every reason the recipes would not render as written, as `<path>: <reason>`: each flat recipe's, each tree's, then the set's. */
export function designProblems(recipes = {}) {
  const { flat = {}, trees = {} } = isNode(recipes) ? recipes : {}
  return [
    ...Object.entries(flat).flatMap(([name, def]) => recipeProblems(def, name).map(({ path, message }) => `${path ? `${name}.${path}` : name}: ${message}`)),
    ...Object.entries(trees).flatMap(([name, tree]) => treeProblems(name, tree, flat)),
    ...recipeSetProblems({ flat, trees }),
  ]
}

/** Every reason a whole set of recipes would not render as written, across recipes: two making one class, two classes
 * writing one variable, a pair written under both of its values, a parts block naming no part of its tree or a property the part's base
 * does not set. [] when every class and variable is its own. */
export function recipeSetProblems(recipes = {}) {
  const { flat = {}, trees = {} } = isNode(recipes) ? recipes : {}
  const problems = []
  const parts = treeParts(Object.keys(trees))
  for (const [name, tree] of Object.entries(trees)) {
    const own = parts[name]
    const listed = own.length ? `${name} lists ${own.join(', ')}` : `${name} lists no part`
    for (const [at, def] of valueBlocks(tree)) {
      if (!isNode(def[PARTS])) continue
      for (const part of Object.keys(def[PARTS])) if (!own.includes(part)) problems.push(`${name}.${at}.${PARTS}.${part}: not a layout part of ${name}; ${listed}`)
    }
  }
  const classes = new Map()
  const claim = (made, by) => {
    const first = classes.get(made)
    if (first === undefined) classes.set(made, by)
    else problems.push(`${by}: makes fui-${made}, which ${first} makes too`)
  }
  for (const name of Object.keys(flat)) claim(name, name)
  for (const [name, tree] of Object.entries(trees)) {
    const pairs = new Set()
    for (const { name: made, layer, when } of treeEntries(name, tree, flat)) {
      if (layer !== 'compound') claim(made, name)
      else if (pairs.has(made)) problems.push(`${name}: the pair ${Object.values(when).join(' + ')} is written under both values; write it once`)
      else pairs.add(made)
    }
  }
  let entries
  try {
    entries = recipeEntries({ flat, trees })
  } catch (error) {
    return [...problems, error.message]
  }
  const partBases = new Map(entries.filter(({ layer }) => layer === 'base').map(({ recipe, vars }) => [recipe, new Set(vars.filter((v) => !v.media && !v.part && v.properties).map((v) => v.suffix))]))
  for (const [name, tree] of Object.entries(trees)) {
    for (const [at, def] of valueBlocks(tree)) {
      if (!isNode(def[PARTS])) continue
      for (const [part, block] of Object.entries(def[PARTS])) {
        if (!parts[name].includes(part) || !isNode(block)) continue
        for (const prop of Object.keys(block)) if (isLayout(prop) && !partBases.get(part)?.has(kebab(prop))) problems.push(`${name}.${at}.${PARTS}.${part}.${prop}: ${part}’s base sets no ${prop}`)
      }
    }
  }
  const variables = new Map()
  for (const { recipe, vars } of entries) {
    for (const suffix of new Set(vars.filter((v) => !v.reset).map((v) => v.suffix))) {
      const variable = `--fui-${recipe}-${suffix}`
      const first = variables.get(variable)
      if (first === undefined) variables.set(variable, recipe)
      else if (first !== recipe) problems.push(`fui-${recipe}: writes ${variable}, which fui-${first} writes too; rename one`)
    }
  }
  return problems
}

/** The breakpoints a text style may step at. */
export const TEXT_STEPS = Object.freeze(['md'])

const UNITS = ['px', 'rem']
const FONT_SIZE_ALIAS = /^\{font\.size\.([a-z0-9-]+)\}$/i

const stepFontSize = (v) => {
  if (isNode(v)) return Number.isFinite(v.value) && UNITS.includes(v.unit) ? `${v.value}${v.unit}` : ''
  const alias = typeof v === 'string' ? FONT_SIZE_ALIAS.exec(v.trim()) : null
  if (alias) return `var(--fui-text-${alias[1]})`
  return typeof v === 'string' && SAFE_VALUE.test(v) ? v.trim() : ''
}
const stepLineHeight = (v) => (Number.isFinite(v) ? String(v) : typeof v === 'string' && SAFE_VALUE.test(v) ? v.trim() : '')

/** One text style's `steps` as CSS values per breakpoint, and the problems that keep a step out. */
export function textStepValues(name, steps) {
  const values = {}
  const problems = []
  if (steps === undefined) return { values, problems }
  if (!isNode(steps)) return { values, problems: [`text style ${name}: steps maps a breakpoint to { fontSize, lineHeight }`] }
  for (const [at, step] of Object.entries(steps)) {
    if (!TEXT_STEPS.includes(at)) {
      problems.push(`text style ${name}: a step at ${at}; only md steps, at the brand’s md breakpoint`)
      continue
    }
    if (!isNode(step)) {
      problems.push(`text style ${name}: steps.${at} is { fontSize, lineHeight }`)
      continue
    }
    const value = {}
    for (const key of Object.keys(step)) {
      if (key !== 'fontSize' && key !== 'lineHeight') problems.push(`text style ${name}: steps.${at}.${key} is not a step property; a step sets fontSize and lineHeight`)
    }
    if (step.fontSize !== undefined) {
      value.fontSize = stepFontSize(step.fontSize)
      if (!value.fontSize) problems.push(`text style ${name}: steps.${at}.fontSize is a dimension, as { value, unit: px | rem }`)
    }
    if (step.lineHeight !== undefined) {
      value.lineHeight = stepLineHeight(step.lineHeight)
      if (!value.lineHeight) problems.push(`text style ${name}: steps.${at}.lineHeight is a number or a CSS length`)
    }
    if (step.fontSize === undefined && step.lineHeight === undefined && !Object.keys(step).length) problems.push(`text style ${name}: steps.${at} sets fontSize, lineHeight or both`)
    values[at] = value
  }
  return { values, problems }
}

/** Every problem in a brand's text group's steps; a library save reports them, the brand build refuses them. */
export function textStepProblems(text) {
  if (!isNode(text)) return []
  return Object.entries(text)
    .filter(([name, style]) => !name.startsWith('$') && isNode(style))
    .flatMap(([name, style]) => {
      const notes = isNode(style.$extensions) && isNode(style.$extensions['com.frontic.brand']) ? style.$extensions['com.frontic.brand'] : {}
      return textStepValues(name, notes.steps).problems
    })
}
