#!/usr/bin/env node
import { realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { Command } from 'commander'
import { add } from '@/src/commands/add'
import { build } from '@/src/commands/build'
import { check } from '@/src/commands/check'
import { create } from '@/src/commands/create'
import { diff } from '@/src/commands/diff'
import { info } from '@/src/commands/info'
import { init } from '@/src/commands/init'
import { mcp } from '@/src/commands/mcp'
import { search } from '@/src/commands/search'
import { skill } from '@/src/commands/skill'
import { docs } from '@/src/commands/docs'
import { view } from '@/src/commands/view'

import packageJson from '../package.json'

export { stylePresetPath } from '@frontic/library-contract/brand'

process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

function main() {
  const program = new Command()
    .name('frontic-ui')
    .description('install Frontic UI items and build their look from your library')
    .version(packageJson.version, '-v, --version', 'display the version number')

  program.addCommand(init).addCommand(create).addCommand(add).addCommand(build).addCommand(check).addCommand(docs).addCommand(view).addCommand(search).addCommand(diff).addCommand(info).addCommand(mcp).addCommand(skill)

  program.parse()
}

// The bundle is also imported by its tests, which must not run the program.
const invoked = process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url
if (invoked) main()
