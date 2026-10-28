---
name: frontic-ui
description: >
  Build storefront UI in a project that uses Frontic UI: Vue components installed as source,
  styled only through recipes, each component's in its manifest beside its files and the shared
  ones in library/recipes/, that name tokens in library/brand.json,
  compiled to frontic.css by `npx @frontic/ui build`. Use it whenever a project has a
  components.json with `"style": "bare"` or a library/DESIGN.md, when adding or using Frontic UI
  items, when changing a brand's colours, type, radius or spacing, or when a fui-* class, a
  recipe, a token or frontic.css comes up.
---

# Frontic UI

Components are files in this repo. Their look is not: it comes from recipes that name tokens, compiled into one stylesheet. You change the look by editing the recipes and tokens, never the component, and never with a colour class in a template.

Run the CLI with the project's package runner: `npx @frontic/ui`, `pnpm dlx @frontic/ui` or `bunx @frontic/ui`. Examples here say `npx`.

## The files

| File                   | Owner             | What it holds                                                                                                                                                              |
| ---------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components.json`      | CLI, you may edit | `style: "bare"`, `typescript`, `tailwind.css` (the global CSS), `iconLibrary`, `aliases`, `library` (default `library`), `check` (what `check` holds the project to)       |
| `library/brand.json`   | you               | the tokens, as DTCG design tokens: `color`, `text`, `font`, `radius`, `border`, `ring`, `opacity`, `shadow`, `breakpoint`, `container`                                     |
| `<folder>/<name>.json` | you               | a component's manifest, beside its files: `title`, `description`, its recipes by name under `recipes`, each tree's `composes` the shared recipes it wears; `add` writes it |
| `library/recipes/`     | you               | the shared recipes, one `<name>.json` each: families and shared states; `add` writes the ones an item needs                                                                |
| `library/DESIGN.md`    | you               | the brand's rulebook: when to use which variant, what the brand never does. Nothing compiles it and nothing writes into it after `init`                                    |
| `frontic.css`          | generated         | the compiled brand: token variables, a Tailwind `@theme`, one `@utility` per recipe class. Never edit it; `build` overwrites it                                            |
| `<aliases.ui>/<name>/` | installed source  | one folder per item: `<Pascal>.vue`, `index.ts` barrel, sometimes more parts, and the item's manifest `<name>.json`                                                        |

`frontic.css` is imported from the global CSS right after `@import "tailwindcss"`. Tailwind emits only the utilities your templates use, so the size of `frontic.css` never reaches the browser.

The registry needs Tailwind CSS 4.3 or newer: its components use utilities such as `inset-s-*` that older releases do not have, so `init` and `add` refuse an older one.

## Commands

| Command                                                  | Does                                                                                                                                                                                      |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init`                                                   | writes `components.json`, `library/` and `AGENTS.md` in the components folder, compiles `frontic.css`, adds its import. `--library <path>` moves the library                              |
| `create [name]`                                          | new Nuxt or Vite project, then `init`, `mcp` and `skills`                                                                                                                                 |
| `add <items...>`                                         | installs items and their dependencies, writes each one's manifest and the shared recipes they need, recompiles. `--overwrite` also replaces what you edited; `--dry-run`, `--diff`        |
| `build`                                                  | compiles `brand.json`, the manifests' recipes and `library/recipes/` → `frontic.css`, installs the font packages the brand names and imports them at its top. Run after every manual edit |
| `check`                                                  | lints the project against its brand and exits 1 on an error: see [Check](#check). `--strict`, `--contrast <AA\|AAA>`, `--json`, `--fix`                                                   |
| `docs <items...>`                                        | an item's docs as markdown: install command, examples, API, types, styling and source                                                                                                     |
| `view <items...>`                                        | items' registry records as JSON                                                                                                                                                           |
| `search [query]`                                         | items by name and description; `--tier ui\|sections\|templates\|lib\|composables`; `--json`                                                                                               |
| `diff [item]`                                            | your installed files against what the registry serves now                                                                                                                                 |
| `info`                                                   | the project: config, library path, installed items, whether `frontic.css` is current; `--json`                                                                                            |
| `mcp --client <claude\|cursor\|vscode\|codex\|opencode>` | registers the hosted MCP server                                                                                                                                                           |
| `skills --client <…>`                                    | writes this skill, the design-system skill and the frontic-ui-review skill into the project                                                                                               |

## Check

`npx @frontic/ui check` reads every `.vue`, `.ts` and `.tsx` file outside `node_modules`, `.nuxt`, `.output` and `dist`, and the library; installed items must sit inside the project. It prints its findings by rule, `<where>: <message>` per line, then `check: <n> errors, <m> warnings in <k> files`, and exits 1 when any finding is an error.

| Rule             | Finds                                                                                                                                                                                              | Default |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `drift`          | a class the brand's theme does not define (`bg-blue-500`, `text-[13px]`, an unknown `fui-*`), or a `<script>` that does not parse                                                                  | `error` |
| `raw-text`       | text written into an installed item instead of passed in                                                                                                                                           | `warn`  |
| `contrast`       | a recipe colour or a brand token pair below the contrast level                                                                                                                                     | `error` |
| `missing-token`  | a recipe reference (`{colors.secondary-hover}`, `{rounded.md}`) to a token `brand.json` does not define, a hover the contract does not derive included; `build` refuses it whatever this is set to | `error` |
| `axis-collision` | two values of different axes that set one property to different values with no `with` pair between them; the later axis wins by order                                                              | `warn`  |

`check` also warns, under `design-md`, when `DESIGN.md`'s front matter has a `components:` key: nothing compiles it, recipes are the component manifests and the files in `library/recipes/`; under `manifest`, when a component manifest's keys run out of order (`$schema`, `title`, `description`, `recipes`; in a tree `composes`, `base`, `variants`, `defaults`, `keepAxis`), which `check --fix` rewrites, or when it holds a top-level `composes`, which belongs in the trees that wear it; and under `composes`, when an element wears a shared recipe (`fui-focus-ring`) that its own tree does not compose, or, for an element with no tree of its own, the component's root tree. `strict` makes them errors; `components.json` has no setting for them.

`components.json` sets the level and each rule's severity, `error`, `warn` or `off`; `drift` can be `warn` but never `off`. `init` writes the defaults:

```json
"check": {
  "contrast": "AA",
  "rules": { "drift": "error", "raw-text": "warn", "contrast": "error", "missing-token": "error" }
}
```

`"contrast": "AAA"` holds text to 7:1 and large text to 4.5:1; icons and the focus ring stay at 3:1. `--contrast <AA|AAA>` overrides the level for one run, `--strict` makes every warning an error, `--json` prints `{ findings, files }`.

## The MCP server

`frontic-ui` (hosted; `mcp` registers it):

- `search_registry_items` — browse or search; empty query lists everything; `tier` filters ui / sections / templates / lib / composables.
- `get_item_docs` — the same markdown `docs` prints, for one or more items.
- `get_item_examples` — an item's examples as source, the main one first; `example` picks one by slug.
- `get_add_command` — the `add` command for a list of items.
- Prompt `build_with` — reads each named item, installs it and builds the goal from it.

Use the MCP to explore what exists; use the CLI for everything that touches the project.

## Workflow

1. **Read the project.** `npx @frontic/ui info --json`: aliases, icon library, library path, installed items. Don't assume paths.
2. **Find items.** `search_registry_items` or `npx @frontic/ui search`. Tiers are named for their folders: `ui` (components), `sections` (page regions such as headers, product cards, cart), `templates` (whole pages), and `lib` and `composables` (the helpers items install with them).
3. **Read an item before using it.** `get_item_docs` or `npx @frontic/ui docs <item>`. The API section lists every part's props, events and slots; the Styling section lists the recipes and the tokens each one names. Don't guess a prop or a variant value.
4. **Install.** `npx @frontic/ui add <items>`. Then read the installed files once: imports resolve through `aliases`, icons through `iconLibrary`.
5. **Build with it.** Items through their barrel (`import { Button } from '@/components/ui/button'`; the Nuxt module auto-imports them). Layout with Tailwind utilities; colour, type and radius with the brand utilities below.
6. **Change the look** in `library/brand.json`, a component's manifest or a file in `library/recipes/`, then `npx @frontic/ui build`. The build refuses a broken token, a broken recipe or a recipe file that isn't JSON, naming the file, and leaves the old `frontic.css` in place.
7. **Check before you are done.** `npx @frontic/ui check` must exit 0. `build` prints the same findings as warnings.
8. **Have a restyle or a new page reviewed.** Hand the review to a subagent with the `frontic-ui-review` skill: the route and the dev server URL, what changed, what it should look like. It renders the page, reports each problem with the token, recipe file or template that fixes it, and edits nothing; you fix. If your client can't spawn a subagent, follow that skill yourself as a separate pass after `check`.

## Rules

**Colour, type, radius, shadow come from the brand.** In your own templates use the utilities the brand exposes: `bg-primary`, `text-primary-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`, `text-buy`, `bg-promo`, `text-heading`, `text-body`, `text-small`, `font-heading`, `rounded-md`, `shadow-sm`. Never `bg-blue-500`, never a hex value, never `text-[13px]`.

**An item's look is its recipe's.** Pick a variant (`<Button variant="outline" color="buy">`), don't restyle with `class`. `class` on an item is for placement: margin, width, grid position, flex. If a variant you need doesn't exist, add a value to its recipe in the component's manifest beside its files (see below), then `build`.

**Don't edit installed items to change colours or sizes.** Edit the recipe. Editing an item is for behaviour and markup; `diff` then shows what the registry changed since.

**Don't edit `frontic.css`.** It's overwritten.

**Icons.** Import from the project's `iconLibrary` (`@lucide/vue` for lucide; `info` tells you). Inside an item that takes an icon, put `data-icon` on it and no size class; the recipe sizes it: `<Button><ShoppingCartIcon data-icon /> Add to cart</Button>`.

**Forms.** A control sits in a `Field`, which wires id, name, required, description and errors:

```vue
<Field name="email" required validation-mode="onBlur">
  <FieldLabel>Email</FieldLabel>
  <Input type="email" autocomplete="email" />
  <FieldDescription>We send your order confirmation here.</FieldDescription>
  <FieldError match="valueMissing">Enter your email for the order confirmation.</FieldError>
</Field>
```

**One ConfigProvider at the app root.** Items take their reading direction, locale and overlay target from Reka's `ConfigProvider`: `<ConfigProvider dir="rtl" locale="de-DE">` around the app. An item's own `dir` or `locale` prop wins over it. Overlays teleport to `teleportTo` (the body when unset); a nested ConfigProvider starts from `ltr` and `en`, so pass the outer one's on, read with Reka's `useDirection()` and `useLocale()`.

**Composition.** Items are Reka UI underneath: `asChild` renders a part as your own element; `Dialog`, `Sheet`, `AlertDialog` need their `Title` part (use `class="sr-only"` to hide it); `SheetContent` opens from `side="end"` unless told otherwise, and `start` and `end` follow the reading direction while `top`, `right`, `bottom` and `left` are fixed edges, so a sheet that opens beside its trigger takes `start` or `end` and mirrors in RTL; `SelectItem` sits in a `SelectGroup`, `TabsTrigger` in `TabsList`. The API reference in `docs` tells you which parts an item has. `Card` takes `surface="raised"` (its edge, shadow and inset; the default) or `surface="bare"` (flush, no edge, no inset): a Card-rooted section inside a Card passes `surface="bare"`, so one surface frames the other's content. A Card is an inline-size container, so it needs a definite or stretched width (a column, `w-full`, `flex-1`); a Card sized by its content collapses. Inside a Card, an unnamed `@sm:`/`@md:` variant reads the Card's width; name the outer container (`@container/page`, `@4xl/page:`) to step at its width.

**Prefer an item to custom markup.** Callouts are `Alert`, empty states `Empty`, loading `Skeleton` or `Spinner`, labels `Badge`, dividers `Separator`. Search before writing a styled `div`.

## Tokens: `library/brand.json`

DTCG format: every token is `{ "$value": … }`, groups carry `$type`. A token's value may be a reference to another token, `{ "$value": "{color.action.primary}" }`: a role whose colour comes from another role references the more general role it means (a price in the page's ink is `{color.surface.foreground}`), which may be a reference itself; never sideways to a role of the same level, never the other way, never a hover to its own base; a role with its own colour keeps its hex. The stylesheet keeps a reference as a `var()` where one can carry it and writes the resolved value elsewhere; contrast reads the colour it names. The contract derives a hover only for the colours a component hovers: `primary`, `foreground` (the neutral solid button fill), `destructive`, `buy` and `checkout`. One written as a reference to a colour with a hover takes that hover (`buy` as `{color.action.primary}` hovers in `primary-hover`); any other is derived from its own base. Any other colour has a hover only where the brand writes one. `build` and `check` refuse a reference whose target is missing, leads back to itself or is of another `$type`, naming its token path. The groups and the names recipes reference:

| Group            | Names                                                                                                                                                                                                                                           | Referenced as       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `color.surface`  | `background`, `foreground`, `foreground-hover` (the neutral solid hover fill), `popover`, `popover-foreground`, `card`, `card-foreground`                                                                                                       | `{colors.card}`     |
| `color.action`   | `primary`, `secondary`, `active`, each with `-foreground`; `primary-hover`, the solid hover fill                                                                                                                                                | `{colors.primary}`  |
| `color.accent`   | `muted`, `muted-foreground`, `accent`, `accent-foreground`                                                                                                                                                                                      |                     |
| `color.edge`     | `border`, `input`, `ring`                                                                                                                                                                                                                       |                     |
| `color.status`   | `destructive`, `info`, `positive`, `warning`, each with `-foreground`; `destructive-hover`                                                                                                                                                      |                     |
| `color.commerce` | `buy`, `checkout`, `promo`, `discount`, `new`, `price`, each with `-foreground`; `buy-hover`, `checkout-hover`                                                                                                                                  | `{colors.buy}`      |
| `text`           | `heading`, `body`, `ui`, `small`, `caption`, `control`, `display`, `headline`, `page-title`, `title`, `subheading`, `lead`, `copy`, `note`, `description`, `micro`: font, size, weight, line height, tracking, optional `steps` at a breakpoint | `{typography.body}` |
| `font.family`    | `sans`, `heading`, `mono`, …; `$extensions.fontsource` names the npm package `init`, `add` and `build` install and `frontic.css` imports                                                                                                        |                     |
| `radius`         | `none`, `sm`, `md`, `lg`, `xl`, `full`                                                                                                                                                                                                          | `{rounded.md}`      |
| `border`         | `default`, `strong`, `focus`, `frame`, `frame-thin`: width, style and colour                                                                                                                                                                    | `{border.default}`  |
| `ring`           | `hairline`, `focus`, `wide`, `outset`, `frame`, `none`: an outline's width, style, colour and offset                                                                                                                                            | `{ring.focus}`      |
| `opacity`        | `0` to `100` in Tailwind's steps; a brand adds named ones                                                                                                                                                                                       | `{opacity.50}`      |
| `shadow`         | `xs`, `sm`, `md`, `lg`                                                                                                                                                                                                                          | `{shadow.sm}`       |
| `breakpoint`     | `sm`, `md`, `lg`, `xl`, `2xl`                                                                                                                                                                                                                   |                     |
| `container`      | optional; `xs` … `7xl`, Tailwind's sizes when absent; `sm`, `md`, `lg` set the `"@sm"`, `"@md"`, `"@lg"` step widths                                                                                                                            | `{container.md}`    |

A colour reference may carry an alpha: `{colors.primary/20}` is the role at 20 %. Spacing is a scale, not a token list: `{spacing.4}` is four steps of the base, `{spacing.px}` one pixel. Every colour and text style also becomes a Tailwind utility (`bg-primary`, `text-body`), so what you name in a recipe is what you use in a template.

To change the brand: edit a value, keep the token name, run `build`. A token that references another (`{color.action.primary}`) changes with it: change the token it points to, or give this one its own value to change it alone. Rename or remove a token only after checking no recipe or reference names it (`build` refuses a reference or a recipe token that no longer resolves).

## Recipes: component manifests and `library/recipes/`

Recipes are held by name: each key is a recipe, its value the recipe. A component's own recipes sit in its manifest, `<name>.json` in its folder beside its `.vue` files, under `recipes`: `components/ui/card/card.json` holds `card` and its parts `card-header`, `card-title`, …, so a part is styled in its component's manifest. The main recipe sits under its own name; a component with no tree of its own name (`drawer` holds `drawer-content`, `drawer-body`) holds only its parts. Each family and shared state sits in `library/recipes/<name>.json`, directly in the folder. A name is one key across all of them; the same name in two files is refused, naming both. Each tree lists first, in its own `composes`, the shared recipes whose classes its element wears beside the tree's own (`"button": { "composes": ["focus-ring", "disabled"], "base": … }`); an element with no tree of its own, such as a section's caption wearing `fui-hint`, answers to the component's root tree, named after it, which may then hold only `composes` and makes no class. `composes` renders nothing; it says which shared recipes a component depends on. `add` writes a missing key at the end of its file and keeps a key you edited, and keeps a manifest's `title` and `description` (`--overwrite` replaces them). Delete a component's folder and its recipes leave `frontic.css` on the next `build`. A component tree in `library/recipes/`, or a folder inside it such as `shared/`, is the layout before 1.0: `build` and `check` refuse it, naming the file and the `add` to run again.

```text
components/ui/button/
  Button.vue
  index.ts
  button.json          # the manifest: title, description, recipes { "button": a tree }
components/ui/card/
  card.json            # recipes { "card": …, "card-header": …, "card-title": … }: a component and its parts
library/recipes/
  action.json          # { "action": a flat recipe }: a family or shared state, used by many items
  focus-ring.json
```

`library/recipes/action.json`:

```json
{
  "$schema": "https://registry.ui.frontic.com/recipe.schema.json",
  "action": {
    "typography": "{typography.ui}",
    "rounded": "{rounded.md}",
    "hover": { "opacity": "{opacity.90}" }
  }
}
```

`components/ui/button/button.json`:

```json
{
  "$schema": "https://registry.ui.frontic.com/item.schema.json",
  "title": "Button",
  "description": "Triggers an action such as adding to the cart.",
  "recipes": {
    "button": {
      "composes": ["focus-ring", "disabled"],
      "base": {
        "extends": ["action"],
        "rounded": "{rounded.full}"
      },
      "variants": {
        "variant": {
          "solid": {
            "with": {
              "color": {
                "primary": { "backgroundColor": "{colors.primary}", "textColor": "{colors.primary-foreground}" },
                "buy": { "backgroundColor": "{colors.buy}", "textColor": "{colors.buy-foreground}" }
              }
            }
          },
          "outline": { "backgroundColor": "transparent" },
          "link": { "textDecorationLine": "underline" }
        },
        "color": { "primary": {}, "buy": {} },
        "size": {
          "md": { "height": "{spacing.10}", "paddingX": "{spacing.6}", "gap": "{spacing.1.5}", "icon": { "size": "{spacing.3.5}" } }
        }
      },
      "defaults": { "variant": "solid", "color": "primary", "size": "md" }
    }
  }
}
```

`extends` inlines the family; the block owns the rest and wins where they meet. `with` under `solid` is the pair's own look, over both values. `$schema` lets an editor check the file as you type; `build` ignores it.

- **Flat recipe:** properties, states and parts directly under its name. Families (`control`, `action`, `menu-item`, `option-item` for select, combobox and autocomplete items, `tag`) and shared states (`focus-ring`, `disabled`, `invalid`).
- **Tree:** `base`, `variants` (every axis, sizes included), `defaults`. A base or value extends a family in its `extends` list, a name or several, and overrides what it sets; a bare name in place of the block is refused.
- **Two values together:** `with` under one of them, the other axis and its values below (`solid.with.color.primary`). The block holds what a value holds. It applies when the element wears both values, over either one alone, and needs nothing in the item's markup. Write each pair once; a third axis nests another `with`.
- **Classes it makes:** `fui-<component>` and `fui-<component>-<value>`. Items already wear these classes; a new variant value in the recipe needs the matching class in the item's cva, which the Source section of `docs` shows; the library lint reports a cva whose slots differ from its tree (`frontic/recipe-classes`). A `with` block makes no class of its own.
- **States:** `hover`, `active`, `pressed`, `focus`, `focusWithin`, `checked` (an indeterminate control too), `checkedWithin`, `invalid`, `invalidWithin`, `highlighted`, `placeholderShown`, `open`, `selected`, `current`; `disabled` is a shared state recipe items apply beside their own. **Parts:** `icon` (size), `iconStart`/`iconEnd` (the padding beside an edge icon), `link` (every link inside, with its own states), `file`, `after`.
- **Layout** on a base, value or `with` block: `height`, `minHeight`, `width`, `minWidth`, `maxWidth`, `size`, `padding`, `paddingX`, `paddingY`, `paddingTop/Bottom/Start/End`, `margin`, `marginX`, `marginY`, `marginTop/Bottom/Start/End`, `bleedX`/`bleedY`/`bleedTop/Bottom/Start/End` (the negative of the step), `gap`, each a `{spacing.n}` step, or for the three widths a `{container.name}` size. Margins and bleeds are recipe properties like padding: an item's own margins and bleeds live in its recipe, not in a margin utility on its elements; `class` on an item still places it. A family may carry layout too (`surface-inset`, `indent`), so a tree extends it instead of repeating the numbers; a shared state never does.
- **Arrangement** keywords, each rendering the CSS of the utility it replaces, at the top level or in a state: `display` (block, inline, inline-block, flex, inline-flex, grid, inline-grid, contents, none), `flexDirection` (row, column, -reverse), `flexWrap`, `alignItems`, `alignSelf`, `alignContent`, `justifyContent`, `justifyItems`, `justifySelf`, `placeItems`, `placeContent` (start, end, center, between, around, evenly, stretch, baseline, normal as the utility allows), `flex` (1, auto, initial, none), `flexGrow` and `flexShrink` (0, 1), `gridColumns` and `gridRows` (1 to 12, equal tracks), `gridColumn` and `gridRow` (`span 1` to `span 12`, `full`). An item's own arrangement lives in its recipe like its padding, so a caller's `class` beats it; a template never sets one beside `props.class`.
- **Steps:** the base is the narrowest form; an `"@sm"`, `"@md"` or `"@lg"` block holds the layout and arrangement the element takes once the nearest container is that wide (`md` is 28rem unless the brand names `container.md`). A tree's base may set `contain: inline-size` to be the container its parts and everything inside read; the page (`body`) is one when nothing nearer is. A value owns the CSS it sets at every step: a family's step values that write any of it drop, so `padding` drops a family's `"@md"` `paddingY`, `paddingY` its `"@md"` `padding`, and `bleedX` its `"@md"` `marginX`; only the value's own step blocks step it.
- **Parts of a value:** `parts` under a value or `with` block maps a part tree of the same component (`card-header` of `card`) to the layout its base takes while the element wears the value: `"bare": { "parts": { "card-header": { "paddingX": "{spacing.0}" } } }`.
- **Values** of a typed property, one the lists here cover, are a token reference or a keyword, never free text. Colour: `{colors.…}`, `transparent`, `currentColor`, and `none` on `fill` and `stroke`. Text: `{typography.…}`. Radius: `{rounded.…}`. `border`: `{border.…}` or `none`. `outline`: `{ring.…}`, with `outlineColor` to recolour it. `opacity`: `{opacity.…}`. `shadow`: `{shadow.…}` or `none`. `translate`: one or two axes, each `{spacing.n}`, `-{spacing.n}`, `0`, `full` or `-full`.
- **Keywords:** `fontWeight` normal, medium, semibold, bold. `lineHeight` none, tight, snug, normal, relaxed, loose. `letterSpacing` tighter, tight, normal, wide, wider, widest. `textDecorationLine` none, underline, line-through. `textAlign` left, center, right, start, end, justify. `textTransform` none, uppercase, lowercase, capitalize. `visibility` visible, hidden, collapse.
- **Not recipe properties:** `fontSize` (a text style carries the size), `borderWidth` and `borderStyle` (the border token), `outlineWidth`, `outlineStyle` and `outlineOffset` (the ring token), `textUnderlineOffset`, `corner`, and the shorthands that would bypass a typed property: `font`, `transform`, `textDecoration`, `borderRadius`, `boxShadow`. Lint refuses each and names where the value lives.
- **Contrast markers**, read by the contrast check and never rendered, on a flat recipe, a base, a value or a `with` block, not in a state: `"ground": "{colors.…}"` names the colour a text or icon sits on when the recipe sets no background of its own (an `inverse` button on a dark band); `"decorative": true` skips the element (an arrow, a divider, a purely visual mark).
- **Untyped properties** (`fontFamily`, `cursor`, anything the lists don't cover) render as written, and `build` and lint warn about each by file and path: no check runs on the value and the recipe editor offers no picker for it. A misspelled property warns the same way. The registry ships typed recipes only.

Typical edits:

- **Rounder buttons:** `radius.md.$value` in `brand.json`, or `"rounded": "{rounded.lg}"` in `library/recipes/action.json`.
- **A new badge colour:** add a value under `badge.variants.variant` with `backgroundColor`/`textColor`, add `'fui-badge-<value>'` to the `variant` map in `Badge.vue`'s cva, `build`.
- **A hover the brand wants everywhere:** put it on the family (`action.hover`), not on each tree.

`build` validates both files first: a value in the wrong group, free text where a token or keyword belongs, a property recipes don't take, a `use` (write `extends`), an opacity token outside 0 to 100, a recipe file that isn't JSON, a `brand.json` reference that does not resolve, a recipe's reference to a token the brand doesn't define, all stop the build with the file and the path that's wrong; an untyped property is a warning and the build goes on.

## Checking

- `npx @frontic/ui info` says whether `frontic.css` is current with the library.
- `check` fails on a token pair below WCAG 2.x contrast, and `build` warns about it and still writes `frontic.css`: every `<name>` / `<name>-foreground` in `color.action`, `status`, `commerce`, `surface` and `accent` needs 4.5:1 (7:1 at `AAA`); `color.edge.ring` needs 3:1 against `surface.background`; `edge.border` and `edge.input` are not checked, so a field's placement must not rest on its edge alone. `info` counts them.
- The same goes for every recipe colour below WCAG contrast on the project's brand, in the base, every value, every `with` pair and each of their states (two values of different axes with no `with` between them are not combined): `<recipe>.<path>: <role> <colour> on <ground> is n:1, needs m:1`. Text and placeholders need 4.5:1, large text (24px, or 18.66px bold) 3:1, or 7:1 and 4.5:1 at `AAA`; an icon (`iconColor`, `fill`, `stroke`, or `textColor` on a recipe that paints with `currentColor`) 3:1; a `ringColor`, and `focus-ring`'s `outlineColor`, 3:1 against the page or the recipe's `ground`. A colour with alpha is composited over its ground. A text's ground is the recipe's own background, else its `ground`, else the tree's background, else the page surfaces (`background`, `card`, `popover`), each checked. `disabled` and anything marked `decorative` are skipped. `info` reports them as `recipeContrast`.
- `npx @frontic/ui diff` shows installed files that drifted from the registry.
- A class that doesn't style: the item wears `fui-x-y`, the recipe has no `y` under that axis, or `build` wasn't run. Compare the item's cva with the recipe.

## Beyond this project

Setting a brand up from a source (a codebase, a Figma library, a storefront) is the design-system skill's job; it ends with the two files this skill works in.

A Frontic account adds a shared library: the same `brand.json`, recipe files and `DESIGN.md`, kept in one place and synced into every project with the `frontic` CLI (`frontic components add`, `frontic components update`, `frontic components tokens`). The files and the rules are the same; only where they live changes.
