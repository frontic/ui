import type { CodemodPlugin } from 'vue-metamorph'
import type { TransformOpts } from '.'
import { iconLibrary } from '@/src/constants'

// Items are authored against Lucide; the map names each icon in every other library.
const SOURCE_LIBRARY = 'lucide'

export function transformIcons(opts: TransformOpts): CodemodPlugin {
  return {
    type: 'codemod',
    name: 'rewrite icon imports to the project icon library',

    transform({ scriptASTs, sfcAST, utils: { traverseScriptAST, traverseTemplateAST } }) {
      let transformCount = 0
      const { config, iconMap } = opts
      const source = iconLibrary(SOURCE_LIBRARY)!
      const target = iconLibrary(config.iconLibrary)
      if (!target || target.name === source.name) return transformCount

      // Map<originalIcon, targetedIcon>
      const targetedIconsMap: Map<string, string> = new Map()

      for (const scriptAST of scriptASTs) {
        traverseScriptAST(scriptAST, {
          visitImportDeclaration(path) {
            if (String(path.node.source.value) !== source.import) return this.traverse(path)

            let hasChanges = false
            for (const specifier of path.node.specifiers ?? []) {
              if (specifier.type === 'ImportSpecifier' && typeof specifier.imported.name === 'string') {
                const iconName = specifier.imported.name
                const targetedIcon = iconMap[iconName]?.[target.name]
                if (!targetedIcon || targetedIconsMap.has(iconName)) continue
                targetedIconsMap.set(iconName, targetedIcon)
                specifier.imported.name = targetedIcon
                hasChanges = true
              }
            }
            if (hasChanges) {
              path.node.source.value = target.import
              transformCount++
            }
            return this.traverse(path)
          },
        })
      }

      if (sfcAST && targetedIconsMap.size > 0) {
        traverseTemplateAST(sfcAST, {
          enterNode(node) {
            if (node.type === 'VElement' && targetedIconsMap.has(node.rawName)) {
              node.rawName = targetedIconsMap.get(node.rawName) ?? ''
              transformCount++
            }
          },
        })
      }

      return transformCount
    },
  }
}
