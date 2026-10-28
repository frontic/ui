import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { load } from 'js-yaml'
import { isTree, recipeFileText, splitRecipes } from '../src/recipe.mjs'

/** Recipes a test writes as a YAML `components:` block, the way it reads easiest: the block's entries as one name-to-recipe map. */
export const yamlComponents = (block) => load(`components:\n${block}`)?.components ?? {}

/** The recipes of a front matter's `components:` block, split as the readers return them; none for no front matter. */
export function yamlRecipes(designMd) {
  const front = designMd ? /^---\r?\n([\s\S]*?)\r?\n---/.exec(designMd) : null
  return splitRecipes(front ? load(front[1])?.components : {})
}

/** Writes each recipe of a YAML `components:` block to `<library>/recipes/`, trees at the root and flat recipes in `shared/`, as `add` writes them. */
export async function writeRecipes(library, block) {
  for (const [name, recipe] of Object.entries(yamlComponents(block))) {
    const file = path.join(library, 'recipes', ...(isTree(recipe) ? [] : ['shared']), `${name}.json`)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, recipeFileText({ [name]: recipe }))
  }
}
