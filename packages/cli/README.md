<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://ui.frontic.com/frontic-ui-lockup-dark.svg">
  <img alt="Frontic UI" src="https://ui.frontic.com/frontic-ui-lockup-light.svg" height="56">
</picture>

# Frontic UI

Vue components for commerce storefronts, built for teams where an AI agent writes most of the code.

Agents write components fast and drift while they do it: a hex code here, a `14px` there, a slightly different radius on every card. Each file is fine on its own. Together they stop looking like one brand.

Frontic UI takes those decisions out of the component. No colour, size or radius ever sits in a component. The agent decides what the UI does; the colour, type and spacing come from the brand and from nowhere else. Change one token in `library/brand.json`, run `build`, and every component in the project follows, including the ones shipped last month.

Every item is accessible by design: keyboard, focus, roles and labels are built in, so what an agent assembles from them meets current regulations without anyone auditing it afterwards.

## Start

```bash
npx @frontic/ui create my-store        # a new Nuxt or Vite project, MCP and skills set up
npx @frontic/ui init                   # or add Frontic UI to a project you have
npx @frontic/ui add button dialog card # items and the recipes they need
npx @frontic/ui build                  # after you edit brand.json or a recipe
```

Use `pnpm dlx` or `bunx` instead of `npx` if that's your runner.

Then give the agent the brand. It has the design-system skill from `create` or `skills`; this prompt starts it:

> Use the design-system skill to build this project's design system from <your storefront URL, Figma library or codebase>, install the pages that show it, and compare them against the source.

## How it holds

Three layers, each one unable to do the next one's job.

**Items** are Vue files in your repo, one folder each, with their own API. An item wears recipe classes like `fui-button-solid`. It has no palette class to wear, so there is nothing to drift.

Items are not a dependency. Like [shadcn](https://ui.shadcn.com), `add` copies the source into your project and from then on it is your component. Treat it as a starting point that skips the first eight levels, not a finished thing: remove the variants you don't use, add the ones your design needs today, change the API. Nothing updates underneath you, and `diff` shows you what the registry has if you ever want to look.

**Recipes** live with the component they style. `add` writes each component's manifest beside its files, `components/ui/card/card.json`, holding its title, description and its recipes by name: `card`, `card-header` and the other parts, each listing in `composes` the shared recipes its element wears, such as `focus-ring`. A recipe several components share, such as the `action` family, sits in `library/recipes/action.json`. `add` brings the recipes an item needs, adds a missing one to its file and keeps one you edited. Delete a component's folder and its recipes leave `frontic.css` on the next `build`. A recipe says `backgroundColor: '{colors.primary}'`, never `#7008e7`. It has a base, variant axes and defaults, the shape of the component's `cva` call; a look for two values together sits under one of them as `with`, and needs nothing in the component.

To restyle a part, edit its recipe and build: for more room in the accordion's trigger, change `paddingY` under `accordion-trigger` in `components/ui/accordion/accordion.json` from `{spacing.4}` to `{spacing.5}`, then run `npx @frontic/ui build`.

```json
"accordion-trigger": {
  "composes": ["focus-ring", "disabled"],
  "base": {
    "paddingY": "{spacing.5}",
```

**Tokens** live in `library/brand.json`: colours by role (`primary`, `muted`, `buy`, `promo`), text styles (`heading`, `body`, `small`), radius, borders, shadows, breakpoints and fonts. This is the only file where a value like `#7008e7` can appear.

`build` compiles the tokens and the recipes into `frontic.css`. Tailwind emits only what your templates use.

`check` holds the project to them. It fails on a class the brand's theme does not define, a colour below contrast and a recipe token the brand lacks, and warns about text written into an item and about two variant values that set one property with no `with` pair to decide. `build` prints the same findings as warnings. The `check` block in `components.json` sets each rule to `error`, `warn` or `off` and the contrast level to `AA` or `AAA`.

Neither file is a format of our own. `brand.json` follows the [W3C Design Tokens (DTCG)](https://www.designtokens.org) specification, so the tokens your design tool exports are the tokens the build reads. `DESIGN.md` takes its sections from [Google's DESIGN.md](https://github.com/google-labs-code/design.md), the convention agents already know for describing a design system in Markdown. Frontic UI puts shadcn's copy-the-source model, DTCG tokens and DESIGN.md together rather than inventing a fourth thing.

Both files are plain text. Your agent reads and edits them exactly as you do, and a change to the look is a change to one of them, never a class on a component.

## Your DESIGN.md

`DESIGN.md` is meant to become your design system's rulebook: the voice of the brand, how spacing works, when to use `buy` and when `promo`, which layouts a product page allows, what a component should never do. Write it the way you'd write it for a new designer. `init` writes its eight section headings, Overview to Do's and Don'ts; after that it is yours alone. Nothing compiles it: a look is a token in `brand.json` or a value in a recipe, and `DESIGN.md` says when to use it.

The agent reads it before it writes. So when a page needs a component that doesn't exist yet, the agent builds it the way the rest were built: with the same tokens, its recipes in a manifest beside its files like the others, following the rules you wrote. New work lands inside the system, not next to it.

## Accessible by design

Items are built on [Reka UI](https://reka-ui.com), so focus management, keyboard navigation, ARIA roles and labels come with the component. Contrast is a property of the tokens and recipes, checked by `check` against `brand.json` rather than once per screen, at AA or AAA. Together that covers each component's share of WCAG 2.2 AA. The page around them is the project's: heading order, alt text, link text, labels and reading order are written where the page is, and `check` doesn't see them.

## Work with an agent

```bash
npx @frontic/ui mcp --client claude    # the registry, browsable from your editor
npx @frontic/ui skills --client claude # the rules, the skill that builds a brand from a source, and the review brief
```

The MCP server lets the agent search items, read an item's API and styling, and get the install command. The skill tells it how to work here: items through their barrels, colour and type through the brand's utilities, changes to the look through the tokens and the recipes. `create` sets both up; `cursor`, `vscode`, `codex` and `opencode` are the other clients.

## Commands

| Command           | Does                                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `create [name]`   | Creates a new project, then runs `init`, `mcp` and `skills`                                                                      |
| `init`            | Adds `components.json`, `library/`, `frontic.css`, its import and `AGENTS.md`; `--library <path>` moves the library              |
| `add <items...>`  | Installs items and their dependencies, writes each one's manifest and recipes, recompiles; `--overwrite` replaces edited recipes |
| `build`           | Compiles `brand.json` and the recipes into `frontic.css`; installs the font packages the brand names                             |
| `check`           | Lints the project against its brand: classes outside the theme, raw text in items, contrast, missing tokens; exits 1 on an error |
| `docs <items...>` | Prints an item's docs: install command, examples, API, styling and source                                                        |
| `view <items...>` | Prints items' registry records as JSON                                                                                           |
| `search [query]`  | Finds items by name and description; `--tier` narrows to ui, sections, templates, lib or composables                             |
| `diff [item]`     | Compares your installed files against the registry                                                                               |
| `info`            | Shows the project's config, library path and installed items                                                                     |
| `mcp`, `skills`   | Agent setup, per client; `skills` writes the frontic-ui, design-system and frontic-ui-review skills                              |

## Icons

Pick a library at `init`: Lucide, Tabler, Hugeicons, Phosphor or Remix Icon. Items are rewritten to it on install.

## See it

Every item, with every variant and state, at [ui.frontic.com](https://ui.frontic.com): the example, the variant matrix, the API, and the tokens and recipes behind it.

## Beyond one project

[Frontic](https://frontic.com) manages everything a next-generation storefront needs: its data, APIs, agents and context, and its design system. A Frontic account keeps a company's library (the same design tokens, recipes, components and styleguide) in one place and syncs it with the `frontic` CLI into every project where agents write code.

## Built on

[shadcn-vue](https://www.shadcn-vue.com) and [Reka UI](https://reka-ui.com), both MIT.

## License

Source-available under the Functional Source License 1.1 with the MIT future licence (FSL-1.1-MIT), a Fair Source licence: each release becomes MIT two years after it ships. See `LICENSE`; the code taken from shadcn-vue keeps its MIT notice in `THIRD-PARTY-NOTICES.md`.
