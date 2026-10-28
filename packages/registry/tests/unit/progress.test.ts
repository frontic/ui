import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Progress } from '../../ui/progress'

const indicator = async (props: Record<string, unknown>) => {
  const html = await renderToString(h(Progress, props))
  return /<div[^>]*data-slot="progress-indicator"[^>]*>/.exec(html)![0]
}

describe('progress', () => {
  it('fills its share of max, not of 100', async () => {
    expect(await indicator({ modelValue: 3, max: 5 })).toContain('translateX(-40%)')
    expect(await indicator({ modelValue: 60 })).toContain('translateX(-40%)')
  })

  it('slides a segment instead of a fill while the value is unknown', async () => {
    const el = await indicator({ modelValue: null })
    expect(el).toContain('data-state="indeterminate"')
    expect(el).toContain('data-state-indeterminate:animate-progress-indeterminate')
    expect(el).not.toContain('transform:')
  })
})
