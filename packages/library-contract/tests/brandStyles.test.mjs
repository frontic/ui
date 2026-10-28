import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BRAND_STYLES, brandUtilities, isRecipeDefinition, RECIPE_PARTS, RECIPE_STATES, recipeValueProblem, renderBaseCss, resolveBrand, stylePresetPath, withBrandStyles } from '../src/brand.mjs'
import { recipeNameProblem, recipeProblems } from '../src/recipe.mjs'
import { yamlRecipes } from './yaml-recipes.mjs'

const defaults = resolveBrand(JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))).brand
const written = JSON.parse(readFileSync(stylePresetPath('default'), 'utf8'))
const named = (group) => Object.keys(group).filter((key) => !key.startsWith('$'))
const bare = {
  color: { $type: 'color', edge: { ring: { $value: '#000000' } } },
  font: { family: { $type: 'fontFamily', sans: { $value: ['Inter'] } } },
  text: { $type: 'typography' },
  border: { $type: 'border' },
}
const designMd = (block) => `---\ncomponents:\n${block}\n---\n`

describe('the brand styles every brand has', () => {
  it('the default brand carries exactly BRAND_STYLES', () => {
    expect(named(defaults.text)).toEqual([
      'heading',
      'body',
      'ui',
      'small',
      'caption',
      'control',
      'display',
      'headline',
      'page-title',
      'title',
      'subheading',
      'lead',
      'copy',
      'note',
      'description',
      'micro',
    ])
    expect(named(defaults.border)).toEqual(['default', 'strong', 'focus', 'frame', 'frame-thin'])
    expect(named(defaults.ring)).toEqual(['hairline', 'focus', 'wide', 'outset', 'frame', 'none'])
    expect(named(defaults.opacity)).toEqual(['50', '60', '90', '100'])
    expect(named(defaults.shadow)).toEqual(['xs', 'sm', 'md', 'lg'])
    const own = resolveBrand(withBrandStyles({ font: written.font, color: written.color })).brand
    for (const group of ['text', 'border', 'ring', 'opacity', 'shadow']) for (const name of Object.keys(BRAND_STYLES[group])) expect(defaults[group][name], name).toEqual(own[group][name])
  })

  it('ui and small are text-sm as the default brand sets it: 14px on a 20px line', () => {
    for (const name of ['ui', 'small']) expect(BRAND_STYLES.text[name].$value, name).toMatchObject({ fontSize: { value: 0.875, unit: 'rem' }, lineHeight: 1.43 })
  })

  it('caption is the small medium text the default brand sets badges and menu labels in', () => {
    expect(defaults.text.caption.$value).toMatchObject({ fontSize: { value: 0.75, unit: 'rem' }, fontWeight: 500 })
  })

  it('ships the opacity steps something reads and renders a named step', () => {
    const css = renderBaseCss(bare)
    expect(css).not.toContain('--fui-opacity-0:')
    expect(css).toContain('--fui-opacity-60: 0.6;')
    expect(css).toContain('--fui-opacity-100: 1;')
    const own = renderBaseCss({ ...bare, opacity: { disabled: { $value: 45 } } })
    expect(own).toContain('--fui-opacity-disabled: 0.45;')
    expect(own).toContain('--fui-opacity-50: 0.5;')
  })

  it('ships the ring tokens and renders a brand-own one with its offset', () => {
    const css = renderBaseCss(bare)
    expect(css).toContain('--fui-ring-hairline: 1px solid var(--fui-border);')
    expect(css).toContain('--fui-ring-hairline-offset: 0px;')
    expect(css).toContain('--fui-ring-focus: 2px solid var(--fui-ring);')
    expect(css).toContain('--fui-ring-none: 0px solid transparent;')
    expect(Object.keys(BRAND_STYLES.ring)).toEqual(['hairline', 'focus', 'wide', 'outset', 'frame', 'none'])
    expect(css).toContain('--fui-ring-wide: 3px solid var(--fui-ring);')
    expect(css).toContain('--fui-ring-outset-offset: 2px;')
    expect(css).toContain('--fui-ring-frame: 2px solid var(--fui-background);')
    expect(css).toContain('--fui-border-frame: 4px solid var(--fui-background);')
    expect(css).toContain('--fui-border-frame-thin: 2px solid var(--fui-background);')
    const own = renderBaseCss({ ...bare, ring: { halo: { $value: { width: { value: 3, unit: 'px' }, style: 'dashed', color: '#ff0000', offset: { value: 2, unit: 'px' } } } } })
    expect(own).toContain('--fui-ring-halo: 3px dashed #ff0000;')
    expect(own).toContain('--fui-ring-halo-offset: 2px;')
    const noOffset = renderBaseCss({ ...bare, ring: { thin: { $value: { width: { value: 1, unit: 'px' }, style: 'solid', color: '#000000' } } } })
    expect(noOffset).toContain('--fui-ring-thin-offset: 0px;')
  })

  it('the focus ring keeps the element colour: outline-color comes after outline whatever the key order', () => {
    const css = renderBaseCss(bare, yamlRecipes(designMd("  focus-ring:\n    outlineColor: '{colors.ring}'\n    outline: '{ring.focus}'")))
    const rule = css.slice(css.indexOf('@utility fui-focus-ring {'))
    const body = rule.slice(0, rule.indexOf('\n}'))
    expect(body).toMatch(/^ +outline: var\(--fui-focus-ring-outline\);$/m)
    expect(body).toMatch(/^ +outline-offset: var\(--fui-focus-ring-outline-offset\);$/m)
    expect(body.indexOf('outline-color:')).toBeGreaterThan(body.search(/^ +outline: /m))
  })

  it('a brand without them renders the defaults, its own font family in the text styles', () => {
    const css = renderBaseCss(bare)
    expect(css).toContain('--fui-text-heading-size: 1.5rem;')
    expect(css).toContain('--fui-text-body-family: Inter;')
    expect(css).toContain('--fui-text-caption-line-height: 1.33;')
    expect(css).toContain('--fui-border-default: 1px solid var(--fui-border);')
    expect(css).toContain('--fui-border-focus: 2px solid var(--fui-ring);')
  })

  it('a brand’s own extra text style stays beside the defaults', () => {
    const poster = { $value: { fontFamily: ['Oswald'], fontSize: { value: 3, unit: 'rem' }, fontWeight: 700, lineHeight: 1.1 } }
    const css = renderBaseCss({ ...bare, text: { $type: 'typography', poster } })
    expect(css.match(/--fui-text-[a-z]+-size: [^;]+;/g)).toEqual([
      '--fui-text-poster-size: 3rem;',
      '--fui-text-heading-size: 1.5rem;',
      '--fui-text-body-size: 1rem;',
      '--fui-text-ui-size: 0.875rem;',
      '--fui-text-small-size: 0.875rem;',
      '--fui-text-caption-size: 0.75rem;',
      '--fui-text-control-size: 1rem;',
      '--fui-text-display-size: 2.25rem;',
      '--fui-text-headline-size: 1.5rem;',
      '--fui-text-title-size: 1.25rem;',
      '--fui-text-subheading-size: 1.125rem;',
      '--fui-text-lead-size: 1.125rem;',
      '--fui-text-copy-size: 0.875rem;',
      '--fui-text-note-size: 0.8125rem;',
      '--fui-text-description-size: 0.875rem;',
      '--fui-text-micro-size: 0.625rem;',
      '--fui-text-control-size: 0.875rem;',
    ])
  })

  it('a brand’s own style wins over the default', () => {
    const css = renderBaseCss({ ...bare, border: { $type: 'border', focus: { $value: { width: { value: 3, unit: 'px' }, style: 'dashed', color: '#ff0000' } } } })
    expect(css).toContain('--fui-border-focus: 3px dashed #ff0000;')
    expect(css.match(/--fui-border-focus:/g)).toHaveLength(1)
  })

  it('a generic recipe naming them resolves', () => {
    const css = renderBaseCss(bare, yamlRecipes(designMd("  panel:\n    typography: '{typography.small}'\n    border: '{border.default}'")))
    expect(css).toContain('--fui-panel-font-size: var(--fui-text-small-size);')
    expect(css).toContain('--fui-panel-border: var(--fui-border-default);')
  })
})

describe('states inside a value recipe', () => {
  const recipes = yamlRecipes(
    designMd(
      [
        '  button-brand-primary:',
        "    backgroundColor: '{colors.primary}'",
        '    hover:',
        "      backgroundColor: '{colors.active}'",
        '    active:',
        "      backgroundColor: '{colors.active}'",
        "      textColor: '{colors.active-foreground}'",
        '    focus:',
        "      borderColor: '{colors.ring}'",
        '  focus-ring:',
        "    outline: '{ring.focus}'",
        '  notice-warning:',
        "    iconColor: '{colors.warning}'",
      ].join('\n'),
    ),
  )
  const css = renderBaseCss(defaults, recipes)

  it('nest as &:hover, &:active and &:focus-visible in the value’s utility', () => {
    expect(css).toContain('--fui-button-brand-primary-hover-background-color: var(--fui-active);')
    expect(css).toMatch(
      /@utility fui-button-brand-primary \{\n {2}--tw-sort: container-type;\n {2}background-color: var\(--fui-button-brand-primary-background-color\);\n {2}&:hover \{\n {4}background-color: var\(--fui-button-brand-primary-hover-background-color\);\n {2}\}\n {2}&:active \{\n {4}background-color: var\(--fui-button-brand-primary-active-background-color\);\n {4}color: var\(--fui-button-brand-primary-active-text-color\);\n {2}\}\n {2}&:focus-visible \{\n {4}border-color: var\(--fui-button-brand-primary-focus-border-color\);\n {2}\}\n\}/,
    )
  })

  it('outline takes a ring token, iconColor colours the icons inside', () => {
    expect(css).toMatch(/@utility fui-focus-ring \{\n {2}--tw-sort: container-type;\n {2}outline: var\(--fui-focus-ring-outline\);\n {2}outline-offset: var\(--fui-focus-ring-outline-offset\);\n\}/)
    expect(css).toContain('--fui-focus-ring-outline: var(--fui-ring-focus);\n  --fui-focus-ring-outline-offset: var(--fui-ring-focus-offset);')
    expect(css).toMatch(/@utility fui-notice-warning \{\n {2}--tw-sort: container-type;\n {2}& svg \{\n {4}color: var\(--fui-notice-warning-icon-color\);\n {2}\}\n\}/)
  })

  it('a nested property inside a state joins the state’s selector, a text style inside a state nests whole', () => {
    const field = renderBaseCss(
      defaults,
      yamlRecipes(
        designMd(
          [
            '  field:',
            '    hover:',
            "      iconColor: '{colors.active}'",
            "      placeholderColor: '{colors.ring}'",
            "      typography: '{typography.small}'",
            '    checked:',
            "      iconColor: '{colors.primary}'",
          ].join('\n'),
        ),
      ),
    )
    expect(field).toContain('--fui-field-hover-icon-color: var(--fui-active);')
    expect(field).toContain('--fui-field-hover-font-size: var(--fui-text-small-size);')
    expect(field).toContain('  &:hover svg {\n    color: var(--fui-field-hover-icon-color);\n  }')
    expect(field).toContain('  &:hover::placeholder {\n    color: var(--fui-field-hover-placeholder-color);\n  }')
    expect(field).toContain('  &:hover {\n    font-family: var(--fui-field-hover-font-family);\n    font-size: var(--fui-field-hover-font-size);')
    expect(field).toContain(
      '  &:is([data-state=checked],[data-state=indeterminate],[data-state=on],[aria-checked=true],[aria-checked=mixed],[aria-pressed=true]) svg {\n    color: var(--fui-field-checked-icon-color);\n  }',
    )
  })

  it('a state block holds properties only: no state inside a state', () => {
    const nested = renderBaseCss(defaults, yamlRecipes(designMd("  x:\n    hover:\n      active:\n        backgroundColor: '{colors.active}'")))
    expect(nested).not.toContain('fui-x')
  })

  it('one table names every state and the selector reka’s attributes match', () => {
    expect(RECIPE_STATES).toEqual({
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
  })

  it('an attribute state nests under its selector, after the pseudo-classes', () => {
    const choice = renderBaseCss(
      defaults,
      yamlRecipes(
        designMd(['  choice:', "    borderColor: '{colors.input}'", '    checked:', "      backgroundColor: '{colors.primary}'", '    hover:', "      borderColor: '{colors.ring}'"].join('\n')),
      ),
    )
    expect(choice).toContain('--fui-choice-checked-background-color: var(--fui-primary);')
    expect(choice).toMatch(
      /@utility fui-choice \{\n {2}--tw-sort: container-type;\n {2}border-color: var\(--fui-choice-border-color\);\n {2}&:hover \{\n {4}border-color: var\(--fui-choice-hover-border-color\);\n {2}\}\n {2}&:is\(\[data-state=checked\],\[data-state=indeterminate\],\[data-state=on\],\[aria-checked=true\],\[aria-checked=mixed\],\[aria-pressed=true\]\) \{\n {4}background-color: var\(--fui-choice-checked-background-color\);\n {2}\}\n\}/,
    )
  })

  it('a checkedWithin block styles an element that holds a checked control, in RECIPE_BLOCKS order, its variables kebab-cased', () => {
    const card = renderBaseCss(
      defaults,
      yamlRecipes(
        designMd(
          [
            '  card:',
            '    base:',
            "      border: '{border.default}'",
            '      checkedWithin:',
            "        backgroundColor: '{colors.primary/5}'",
            "        borderColor: '{colors.primary}'",
            '      hover:',
            "        borderColor: '{colors.ring}'",
          ].join('\n'),
        ),
      ),
    )
    expect(card).toContain('--fui-card-checked-within-background-color: color-mix(in oklab, var(--fui-primary) 5%, transparent);')
    const utility = card.slice(card.indexOf('@utility fui-card {'))
    expect(utility.indexOf('&:hover {')).toBeLessThan(utility.indexOf('&:has([data-state=checked]) {'))
    expect(utility).toContain(
      '  &:has([data-state=checked]) {\n    background-color: var(--fui-card-checked-within-background-color);\n    border-color: var(--fui-card-checked-within-border-color);\n  }',
    )
    expect(isRecipeDefinition({ checkedWithin: { backgroundColor: '{colors.primary/5}' } })).toBe(true)
    expect(isRecipeDefinition({ checkedWithinColor: '{colors.primary}' })).toBe(false)
  })

  it('isRecipeDefinition takes properties and one level of state blocks, nothing else', () => {
    expect(isRecipeDefinition({ backgroundColor: '{colors.primary}', opacity: '{opacity.50}', hover: { opacity: '{opacity.90}' } })).toBe(true)
    expect(
      isRecipeDefinition({ checked: { backgroundColor: '{colors.primary}' }, highlighted: { opacity: '{opacity.100}' }, open: { opacity: '{opacity.100}' }, selected: { opacity: '{opacity.100}' } }),
    ).toBe(true)
    expect(isRecipeDefinition({ hover: 'x' })).toBe(false)
    expect(isRecipeDefinition({ hover: { active: { opacity: '{opacity.100}' } } })).toBe(false)
    expect(isRecipeDefinition({ checked: { open: { opacity: '{opacity.100}' } } })).toBe(false)
    expect(isRecipeDefinition({ pressed: { translate: '0 {spacing.px}' } })).toBe(true)
    expect(isRecipeDefinition({ today: { opacity: '{opacity.100}' } })).toBe(false)
    expect(isRecipeDefinition({ backgroundColor: { value: 'x' } })).toBe(false)
    expect(isRecipeDefinition({ 'Bad-Key': 'x' })).toBe(false)
    expect(isRecipeDefinition({ 'border-color': 'red' })).toBe(false)
    expect(isRecipeDefinition({ hover: { 'border-color': 'red' } })).toBe(false)
    expect(isRecipeDefinition({ padding: 'x'.repeat(501) })).toBe(false)
    expect(isRecipeDefinition({ [`a${'b'.repeat(64)}`]: 'x' })).toBe(false)
    expect(isRecipeDefinition('@x')).toBe(false)
  })
})

describe('an explicit type property beside typography', () => {
  const lines = [
    "    typography: '{typography.ui}'",
    '    letterSpacing: wider',
    '    fontWeight: semibold',
    '    lineHeight: none',
    '    fontFamily: serif',
    '    fontFeatureSettings: normal',
    `    fontVariationSettings: "'wght' 300"`,
  ]
  const recipe = (block) => yamlRecipes(designMd(`  chip:\n${block.join('\n')}\n    hover:\n${block.map((l) => `  ${l}`).join('\n')}`))
  const first = renderBaseCss(bare, recipe(lines))
  const last = renderBaseCss(bare, recipe([...lines.slice(1), lines[0]]))

  it('renders the same CSS whatever the key order', () => {
    expect(first).toContain('@utility fui-chip {')
    expect(last).toBe(first)
  })

  it('overrides the part of the expansion it names, once, flat and in a state', () => {
    for (const [prefix, part, value] of [
      ['', 'letter-spacing', '0.05em'],
      ['', 'font-weight', '600'],
      ['', 'line-height', '1'],
      ['', 'font-family', 'serif'],
      ['', 'font-feature-settings', 'normal'],
      ['hover-', 'font-variation-settings', "'wght' 300"],
      ['hover-', 'letter-spacing', '0.05em'],
    ]) {
      expect(first.match(new RegExp(`--fui-chip-${prefix}${part}: [^;]+;`, 'g'))).toEqual([`--fui-chip-${prefix}${part}: ${value};`])
      expect(first.match(new RegExp(`^ +${part}: var\\(--fui-chip-${prefix}${part}\\);`, 'gm'))).toHaveLength(1)
    }
  })
})

describe('a colour reference with an alpha', () => {
  const css = (block) => renderBaseCss(bare, yamlRecipes(designMd(`  tint:\n${block}`)))

  it('renders the colour mixed with transparent at that percent, flat and in a state', () => {
    const out = css("    backgroundColor: '{colors.primary/20}'\n    hover:\n      backgroundColor: '{colors.primary/30}'")
    expect(out).toContain('--fui-tint-background-color: color-mix(in oklab, var(--fui-primary) 20%, transparent);')
    expect(out).toContain('--fui-tint-hover-background-color: color-mix(in oklab, var(--fui-primary) 30%, transparent);')
  })

  it('renders nothing for it on a non-colour property', () => {
    expect(css("    rounded: '{colors.primary/10}'")).not.toContain('--fui-tint-rounded')
  })

  it.each(['{colors.primary/101}', '{colors.primary/-1}', '{colors.primary/12.5}', '{colors.primary/}', '{colors.primary/ab}'])('renders nothing for %s', (value) => {
    expect(css(`    backgroundColor: '${value}'`)).not.toContain('--fui-tint-background-color')
  })

  it('names the problem: a whole percent from 0 to 100, on a colour property only', () => {
    expect(recipeValueProblem('backgroundColor', '{colors.primary/0}')).toBeNull()
    expect(recipeValueProblem('iconColor', '{colors.primary/100}')).toBeNull()
    expect(recipeValueProblem('backgroundColor', '{colors.primary}')).toBeNull()
    expect(recipeValueProblem('backgroundColor', '{colors.primary/101}')).toMatch(/whole percent from 0 to 100/)
    expect(recipeValueProblem('backgroundColor', '{colors.primary/12.5}')).toMatch(/whole percent from 0 to 100/)
    expect(recipeValueProblem('rounded', '{colors.primary/10}')).toMatch(/colour property/)
  })

  it('is a recipe definition the library saves only when valid and on a colour property', () => {
    expect(isRecipeDefinition({ backgroundColor: '{colors.primary/20}', hover: { textColor: '{colors.primary/80}' } })).toBe(true)
    expect(isRecipeDefinition({ rounded: '{colors.primary/20}' })).toBe(false)
    expect(isRecipeDefinition({ hover: { backgroundColor: '{colors.primary/120}' } })).toBe(false)
  })
})

describe('a text style that steps at md', () => {
  const step = (steps) => ({ $value: { fontFamily: ['Oswald'], fontSize: { value: 2, unit: 'rem' }, fontWeight: 700, lineHeight: 1.1 }, $extensions: { 'com.frontic.brand': { steps } } })
  const brand = (steps) => ({ ...bare, text: { $type: 'typography', display: step(steps) } })

  it('overrides its size and line height from 48rem, in the scope the brand renders in', () => {
    const css = renderBaseCss(brand({ md: { fontSize: { value: 3, unit: 'rem' }, lineHeight: 1 } }), {}, { scope: 'project' })
    expect(css).toContain('@media (width >= 48rem) {\n  :root {\n    --fui-text-display-size: 3rem;\n    --fui-text-display-line-height: 1;')
  })

  it.each([
    ['experience', ':where(.frontic-experience-root, :host)'],
    ['project', ':root'],
  ])('in the %s scope, comes after the vars block it overrides: same selector, so order decides', (scope, selector) => {
    const css = renderBaseCss(bare, {}, { scope })
    const vars = css.indexOf(`\n${selector} {\n  box-sizing: border-box;`)
    const varsEnd = css.indexOf('\n}\n', vars)
    const step = css.indexOf(`@media (width >= 48rem) {\n  ${selector} {`)
    expect(vars).toBeGreaterThanOrEqual(0)
    expect(css.slice(vars, varsEnd)).toContain('--fui-text-control-size: 1rem;')
    expect(step).toBeGreaterThan(varsEnd)
  })

  it('the default control style is text-base, text-sm from md, as the default brand sets controls', () => {
    expect(defaults.text.control.$value).toMatchObject({ fontSize: { value: 1, unit: 'rem' }, fontWeight: 400, lineHeight: 1.5 })
    const css = renderBaseCss(bare)
    expect(css).toContain('--fui-text-control-size: 1rem;')
    expect(css).toContain('@media (width >= 48rem) {\n  :where(.frontic-experience-root, :host) {\n    --fui-text-control-size: 0.875rem;\n    --fui-text-control-line-height: 1.43;')
  })

  // A media query cannot read a custom property, so each step width is fixed at build time; the default brand steps at md only.
  it.each(['lg', 'sm', '2xl'])('refuses a step at %s: only md, the brand’s md breakpoint', (at) => {
    expect(() => renderBaseCss(brand({ [at]: { fontSize: { value: 3, unit: 'rem' } } }))).toThrow(/text style display: a step at .*; only md/)
  })

  it.each([
    [{ md: 'oops' }, /steps\.md is \{ fontSize, lineHeight \}/],
    [{ md: { fontSize: {} } }, /steps\.md\.fontSize is a dimension/],
    [{ md: { fontSize: 'x;}' } }, /steps\.md\.fontSize is a dimension/],
  ])('refuses %j with the problem textStepProblems reports, never emitting it', (steps, problem) => {
    expect(() => renderBaseCss(brand(steps))).toThrow(problem)
  })

  it('steps at the brand’s own md breakpoint when it sets one, 48rem without', () => {
    const md = { $type: 'dimension', sm: { $value: { value: 30, unit: 'rem' } }, md: { $value: { value: 60, unit: 'rem' } } }
    const css = renderBaseCss({ ...brand({ md: { lineHeight: 1 } }), breakpoint: md })
    expect(css).toContain('@media (width >= 60rem) {\n  :where(.frontic-experience-root, :host) {\n    --fui-text-display-line-height: 1;')
    expect(css).not.toContain('(width >= 48rem)')
    expect(renderBaseCss({ ...brand({ md: { lineHeight: 1 } }), breakpoint: { $type: 'dimension', lg: { $value: { value: 70, unit: 'rem' } } } })).toContain('@media (width >= 48rem)')
  })
})

describe('a recipe’s layout keywords', () => {
  it('renders the layout keywords as their utilities do, stepped at the container and inside a state', () => {
    const css = renderBaseCss(
      bare,
      yamlRecipes(
        designMd(
          "  probe:\n    base:\n      display: flex\n      flexDirection: column\n      alignItems: center\n      gridColumns: 3\n      gridColumn: full\n      '@md': { flexDirection: row }\n      open: { display: block }",
        ),
      ),
    )
    expect(css).toContain('--fui-probe-grid-columns: repeat(3, minmax(0, 1fr));')
    expect(css).toContain('--fui-probe-grid-column: 1 / -1;')
    expect(css).toContain('--fui-probe-align-items: center;')
    expect(css).toContain('  grid-template-columns: var(--fui-probe-grid-columns);')
    expect(css).toContain('  display: var(--fui-probe-display);')
    expect(css).toContain('@container (width >= 28rem) {\n    flex-direction: var(--fui-probe-md-flex-direction);')
    expect(css).toContain('display: var(--fui-probe-open-display);')
  })
})

describe('a layout step at the container', () => {
  const stepped = yamlRecipes(designMd("  rail:\n    base:\n      gap: '{spacing.2}'\n      '@md': { gap: '{spacing.4}' }\n      '@lg': { gap: '{spacing.6}' }"))

  it('widens at the brand’s container width when it names one, Tailwind’s default without', () => {
    const css = renderBaseCss(bare, stepped)
    expect(css).toMatch(
      /@utility fui-rail \{\n {2}--tw-sort: container-type;\n {2}gap: var\(--fui-rail-gap\);\n {2}@container \(width >= 28rem\) \{\n {4}gap: var\(--fui-rail-md-gap\);\n {2}\}\n {2}@container \(width >= 32rem\) \{\n {4}gap: var\(--fui-rail-lg-gap\);\n {2}\}\n\}/,
    )
    const own = renderBaseCss({ ...bare, container: { $type: 'dimension', md: { $value: { value: 30, unit: 'rem' } } } }, stepped)
    expect(own).toContain('@container (width >= 30rem) {\n    gap: var(--fui-rail-md-gap);')
    expect(own).toContain('@container (width >= 32rem) {\n    gap: var(--fui-rail-lg-gap);')
  })

  it('renders contain as the base utility’s container type, and a bleed as a negative margin', () => {
    const css = renderBaseCss(bare, yamlRecipes(designMd("  card:\n    base:\n      contain: inline-size\n      bleedX: '{spacing.4}'\n      marginTop: '{spacing.2}'")))
    expect(css).toContain('--fui-card-contain: inline-size;')
    expect(css).toContain('--fui-card-bleed-x: calc(-1 * calc(var(--fui-spacing) * 4));')
    expect(css).toMatch(
      /@utility fui-card \{\n {2}--tw-sort: container-type;\n {2}container-type: var\(--fui-card-contain\);\n {2}margin-inline: var\(--fui-card-bleed-x\);\n {2}margin-top: var\(--fui-card-margin-top\);\n\}/,
    )
  })

  it('a value’s parts block redeclares each part’s variable on the value’s utility', () => {
    const css = renderBaseCss(
      bare,
      yamlRecipes(
        designMd(
          [
            '  card:',
            '    base: {}',
            '    variants:',
            '      surface:',
            "        bare: { paddingY: '{spacing.0}', '@md': { paddingY: '{spacing.1}' }, parts: { card-header: { paddingX: '{spacing.0}' }, card-content: { paddingX: '{spacing.0}' } } }",
            '    defaults: { surface: raised }',
            '  card-header:',
            "    base: { paddingX: '{spacing.8}' }",
            '  card-content:',
            "    base: { paddingX: '{spacing.6}' }",
          ].join('\n'),
        ),
      ),
    )
    expect(css).toContain('--fui-card-bare-card-header-padding-x: calc(var(--fui-spacing) * 0);')
    expect(css).toContain('--fui-card-bare-card-content-padding-x: calc(var(--fui-spacing) * 0);')
    expect(css).toMatch(
      /@utility fui-card-bare \{\n {2}--tw-sort: pointer-events;\n {2}padding-block: var\(--fui-card-bare-padding-y\);\n {2}--fui-card-header-padding-x: var\(--fui-card-bare-card-header-padding-x\);\n {2}--fui-card-content-padding-x: var\(--fui-card-bare-card-content-padding-x\);\n {2}@container \(width >= 28rem\) \{\n {4}padding-block: var\(--fui-card-bare-md-padding-y\);\n {2}\}\n\}/,
    )
    expect(css).toMatch(/@utility fui-card-header \{\n {2}--tw-sort: container-type;\n {2}padding-inline: var\(--fui-card-header-padding-x\);\n\}/)
  })

  const experience =
    '\n@layer base {\n  :where(.frontic-experience-root, :host) {\n    container-type: inline-size;\n    inline-size: 100%;\n    inline-size: -webkit-fill-available;\n    inline-size: -moz-available;\n    inline-size: stretch;\n  }\n}\n'
  it.each([
    ['experience', ':where(.frontic-experience-root, :host)', experience],
    ['root', 'body', '\nbody {\n  container-type: inline-size;\n}\n'],
    ['project', 'body', '\nbody {\n  container-type: inline-size;\n}\n'],
  ])('in the %s scope, gives %s a container after the theme block, so a step always has one', (scope, selector, rule) => {
    const css = renderBaseCss(bare, {}, { scope })
    const at = css.indexOf(rule)
    expect(at).toBeGreaterThan(css.indexOf('@theme inline {'))
    expect(at).toBeLessThan(css.indexOf('@custom-variant'))
    expect(css.split(rule)).toHaveLength(2)
    if (selector !== 'body') expect(css).not.toMatch(/^body \{/m)
  })

  it('makes a shadow host block-level, so its inline-size container has a width to query, and keeps a hidden host hidden', () => {
    const host = '\n:host {\n  display: block;\n}\n\n:host([hidden]) {\n  display: none;\n}\n'
    const css = renderBaseCss(bare, {}, { scope: 'experience' })
    expect(css.indexOf(host)).toBeGreaterThan(css.indexOf('container-type: inline-size;'))
    expect(css.split(host)).toHaveLength(2)
    for (const scope of ['root', 'project']) expect(renderBaseCss(bare, {}, { scope })).not.toContain(host)
  })

  it('leaves a text step at the viewport', () => {
    const css = renderBaseCss(bare, stepped)
    expect(css).toContain('@media (width >= 48rem) {\n  :where(.frontic-experience-root, :host) {\n    --fui-text-control-size: 0.875rem;')
    expect(css).not.toContain('@media (width >= 28rem)')
  })
})

describe('a file block in a recipe', () => {
  it('renders as the file selector button, a pseudo-element beside the states', () => {
    const css = renderBaseCss(
      bare,
      yamlRecipes(designMd("  field:\n    textColor: '{colors.ring}'\n    file:\n      backgroundColor: transparent\n      border: none\n      typography: '{typography.ui}'")),
    )
    expect(css).toContain('--fui-field-file-background-color: transparent;')
    expect(css).toContain('--fui-field-file-font-size: var(--fui-text-ui-size);')
    expect(css).toMatch(/ {2}&::file-selector-button \{\n {4}background-color: var\(--fui-field-file-background-color\);\n {4}border: var\(--fui-field-file-border\);/)
  })

  it('is a block of plain properties the library saves, with no state inside it', () => {
    expect(isRecipeDefinition({ file: { backgroundColor: 'transparent', typography: '{typography.ui}' } })).toBe(true)
    expect(isRecipeDefinition({ file: { hover: { opacity: '{opacity.100}' } } })).toBe(false)
    expect(isRecipeDefinition({ hover: { file: { opacity: '{opacity.100}' } } })).toBe(false)
    expect(RECIPE_PARTS).toEqual({ file: '&::file-selector-button', after: '&::after', link: '& :where(a)' })
  })
})

describe('a link block in a recipe', () => {
  const render = (yaml) => renderBaseCss(bare, yamlRecipes(designMd(yaml)))

  it('styles every link inside at the recipe’s own weight, its states on the link itself', () => {
    const css = render("  hint:\n    textColor: '{colors.muted-foreground}'\n    link:\n      hover:\n        textColor: '{colors.primary}'")
    expect(css).toContain('--fui-hint-link-hover-text-color: var(--fui-primary);')
    expect(css).toMatch(/ {2}& :where\(a:hover\) \{\n {4}color: var\(--fui-hint-link-hover-text-color\);\n {2}\}/)
    const tree = render(
      "  item-description:\n    base:\n      link:\n        textColor: '{colors.foreground}'\n        hover:\n          textColor: '{colors.primary}'\n    variants: {}\n    defaults: {}",
    )
    expect(tree).toMatch(/ {2}& :where\(a\) \{\n {4}color: var\(--fui-item-description-link-text-color\);\n {2}\}/)
    expect(tree).toMatch(/ {2}& :where\(a:hover\) \{\n {4}color: var\(--fui-item-description-link-hover-text-color\);\n {2}\}/)
  })

  it('takes a state inside it, unlike the pseudo-element parts, and nothing deeper', () => {
    expect(recipeProblems({ link: { hover: { textColor: '{colors.primary}' } } }, 'hint')).toEqual([])
    expect(recipeProblems({ link: { hover: {} } }, 'hint')).toEqual([{ path: 'link.hover', message: 'a state is a block of one or more properties' }])
    expect(recipeProblems({ link: { hover: { focus: { textColor: '{colors.primary}' } } } }, 'hint')).toEqual([{ path: 'link.hover.focus', message: 'a state inside a state' }])
    expect(recipeProblems({ after: { hover: { textColor: '{colors.primary}' } } }, 'hint')).toEqual([{ path: 'after.hover', message: 'a state inside a part' }])
    expect(recipeProblems({ hover: { link: { textColor: '{colors.primary}' } } }, 'hint')).toEqual([{ path: 'hover.link', message: 'a part inside a state' }])
  })

  it('leaves -link recipe names free', () => {
    expect(recipeNameProblem('breadcrumb-link')).toBeNull()
    expect(recipeNameProblem('breadcrumb-after')).not.toBeNull()
  })
})

describe('an after block in a recipe', () => {
  it('renders as the element’s ::after', () => {
    const css = renderBaseCss(bare, yamlRecipes(designMd("  avatar:\n    base:\n      rounded: '{rounded.full}'\n      after:\n        border: '{border.default}'\n        rounded: '{rounded.full}'")))
    expect(css).toContain('--fui-avatar-after-border: var(--fui-border-default);')
    expect(css).toMatch(/ {2}&::after \{\n {4}content: var\(--tw-content, ''\);\n {4}border: var\(--fui-avatar-after-border\);\n {4}border-radius: var\(--fui-avatar-after-rounded\);\n {2}\}/)
  })
})

describe('a recipe the validator refuses renders nothing for it', () => {
  it('drops a flat property named for a block and an inner-element property inside the file part', () => {
    const css = renderBaseCss(
      bare,
      yamlRecipes(designMd("  field:\n    fileColor: '{colors.ring}'\n    file:\n      color: '{colors.ring}'\n      iconColor: '{colors.ring}'\n      placeholderColor: '{colors.ring}'")),
    )
    expect(css.match(/--fui-field-file-color:/g)).toHaveLength(1)
    expect(css).not.toContain('file-selector-button svg')
    expect(css).not.toContain('file-selector-button::placeholder')
    expect(css).not.toContain('file-icon-color')
  })

  it.each(['{colors.primary /50}', '{color.primary/50}'])('drops %s, which the validator refuses', (value) => {
    expect(renderBaseCss(bare, yamlRecipes(designMd(`  tint:\n    backgroundColor: '${value}'\n    textColor: '{colors.ring}'`)))).not.toContain('--fui-tint-background-color')
  })
})

describe('withBrandStyles', () => {
  const deepFreeze = (node) => {
    if (typeof node === 'object' && node !== null) for (const value of Object.values(Object.freeze(node))) deepFreeze(value)
    return node
  }

  it('takes a deep-frozen brand and leaves it untouched', () => {
    const input = deepFreeze(structuredClone(bare))
    const out = withBrandStyles(input)
    expect(input).toEqual(bare)
    expect(out.shadow.xs).toEqual(BRAND_STYLES.shadow.xs)
  })

  it('copies what it fills in, so changing the result leaves BRAND_STYLES alone', () => {
    const before = structuredClone(BRAND_STYLES)
    const out = withBrandStyles(bare)
    out.shadow.xs.$value[0].blur.value = 99
    out.border.default.$value.width.value = 9
    out.text.ui.$value.fontFamily.push('serif')
    out.text.control.$extensions['com.frontic.brand'].steps.md.lineHeight = 9
    expect(BRAND_STYLES).toEqual(before)
  })
})

describe('the xs shadow every brand has', () => {
  it('renders the default brand’s shadow-xs for a brand without one', () => {
    const css = renderBaseCss({ ...bare, shadow: { $type: 'shadow' } })
    expect(css).toContain('--fui-shadow-xs: 0px 1px 2px 0px rgb(0 0 0 / 0.05);')
  })

  it('keeps a brand’s own xs', () => {
    const xs = { $value: [{ color: '#ff0000', offsetX: { value: 0, unit: 'px' }, offsetY: { value: 2, unit: 'px' }, blur: { value: 4, unit: 'px' }, spread: { value: 0, unit: 'px' } }] }
    const css = renderBaseCss({ ...bare, shadow: { $type: 'shadow', xs } })
    expect(css).toContain('--fui-shadow-xs: 0px 2px 4px 0px #ff0000;')
    expect(css.match(/--fui-shadow-xs:/g)).toHaveLength(1)
  })
})

describe('a component’s value that sets the shared focus ring’s colour', () => {
  const recipes = yamlRecipes(
    designMd(
      [
        '  focus-ring:',
        "    borderColor: '{colors.ring}'",
        "    outlineColor: '{colors.ring/50}'",
        '  button:',
        '    variants:',
        '      variant:',
        '        danger:',
        "          backgroundColor: '{colors.primary}'",
        "          ringColor: '{colors.destructive/20}'",
        "          ringBorderColor: '{colors.destructive/40}'",
      ].join('\n'),
    ),
  )
  const css = renderBaseCss(bare, recipes)

  it('sets the ring variables on its element', () => {
    expect(css).toContain('--fui-button-danger-ring-color: color-mix(in oklab, var(--fui-destructive) 20%, transparent);')
    expect(css).toMatch(
      /@utility fui-button-danger \{\n {2}--tw-sort: pointer-events;\n {2}background-color: [^\n]+\n {2}--fui-ring-color: var\(--fui-button-danger-ring-color\);\n {2}--fui-ring-border-color: var\(--fui-button-danger-ring-border-color\);\n\}/,
    )
  })

  it('the focus ring reads them over its own colours', () => {
    expect(css).toMatch(
      /@utility fui-focus-ring \{\n {2}--tw-sort: container-type;\n {2}border-color: var\(--fui-ring-border-color, var\(--fui-focus-ring-border-color\)\);\n {2}outline-color: var\(--fui-ring-color, var\(--fui-focus-ring-outline-color\)\);\n\}/,
    )
  })

  it('registers them uninherited, so a ring inside the element keeps its own colour', () => {
    for (const name of ['--fui-ring-color', '--fui-ring-border-color']) expect(css).toContain(`@property ${name} {\n  syntax: '*';\n  inherits: false;\n}`)
  })

  it.each(['focus-ring', 'disabled', 'invalid', 'control'])('a flat recipe carrying a ring colour, %s, is refused, so it cannot override a value’s', (name) => {
    expect(() => renderBaseCss(bare, yamlRecipes(designMd(`  ${name}:\n    outlineColor: '{colors.ring}'\n    ringColor: '{colors.destructive}'`)))).toThrow(
      `recipe ${name}: ringColor belongs to a component tree’s value`,
    )
  })

  it('a value recipe’s own outline and border colours are not ring colours', () => {
    expect(renderBaseCss(bare, yamlRecipes(designMd("  panel:\n    borderColor: '{colors.ring}'\n    outlineColor: '{colors.ring}'")))).toMatch(
      /@utility fui-panel \{\n {2}--tw-sort: container-type;\n {2}border-color: var\(--fui-panel-border-color\);\n {2}outline-color: var\(--fui-panel-outline-color\);\n\}/,
    )
  })
})

describe('a text style named like a font slot', () => {
  it('maps onto the Tailwind theme, and the slot alone defines the family', () => {
    const css = renderBaseCss(defaults)
    expect(css).toContain('--text-heading: var(--fui-text-heading-size);')
    expect(css).toContain('--text-heading--font-weight: var(--fui-text-heading-weight);')
    expect(css.match(/ --font-heading:[^;]*;/g)).toEqual([' --font-heading: var(--fui-font-heading);'])
  })
})

describe('the utilities a brand defines', () => {
  it('names the text styles and radii the theme emits; one shadowing a font size is left out', () => {
    const own = { ...bare, font: { ...bare.font, size: { $type: 'dimension', lg: { $value: { value: 1.125, unit: 'rem' } } } }, text: { $type: 'typography', lg: {}, mono: {}, poster: {} } }
    const radius = { $type: 'dimension', base: { $value: { value: 0.5, unit: 'rem' } }, md: { $value: { value: 0.4, unit: 'rem' } } }
    expect(brandUtilities({ ...own, radius })).toEqual({
      text: ['mono', 'poster', 'heading', 'body', 'ui', 'small', 'caption', 'control', 'display', 'headline', 'page-title', 'title', 'subheading', 'lead', 'copy', 'note', 'description', 'micro'],
      rounded: ['base', 'md'],
    })
  })
})

describe('the shadow keyword none', () => {
  it('a base override takes a family’s shadow off', () => {
    const css = renderBaseCss(bare, yamlRecipes(designMd("  panel:\n    shadow: '{shadow.xs}'\n  alert:\n    base:\n      extends: 'panel'\n      shadow: none\n    variants: {}\n    defaults: {}")))
    expect(css).toContain('--fui-alert-shadow: none;')
    expect(recipeValueProblem('shadow', 'none')).toBeNull()
  })
})

describe('a value overriding a family it uses', () => {
  it('renders the value’s declaration after the family’s, in its own utility', () => {
    const css = renderBaseCss(
      bare,
      yamlRecipes(
        designMd(
          "  frame:\n    border: '{border.default}'\n    borderColor: '{colors.ring}'\n  tag:\n    variants:\n      tone:\n        a:\n          extends: 'frame'\n          border: '{border.default}'\n    defaults: {}",
        ),
      ),
    )
    const utility = css.slice(css.indexOf('@utility fui-tag-a {'))
    const body = utility.slice(0, utility.indexOf('\n}'))
    expect(body.indexOf('border-color:')).toBeGreaterThan(0)
    expect(body.indexOf('  border:')).toBeGreaterThan(body.indexOf('border-color:'))
  })
})

describe('the scrollbar property', () => {
  it('hides the scrollbar: scrollbar-width on the element, the webkit scrollbar under its own selector', () => {
    const css = renderBaseCss(defaults, yamlRecipes(designMd('  list:\n    base:\n      scrollbar: none')))
    expect(css).toContain('--fui-list-scrollbar: none;')
    expect(css).toMatch(
      /@utility fui-list \{\n {2}--tw-sort: container-type;\n {2}scrollbar-width: var\(--fui-list-scrollbar\);\n {2}&::-webkit-scrollbar \{\n {4}display: var\(--fui-list-scrollbar\);\n {2}\}\n\}/,
    )
  })

  it('takes none only, at the top level only', () => {
    expect(recipeValueProblem('scrollbar', 'none')).toBeNull()
    expect(recipeValueProblem('scrollbar', 'thin')).toBe('thin — scrollbar takes none only')
    expect(isRecipeDefinition({ scrollbar: 'none' })).toBe(true)
    expect(isRecipeDefinition({ scrollbar: 'auto' })).toBe(false)
    expect(isRecipeDefinition({ hover: { scrollbar: 'none' } })).toBe(false)
    const css = renderBaseCss(defaults, yamlRecipes(designMd('  list:\n    base:\n      scrollbar: thin\n      hover:\n        scrollbar: none')))
    expect(css).not.toContain('scrollbar')
  })
})

describe('a container size', () => {
  it('sets a width, a min width or a max width, and nothing else', () => {
    expect(recipeValueProblem('maxWidth', '{container.md}')).toBeNull()
    expect(recipeValueProblem('width', '{container.xs}')).toBeNull()
    expect(recipeValueProblem('minWidth', '{container.3xs}')).toBeNull()
    expect(recipeValueProblem('padding', '{container.md}')).toMatch(/sets width, minWidth or maxWidth only/)
    expect(recipeValueProblem('height', '{container.md}')).toMatch(/sets width, minWidth or maxWidth only/)
    expect(recipeValueProblem('maxWidth', '{container.m d}')).toMatch(/not a token reference/)
  })

  it('names the container in the message a width refuses', () => {
    expect(recipeValueProblem('maxWidth', '200px')).toMatch(/takes \{spacing.<n>\} or \{container.<name>\}/)
    expect(recipeValueProblem('height', '200px')).toMatch(/takes \{spacing.<n>\}; height also takes/)
  })
})

describe('a Reka popup keyword', () => {
  it('renders on the element, where Reka sets the variable, and declares nothing at the root', () => {
    const css = renderBaseCss(bare, yamlRecipes(designMd("  select-content:\n    base:\n      width: trigger\n      minWidth: '{spacing.8}'\n      '@md': { maxWidth: available }")))
    expect(css).toMatch(
      /@utility fui-select-content \{\n {2}--tw-sort: container-type;\n {2}width: var\(--reka-select-trigger-width\);\n {2}min-width: var\(--fui-select-content-min-width\);\n {2}@container \(width >= 28rem\) \{\n {4}max-width: var\(--reka-select-content-available-width\);\n {2}\}\n\}/,
    )
    expect(css).toContain('--fui-select-content-min-width: calc(var(--fui-spacing) * 8);')
    expect(css).not.toContain('--fui-select-content-width')
    expect(css).not.toContain('--fui-select-content-md-max-width')
  })
})
