import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createSSRApp, getCurrentInstance, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import * as reka from 'reka-ui'
import { TabsList as RekaTabsList } from 'reka-ui'
import { describe, expect, it } from 'vitest'
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs'

describe('a wrapper that forwards its props to Reka', () => {
  it("leaves Reka's true default alone when the prop is not passed: TabsList keeps looping focus", async () => {
    const received: unknown[] = []
    const app = createSSRApp({
      render: () => h(Tabs, { defaultValue: 'a' }, () => h(TabsList, null, () => [h(TabsTrigger, { value: 'a' }, () => 'A'), h(TabsTrigger, { value: 'b' }, () => 'B')])),
    })
    app.mixin({
      created() {
        const instance = getCurrentInstance()!
        if (instance.type === RekaTabsList) received.push(instance.props.loop)
      },
    })
    await renderToString(app)
    expect(received).toEqual([true])
  })

  it("forwards with useForwardProps whenever a Reka prop it declares defaults to true, so Vue's false for an unset boolean never reaches Reka", () => {
    const root = join(import.meta.dirname, '../..')
    const overriding = globSync('{ui,sections,templates}/**/*.vue', { cwd: root })
      .filter((file) => !file.endsWith('.example.vue'))
      .flatMap((file) => {
        const source = readFileSync(join(root, file), 'utf8')
        if (/useForwardProps/.test(source)) return []
        const declared = source.match(/defineProps<([\s\S]*?)>\(/)?.[1] ?? ''
        const components =
          source
            .match(/import \{([^}]*)\} from 'reka-ui'/)?.[1]
            ?.split(',')
            .map((name) => name.trim()) ?? []
        return components.flatMap((component) =>
          declared.includes(`${component}Props`)
            ? Object.entries((reka as unknown as Record<string, { props?: Record<string, { type?: unknown; default?: unknown }> }>)[component]?.props ?? {})
                .filter(([, prop]) => [prop.type].flat().includes(Boolean) && prop.default === true)
                .map(([name]) => `${file}: ${component}.${name}`)
            : [],
        )
      })
    expect(overriding).toEqual([])
  })
})
