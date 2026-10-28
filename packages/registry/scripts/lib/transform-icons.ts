import type { CodemodPlugin } from 'vue-metamorph'

const ICON_LIB_ATTRS = new Set(['lucide', 'tabler', 'hugeicons', 'phosphor', 'remixicon'])
const ICON_PLACEHOLDER_SOURCE_RE = /icon-placeholder/i

interface VAttributeLike {
  type: 'VAttribute'
  directive: boolean
  key?: { name?: { name?: string } | string; rawName?: string }
  value?: { type: 'VLiteral'; value: string } | null
}

function getAttributeKeyName(attr: VAttributeLike): string | undefined {
  const key = attr.key as any
  if (!key) return undefined
  if (typeof key.name === 'string') return key.name
  if (key.name && typeof key.name.name === 'string') return key.name.name
  return undefined
}

function findStaticAttribute(element: any, name: string): VAttributeLike | undefined {
  const attrs = element?.startTag?.attributes ?? []
  return attrs.find((attr: VAttributeLike) => attr.type === 'VAttribute' && attr.directive === false && getAttributeKeyName(attr) === name)
}

/** One plugin per file: it collects the file's icon names in closure state. */
export function makeTransformIconsPlugin(): CodemodPlugin {
  return {
    type: 'codemod',
    name: 'transform-icon-placeholder',
    transform({ scriptASTs, sfcAST, utils: { astHelpers, traverseScriptAST, traverseTemplateAST } }) {
      let count = 0
      const iconsToImport = new Set<string>()

      if (sfcAST) {
        traverseTemplateAST(sfcAST, {
          enterNode(node: any) {
            if (node.type !== 'VElement' || node.rawName !== 'IconPlaceholder') return
            const lucideAttr = findStaticAttribute(node, 'lucide')
            if (!lucideAttr || lucideAttr.value?.type !== 'VLiteral') return
            const iconName = lucideAttr.value.value
            if (!iconName) return
            node.name = iconName
            node.rawName = iconName
            const attrs = node.startTag?.attributes ?? []
            node.startTag.attributes = attrs.filter((attr: VAttributeLike) => {
              if (attr.type !== 'VAttribute' || attr.directive) return true
              const keyName = getAttributeKeyName(attr)
              return keyName === undefined || !ICON_LIB_ATTRS.has(keyName)
            })
            iconsToImport.add(iconName)
            count++
          },
          leaveNode() {},
        })
      }

      // Icon imports go to the script that imported the placeholder; a part's other script keeps its default export as written.
      for (const scriptAST of scriptASTs) {
        let imported = false
        traverseScriptAST(scriptAST, {
          visitImportDeclaration(path: any) {
            const source = path.node?.source?.value
            if (typeof source === 'string' && ICON_PLACEHOLDER_SOURCE_RE.test(source)) {
              imported = true
              path.prune()
              return false
            }
            this.traverse(path)
            return undefined
          },
        })
        if (imported) for (const iconName of iconsToImport) astHelpers.createNamedImport(scriptAST, '@lucide/vue', iconName)
      }

      return count
    },
  }
}
