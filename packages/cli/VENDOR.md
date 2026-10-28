# Vendored code

The CLI started as a copy of shadcn-vue's CLI (`packages/cli` of https://github.com/unovue/shadcn-vue, MIT). What remains of it is the project plumbing; the registry, the library and every command are Frontic's.

## From shadcn-vue

- `src/utils/create-project.ts`, `src/utils/frameworks.ts`, `src/utils/get-project-info.ts`, `src/utils/get-package-info.ts`, `src/utils/resolve-import.ts`: scaffolding and detecting a Nuxt or Vite project, its Tailwind CSS file and its tsconfig alias.
- `src/preflights/preflight-init.ts`, `src/preflights/preflight-add.ts`: the checks before `init` and `add`, trimmed to Tailwind v4.
- `src/utils/updaters/update-files.ts`, `src/utils/updaters/update-dependencies.ts`: writing an item's files into the project and installing its packages with `nypm`.
- `src/utils/transformers/`: the vue-metamorph pipeline that rewrites imports to the project's aliases, strips types for JavaScript projects and swaps icons to the configured icon library.
- `src/utils/compare.ts`, `src/utils/errors.ts`, `src/utils/handle-error.ts`, `src/utils/highlighter.ts`, `src/utils/logger.ts`, `src/utils/spinner.ts`.
- `src/commands/mcp.ts`, `src/commands/diff.ts`: shape and prompts.

## Frontic's

- `src/schema.ts`, `src/constants.ts`, `src/utils/get-config.ts`: `components.json` as `packages/registry/public/schema.json` describes it, one style (`bare`), one registry.
- `src/registry.ts`: the contract registry (`/v1/`) through `@frontic/registry-client`, bundled.
- `src/library.ts`: `library/brand.json`, each component manifest's recipes and the shared recipe files in `library/recipes/`, compiled into `frontic.css` by `@frontic/library-contract`, bundled; the contract's style presets ship in `dist/style-presets/`.
- `src/install.ts` and the commands `init`, `create`, `add`, `build`, `view`, `search`, `info`, `skill`.

Nothing is fetched from shadcn-vue's registry.
