<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://ui.frontic.com/frontic-ui-lockup-dark.svg">
  <img alt="Frontic UI" src="https://ui.frontic.com/frontic-ui-lockup-light.svg" height="56">
</picture>

# Frontic UI

Vue components for commerce storefronts, built for teams where an AI agent writes most of the code. `add` copies an item's source into your project; your brand's tokens and recipes set the look. No colour, radius or type style sits in a component: change a design token, run `build`, and every component follows. Interactive items build on Reka UI, so keyboard, focus and ARIA come with them.

This repository holds what lands in your project:

- **`@frontic/ui`**, the CLI: `create`, `init`, `add`, `build`, `check`, `docs` and the rest. It installs items, compiles your brand into `frontic.css`, and sets up the MCP server and agent skills.
- **The registry items**, in `packages/registry`: components, sections and templates, each with its manifest and recipes. They are served at `registry.ui.frontic.com`.
- **The library contract**, in `packages/library-contract`: what an item is, the brand compiler and the checks. It ships with its schemas.
- **The registry client**, in `packages/registry-client`: how the CLI reads the registry.

The CLI bundles the contract and the client, so you only install the CLI.

## Get started

```sh
npx @frontic/ui create my-store   # a new Nuxt or Vite project
npx @frontic/ui init              # or add Frontic UI to a project you have
npx @frontic/ui add button dialog card
```

Every item, with its variants, states and API, is at [ui.frontic.com](https://ui.frontic.com). Agents start at [ui.frontic.com/llms.txt](https://ui.frontic.com/llms.txt).

## Licence

Frontic UI is source-available (Fair Source) under the [Functional Source License, Version 1.1, MIT Future License](./LICENSE) (FSL-1.1-MIT). You may use, change and redistribute it for any purpose except a competing use, as the licence defines it. Two years after each release, that release is also available under the MIT licence.

Copyright frontstack GmbH DBA Frontic.

Parts of the components derive from [shadcn-vue](https://github.com/unovue/shadcn-vue), Copyright (c) 2023 unovue, used under the MIT licence. [THIRD-PARTY-NOTICES](./THIRD-PARTY-NOTICES) carries its notice.

"Frontic" is a trademark of frontstack GmbH. The licence grants no right to use it.

## Contributing

Frontic UI takes contributions as issues, not outside pull requests. Bring the problem: a bug you hit, or a job where Frontic UI gets in your way. The team builds the change and credits you as its contributor.

[CONTRIBUTING.md](./CONTRIBUTING.md) explains how an issue becomes a change. Every item is documented at [ui.frontic.com](https://ui.frontic.com).
