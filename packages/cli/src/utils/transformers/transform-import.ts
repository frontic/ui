import type { CodemodPlugin } from 'vue-metamorph'
import type { TransformOpts } from '.'
import { itemAlias } from '@/src/constants'

// Items import each other through `@library/components/<tier>/<name>`, `@library/lib/<name>` and `@library/composables/<name>`; the project reaches them through its aliases.
const LIBRARY_UI = /^@library\/components\/ui\//
const LIBRARY = /^@library\/components\//
const LIBRARY_LIB = /^@library\/lib\//
const LIBRARY_COMPOSABLES = /^@library\/composables\//

export function rewriteImport(specifier: string, config: TransformOpts['config']) {
  if (LIBRARY_UI.test(specifier)) return specifier.replace(LIBRARY_UI, `${config.aliases.ui ?? `${config.aliases.components}/ui`}/`)
  if (LIBRARY.test(specifier)) return specifier.replace(LIBRARY, `${config.aliases.components}/`)
  if (LIBRARY_LIB.test(specifier)) return specifier.replace(LIBRARY_LIB, `${itemAlias(config.aliases, 'lib')}/`)
  if (LIBRARY_COMPOSABLES.test(specifier)) return specifier.replace(LIBRARY_COMPOSABLES, `${itemAlias(config.aliases, 'composables')}/`)
  return specifier
}

export function transformImport(opts: TransformOpts): CodemodPlugin {
  return {
    type: 'codemod',
    name: 'rewrite library imports to the project aliases',

    transform({ scriptASTs, utils: { traverseScriptAST } }) {
      let transformCount = 0

      for (const scriptAST of scriptASTs) {
        traverseScriptAST(scriptAST, {
          visitLiteral(path) {
            const parent = path.parent.value
            const isImport = parent.type === 'ImportDeclaration' || parent.type === 'ExportNamedDeclaration' || parent.type === 'ExportAllDeclaration' || (parent.type === 'CallExpression' && parent.callee?.name === 'import')
            if (isImport && typeof path.node.value === 'string') {
              const updated = rewriteImport(path.node.value, opts.config)
              if (updated !== path.node.value) {
                path.node.value = updated
                transformCount++
              }
            }
            return this.traverse(path)
          },
        })
      }

      return transformCount
    },
  }
}
