// The axes an item's files name and the combinations of their values: what the look check and the preview canvas walk.
import { cva } from 'class-variance-authority'
import ts from 'typescript'

/** An item's files on one side: the legacy JSON, or the registry's own `ui/<name>/`. */
export type Files = Record<string, string>

const isWord = (text: string, word: string) => new RegExp(`(?<![\\w-])${word.replace(/[-]/g, '\\-')}(?![\\w-])`).test(text)

const scriptOf = (text: string) => (text.includes('<template') || text.includes('<script') ? [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n') : text)
export const js = (code: string) =>
  ts
    .transpile(`(${code})`, { target: ts.ScriptTarget.ES2022 })
    .replace(/^"use strict";\s*/, '')
    .trim()
    .replace(/;$/, '')

/** Every top-level `const` of a file's script the template can read: cva calls, literal maps, strings. Others are skipped. */
export function scriptConsts(files: Files): { values: Record<string, unknown>; axes: Record<string, Set<string>> } {
  const values: Record<string, unknown> = {}
  const axes: Record<string, Set<string>> = {}
  for (const text of Object.values(files)) {
    const source = ts.createSourceFile('c.ts', scriptOf(text), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    for (const statement of source.statements) {
      const list = ts.isVariableStatement(statement) ? statement.declarationList.declarations : []
      for (const decl of list) {
        if (!ts.isIdentifier(decl.name) || !decl.initializer) continue
        const init = decl.initializer
        const isCva = ts.isCallExpression(init) && ts.isIdentifier(init.expression) && init.expression.text === 'cva'
        if (!isCva && !ts.isObjectLiteralExpression(init) && !ts.isArrayLiteralExpression(init) && !ts.isStringLiteral(init) && !ts.isAsExpression(init)) continue
        try {
          // an earlier const is in scope: `classes` reads the `toast` cva above it
          const value = new Function('cva', ...Object.keys(values), `return ${js(init.getText(source))}`)(cva, ...Object.values(values)) as unknown
          values[decl.name.text] = value
          if (isCva) {
            const config = new Function(`return ${js(init.arguments[1]?.getText(source) ?? '{}')}`)() as { variants?: Record<string, Record<string, string>> }
            for (const [axis, own] of Object.entries(config.variants ?? {})) for (const value of Object.keys(own)) (axes[axis] ??= new Set()).add(value)
          }
        } catch {
          // a const that reads something outside the script stays out of scope
        }
      }
    }
  }
  return { values, axes }
}

/** The interfaces and type-literal aliases a set of files declares, by name. */
function namedTypes(texts: string[]): Map<string, ts.TypeElement[]> {
  const named = new Map<string, ts.TypeElement[]>()
  for (const text of texts) {
    const source = ts.createSourceFile('t.ts', scriptOf(text), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    for (const statement of source.statements) {
      if (ts.isInterfaceDeclaration(statement)) named.set(statement.name.text, [...statement.members])
      else if (ts.isTypeAliasDeclaration(statement) && ts.isTypeLiteralNode(statement.type)) named.set(statement.name.text, [...statement.type.members])
    }
  }
  return named
}

/** The members a file's `defineProps<…>()` declares, reading through an interface or alias `named` holds. */
function declaredProps(text: string, named = namedTypes([text])): ts.PropertySignature[] {
  const source = ts.createSourceFile('p.ts', scriptOf(text), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const members = (type: ts.TypeNode): ts.TypeElement[] =>
    ts.isTypeLiteralNode(type)
      ? [...type.members]
      : ts.isIntersectionTypeNode(type)
        ? type.types.flatMap(members)
        : ts.isParenthesizedTypeNode(type)
          ? members(type.type)
          : ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName)
            ? (named.get(type.typeName.text) ?? [])
            : []
  const out: ts.PropertySignature[] = []
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'defineProps' && node.typeArguments?.[0])
      for (const member of members(node.typeArguments[0])) if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) out.push(member)
    ts.forEachChild(node, visit)
  }
  visit(source)
  return out
}

/** The type aliases a set of files declares as a union of string literals, by name: `type Size = 'sm' | 'md'`. */
function literalAliases(texts: string[]): Map<string, string[]> {
  const aliases = new Map<string, string[]>()
  for (const text of texts) {
    const source = ts.createSourceFile('a.ts', scriptOf(text), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    for (const statement of source.statements) {
      if (!ts.isTypeAliasDeclaration(statement)) continue
      const parts = ts.isUnionTypeNode(statement.type) ? statement.type.types : [statement.type]
      const literals = parts.flatMap((t) => (ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal) ? [t.literal.text] : []))
      if (literals.length === parts.length && literals.length) aliases.set(statement.name.text, literals)
    }
  }
  return aliases
}

/** The string-literal unions and booleans each file's `defineProps` declares: `side?: 'top' | 'left'` → side: [top, left].
 * `aliases`: literal unions a prop may name instead of spelling its values out. */
export function propAxes(files: Files, aliases: Map<string, string[]> = new Map()): { axes: Record<string, Set<string>>; booleans: Set<string> } {
  const axes: Record<string, Set<string>> = {}
  const booleans = new Set<string>()
  for (const text of Object.values(files)) {
    for (const member of declaredProps(text)) {
      if (!member.type) continue
      const name = (member.name as ts.Identifier).text
      const parts = ts.isUnionTypeNode(member.type) ? member.type.types : [member.type]
      const literals = parts.flatMap((t) => (ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal) ? [t.literal.text] : []))
      const alias = ts.isTypeReferenceNode(member.type) && ts.isIdentifier(member.type.typeName) ? aliases.get(member.type.typeName.text) : undefined
      if (literals.length === parts.length && literals.length) for (const v of literals) (axes[name] ??= new Set()).add(v)
      else if (alias) for (const v of alias) (axes[name] ??= new Set()).add(v)
      else if (member.type.kind === ts.SyntaxKind.BooleanKeyword) booleans.add(name)
    }
  }
  for (const name of booleans) axes[name] = new Set(['true', 'false'])
  return { axes, booleans }
}

/** Every prop name a file's `defineProps<…>()` declares, of any type; `types` adds files whose interfaces it may name. */
export function propNames(files: Files, types: Files = {}): Set<string> {
  const named = namedTypes([...Object.values(files), ...Object.values(types)])
  return new Set(Object.values(files).flatMap((text) => declaredProps(text, named).map((member) => (member.name as ts.Identifier).text)))
}

export const comboKey = (combo: Record<string, string>) =>
  Object.entries(combo)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ')

export function product(axes: [string, string[]][]): Record<string, string>[] {
  return axes.reduce<Record<string, string>[]>((all, [axis, values]) => all.flatMap((combo) => values.map((value) => ({ ...combo, [axis]: value }))), [{}])
}

/** The axes an item's elements may read: every cva value of both sides, plus `extra`. */
export function itemAxes(a: Files, b: Files, extra: Record<string, string[]> = {}): Record<string, string[]> {
  const all: Record<string, Set<string>> = {}
  for (const files of [a, b])
    for (const [axis, values] of [...Object.entries(scriptConsts(files).axes), ...Object.entries(propAxes(files).axes)]) for (const v of values) (all[axis] ??= new Set()).add(v)
  for (const [axis, values] of Object.entries(extra)) for (const v of values) (all[axis] ??= new Set()).add(v)
  return Object.fromEntries(Object.entries(all).map(([axis, values]) => [axis, [...values]]))
}

/** The combinations an element pair reads: the axes its class expressions or its classes' data attributes name; a boolean prop only where an expression reads it. */
export function combosFor(texts: string[], axes: Record<string, string[]>, booleans: Set<string> = new Set()): Record<string, string>[] {
  const reads = (text: string, axis: string) =>
    booleans.has(axis)
      ? new RegExp(`(?<![\\w$.-])(?:props\\.)?${axis}(?![\\w$-])\\s*(?:\\?|&&|\\|\\||\\)|===|!==)`).test(text)
      : isWord(text, axis) || text.includes(`data-${axis}`) || text.includes(`[${axis}=`)
  const read = Object.entries(axes).filter(([axis]) => texts.some((text) => reads(text, axis)))
  return product(read)
}

/** A main component's variant matrix: every value of every axis it declares as a prop, crossed in the order the file names them.
 * An axis its cva reads but its props do not declare is set by its parts or context, and listed apart. `types`: files its props' interfaces live in. */
export function variantMatrix(main: Files, types: Files = {}): { axes: Record<string, string[]>; combos: Record<string, string>[]; contextAxes: Record<string, string[]> } {
  const declared = propNames(main, types)
  const aliases = literalAliases([...Object.values(main), ...Object.values(types)])
  const found: Record<string, Set<string>> = {}
  for (const [axis, values] of [...Object.entries(scriptConsts(main).axes), ...Object.entries(propAxes(main, aliases).axes)]) for (const v of values) (found[axis] ??= new Set()).add(v)
  const all = Object.entries(found).map(([axis, values]): [string, string[]] => [axis, [...values]])
  const axes = Object.fromEntries(all.filter(([axis]) => declared.has(axis)))
  return { axes, combos: product(Object.entries(axes)), contextAxes: Object.fromEntries(all.filter(([axis]) => !declared.has(axis))) }
}
