# @frontic/registry

The Frontic UI component source, its recipes, the build that serves it, and the gates every served item passes.

## Commands

```bash
pnpm --filter @frontic/registry build           # writes public/v1/
pnpm --filter @frontic/registry serve           # http://localhost:3333/v1/
pnpm --filter @frontic/registry test:unit
pnpm --filter @frontic/registry test:contract   # the contract on good/bad fixture items
pnpm --filter @frontic/registry contract        # every served item through the library gates
pnpm --filter @frontic/registry look            # every item's resolved look against look/<item>.txt
```

## Layout

```
packages/registry/
├── ui/, sections/, templates/   # source, one folder per item: <Pascal>.vue, index.ts, <name>.example.vue, <name>.json (the manifest)
├── lib/, composables/           # one <name>.ts per item, its manifest <name>.json beside it
├── item.schema.json             # the $schema of a manifest
├── recipes/shared/              # the families and shared states, one <name>.json each holding { "<name>": … }, in token references only
├── families.json                # the family groups the catalog shows
├── pending.json                 # items with source but not served yet
├── icon-placeholder/            # <IconPlaceholder> for source files
├── icons/legacy-mapping.json    # icons passed as values (suffixed @lucide/vue imports)
├── public/schema.json, public/schema/registry-item.json  # the $schema files the CLI writes
├── look/<item>.txt              # each served item's resolved look, which `look` compares against
├── scripts/                     # build, contract gate, look check and their lib/
├── functions/index.ts           # the root's text: where the docs are
├── public/_headers              # CORS and caching for /v1/
└── tests/{unit,contract}/
```

## Adding an Item

1. Create `<tier>/<name>/` with `<Pascal>.vue`, an `index.ts` barrel exporting it, and `<name>.example.vue` (`defineOptions({ inheritAttrs: false })`, `v-bind="$attrs"` last on `<Pascal>`).
2. Style through recipe classes only (`fui-<component>`, `fui-<component>-<value>`, `fui-<family>`); no `cn()`, no palette classes, no arbitrary values. An element that wears a recipe takes its heights, widths, padding, margins and gaps from it: a numeric spacing or margin utility on it is refused by the gate, except behind a structural variant (`has-…`, `[&>…]`, `*:`, `**:`, `first:`, `last:`, `nth-…:`) or `file:`. Icons are `<IconPlaceholder>` with all five names.
3. Import another item through its barrel, `@library/components/<tier>/<name>`, and list it in `registryDependencies`.
4. A section whose root is a `Card` declares `surface?: 'raised' | 'bare'` (default `raised`) and passes it to that Card; placed inside a Card or CardContent, it gets `surface="bare"`.
5. Add its manifest `<tier>/<name>/<name>.json`: `title`, `description`, `components` (one sentence for each part `index.ts` exports, by its name: the API reference's description of the part), `recipes`, the trees it owns by name (`<name>` for its main part, `<name>-<part>` for each other part; the longest item name a tree starts with owns it). Each tree lists in its own `composes`, first, the shared recipes whose classes it puts on its element; an element with no tree of its own answers to the item's root tree `<name>`, which may then hold only `composes`. A top-level `composes` is refused. A family it extends or a shared recipe it composes lives in `recipes/shared/<name>.json`.
6. Run `build`, `test:unit` and `contract` (which also measures every served recipe colour on every shipped style preset against its WCAG threshold and fails below it; `ground` and `decorative` steer it, see the frontic-ui skill), then `look --write <name>` to snapshot the item's look.

Never edit `public/v1/`.

## Recipes

Every recipe a registry item names is defined once, by name, against the default brand's roles, text styles, borders, rings, opacity steps and spacing. A tree sits under `recipes` in the manifest of the item that owns it (`ui/button/button.json`); a flat recipe, a family or a shared state, sits in its own `recipes/shared/<name>.json` as `{ "<name>": … }`. The build refuses one anywhere else, and a manifest is never one of the item's served files: the served item carries its own trees in `recipes`, each with its `composes`, and the definition of each composed recipe and of every family its trees extend in `library.recipes`. `add` writes the trees into the component's manifest beside its files and each library recipe into the project's `library/recipes/<name>.json`, where they come out in the project's brand.

A flat recipe is a family several items share (`control`, `menu-item`, `option-item`, `tag`, `action`) or a shared state (`focus-ring`, `disabled`, `invalid`). A component is one tree, the shape of its cva call: `base`, `variants` (every axis, sizes included) and `defaults`. A value styles two values together with `with`: the other axis and its values nested under it (`solid.with.color.primary`), applying where the element wears both, over either alone, without a class in the markup. A base or a value extends a family by name in its `extends` list (`base: { extends: action }`), and owns the rest; a base, a value or a `with` block may also override what the family sets, its own declaration coming after the family's and winning. The build inlines the family, so a component names only its own classes: `fui-<component>` and `fui-<component>-<value>`; a `with` block renders as a rule inside each of its values' classes, selecting the other. A value keeps its axis, `fui-<component>-<axis>-<value>`, where another axis of the tree has the same value or the tree's `keepAxis` lists it (`sidebar` lists `inset`, since `fui-sidebar-inset` is the inset part's class). Names come from the tree alone: a recipe named like a class another tree makes is refused, never renamed around.

Blocks inside a recipe carry what differs by state and by part: a value's states (hover, active, pressed, focus, checked, checkedWithin, focusWithin, invalidWithin, highlighted, placeholderShown, open, selected, invalid, current; `pressed` is active on an element that opens no popup, the `…Within` states hold a checked, focused or invalid control, `checked` also holds an indeterminate (mixed) control, `placeholderShown` is a segment still showing its placeholder, `current` is `data-active`) and three parts: `file`, the file selector button of a file input, `after`, the element's `::after`, and `link`, every link inside, which may hold a state of its own (`link: { hover: { textColor } }`). A base or an axis value may be `{}`: its class exists and sets nothing. A base, the values of any axis and a `with` block also set layout: `height`, `minHeight`, `width`, `minWidth`, `maxWidth`, `size`, `padding`, `paddingX`, `paddingY`, one side's `paddingTop`, `paddingBottom`, `paddingStart` or `paddingEnd`, `margin`, `marginX`, `marginY`, one side's `marginTop`, `marginBottom`, `marginStart` or `marginEnd`, `bleedX`, `bleedY` and the one-sided `bleedTop`, `bleedBottom`, `bleedStart` and `bleedEnd` (the negative of the step, so a value never writes a minus sign), and `gap`, the `icon` part's `size`, and `iconStart`'s `paddingStart` and `iconEnd`'s `paddingEnd`, the element's padding beside an edge icon, each a `{spacing.<n>}` step of the brand's spacing base. `width`, `minWidth` and `maxWidth` may take a `{container.<name>}` size instead, the brand's container scale (Tailwind's `xs` to `7xl` when it names none). A layout value steps at its container: an `@sm`, `@md` or `@lg` block holds the layout properties it takes once the nearest container is that wide, the brand's `container.<name>` or Tailwind's default (`md` is 28rem); the base is the narrowest form. A tree's base may set `contain: inline-size`, which makes its element the container its parts and everything inside query; a document that includes the brand CSS always has one, the scope root at worst. A family may carry layout and steps of its own, so an inset or an indent several trees share is written once (`surface-inset`, `indent`); a shared state never does. A value or a `with` block may hold `parts`, each part tree of the same component (`card-header` of `card`) mapped to the layout its base takes while the element wears the value; a part not in the tree or a property that is no layout is refused. Where two axes set one layout property, a `with` block for the pair decides. `card` carries a `surface` axis, `raised` or `bare`: raised stands on its own with its edge, shadow and inset, bare sits flush inside another surface with no edge, no shadow and no inset, so a Card-rooted section placed inside a Card passes `surface="bare"`. A Card is an inline-size container, so it needs a definite or stretched width; a Card sized by its content collapses. A colour reference may carry an alpha, `{colors.<role>/<NN>}`: the role at NN percent opacity, as Tailwind's `/NN`. A component's value colours the shared focus ring on its own element with `ringColor` and `ringBorderColor`.

A typed property, one a table of `@frontic/library-contract/recipe` covers, takes a token reference or a keyword, never free text. Colours take `{colors.<role>}`, `transparent` or `currentColor`, and `fill` and `stroke` also `none`. A size comes from a text style (`typography: {typography.<name>}`), an edge from `border: {border.<name>}` or `none`, an outline from `outline: {ring.<name>}`, which sets its width, style, colour and offset, and opacity from `{opacity.<name>}`. `translate` takes one or two axes, each `{spacing.<n>}`, `-{spacing.<n>}`, `0`, `full` or `-full`. `fontWeight`, `lineHeight`, `letterSpacing`, `textDecorationLine`, `textAlign`, `textTransform` and `visibility` take the keywords `VALUE_SETS` lists in `@frontic/library-contract/recipe`. `fontSize`, `borderWidth`, `borderStyle`, `outlineWidth`, `outlineStyle`, `outlineOffset`, `textUnderlineOffset`, `corner` and the bypassing shorthands `font`, `transform`, `textDecoration`, `borderRadius` and `boxShadow` are not recipe properties; the gate refuses each with the token that carries it. A project's untyped property renders with a warning; the registry's recipe files take typed properties only, so the gate refuses one there.

## Look Check

`look` resolves every served item's CSS and compares it with `look/<item>.txt` (`pnpm look [item…] [--write]`). It reads each element of the item's own files at every combination of the axes its class reads, at a phone (375px), a desktop (1536px) and any width the item adds in `scripts/lib/snapshot-run.ts`, every `var()` resolved against the default preset, motion included. A snapshot line is `<element> | <context> | <property>: <value>`; a line that does not hold at every combination ends in where it does, `[desktop variant=solid,soft]`, several such parts joined by `;`, with the axes it does not depend on left out.

A changed line, a served item without a snapshot or a snapshot without a served item exits 1. An intended change is rewritten with `look --write` (or `look --write <item>`), and the diff of `look/` is what review reads; a full `--write` also deletes the snapshot of a removed item. The snapshot says what changed, never whether it is right. CI runs it on every push to `main`, and on a pull request only when a file it reads changes (the `look` filter in `ci.yml`).

What it does not see:

- the look an element takes from a registry item it renders (Label, Separator, Button);
- a parent's `*:` / `[&>*]` variants on unslotted children, which show as lines on the parent;
- a class expression reading script state it cannot evaluate: it falls back to every literal and names the element in an `# approximate:` line;
- a part variable a value of its tree redeclares (`card`'s bare surface zeroing its header, content and footer sides): a part's lines read the part's own classes.

## Serving

The build's `public/v1/` is served as static files at `/v1/`, to any origin (`public/_headers`); the root answers with text pointing to ui.frontic.com (`functions/index.ts`). `/r/v2/` serves `public/r/v2/`, the registry as it was before `composes`, frozen until the stack's library-core reads `/v1/`, then goes. Nothing else is served: no other `/r/` path, no item markdown.

## Deployment

`deploy.yml` deploys to Cloudflare Pages (`frontic-registry`) after CI passes on `main`; every PR gets a preview at `pr-<N>`. By hand: `pnpm publish:cf` (or `publish:cf:preview`).

## License

The items are source-available under FSL-1.1-MIT, a Fair Source licence, served at https://registry.ui.frontic.com/LICENSE. The base items derived from shadcn-vue keep its MIT notice, served at https://registry.ui.frontic.com/THIRD-PARTY-NOTICES.
