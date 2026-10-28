import { cp, glob, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { recipeFileText } from '@frontic/library-contract/recipe'
import { runChecks } from '@/src/check'
import { defaultBrand } from '@/src/library'
import { getConfig } from '@/src/utils/get-config'

const registry = join(import.meta.dirname, '../../../registry')
let cwd: string

const config = async () => (await getConfig(cwd))!
const write = (file: string, text: string) => mkdir(join(cwd, file, '..'), { recursive: true }).then(() => writeFile(join(cwd, file), text))
const setRules = async (check: unknown) => {
  const file = JSON.parse(await readFile(join(cwd, 'components.json'), 'utf8'))
  await writeFile(join(cwd, 'components.json'), JSON.stringify({ ...file, check }))
}
const PAGE = '<template>\n  <Button>{{ $t("buy") }}</Button>\n</template>\n'

beforeAll(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'frontic-ui-check-'))
  await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: 'shop' }))
  await writeFile(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['./*'] } } }))
  await writeFile(join(cwd, 'components.json'), JSON.stringify({ style: 'bare', tailwind: { css: 'assets/css/tailwind.css' }, aliases: { components: '@/components' } }))
  await write('library/brand.json', defaultBrand())
  for await (const shared of glob('recipes/shared/*.json', { cwd: registry })) await cp(join(registry, shared), join(cwd, 'library/recipes', basename(shared)))
  for await (const manifest of glob('{ui,sections,templates}/*/*.json', { cwd: registry })) {
    const name = basename(join(manifest, '..'))
    if (basename(manifest) === `${name}.json`) await write(`components/${manifest}`, await readFile(join(registry, manifest), 'utf8'))
  }
  await mkdir(join(cwd, 'components/ui'), { recursive: true })
  await cp(join(registry, 'ui/button/Button.vue'), join(cwd, 'components/ui/button/Button.vue'))
  await write('app/pages/index.vue', PAGE)
}, 60_000)

afterAll(() => rm(cwd, { recursive: true, force: true }))

describe('runChecks', () => {
  it('refuses a brand reference that does not resolve, naming brand.json and the token path', async () => {
    const tokens = JSON.parse(defaultBrand())
    tokens.color.action.secondary = { $value: '{font.size.base}' }
    await write('library/brand.json', JSON.stringify(tokens))
    try {
      await expect(runChecks(await config(), {})).rejects.toThrow('library/brand.json:\ncolor.action.secondary: {font.size.base}, a token of another $type')
    } finally {
      await write('library/brand.json', defaultBrand())
    }
  })

  it('a clean project has no findings', async () => {
    const result = await runChecks(await config(), {})
    expect(result.findings).toEqual([])
    expect(result.files).toBe(2)
  }, 60_000)

  it('warns once when DESIGN.md front matter has components:, which nothing compiles; the key in the body or under another key is no finding', async () => {
    try {
      await write('library/DESIGN.md', '---\nname: Shop\ncomponents:\n  button:\n    base: { bg: "{colors.primary}" }\n  badge:\n    base: {}\n---\n\n## Components\n')
      expect((await runChecks(await config(), {})).findings).toEqual([
        {
          rule: 'design-md',
          severity: 'warn',
          where: 'library/DESIGN.md',
          message: "components: is not compiled; recipes live in each component's manifest and in library/recipes/",
          file: 'library/DESIGN.md',
        },
      ])
      expect((await runChecks(await config(), { strict: true })).findings).toEqual([expect.objectContaining({ rule: 'design-md', severity: 'error' })])
      await write('library/DESIGN.md', '---\nname: Shop\nfrontic:\n  components: []\n---\n\ncomponents: are described below.\n')
      expect((await runChecks(await config(), {})).findings).toEqual([])
    } finally {
      await rm(join(cwd, 'library/DESIGN.md'), { force: true })
    }
  }, 60_000)

  it('a stock class in a page is a drift error', async () => {
    await write('app/pages/index.vue', '<template>\n  <div class="bg-blue-500">{{ $t("x") }}</div>\n</template>\n')
    try {
      const { findings } = await runChecks(await config(), {})
      expect(findings).toEqual([expect.objectContaining({ rule: 'drift', severity: 'error', where: expect.stringMatching(/^app\/pages\/index\.vue:2:\d+$/) })])
    } finally {
      await write('app/pages/index.vue', PAGE)
    }
  }, 60_000)

  it('a parse error is a drift error', async () => {
    await write('app/pages/broken.vue', '<script setup lang="ts">\nconst = 1\n</script>\n')
    try {
      const { findings } = await runChecks(await config(), {})
      expect(findings).toEqual([expect.objectContaining({ rule: 'drift', severity: 'error', where: expect.stringMatching(/^app\/pages\/broken\.vue:2:/) })])
    } finally {
      await rm(join(cwd, 'app/pages/broken.vue'))
    }
  }, 60_000)

  it('raw text in an item is a warning, and strict makes it an error', async () => {
    const button = join(cwd, 'components/ui/button/Button.vue')
    const source = await readFile(button, 'utf8')
    await writeFile(button, source.replace('<slot />', '<slot />Buy'))
    try {
      const loose = await runChecks(await config(), {})
      expect(loose.findings).toEqual([expect.objectContaining({ rule: 'raw-text', severity: 'warn', where: expect.stringMatching(/^components\/ui\/button\/Button\.vue:\d+:\d+$/) })])
      const strict = await runChecks(await config(), { strict: true })
      expect(strict.findings).toEqual([expect.objectContaining({ rule: 'raw-text', severity: 'error' })])
    } finally {
      await writeFile(button, source)
    }
  }, 60_000)

  it('raw text in an installed section is a warning too', async () => {
    await write('components/sections/promo/Promo.vue', '<template>\n  <p>Free shipping</p>\n</template>\n')
    try {
      const { findings } = await runChecks(await config(), {})
      expect(findings).toEqual([expect.objectContaining({ rule: 'raw-text', severity: 'warn', where: expect.stringMatching(/^components\/sections\/promo\/Promo\.vue:2:/) })])
    } finally {
      await rm(join(cwd, 'components/sections'), { recursive: true })
    }
  }, 60_000)

  it('refuses components installed outside the project', async () => {
    const file = JSON.parse(await readFile(join(cwd, 'components.json'), 'utf8'))
    await writeFile(join(cwd, 'components.json'), JSON.stringify({ ...file, aliases: { ...file.aliases, components: '@/../shared/components' } }))
    try {
      await expect(runChecks(await config(), {})).rejects.toThrow(/outside the project/)
    } finally {
      await writeFile(join(cwd, 'components.json'), JSON.stringify(file))
    }
  }, 60_000)

  it('refuses components at the project root', async () => {
    const file = JSON.parse(await readFile(join(cwd, 'components.json'), 'utf8'))
    await writeFile(join(cwd, 'components.json'), JSON.stringify({ ...file, aliases: { ...file.aliases, components: '@/.' } }))
    try {
      await expect(runChecks(await config(), {})).rejects.toThrow(/project root/)
    } finally {
      await writeFile(join(cwd, 'components.json'), JSON.stringify(file))
    }
  }, 60_000)

  it('names the brand files when a class is outside the theme', async () => {
    await write('app/pages/index.vue', '<template>\n  <div class="bg-blue-500">{{ $t("x") }}</div>\n</template>\n')
    try {
      const [finding] = (await runChecks(await config(), {})).findings
      expect(finding?.message).toContain('library/brand.json, the component manifests and library/recipes/')
      expect(finding?.message).not.toContain('styles/base.css')
    } finally {
      await write('app/pages/index.vue', PAGE)
    }
  }, 60_000)

  it('AAA turns the default brand’s mid-contrast pairs into contrast errors', async () => {
    const aa = await runChecks(await config(), {})
    expect(aa.findings.filter((f) => f.rule === 'contrast')).toEqual([])
    const aaa = await runChecks(await config(), { contrast: 'AAA' })
    const contrast = aaa.findings.filter((f) => f.rule === 'contrast')
    expect(contrast.length).toBeGreaterThan(0)
    expect(contrast.every((f) => f.severity === 'error' && /needs (7|4\.5):1$/.test(f.message))).toBe(true)
    await setRules({ contrast: 'AAA' })
    try {
      expect((await runChecks(await config(), {})).findings.filter((f) => f.rule === 'contrast')).toEqual(contrast)
    } finally {
      await setRules(undefined)
    }
  }, 60_000)

  it('a brand without primary-hover gets it derived, so no recipe misses it', async () => {
    const brand = JSON.parse(defaultBrand())
    delete brand.color.action['primary-hover']
    await write('library/brand.json', JSON.stringify(brand))
    try {
      const missing = (await runChecks(await config(), {})).findings.filter((f) => f.rule === 'missing-token')
      expect(missing.filter((f) => f.message.includes('primary-hover'))).toEqual([])
    } finally {
      await write('library/brand.json', defaultBrand())
    }
  }, 60_000)

  it('a hover that could not be derived is a missing-token error that says why', async () => {
    const brand = JSON.parse(defaultBrand())
    delete brand.color.action['primary-hover']
    brand.color.action.primary.$value = { colorSpace: 'srgb', components: [0, 0, 0], hex: '#000000' }
    brand.color.action['primary-foreground'].$value = { colorSpace: 'srgb', components: [0.4588, 0.4588, 0.4588], hex: '#757575' }
    await write('library/brand.json', JSON.stringify(brand))
    try {
      const missing = (await runChecks(await config(), {})).findings.filter((f) => f.rule === 'missing-token')
      expect(missing).toContainEqual({
        rule: 'missing-token',
        severity: 'error',
        where: expect.stringMatching(/^button\./),
        message: '{colors.primary-hover} is not derived: a derived hover would fall to 2.95:1 against primary-foreground; set it in library/brand.json',
        file: 'components/ui/button/button.json',
        recipe: 'button',
      })
    } finally {
      await write('library/brand.json', defaultBrand())
    }
  }, 60_000)

  it('two values of different axes setting one property with no with pair between them are an axis-collision warning', async () => {
    await write(
      'components/ui/nav/nav.json',
      JSON.stringify({ recipes: { nav: { variants: { layout: { captioned: { textColor: '{colors.muted-foreground}' } }, tone: { highlight: { textColor: '{colors.destructive}' } } } } } }),
    )
    try {
      const found = (await runChecks(await config(), {})).findings.filter((f) => f.rule === 'axis-collision')
      expect(found).toEqual([
        {
          rule: 'axis-collision',
          severity: 'warn',
          where: 'nav',
          message: 'layout.captioned and tone.highlight both set textColor and no with pair decides; tone.highlight wins by axis order',
          file: 'components/ui/nav/nav.json',
          recipe: 'nav',
        },
      ])
      await setRules({ rules: { 'axis-collision': 'off' } })
      expect((await runChecks(await config(), {})).findings.filter((f) => f.rule === 'axis-collision')).toEqual([])
    } finally {
      await setRules(undefined)
      await rm(join(cwd, 'components/ui/nav'), { recursive: true })
    }
  }, 60_000)

  it('rules at off produce nothing', async () => {
    const brand = JSON.parse(defaultBrand())
    delete brand.color.action['primary-hover']
    await write('library/brand.json', JSON.stringify(brand))
    await write('app/pages/index.vue', '<template>\n  <div class="bg-blue-500">Buy</div>\n</template>\n')
    await setRules({ contrast: 'AAA', rules: { drift: 'warn', 'raw-text': 'off', contrast: 'off', 'missing-token': 'off', 'axis-collision': 'off' } })
    try {
      const { findings } = await runChecks(await config(), {})
      expect(findings.map((f) => `${f.rule}:${f.severity}`)).toEqual(['drift:warn'])
    } finally {
      await setRules(undefined)
      await write('library/brand.json', defaultBrand())
      await write('app/pages/index.vue', PAGE)
    }
  }, 60_000)

  it('warns about a component manifest whose keys run out of order, under manifest', async () => {
    await write('components/ui/chip/chip.json', JSON.stringify({ recipes: { chip: { base: {}, composes: ['focus-ring'] } }, title: 'Chip' }))
    try {
      expect((await runChecks(await config(), {})).findings).toEqual([
        {
          rule: 'manifest',
          severity: 'warn',
          where: 'components/ui/chip/chip.json',
          message: 'keys run recipes, title; a manifest orders them title, recipes; check --fix rewrites it',
          file: 'components/ui/chip/chip.json',
        },
        {
          rule: 'manifest',
          severity: 'warn',
          where: 'components/ui/chip/chip.json',
          message: 'recipes: chip: keys run base, composes; a tree orders them composes, base; check --fix rewrites it',
          file: 'components/ui/chip/chip.json',
        },
      ])
    } finally {
      await rm(join(cwd, 'components/ui/chip'), { recursive: true })
    }
  }, 60_000)

  it('warns about a top-level composes, and about an element whose tree does not compose what it wears, and still builds', async () => {
    await write('components/ui/chip/chip.json', JSON.stringify({ title: 'Chip', recipes: { chip: { base: {} } }, composes: ['focus-ring'] }))
    await write('components/ui/stamp/stamp.json', JSON.stringify({ title: 'Stamp', recipes: { stamp: { composes: ['disabled'], base: {} } } }))
    await write('components/ui/stamp/Stamp.vue', '<template><span class="fui-stamp disabled:fui-disabled focus-visible:fui-focus-ring" /><p class="fui-hint" /></template>\n')
    try {
      expect((await runChecks(await config(), {})).findings.filter((f) => f.rule === 'manifest' || f.rule === 'composes')).toEqual([
        {
          rule: 'manifest',
          severity: 'warn',
          where: 'components/ui/chip/chip.json',
          message: 'composes: move composes into the trees that wear it, "<tree>": { "composes": [ … ] }',
          file: 'components/ui/chip/chip.json',
        },
        {
          rule: 'composes',
          severity: 'warn',
          where: 'components/ui/stamp/Stamp.vue',
          message: 'fui-focus-ring sits on an element of stamp; compose it there: "stamp": { "composes": [..., "focus-ring"] }',
          file: 'components/ui/stamp/Stamp.vue',
        },
        {
          rule: 'composes',
          severity: 'warn',
          where: 'components/ui/stamp/Stamp.vue',
          message: 'fui-hint sits on an element with no tree of its own, so it answers to stamp; compose it there: "stamp": { "composes": [..., "hint"] }',
          file: 'components/ui/stamp/Stamp.vue',
        },
      ])
    } finally {
      await rm(join(cwd, 'components/ui/chip'), { recursive: true })
      await rm(join(cwd, 'components/ui/stamp'), { recursive: true })
    }
  }, 60_000)

  it('refuses the layout before 1.0, naming the file and the add to run', async () => {
    await write('library/recipes/card.json', recipeFileText({ card: { base: {} } }))
    try {
      await expect(runChecks(await config(), {})).rejects.toThrow(
        "library/recipes/card.json: holds the component tree card, the layout before 1.0; a component's trees live in its manifest beside its files: delete this file and run `npx @frontic/ui add card` again",
      )
    } finally {
      await rm(join(cwd, 'library/recipes/card.json'))
    }
  }, 60_000)

  it('a stale frontic.css does not change the drift result', async () => {
    const clean = await runChecks(await config(), {})
    await write('assets/css/frontic.css', '@import "tailwindcss";\n')
    try {
      expect(await runChecks(await config(), {})).toEqual(clean)
    } finally {
      await rm(join(cwd, 'assets/css/frontic.css'))
    }
  }, 60_000)
})
