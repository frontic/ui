import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { transform } from '@/src/utils/transformers'
import { getConfig } from '@/src/utils/get-config'

const VUE = ['<!-- SPDX-License-Identifier: FSL-1.1-MIT AND MIT -->', '<!-- Frontic UI © Frontic · Portions © 2023 unovue (shadcn-vue, MIT) · ui.frontic.com/license -->']
const TS = ['// SPDX-License-Identifier: FSL-1.1-MIT AND MIT', '// Frontic UI © Frontic · Portions © 2023 unovue (shadcn-vue, MIT) · ui.frontic.com/license']

const component = `${VUE.join('\n')}
<script setup lang="ts">
import { Button } from '@library/components/ui/button'
const count: number = 1
</script>

<template>
  <Button>{{ count }}</Button>
</template>
`
const barrel = `${TS.join('\n')}
export { default as Button } from './Button.vue'
`

let cwd: string
afterEach(() => rm(cwd, { recursive: true, force: true }))

describe('an installed registry file', () => {
  it.each([true, false])('keeps its licence lines first, typescript %s', async (typescript) => {
    cwd = await mkdtemp(join(tmpdir(), 'licence-'))
    await writeFile(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['./app/*'] } } }))
    await writeFile(join(cwd, 'components.json'), JSON.stringify({ style: 'bare', typescript, tailwind: { css: 'app/assets/tailwind.css' }, aliases: { components: '@/components' } }))
    const config = (await getConfig(cwd))!
    const install = (filename: string, raw: string) => transform({ filename, raw, config, iconMap: {} as never })
    expect((await install('Button.vue', component)).split('\n').slice(0, 2)).toEqual(VUE)
    expect((await install(typescript ? 'index.ts' : 'index.js', barrel)).split('\n').slice(0, 2)).toEqual(TS)
  })
})
