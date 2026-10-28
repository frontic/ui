import { transform as metaTransform } from 'vue-metamorph'
import type { IconMap } from '@frontic/registry-client'
import type { Config } from '@/src/schema'
import { transformIcons } from '@/src/utils/transformers/transform-icons'
import { transformImport } from '@/src/utils/transformers/transform-import'
import { transformSFC } from '@/src/utils/transformers/transform-sfc'

export interface TransformOpts {
  filename: string
  raw: string
  config: Config
  iconMap: IconMap
}

/** A registry file as the project installs it: its imports on the project's aliases, its icons from the project's icon library, and without types when the project has none. */
export async function transform(opts: TransformOpts) {
  const source = await transformSFC(opts)
  return metaTransform(source, opts.filename, [transformImport(opts), transformIcons(opts)]).code
}
