# Frontic UI components

The folders here are Frontic UI items, installed as source by `npx @frontic/ui add`. Their look is not in their markup. It comes from recipes: each item's `<name>.json` holds its recipes by name (`card.json` holds `card`, `card-header`, …) and extends the families and states in `library/recipes/`. Recipes name tokens in `library/brand.json`, compiled into `frontic.css` by `npx @frontic/ui build`. Paths follow the `library` setting in `components.json`.

Before using or changing anything here, load the `frontic-ui` skill if the project has it, or run `npx @frontic/ui docs <item>` for the item's API, variants and recipes.

## Rules

- **Read the rulebook.** `library/DESIGN.md` says when to use which variant and what the brand never does. It describes; the tokens and recipe files define. A value written there does nothing.
- **Read before you use.** `npx @frontic/ui info --json` tells you the aliases, icon library and installed items. `docs <item>` lists every part's props, events, slots and variant values. Never guess a prop or a variant value.
- **An item's look is its recipe's.** Pick a variant: `<Button variant="outline" color="buy">`. `class` on an item is for placement only: margin, width, grid or flex position. Never a colour, size or radius class on an item.
- **Colour, type, radius and shadow come from the brand.** In your own templates use the brand utilities: `bg-primary`, `text-muted-foreground`, `border-border`, `text-buy`, `text-heading`, `font-heading`, `rounded-md`, `shadow-sm`. Never `bg-blue-500`, never a hex value, never `text-[13px]`.
- **Change the look in the recipes, not the markup.** A new colour, size or variant is a token in `library/brand.json` or a recipe value under its name in the item's `<name>.json`, then `npx @frontic/ui build`, then `npx @frontic/ui check`. Editing a `.vue` or `.ts` file here is for behaviour and markup only; `npx @frontic/ui diff` then shows what the registry changed since.
- **Keep `composes` and the class together.** A recipe tree's `composes` lists the shared recipes whose class its element wears; add or remove the class in the `.vue` together with the entry.
- **Never edit `frontic.css`.** `build` overwrites it.
- **Have a restyle or a new page reviewed.** After `check` passes, hand the review to a subagent with the `frontic-ui-review` skill: the route, what changed, what it should look like. It reports, you fix. If your client can't spawn one, follow that skill yourself as a separate pass.
- **Icons** come from the project's icon library. Inside an item that takes an icon, put `data-icon` on it and no size class; the recipe sizes it.
- **Forms.** Every control sits in a `Field`, which wires id, name, required, description and errors. Do not wire labels and errors by hand.
- **One `ConfigProvider` at the app root** gives every item its reading direction, locale and overlay target. Do not pass `dir` or `locale` to each item; an item's own prop is for the exception. A side an item opens from, such as a `Sheet`'s `side`, is `start` or `end`, not `left` or `right`, so it mirrors with the page.
- **Prefer an item to custom markup.** Callouts are `Alert`, empty states `Empty`, loading `Skeleton` or `Spinner`, labels `Badge`, dividers `Separator`. Search the registry before writing a styled `div`.
- **Import through the barrel:** `import { Button } from '@/components/ui/button'`. The Nuxt module auto-imports items.
- **Keep installed items updatable.** Do not rename folders, move parts out of their folder or hand-edit the `index.ts` barrels; `add --overwrite` and `diff` rely on them.

## Commands

| Command                          | Does                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `npx @frontic/ui search <query>` | find items by name and description                                                                                |
| `npx @frontic/ui docs <item>`    | an item's examples, API, recipes and source                                                                       |
| `npx @frontic/ui add <items>`    | install items, their dependencies and their recipe files, then rebuild                                            |
| `npx @frontic/ui build`          | compile `brand.json` + `recipes/` to `frontic.css`; run after every manual edit                                   |
| `npx @frontic/ui check`          | the project against its brand: classes outside the theme, raw text, contrast, missing tokens; exits 1 on an error |
| `npx @frontic/ui diff [item]`    | installed files against the registry                                                                              |
| `npx @frontic/ui info`           | the project: config, library, installed items, whether `frontic.css` is current                                   |

The hosted MCP server `frontic-ui` (`npx @frontic/ui mcp --client <claude|cursor|vscode|codex|opencode>`) offers `search_registry_items`, `get_item_docs`, `get_item_examples` and `get_add_command`. Use it to explore; use the CLI for everything that touches the project.
