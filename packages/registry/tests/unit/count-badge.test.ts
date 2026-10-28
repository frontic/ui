import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '../..')

describe('count badges', () => {
  it('fill the badge they float on an icon, so the count reads as a marker and not as loose text', () => {
    const floating = ['sections', 'templates'].flatMap((tier) =>
      readdirSync(join(root, tier)).flatMap((name) =>
        readdirSync(join(root, tier, name))
          .filter((file) => file.endsWith('.vue') && !file.endsWith('.example.vue'))
          .flatMap((file) =>
            [...readFileSync(join(root, tier, name, file), 'utf8').matchAll(/<Badge\b(?:[^>"]|"[^"]*")*>/g)].filter((m) => m[0].includes('class="absolute')).map((m) => [`${name}/${file}`, m[0]]),
          ),
      ),
    )
    expect(floating.map(([file]) => file).sort()).toEqual(['cart-compact/CartCompact.vue', 'cart-minimal/CartMinimal.vue', 'header-centered/HeaderCentered.vue', 'header-shop/HeaderShop.vue'])
    expect(floating.filter(([, tag]) => !tag!.includes('variant="primary"')).map(([file]) => file)).toEqual([])
  })
})
