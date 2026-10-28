#!/usr/bin/env node
// frontic-convert-recipes <libraryDir> [--check]: rewrites the library's recipes/ from one recipe per file to recipes by name.
// --check writes nothing, prints what it would write and delete, and exits 1 when anything needs converting. A problem exits 2.
import { convertRecipeFolder } from '../src/brand.mjs'

const args = process.argv.slice(2)
const check = args.includes('--check')
const dirs = args.filter((arg) => arg !== '--check')

if (dirs.length !== 1 || dirs[0].startsWith('-')) {
  console.error('usage: frontic-convert-recipes <libraryDir> [--check]')
  process.exitCode = 2
} else {
  try {
    const { writes, removes, problems } = await convertRecipeFolder(dirs[0], { check })
    if (problems.length) {
      for (const problem of problems) console.error(problem)
      process.exitCode = 2
    } else {
      for (const { path } of writes) console.log(`write ${path}`)
      for (const path of removes) console.log(`delete ${path}`)
      process.exitCode = check && writes.length + removes.length > 0 ? 1 : 0
    }
  } catch (error) {
    console.error(error.message)
    process.exitCode = 2
  }
}
