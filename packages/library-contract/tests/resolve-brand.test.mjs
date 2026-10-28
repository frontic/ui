import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { brandContrastProblems, brandOpacityProblems, brandReferenceProblems, HOVERED, renderBaseCss, resolveBrand, stylePresetPath, withBrandStyles } from '../src/brand.mjs'
import { recipeContrast } from '../src/contrast.mjs'

const preset = () => resolveBrand(JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))).brand
const isToken = (v) => typeof v === 'object' && v !== null && Object.hasOwn(v, '$value')
const tokensOf = (group) => Object.entries(group).filter(([name, v]) => !name.startsWith('$') && isToken(v))

/** A resolver stress fixture, not an example of authoring: the default brand with every colour that repeats an earlier one's hex written as a
 * reference to that earlier one, so repeats chain (sideways as often as not), and every text style whose size is a font size written as a
 * reference to it. Its plain twin is the default brand resolved. */
function aliased() {
  const brand = preset()
  const seen = new Map()
  let references = 0
  for (const [group, entries] of Object.entries(brand.color)) {
    if (group.startsWith('$')) continue
    for (const [name, token] of tokensOf(entries)) {
      const hex = token.$value.hex
      if (seen.has(hex)) {
        token.$value = `{${seen.get(hex)}}`
        references++
      }
      seen.set(hex, `color.${group}.${name}`)
    }
  }
  const sizes = tokensOf(brand.font.size)
  for (const [, style] of tokensOf(brand.text)) {
    const size = sizes.find(([, t]) => JSON.stringify(t.$value) === JSON.stringify(style.$value.fontSize))
    if (size) {
      style.$value.fontSize = `{font.size.${size[0]}}`
      references++
    }
  }
  return { brand, references }
}

// The hovers the contract derives, which it writes as plain colours whether their base is a reference or not.
const hovers = (tokens) =>
  Object.fromEntries(
    Object.entries(withBrandStyles(tokens).color).flatMap(([group, entries]) =>
      group.startsWith('$') ? [] : tokensOf(entries).flatMap(([name, t]) => (t.$extensions?.['com.frontic.brand']?.derived ? [[`${group}.${name}`, t.$value.hex]] : [])),
    ),
  )

describe('resolveBrand', () => {
  it('resolves an aliased brand to its plain twin, and leaves the brand it is given as written', () => {
    const { brand, references } = aliased()
    const written = JSON.stringify(brand)
    expect(references).toBeGreaterThanOrEqual(25)
    const { brand: resolved, problems } = resolveBrand(brand)
    expect(problems).toEqual([])
    expect(resolved).toEqual(resolveBrand(preset()).brand)
    expect(JSON.stringify(brand)).toBe(written)
  })

  it('resolves a reference to its target, through a chain, across groups', () => {
    const brand = preset()
    brand.color.edge.input = { $value: '{color.edge.border}' }
    brand.color.edge.border = { $value: '{color.action.primary}' }
    brand.color.commerce.checkout = { $value: '{color.edge.input}' }
    const { brand: out, problems } = resolveBrand(brand)
    expect(problems).toEqual([])
    for (const path of ['edge.input', 'edge.border', 'commerce.checkout']) expect(out.color[path.split('.')[0]][path.split('.')[1]].$value).toEqual(preset().color.action.primary.$value)
  })

  it('resolves a reference in a composite: a border’s colour, a shadow layer’s, a text style’s size and family', () => {
    const brand = preset()
    brand.shadow.sm.$value[0].color = '{color.surface.foreground}'
    brand.text.body.$value.fontFamily = '{font.family.sans}'
    const { brand: out, problems } = resolveBrand(brand)
    expect(problems).toEqual([])
    expect(out.border.default.$value.color).toEqual(preset().color.edge.border.$value)
    expect(out.shadow.sm.$value[0].color).toEqual(preset().color.surface.foreground.$value)
    expect(out.text.body.$value.fontFamily).toEqual(preset().font.family.sans.$value)
  })

  it('reports a missing target at the path that names it, and keeps the reference as written', () => {
    const brand = preset()
    brand.color.edge.border = { $value: '{color.edge.nope}' }
    const { brand: out, problems } = resolveBrand(brand)
    expect(problems).toEqual([{ path: 'color.edge.border', kind: 'missing', target: 'color.edge.nope' }])
    expect(out.color.edge.border.$value).toBe('{color.edge.nope}')
  })

  it('reports the root cause only, not every reference downstream of it', () => {
    const brand = preset()
    brand.color.edge.input = { $value: '{color.edge.border}' }
    brand.color.edge.border = { $value: '{color.edge.nope}' }
    brand.border.default.$value.color = '{color.edge.border}'
    const { brand: out, problems } = resolveBrand(brand)
    // border.default's colour names edge.border too, and stays as written with it.
    expect(problems).toEqual([{ path: 'color.edge.border', kind: 'missing', target: 'color.edge.nope' }])
    expect(out.color.edge.input.$value).toBe('{color.edge.border}')
    expect(out.border.default.$value.color).toBe('{color.edge.border}')
  })

  it('reports a token that names itself as a cycle', () => {
    const brand = preset()
    brand.color.edge.border = { $value: '{color.edge.border}' }
    expect(resolveBrand(brand).problems).toEqual([{ path: 'color.edge.border', kind: 'cycle', target: 'color.edge.border' }])
  })

  it('reports every reference on a loop as a cycle, once each, and none that only leads into it', () => {
    const brand = preset()
    brand.color.edge.border = { $value: '{color.edge.input}' }
    brand.color.edge.input = { $value: '{color.edge.ring}' }
    brand.color.edge.ring = { $value: '{color.edge.border}' }
    brand.color.action.secondary = { $value: '{color.edge.ring}' }
    const { problems } = resolveBrand(brand)
    expect(problems.toSorted((a, b) => a.path.localeCompare(b.path))).toEqual([
      { path: 'color.edge.border', kind: 'cycle', target: 'color.edge.input' },
      { path: 'color.edge.input', kind: 'cycle', target: 'color.edge.ring' },
      { path: 'color.edge.ring', kind: 'cycle', target: 'color.edge.border' },
    ])
  })

  it('reports a colour that names a token of another type, by the $type its group gives', () => {
    const brand = preset()
    brand.color.edge.border = { $value: '{radius.lg}' }
    brand.shadow.sm.$value[0].color = '{font.size.base}'
    const { brand: out, problems } = resolveBrand(brand)
    expect(problems).toEqual([
      { path: 'color.edge.border', kind: 'type', target: 'radius.lg' },
      { path: 'shadow.sm.0.color', kind: 'type', target: 'font.size.base' },
    ])
    expect(out.color.edge.border.$value).toBe('{radius.lg}')
  })

  it('reports a dimension slot that names a colour, and a border that names a dimension', () => {
    const brand = preset()
    brand.font.size.lg = { $value: '{color.action.primary}' }
    brand.ring.focus.$value.offset = '{color.edge.ring}'
    brand.border.default.$value.color = '{font.size.base}'
    expect(resolveBrand(brand).problems).toEqual([
      { path: 'font.size.lg', kind: 'type', target: 'color.action.primary' },
      { path: 'border.default.color', kind: 'type', target: 'font.size.base' },
      { path: 'ring.focus.offset', kind: 'type', target: 'color.edge.ring' },
    ])
  })

  it('reads a reference with an underscore or a single segment, as the stack does', () => {
    const brand = preset()
    brand.text_ink = { $type: 'color', $value: preset().color.surface.foreground.$value }
    brand.color.surface.foreground = { $value: '{text_ink}' }
    brand.color.edge.ring = { $value: '{color.surface.foreground}' }
    const { brand: out, problems } = resolveBrand(brand)
    expect(problems).toEqual([])
    expect(out.color.edge.ring.$value).toEqual(preset().color.surface.foreground.$value)
    expect(resolveBrand({ color: { $type: 'color', ink: { $value: '{no_such}' } } }).problems).toEqual([{ path: 'color.ink', kind: 'missing', target: 'no_such' }])
  })

  it('takes a reference’s type from its target when neither it nor its groups declare one', () => {
    const brand = preset()
    brand.alias = { ink: { $value: '{color.surface.foreground}' }, gap: { $value: '{radius.lg}' } }
    brand.color.edge.border = { $value: '{alias.ink}' }
    brand.color.edge.input = { $value: '{alias.gap}' }
    expect(resolveBrand(brand).problems).toEqual([{ path: 'color.edge.input', kind: 'type', target: 'alias.gap' }])
  })

  it('takes plain values, a non-brand and a reactive-style proxy as they are', () => {
    const plain = { color: { $type: 'color', surface: { background: preset().color.surface.background } }, radius: { lg: { $value: { value: 8, unit: 'px' } } } }
    expect(resolveBrand(plain)).toEqual({ brand: plain, problems: [] })
    for (const doc of [null, undefined, 'x', []]) expect(resolveBrand(doc)).toEqual({ brand: {}, problems: [] })
    const brand = preset()
    brand.color.edge.border = { $value: '{color.action.primary}' }
    const proxy = new Proxy(brand, {})
    expect(resolveBrand(proxy).brand.color.edge.border.$value).toEqual(preset().color.action.primary.$value)
  })
})

describe('a brand that writes references reads like its plain twin', () => {
  it('derives the same hover for a role written as a colour, and gives a role written as a reference the hover of the role it names', () => {
    const { brand } = aliased()
    const plain = hovers(preset())
    const styled = withBrandStyles(brand).color
    const resolved = resolveBrand(withBrandStyles(brand)).brand.color
    const derived = Object.entries(styled).flatMap(([group, entries]) =>
      group.startsWith('$')
        ? []
        : tokensOf(entries)
            .filter(([, t]) => t.$extensions?.['com.frontic.brand']?.derived)
            .map(([name, t]) => [group, name, t.$value]),
    )
    const followed = derived.filter(([, , value]) => typeof value === 'string')
    expect(followed.length).toBeGreaterThanOrEqual(1)
    for (const [group, name, value] of followed) {
      const [, targetGroup, target] = value.match(/^\{color\.([a-z]+)\.([a-z-]+)-hover\}$/)
      expect(brand.color[group][name.replace(/-hover$/, '')].$value).toBe(`{color.${targetGroup}.${target}}`)
      expect(resolved[group][name].$value).toEqual(resolved[targetGroup][`${target}-hover`].$value)
    }
    for (const [group, name, value] of derived.filter(([, , value]) => typeof value !== 'string')) expect(value.hex).toBe(plain[`${group}.${name}`])
    expect(derived.map(([group, name]) => `${group}.${name}`).sort()).toEqual(Object.keys(plain).sort())
  })

  it('reports the same contrast problems', () => {
    const plain = brandContrastProblems(preset(), { text: 7 })
    expect(plain.length).toBeGreaterThan(0)
    expect(brandContrastProblems(aliased().brand, { text: 7 })).toEqual(plain)
  })

  it('measures recipe colours and text sizes the same', () => {
    const recipes = {
      flat: {
        note: { textColor: '{colors.popover-foreground}', backgroundColor: '{colors.popover}' },
        chip: { textColor: '{colors.active-foreground}', backgroundColor: '{colors.active}' },
        sale: { textColor: '{colors.discount-foreground}', backgroundColor: '{colors.discount}', typography: '{typography.display}' },
        hint: { textColor: '{colors.muted-foreground}', backgroundColor: '{colors.accent}', hover: { backgroundColor: '{colors.accent-hover}' } },
      },
      trees: {},
    }
    const plain = recipeContrast(recipes, preset())
    expect(plain.length).toBeGreaterThanOrEqual(4)
    expect(recipeContrast(recipes, aliased().brand)).toEqual(plain)
  })

  it('measures a recipe colour with an alpha on a role the brand writes as a reference the same', () => {
    const recipes = { flat: { tint: { textColor: '{colors.foreground}', backgroundColor: '{colors.active/20}' } }, trees: {} }
    const plain = recipeContrast(recipes, preset())
    expect(plain).toHaveLength(1)
    expect(aliased().brand.color.action.active.$value).toBe('{color.action.primary}')
    expect(recipeContrast(recipes, aliased().brand)).toEqual(plain)
    expect(renderBaseCss(aliased().brand, recipes)).toMatch(/--fui-active: var\(--fui-primary\);/)
  })

  it('reads an aliased opacity as the number it names', () => {
    const brand = preset()
    brand.opacity.faint = { $value: '{opacity.50}' }
    expect(brandOpacityProblems(brand)).toEqual([])
  })
})

describe('the stylesheet of a brand that writes references', () => {
  it('keeps a var() for each reference a var can carry, derives hovers from the resolved base, and leaves no reference in a declaration', () => {
    const { brand } = aliased()
    const css = renderBaseCss(brand)
    expect(css).toMatch(/--fui-popover: var\(--fui-background\);/)
    expect(css).toMatch(/--fui-text-body-size: var\(--fui-text-base\);/)
    const declared = (text) => [...text.matchAll(/--fui-([a-z-]+-hover): /g)].map(([, name]) => name).sort()
    expect(declared(css)).toEqual(declared(renderBaseCss(preset())))
    expect(css).not.toMatch(/: [^;]*\{[a-z]/)
  })

  it('carries a font family, weight or colour reference as a var, and writes the value of one no var can carry', () => {
    const brand = preset()
    brand.font.family.mono = { $value: '{font.family.sans}' }
    brand.font.weight.bold = { $value: '{font.weight.semibold}' }
    brand.text.body.$value.fontWeight = '{font.weight.medium}'
    brand.text.body.$value.lineHeight = '{opacity.50}'
    brand.color.tone = { 'tone-1': preset().color.action.primary }
    brand.color.surface.popover = { $value: '{color.tone.tone-1}' }
    brand.opacity.faint = { $value: '{opacity.50}' }
    brand.breakpoint.wide = { $value: '{breakpoint.xl}' }
    const css = renderBaseCss(brand)
    expect(css).toMatch(/--fui-font-mono: var\(--fui-font-sans\);/)
    expect(css).toMatch(/--fui-font-weight-bold: var\(--fui-font-weight-semibold\);/)
    expect(css).toMatch(/--fui-text-body-weight: var\(--fui-font-weight-medium\);/)
    expect(css).toMatch(/--fui-text-body-line-height: 50;/)
    expect(css).toMatch(/--fui-popover: var\(--fui-tone-1\);/)
    expect(css).toMatch(/--fui-opacity-faint: 0\.5;/)
    expect(css).toMatch(new RegExp(`--breakpoint-wide: ${css.match(/--breakpoint-xl: ([^;]+);/)[1]};`))
    expect(css).not.toMatch(/: [^;]*\{[a-z]/)
  })

  it('is valid for an aliased brand with every kind of reference: none left, and every var() a property the stylesheet defines', () => {
    const { brand } = aliased()
    brand.color.tone = { 'tone-1': { $value: '{color.action.primary}' } }
    brand.color.accent.muted = { $value: '{color.tone.tone-1}' }
    brand.font.family.mono = { $value: '{font.family.sans}' }
    brand.font.weight.bold = { $value: '{font.weight.semibold}' }
    brand.text.body.$value.fontWeight = '{font.weight.medium}'
    brand.text.body.$value.lineHeight = '{opacity.50}'
    brand.radius.base = { $value: '{radius.lg}' }
    brand.opacity.faint = { $value: '{opacity.50}' }
    brand.breakpoint.wide = { $value: '{breakpoint.xl}' }
    brand.shadow.sm.$value[0].color = '{color.surface.foreground}'
    brand.ring.focus.$value.offset = '{radius.sm}'
    for (const scope of ['experience', 'root', 'project']) {
      const css = renderBaseCss(brand, {}, { scope })
      expect(css).not.toMatch(/\{[a-z0-9_.-]+\}/i)
      const defined = new Set([...css.matchAll(/(--[a-z0-9-]+):/gi)].map(([, name]) => name))
      const used = new Set([...css.matchAll(/var\((--fui-[a-z0-9-]+)/gi)].map(([, name]) => name))
      expect([...used].filter((name) => !defined.has(name))).toEqual([])
      expect([...css.matchAll(/(--[a-z0-9-]+):([^;]*);/gi)].filter(([, name, value]) => value.includes(`var(${name})`)).map(([line]) => line)).toEqual([])
    }
  })

  it('refuses a brand whose references do not resolve, every one listed at its path', () => {
    const brand = preset()
    brand.color.edge.border = { $value: '{color.edge.nope}' }
    brand.font.weight.bold = { $value: '{font.weight.bold}' }
    expect(() => renderBaseCss(brand)).toThrow('color.edge.border: {color.edge.nope}, which is no token\nfont.weight.bold: {font.weight.bold}, which leads back to it')
  })

  it('refuses a reference to a hover the contract derives, which is no token in brand.json, and says to write it there', () => {
    const brand = preset()
    brand.color.action.primary = { $value: '{color.status.destructive-hover}' }
    expect(brandReferenceProblems(brand)).toEqual([{ path: 'color.action.primary', kind: 'missing', target: 'color.status.destructive-hover' }])
    expect(() => renderBaseCss(brand)).toThrow("color.action.primary: {color.status.destructive-hover}, which is no token; a derived hover can't be referenced, write it in brand.json")
    expect(brandReferenceProblems({ color: { $type: 'color', surface: { background: preset().color.surface.background } } })).toEqual([])
  })

  it('refuses a reference to another colour of the same name, whose var() would name the property it declares', () => {
    const brand = preset()
    brand.color.brand = { primary: preset().color.action.primary }
    brand.color.action.primary = { $value: '{color.brand.primary}' }
    expect(() => renderBaseCss(brand)).toThrow('color.action.primary, color.brand.primary: both declare --fui-primary')
  })

  it('writes the value of a reference to a colour the stylesheet declares no property for, deeper than a group and its role', () => {
    const brand = preset()
    brand.color.palette = { blue: { 500: { $value: preset().color.status.info.$value } } }
    brand.color.action.secondary = { $value: '{color.palette.blue.500}' }
    const css = renderBaseCss(brand)
    expect(css).toMatch(new RegExp(`--fui-secondary: ${preset().color.status.info.$value.hex};`))
    expect(css).not.toMatch(/var\(--fui-500\)/)
  })

  it('trims padding outside a reference, reports braces around anything but one, and refuses a declaration that would still hold one', () => {
    const brand = preset()
    brand.color.edge.ring = { $value: '{ color.edge.border }' }
    brand.color.edge.input = { $value: '{color.brand blue}' }
    brand.color.edge.border = { $value: ' {color.surface.foreground} ' }
    expect(resolveBrand(brand).problems).toEqual([
      { path: 'color.edge.input', kind: 'missing', target: '{color.brand blue}' },
      { path: 'color.edge.ring', kind: 'missing', target: '{ color.edge.border }' },
    ])
    expect(resolveBrand(brand).brand.color.edge.border.$value).toEqual(preset().color.surface.foreground.$value)
    expect(() => renderBaseCss(brand)).toThrow('color.edge.ring: { color.edge.border }, which is no token')
    const raw = preset()
    raw.radius.lg.$extensions = { 'com.frontic.brand': { raw: '{radius.base}' } }
    expect(() => renderBaseCss(raw)).toThrow('--fui-radius-lg: {radius.base};')
  })

  it('renders a logo whose URL holds a brace, and still refuses a brace in a token value', () => {
    const svg = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><style>.a{fill:red}</style></svg>"
    const brand = { ...preset(), $extensions: { 'com.frontic.brand': { logo: { mark: svg } } } }
    expect(renderBaseCss(brand)).toContain(`--fui-logo-mark: url('${svg}');`)
    brand.radius.lg.$extensions = { 'com.frontic.brand': { raw: 'calc({radius.base} * 2)' } }
    expect(() => renderBaseCss(brand)).toThrow('--fui-radius-lg: calc({radius.base} * 2);')
  })

  it('resolves a deep, branching chain that ends in a missing token in linear time', () => {
    const depth = 30
    const brand = { chain: Object.fromEntries(Array.from({ length: depth }, (_, i) => [`n${i}`, { $value: { a: `{chain.n${i + 1}}`, b: `{chain.n${i + 1}}` } }])) }
    const start = performance.now()
    const { problems } = resolveBrand(brand)
    expect(performance.now() - start).toBeLessThan(100)
    expect(problems).toEqual(['a', 'b'].map((field) => ({ path: `chain.n${depth - 1}.${field}`, kind: 'missing', target: `chain.n${depth}` })))
  })
})

describe('the hover of a role that is a reference', () => {
  const hoverOf = (brand, group, name) => withBrandStyles(brand).color[group][`${name}-hover`]
  const resolvedHover = (brand, group, name) => resolveBrand(withBrandStyles(brand)).brand.color[group][`${name}-hover`]?.$value

  const hex = (value) => ({ $value: { colorSpace: 'srgb', components: [0, 0, 0], hex: value } })

  it('is its target’s written hover, as a reference to it, so it hovers exactly like the role it means', () => {
    const brand = preset()
    brand.color.action['primary-hover'] = hex('#5e07c2')
    brand.color.commerce.buy = { $value: '{color.action.primary}' }
    brand.color.commerce['buy-foreground'] = { $value: '{color.action.primary-foreground}' }
    expect(hoverOf(brand, 'commerce', 'buy').$value).toBe('{color.action.primary-hover}')
    expect(resolvedHover(brand, 'commerce', 'buy').hex).toBe('#5e07c2')
    expect(renderBaseCss(brand)).toMatch(/--fui-buy-hover: var\(--fui-primary-hover\);/)
  })

  it('is its target’s derived hover where the target has none written', () => {
    const brand = preset()
    brand.color.commerce.checkout = { $value: '{color.action.primary}' }
    const primary = resolvedHover(brand, 'action', 'primary')
    expect(primary).toBeDefined()
    expect(resolvedHover(brand, 'commerce', 'checkout')).toEqual(primary)
    expect(renderBaseCss(brand)).toMatch(/--fui-checkout-hover: var\(--fui-primary-hover\);/)
  })

  it('is the role’s own where its target’s hover would fail the colour on the role', () => {
    const brand = preset()
    brand.color.action['primary-hover'] = hex('#b48af5')
    brand.color.commerce.buy = { $value: '{color.action.primary}' }
    brand.color.commerce['buy-foreground'] = hex('#ffffff')
    const own = hoverOf(brand, 'commerce', 'buy')
    expect(own.$value.hex).toBeDefined()
    expect(own.$value.hex).not.toBe('#b48af5')
  })

  it('stays the one the brand writes, and is derived from the role’s own base where the target is no role with a hover', () => {
    const brand = preset()
    brand.color.commerce.buy = { $value: '{color.action.primary}' }
    brand.color.commerce['buy-hover'] = hex('#333333')
    expect(hoverOf(brand, 'commerce', 'buy')).toEqual(brand.color.commerce['buy-hover'])
    const ring = preset()
    ring.color.commerce.buy = { $value: '{color.edge.ring}' }
    const plain = preset()
    plain.color.commerce.buy = preset().color.edge.ring
    expect(hoverOf(ring, 'commerce', 'buy').$value).toEqual(hoverOf(plain, 'commerce', 'buy').$value)
  })
})

describe('a text style step that writes a reference', () => {
  const stepped = (fontSize) => {
    const brand = preset()
    brand.text.body.$extensions = { 'com.frontic.brand': { steps: { md: { fontSize, lineHeight: 1.4 } } } }
    return brand
  }
  const at = 'text.body.$extensions.com.frontic.brand.steps.md.fontSize'
  const media = (css) => css.slice(css.indexOf('@media (width >= '))

  it('is a problem where its size is no token, and the stylesheet refuses it', () => {
    const brand = stepped('{font.size.nope}')
    expect(resolveBrand(brand).problems).toEqual([{ path: at, kind: 'missing', target: 'font.size.nope' }])
    expect(() => renderBaseCss(brand)).toThrow(/brand references that do not resolve:\n.*steps\.md\.fontSize: \{font\.size\.nope\}, which is no token/)
  })

  it('is a problem where it names a token of another type', () => {
    expect(resolveBrand(stepped('{color.action.primary}')).problems).toEqual([{ path: at, kind: 'type', target: 'color.action.primary' }])
  })

  it('resolves to its size, stays a var of a font size the stylesheet declares, and is written as its value otherwise', () => {
    expect(resolveBrand(stepped('{font.size.lg}')).brand.text.body.$extensions['com.frontic.brand'].steps.md.fontSize).toEqual(preset().font.size.lg.$value)
    expect(media(renderBaseCss(stepped('{font.size.lg}')))).toMatch(/--fui-text-body-size: var\(--fui-text-lg\);/)
    const radius = preset().radius.md.$value
    expect(media(renderBaseCss(stepped('{radius.md}')))).toMatch(new RegExp(`--fui-text-body-size: ${radius.value}${radius.unit};`))
  })
})

describe('the hovers the contract derives', () => {
  const derived = (brand) =>
    Object.entries(withBrandStyles(brand).color).flatMap(([group, entries]) =>
      group.startsWith('$') ? [] : tokensOf(entries).flatMap(([name, t]) => (t.$extensions?.['com.frontic.brand']?.derived ? [`${group}.${name}`] : [])),
    )
  const written = () => JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))

  it('are only those of a colour a component hovers', () => {
    expect(HOVERED).toEqual(['action.primary', 'commerce.buy', 'commerce.checkout', 'status.destructive', 'surface.foreground'])
    expect(derived(written()).sort()).toEqual(['action.primary-hover', 'commerce.buy-hover', 'commerce.checkout-hover', 'status.destructive-hover', 'surface.foreground-hover'])
  })

  it('give a hovered colour written as a reference to another hovered colour that colour’s hover', () => {
    const brand = written()
    expect(brand.color.commerce.buy.$value).toBe('{color.action.primary}')
    expect(withBrandStyles(brand).color.commerce['buy-hover'].$value).toBe('{color.action.primary-hover}')
    expect(renderBaseCss(brand)).toMatch(/--fui-buy-hover: var\(--fui-primary-hover\);/)
  })

  it('leave a text colour none, though it is written as a reference to a colour with a hover', () => {
    const brand = written()
    expect(brand.color.commerce.price.$value).toBe('{color.surface.foreground}')
    expect(withBrandStyles(brand).color.commerce['price-hover']).toBeUndefined()
    expect(renderBaseCss(brand)).not.toMatch(/--fui-price-hover:/)
  })

  it('derive a hovered colour’s own hover where the colour it names has none, and give that colour none', () => {
    const brand = written()
    brand.color.action.active = { $value: '{color.action.primary}' }
    brand.color.commerce.checkout = { $value: '{color.action.active}' }
    const styled = resolveBrand(withBrandStyles(brand)).brand.color
    expect(withBrandStyles(brand).color.commerce['checkout-hover'].$value.hex).toBe(styled.action['primary-hover'].$value.hex)
    expect(styled.action['active-hover']).toBeUndefined()
  })

  it('keep any hover the brand writes, on a colour nobody hovers too', () => {
    const brand = written()
    brand.color.commerce['price-hover'] = { $value: { colorSpace: 'srgb', components: [0.2, 0.2, 0.2], hex: '#333333' } }
    expect(renderBaseCss(brand)).toMatch(/--fui-price-hover: #333333;/)
  })
})
