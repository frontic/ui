import { test } from 'vitest'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { recipeTokenProblems, renderBaseCss, stylePresetPath } from '../src/brand.mjs'

const EXPERIENCE_NIGHT = ':where(.dark .frontic-experience-root, .frontic-experience-root.dark, :host(.dark)) {'
const ROOT_NIGHT = ':root.dark {'

const hexToken = (hex) => ({ $type: 'color', $value: { colorSpace: 'srgb', components: [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16) / 255), hex } })
const family = (steps) => Object.fromEntries(Object.entries(steps).map(([step, hex]) => [step, hexToken(hex)]))

/** The default preset with a blue and a grey family nested by step, and `dark` as its night set. */
const brandWith = (dark) => {
  const brand = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
  brand.color.brand = { blue: family({ soft: '#99c2ff', deep: '#0047b3', night: '#001a40' }), grey: family({ 50: '#f8f9fa', 900: '#111318' }) }
  if (dark) brand.$extensions['com.frontic.brand'].modes = { dark }
  return brand
}

const NIGHT = {
  color: {
    surface: { background: { $value: '{color.brand.grey.900}' }, foreground: { $value: '{color.brand.grey.50}' } },
    action: { primary: { $value: '{color.brand.blue.soft}' }, 'primary-foreground': { $value: '{color.brand.blue.night}' } },
    brand: { blue: { night: hexToken('#000d20') } },
  },
}

/** The declarations of the rule `opener` starts, by property. */
const rule = (css, opener) => {
  const at = css.indexOf(`\n${opener}\n`)
  if (at < 0) return null
  const body = css.slice(at + opener.length + 2, css.indexOf('\n}', at + 1))
  return Object.fromEntries([...body.matchAll(/^ {2}(--[\w-]+): (.*);$/gm)].map(([, name, value]) => [name, value]))
}

test("a brand's night colours land in a .dark block after the day block, over the same names, and palette steps reach it only through roles", () => {
  const css = renderBaseCss(brandWith(NIGHT))
  const day = rule(css, ':where(.frontic-experience-root, :host) {')
  const night = rule(css, EXPERIENCE_NIGHT)
  assert.ok(night, 'no night block')
  assert.ok(css.indexOf(EXPERIENCE_NIGHT) > css.indexOf(':where(.frontic-experience-root, :host) {'), 'the night block comes after the day block')
  assert.equal(night['--fui-background'], '#111318')
  assert.equal(night['--fui-foreground'], '#f8f9fa')
  assert.equal(night['--fui-primary'], '#99c2ff')
  assert.equal(night['--fui-primary-foreground'], '#000d20', 'a night reference reads the night value of a palette step')
  assert.doesNotMatch(css, /--(fui|color)-(blue|grey)[-:]/)
  // A role that points at a role recomputes from it on the same element: it is not written again.
  assert.equal(day['--fui-card'], 'var(--fui-background)')
  assert.equal(night['--fui-card'], undefined)
  assert.equal(night['--fui-buy'], undefined)
  // Only what changes at night.
  assert.equal(night['--fui-destructive'], undefined)
  for (const [name, value] of Object.entries(night)) assert.notEqual(value, day[name], `${name} is written at night with its day value`)
})

test('a derived hover is derived again from its night base and the colour on it', () => {
  const css = renderBaseCss(brandWith(NIGHT))
  const day = rule(css, ':where(.frontic-experience-root, :host) {')
  const night = rule(css, EXPERIENCE_NIGHT)
  assert.match(night['--fui-primary-hover'], /^#[0-9a-f]{6}$/)
  assert.notEqual(night['--fui-primary-hover'], day['--fui-primary-hover'])
  assert.notEqual(night['--fui-primary-hover'], '#99c2ff')
  assert.match(night['--fui-foreground-hover'], /^#[0-9a-f]{6}$/)
})

// A night primary whose derived hover would fail AA on its foreground, while its base passes.
const UNDERIVED = { color: { action: { primary: { $value: hexToken('#ffffff').$value }, 'primary-foreground': { $value: hexToken('#737373').$value } } } }
const HOVER_RECIPE = { flat: { probe: { backgroundColor: '{colors.primary-hover}' } } }

test('a night hover the contract cannot derive takes its night base, never the day hover', () => {
  const night = rule(renderBaseCss(brandWith(UNDERIVED)), EXPERIENCE_NIGHT)
  assert.equal(night['--fui-primary-hover'], 'var(--fui-primary)')
})

test('a recipe that names a night hover the contract cannot derive is told where the brand writes it', () => {
  const [problem, ...rest] = recipeTokenProblems(HOVER_RECIPE, brandWith(UNDERIVED))
  assert.deepEqual(rest, [])
  assert.deepEqual(
    { ...problem, underived: { against: problem?.underived?.against } },
    {
      recipe: 'probe',
      at: 'backgroundColor',
      ref: '{colors.primary-hover}',
      path: '$extensions.com.frontic.brand.modes.dark.color.action.primary-hover',
      underived: { against: 'primary-foreground' },
    },
  )
  assert.ok(problem.underived.ratio < 4.5)
})

test('a night hover the brand writes where the day derives one lands in the night block, and no recipe is told', () => {
  const dark = structuredClone(UNDERIVED)
  dark.color.action['primary-hover'] = { $value: hexToken('#e0e0e0').$value }
  const night = rule(renderBaseCss(brandWith(dark)), EXPERIENCE_NIGHT)
  assert.equal(night['--fui-primary-hover'], '#e0e0e0')
  assert.deepEqual(recipeTokenProblems(HOVER_RECIPE, brandWith(dark)), [])
})

test('every scope writes its own night selector', () => {
  assert.ok(renderBaseCss(brandWith(NIGHT), {}, { scope: 'root' }).includes(`\n${ROOT_NIGHT}\n  --fui-background: #111318;`))
  assert.ok(renderBaseCss(brandWith(NIGHT), {}, { scope: 'project' }).includes(`\n${ROOT_NIGHT}\n  --fui-background: #111318;`))
})

test('a brand without night colours renders as it did: no night block, not one byte moved', () => {
  const css = renderBaseCss(brandWith())
  assert.ok(!css.includes('.dark'))
  for (const dark of [{ $description: 'empty' }, { radius: { md: { $value: '1rem' } } }, { color: {} }]) assert.equal(renderBaseCss(brandWith(dark)), css)
})

test('a night reference that does not resolve, or a night colour the day lacks, is a problem', () => {
  assert.throws(
    () => renderBaseCss(brandWith({ color: { surface: { background: { $value: '{color.brand.grey.800}' } } } })),
    /night references that do not resolve:\n.*modes\.dark\.color\.surface\.background/,
  )
  assert.throws(() => renderBaseCss(brandWith({ color: { surface: { glow: hexToken('#ffffff') } } })), /modes\.dark\.color\.surface\.glow: .*the day brand declares no such colour/)
})

test('a hover the day writes as a colour is derived again at night when night changes only its base', () => {
  const brand = brandWith({ color: { action: { primary: { $value: hexToken('#eeeeee').$value } } } })
  brand.color.action['primary-hover'] = hexToken('#222222')
  const night = rule(renderBaseCss(brand), EXPERIENCE_NIGHT)
  assert.match(night['--fui-primary-hover'] ?? '', /^#[0-9a-f]{6}$/)
  assert.notEqual(night['--fui-primary-hover'], '#222222')
})

test('a hover the day writes as a reference to a role night changes stays that reference', () => {
  const brand = brandWith(NIGHT)
  brand.color.action['primary-hover'] = { $type: 'color', $value: '{color.surface.foreground}' }
  const css = renderBaseCss(brand)
  assert.equal(rule(css, ':where(.frontic-experience-root, :host) {')['--fui-primary-hover'], 'var(--fui-foreground)')
  assert.equal(rule(css, EXPERIENCE_NIGHT)['--fui-primary-hover'], undefined)
})
