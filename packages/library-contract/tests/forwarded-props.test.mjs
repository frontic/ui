import { describe, expect, it } from 'vitest'
import { forwardedPropsProblems } from '../src/forwarded-props.mjs'

const sfc = (script, template) => `<script setup lang="ts">\n${script}\n</script>\n\n<template>\n${template}\n</template>\n`

describe('forwardedPropsProblems', () => {
  it('finds props or a reactiveOmit of them bound straight onto a Reka part', () => {
    const source = sfc(
      "import { DialogTitle, DialogTrigger } from 'reka-ui'\nconst props = defineProps<{ class?: string }>()\nconst delegatedProps = reactiveOmit(props, 'class')",
      '  <DialogTrigger v-bind="props" />\n  <DialogTitle\n    v-bind="delegatedProps"\n  />',
    )
    expect(forwardedPropsProblems(source, 'X.vue')).toEqual([
      { file: 'X.vue', line: 8, part: 'DialogTrigger', binding: 'props' },
      { file: 'X.vue', line: 10, part: 'DialogTitle', binding: 'delegatedProps' },
    ])
  })

  it('accepts what useForwardProps or useForwardPropsEmits returns, and a part that is not Reka’s', () => {
    const source = sfc(
      "import { DialogTitle, useForwardProps } from 'reka-ui'\nimport { Button } from '@library/components/ui/button'\nconst props = defineProps<{ class?: string }>()\nconst forwarded = useForwardProps(reactiveOmit(props, 'class'))",
      '  <DialogTitle v-bind="forwarded" />\n  <Button v-bind="props" />',
    )
    expect(forwardedPropsProblems(source, 'Y.vue')).toEqual([])
  })
})
