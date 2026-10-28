/** Utilities whose property a recipe holds, each with that recipe property; the first match wins. */
const HELD = [
  [/^(block|inline|inline-block|flex|inline-flex|grid|inline-grid|contents|hidden)$/, 'display'],
  [/^flex-(row|col)(-reverse)?$/, 'flexDirection'],
  [/^flex-(wrap|nowrap|wrap-reverse)$/, 'flexWrap'],
  [/^flex-(1|auto|initial|none)$/, 'flex'],
  [/^(flex-)?grow(-0|-1)?$/, 'flexGrow'],
  [/^(flex-)?shrink(-0|-1)?$/, 'flexShrink'],
  [/^items-/, 'alignItems'],
  [/^self-/, 'alignSelf'],
  [/^content-(normal|center|start|end|between|around|evenly|baseline|stretch)$/, 'alignContent'],
  [/^justify-items-/, 'justifyItems'],
  [/^justify-self-/, 'justifySelf'],
  [/^justify-/, 'justifyContent'],
  [/^place-items-/, 'placeItems'],
  [/^place-content-/, 'placeContent'],
  [/^grid-cols-/, 'gridColumns'],
  [/^grid-rows-/, 'gridRows'],
  [/^col-span-/, 'gridColumn'],
  [/^row-span-/, 'gridRow'],
  [/^text-(left|center|right|start|end|justify)$/, 'textAlign'],
  [/^size-/, 'size'],
  [/^w-/, 'width'],
  [/^h-/, 'height'],
  [/^min-w-/, 'minWidth'],
  [/^min-h-/, 'minHeight'],
  [/^max-w-/, 'maxWidth'],
  [/^gap-(?![xy]-)/, 'gap'],
  [/^p-/, 'padding'],
  [/^px-/, 'paddingX'],
  [/^py-/, 'paddingY'],
  [/^pt-/, 'paddingTop'],
  [/^pb-/, 'paddingBottom'],
  [/^ps-/, 'paddingStart'],
  [/^pe-/, 'paddingEnd'],
  [/^-mx-/, 'bleedX'],
  [/^-my-/, 'bleedY'],
  [/^-mt-/, 'bleedTop'],
  [/^-mb-/, 'bleedBottom'],
  [/^-ms-/, 'bleedStart'],
  [/^-me-/, 'bleedEnd'],
  [/^m-/, 'margin'],
  [/^mx-/, 'marginX'],
  [/^my-/, 'marginY'],
  [/^mt-/, 'marginTop'],
  [/^mb-/, 'marginBottom'],
  [/^ms-/, 'marginStart'],
  [/^me-/, 'marginEnd'],
]

const BINDING = /(?:^|\s)(?::|v-bind:)(?:[\w-]*-class|\w*Class|class)="([^"]*)"/g
const STATIC = /(?:^|\s)class="([^"]*)"/g
const ROOT_BINDING = /(?:^|\s)(?::|v-bind:)class="([^"]*)"/g
const STRING = /'([^']*)'|`([^`]*)`/g

/** A utility as its variants and the utility itself, split at the colons outside brackets: `group-hover:!flex` is `group-hover` and `flex`. */
function split(utility) {
  const variants = []
  let depth = 0
  let start = 0
  for (let i = 0; i < utility.length; i++) {
    const c = utility[i]
    if (c === '[' || c === '(') depth++
    else if (c === ']' || c === ')') depth--
    else if (c === ':' && depth === 0) {
      variants.push(utility.slice(start, i))
      start = i + 1
    }
  }
  return { variants, bare: utility.slice(start).replace(/^!|!$/g, '') }
}

/** Variants that style a descendant or read one (`*:`, `**:`, `has-…`, `group-has-…`, `peer-has-…`, `[&…]:`, `in-…`, each also behind `not-`):
 * no recipe block reaches that element or that structure, so the utility stays in the template. */
export const RELATIONAL_VARIANTS = Object.freeze([/^\*\*?$/, /^(?:group-|peer-)?has-/, /^\[&/, /^in-/])

/** Whether a variant styles a descendant or reads one. */
export const isRelational = (variant) => RELATIONAL_VARIANTS.some((pattern) => pattern.test(variant.replace(/^not-/, '')))

/** The recipe property a utility sets, or undefined when no recipe holds it or a relational variant keeps it in the template. */
export function heldProperty(utility) {
  const { variants, bare } = split(utility)
  return variants.some(isRelational) ? undefined : HELD.find(([pattern]) => pattern.test(bare))?.[1]
}

const CVA = /\bconst (\w+) = cva\(/g

/** The text of the call whose `(` sits at `open`, through its matching `)`; strings may hold parentheses. */
function callText(source, open) {
  let depth = 0
  let quote = null
  for (let i = open; i < source.length; i++) {
    const c = source[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
    } else if (c === "'" || c === '"' || c === '`') quote = c
    else if (c === '(') depth++
    else if (c === ')' && --depth === 0) return source.slice(open, i + 1)
  }
  return source.slice(open)
}

const lineAt = (source, index) => source.slice(0, index).split('\n').length

/** The held utilities in each string literal of `text`, which starts at `offset` in `source`; `at` fixes the line instead. */
function scan(source, text, offset, file, at) {
  const findings = []
  for (const literal of text.matchAll(STRING)) {
    const line = at ?? lineAt(source, offset + literal.index)
    for (const utility of (literal[1] ?? literal[2])
      .replace(/\$\{[^}]*\}/g, ' ')
      .split(/\s+/)
      .filter(Boolean)) {
      const property = heldProperty(utility)
      if (property) findings.push({ file, line, utility, property })
    }
  }
  return findings
}

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])

/** The index just past the `>` that closes the tag opening at `start`, skipping quoted attribute values. */
function tagEnd(source, start) {
  let quote = null
  for (let i = start; i < source.length; i++) {
    const c = source[i]
    if (quote) {
      if (c === quote) quote = null
    } else if (c === '"' || c === "'") quote = c
    else if (c === '>') return i + 1
  }
  return source.length
}

/** The elements at the top of the SFC's template, each with its tag, the index of its attributes and their text. */
function topElements(source) {
  const open = /^<template(?:\s[^>]*)?>/m.exec(source)
  if (!open) return []
  const close = source.lastIndexOf('\n</template>')
  const end = close < open.index ? source.length : close
  const elements = []
  let depth = 0
  for (let i = open.index + open[0].length; i < end; i++) {
    if (source[i] !== '<') continue
    if (source.startsWith('<!--', i)) {
      i = source.indexOf('-->', i) + 2
      continue
    }
    const after = tagEnd(source, i)
    if (source[i + 1] === '/') depth--
    else {
      const tag = /^<([\w.:-]+)/.exec(source.slice(i))?.[1]
      if (!tag) continue
      const selfClosing = source[after - 2] === '/' || VOID.has(tag.toLowerCase())
      if (depth === 0) elements.push({ tag, index: i + tag.length + 1, attributes: source.slice(i + tag.length + 1, after - 1) })
      if (!selfClosing) depth++
    }
    i = after - 1
  }
  return elements
}

/** The roots a caller's class falls through to: the one element at the top of the template, or each of a v-if chain;
 * none where the part binds props.class, sets inheritAttrs false or renders several roots. */
function fallthroughRoots(source) {
  if (/\bprops\.class\b/.test(source) || /\binheritAttrs\s*:\s*false\b/.test(source)) return []
  const roots = topElements(source).filter((root) => root.tag !== 'slot' && root.tag !== 'template')
  if (roots.length === 1) return roots
  const chain = roots.every((root, i) => (i === 0 ? /(?:^|\s)v-if=/ : /(?:^|\s)v-else(?:-if)?(?:=|\s|\/|$)/).test(root.attributes))
  return chain ? roots : []
}

/** Every utility a recipe holds where a caller's class meets it, read from the strings and the cvas a class reads: a class binding that also
 * binds `props.class`, and the static class and class bindings on a root the caller's class falls through to. There a caller's utility for
 * the same property fights it, where it would beat a recipe. */
export function layoutGate(source, file) {
  const cvas = [...source.matchAll(CVA)].map((match) => ({ name: match[1], index: match.index + match[0].length - 1 }))
  const read = new Set()
  const findings = []
  const readBinding = (expression, index) => {
    findings.push(...scan(source, expression, index, file, lineAt(source, index)))
    for (const cva of cvas) {
      if (read.has(cva.name) || !new RegExp(`\\b${cva.name}\\(`).test(expression)) continue
      read.add(cva.name)
      findings.push(...scan(source, callText(source, cva.index), cva.index, file))
    }
  }
  for (const binding of source.matchAll(BINDING)) if (/\bprops\.class\b/.test(binding[1])) readBinding(binding[1], binding.index)
  for (const root of fallthroughRoots(source)) {
    for (const found of root.attributes.matchAll(STATIC)) {
      const line = lineAt(source, root.index + found.index)
      for (const utility of found[1].split(/\s+/).filter(Boolean)) {
        const property = heldProperty(utility)
        if (property) findings.push({ file, line, utility, property })
      }
    }
    for (const binding of root.attributes.matchAll(ROOT_BINDING)) readBinding(binding[1], root.index + binding.index)
  }
  return findings
}
