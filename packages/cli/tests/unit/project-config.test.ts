import { describe, expect, it } from 'vitest'
import { NUXT_PROJECT, projectConfig } from '@/src/project-config'
import { DEFAULT_CHECK, rawConfigSchema } from '@/src/schema'

describe('projectConfig', () => {
  it('writes a components.json the schema reads back unchanged for a new Nuxt project', () => {
    const config = projectConfig(NUXT_PROJECT)!
    expect(NUXT_PROJECT).toEqual({ tailwindCssFile: 'app/assets/css/tailwind.css', aliasPrefix: '@', typescript: true })
    expect(rawConfigSchema.parse(config)).toEqual(config)
    expect(config.aliases.ui).toBe('@/components/ui')
    expect(config.check).toEqual(DEFAULT_CHECK)
    expect(config.check).not.toBe(DEFAULT_CHECK)
  })

  it('writes nothing without a Tailwind CSS file or an import alias', () => {
    expect(projectConfig({ ...NUXT_PROJECT, tailwindCssFile: null })).toBeNull()
    expect(projectConfig({ ...NUXT_PROJECT, aliasPrefix: null })).toBeNull()
  })
})
