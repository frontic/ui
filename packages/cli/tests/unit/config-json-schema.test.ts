import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { configJsonSchema } from '@/src/config-json-schema'

const served = join(import.meta.dirname, '../../../registry/public/schema.json')

type Node = { type?: string; description?: string; properties?: Record<string, Node> }
const nodes = (node: Node, at: string[] = []): [string, Node][] => [
  ...(at.length ? ([[at.join('.'), node]] as [string, Node][]) : []),
  ...Object.entries(node.properties ?? {}).flatMap(([key, child]) => nodes(child, [...at, key])),
]

describe('the served components.json schema', () => {
  // `pnpm --filter @frontic/ui schema` rewrites the served file from the CLI's schema.
  if (process.env.WRITE_SCHEMA) writeFileSync(served, `${JSON.stringify(configJsonSchema(), null, 2)}\n`)

  it('is the schema the CLI validates against', () => {
    expect(JSON.parse(readFileSync(served, 'utf8'))).toEqual(configJsonSchema())
  })

  it('describes every setting and every group of them', () => {
    expect(
      nodes(configJsonSchema() as Node)
        .filter(([, node]) => !node.description)
        .map(([path]) => path),
    ).toEqual([])
  })
})
