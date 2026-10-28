---
name: design-system
description: >
  Build a brand's design system for Frontic UI from whatever shows the brand: a codebase, a Figma
  library, a live storefront, a style guide, screenshots. Use it when asked to set up, migrate,
  recreate or match a brand, theme or design system in a project that uses Frontic UI, or to start
  a storefront that has to look like an existing one. The daily rules for working with the
  installed library are in the frontic-ui skill; this one ends where that one starts.
---

# Design system from a source

The result is the brand's tokens, its recipes and a handful of installed pages: `library/brand.json` holds the tokens; the recipes that turn them into component looks sit in each component's manifest beside its files, holding its recipes by name, and the shared ones in `library/recipes/`; `npx @frontic/ui build` compiles them into `frontic.css`. Nothing of the source is copied as CSS. Every colour, font, radius and shadow becomes a token, every component treatment a recipe, and the pages you install are the proof that the tokens and recipes reproduce the brand.

Work in this order. Each step has an output the next one reads.

## 1. Inventory the source

You bring the access; this step says what to take. Write the inventory as a plain list of what the source has, in the source's own words and values, before mapping anything.

| Source           | Take                                                                                                                                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codebase         | Tailwind config and `@theme` blocks, CSS custom properties, theme or token files, font imports, the component library's button, input, badge and card styles, the colours used for prices, discounts, stock and errors                               |
| Figma library    | Colour variables and styles with their names, text styles (family, weight, size, line height), effect styles (shadows), corner radius on buttons, inputs and cards, the main button and badge components with their variants                         |
| Storefront URL   | Computed styles of the primary button, the add-to-cart button, an input at rest and focused, headings and body text, the price and a discounted price, stock and sale badges, a card edge; the fonts loaded; the logo's colours; the page background |
| Style guide, PDF | The palette with its roles, the type scale, spacing and radius rules, do-and-don't examples for buttons and badges                                                                                                                                   |
| Screenshots only | Sample colours from flat areas, not edges; read type sizes relative to a known control height; treat every value as approximate and say so                                                                                                           |

The inventory has eight parts: brand colours by role, neutrals, feedback colours, commerce colours, fonts and the type scale, radius, borders and shadows, and the look of the five anchor components (primary button, buy button, input, badge, card). A source rarely has all eight. Note what is missing; step 2 fills it.

## 2. Map the inventory onto `brand.json`

`npx @frontic/ui init` writes `library/brand.json` from the default preset. Edit that file; don't start from an empty one. Every group below exists in it with a value you replace or keep.

| Inventory                        | Token group                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| page background, text, cards     | `color.surface`: `background`, `foreground`, `card`, `popover`, each with its foreground             |
| primary brand colour, secondary  | `color.action`: `primary`, `secondary`, `active`, each with its foreground                           |
| muted text, subtle fills         | `color.accent`: `muted`, `accent`, each with its foreground                                          |
| dividers, input edges, focus     | `color.edge`: `border`, `input`, `ring`                                                              |
| success, warning, info, error    | `color.status`: `positive`, `warning`, `info`, `destructive`, each with its foreground               |
| add to cart, checkout, sale, new | `color.commerce`: `buy`, `checkout`, `promo`, `discount`, `new`, `price`, each with its foreground   |
| font families and weights        | `font.family`, `font.weight`, `font.size`                                                            |
| headings, body, labels, captions | `text.heading`, `body`, `ui`, `small`, `caption`, `control`: family, weight, size steps, line height |
| corner radius                    | `radius.base`, and the `sm` to `full` steps that derive from it                                      |
| border widths, focus ring        | `border.default`, `strong`, `focus`                                                                  |
| elevation                        | `shadow.xs` to `lg`                                                                                  |

Rules for the mapping:

- **Roles, not names.** A source's "brand blue" goes where it is used: `action.primary` if it is the button. A role with its own colour keeps its hex: it is the root of that colour job, a distinct sale red as much as the primary.
- **References run top-down.** A role whose colour comes from another role is a reference to the more general role it means: an add-to-cart button in the primary colour is `"buy": { "$value": "{color.action.primary}" }`, a price in the page's ink `"price": { "$value": "{color.surface.foreground}" }`. That role may be a reference itself, so the brand reads as a chain from one root: a focus ring in the ink is `"ring": { "$value": "{color.surface.foreground}" }`, and the focus border names `{color.edge.ring}`. Never sideways, one role to another of the same level (`commerce.checkout` as `{color.commerce.buy}`), never the other way (`surface.foreground` as `{color.commerce.price}`), and never a hover as a reference to its own base. The contract derives a hover only for `primary`, `foreground`, `destructive`, `buy` and `checkout`, the colours a component hovers: one written as a reference takes its target's hover, any other its own base's. Write a hover only where a colour should hover differently from that, or where nothing derives one. A price that repeats the ink's hex is wrong too. A colour that only happens to equal another, with a different job, stays a hex: a sale red equal to the error red is not the error red. Plain values stay valid; `build` and `check` refuse a reference whose target is missing, leads back to itself or is of another type, naming the token.
- **Fill a gap from the brand, not from the preset.** No `commerce.buy` in the source: reference `{color.action.primary}`. No `promo` or `discount`: give `discount` the source's error red and `promo` its primary, as their own hex, only if that is how the storefront already shows sales; otherwise keep the preset's and say so. No muted text colour: mix the foreground toward the background until it reads as secondary, then check it in step 3.
- **Neutrals carry the brand's warmth.** A source with warm greys gets warm `surface`, `accent` and `edge` values; don't leave the preset's zinc under a warm brand.
- **Foregrounds are decided, not assumed.** White text on the primary is a choice the source made; copy it. Where the source has no text on a colour, pick the foreground that passes in step 3.
- **Type is a scale.** Map the source's sizes onto the six text styles by role, not by pixel: the biggest product title is `heading`, running text `body`, buttons and nav `ui`, meta text `small`, legal `caption`, inputs `control`. A source with one font puts it in every style; one with a display face puts it in `heading` only.
- **Radius is one number.** Set `radius.base` to the most common corner on the source's controls and let the steps follow. Pill buttons are `"rounded": "{rounded.full}"` on the `action` recipe in step 6, not a bigger base.
- **Nothing outside brand.json has a hex.** A value you can't place in a group has no place yet; note it for step 6 or for the list in step 7.

## 3. Compile and clear the warnings

```bash
npx @frontic/ui init          # once, in the project
# edit library/brand.json
npx @frontic/ui build         # compiles frontic.css, warns about contrast
npx @frontic/ui info          # counts the problems that remain
```

`build` checks every `<name>` / `<name>-foreground` pair in `action`, `status`, `commerce`, `surface` and `accent` at 4.5:1 and `edge.ring` at 3:1 against the background. For each warning:

- Keep the hue and saturation; move lightness one step at a time until the pair passes. The brand's green stays its green.
- Where the source's own colour fails on white, prefer darkening the colour over changing the text to black: a solid button with dark text is a bigger change than a slightly darker button.
- A muted text colour that fails is moved toward the foreground, not toward the preset's grey.
- `edge.border` and `edge.input` are not checked, so a field must be placed by its label and fill, not by its edge alone.

`build` measures every recipe colour the same way once the project has recipes (step 6): text at 4.5:1, large text, icons and rings at 3:1, each on its own background, its `ground`, or the page surfaces. A recipe warning is fixed in the token it names, the same way, unless only that one component is off.

Stop when `info` reports no problems. The source's shade may now differ from the token by a step; say so in step 7.

## 4. Install the pages that show the system

Tokens alone show nothing. Install the templates and sections a shopper sees most, so every token and every recipe is on screen together:

```bash
npx @frontic/ui add header-shop category-grid filter-sidebar product-card-basic product-options cart-full checkout-page
```

- Each one pulls its ui items with it, each with its manifest and recipes beside its files and the shared recipes they need in `library/recipes/`. A product card brings badge, price and button; a checkout brings inputs, selects, totals and the destructive action.
- Choose by the source's pages: a storefront with a listing, a product page and a cart is covered by the set above; swap `product-card-basic` for the card variant closest to the source (`hover`, `horizontal`, `gallery`, `minimal`, `featured`), `filter-sidebar` for `filter-toolbar` or `filter-sheet`, `cart-full` for `cart-compact`.
- Mount their examples on one scratch page. `npx @frontic/ui docs <item>` prints the main example under Examples, the MCP's `get_item_examples` the same; paste them into one route, with imports resolved through the project's aliases from `info --json`. The examples ship with catalog data (jackets, goggles, backpacks), so the page is a shop, not a swatch board.

The page stays until step 7. It is where every change is judged.

## 5. Compare against the source

Put the scratch page and the source side by side, screen by screen: listing, product, cart. For each of the five anchor components, check fill, text colour, type, radius, edge and shadow. Then the page as a whole: density, how muted text reads at scale, whether sale and stock badges stand out the way the source's do, whether the buy button is the loudest thing on the product page.

Every miss goes to one of two places:

- **The whole system is off** (every button too round, all muted text too light, every card edge too strong): a token in `brand.json`.
- **One component is off** (the badge should be a pill, the card has no shadow, the buy button is uppercase): its component's manifest beside its files, whose `recipes` hold the component and every part.

Fix the token first and rebuild; recipe fixes made before the tokens settle are redone.

## 6. Recipes for what the tokens don't give

A component's recipes sit in its manifest, `<name>.json` beside its `.vue` files, keyed by recipe name under `recipes`; the families and shared states sit one each in `library/recipes/`; the frontic-ui skill has the format. Restyling a component is one read: open its manifest and its parts are the keys under `recipes`. Here, write only what the comparison asked for, in the widest recipe that carries it:

- The whole brand's button shape: `rounded`, `typography`, `textTransform`, `hover` on the `action` family, `library/recipes/action.json`.
- All inputs: on `control`, `library/recipes/control.json`.
- A badge style, a card edge, a price weight: on that component's tree, under its name in `badge.json`, `card.json`, `price.json`; a card's header under `card-header` in `card.json`.
- A new look the item has no variant for: a value under its axis, plus the matching `fui-` class in the item's cva, which the Source section of `docs` shows. The library lint refuses a save whose cva differs from its tree.
- A look for two values together (a small neutral badge, a solid buy button): `with` under one of the values, nothing in the markup.
- Less room, less inset: the base of a recipe is its phone form, an `"@md"` block what it becomes once its container is 28rem wide. A card's inset at every width is `surface-inset`, an indent that only a wide column affords is `indent`; a Card-rooted section inside a Card wears `surface="bare"`. A Card is an inline-size container, so it needs a definite or stretched width; a Card sized by its content collapses.
- A text or icon colour that sits on something other than its own background or the page (an `inverse` button on a dark band): `"ground": "{colors.<role>}"` on that value, so `build` measures it there. An element that carries no meaning (an arrow, a divider): `"decorative": true`. Neither renders anything.
- The room around an element is the recipe's too: `marginTop`, `marginX` and the rest take a `{spacing.n}` step, `bleedX`, `bleedY` and the one-sided `bleedTop`, `bleedBottom`, `bleedStart` and `bleedEnd` the negative of one, so an item's own margins and bleeds live in its recipe, not in a margin utility on its elements; `class` on an item still places it.

```bash
npx @frontic/ui build         # after every edit; refuses a bad token or recipe with its path
```

Rebuild, look at the page, repeat. A pass that changes nothing on the page is done.

Hand each comparison, step 5's and every one after a pass, to a review subagent with the `frontic-ui-review` skill: the scratch route, the source, what this pass changed. It reports which token or recipe file each miss goes to and edits nothing. If your client can't spawn a subagent, follow that skill yourself as a separate pass.

## 7. Finish

- `npx @frontic/ui info`: `frontic.css` current, no contrast problems.
- Remove the scratch route, or keep it as the project's own style page if the team wants one.
- Write the rulebook, `library/DESIGN.md`: what the source had that the library does not model, under the section it belongs to (a token that was darkened for contrast under Colors, a gradient or texture that became a flat colour under Do's and Don'ts). Whoever reads the library next needs to know what was a decision. DESIGN.md describes; it never defines. A value written there does nothing; it lives in `brand.json` or a recipe file.

### The Components section

- Each entry names its recipe and variants as `recipe.variant` (`button.primary`, `badge.stock`), so a reader can check and link them.
- It states only what the recipe can't: when to use which variant, placement, counts, content rules.
- It never restates a recipe's values; those live in the recipe, and a second copy drifts.
- Entries are grouped by role, and the section ends with a "Signature patterns" subsection for brand rules that are neither a token nor a component.

## Rules

- A hex value appears in `brand.json` and nowhere else. Not in a recipe, not in a component, not in the scratch page.
- Change one thing, build, look. Several edits before a build hide which one did it.
- Keep the source's hues. Contrast is fixed with lightness, not with a different colour.
- Don't install the catalogue. The pages in step 4 are enough to judge the system; more items come when pages need them.
- Say what is approximate. Values read from screenshots or a PDF are marked as such in step 7.
