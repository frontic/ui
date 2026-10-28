export { exampleDeps, getExamples, getIconMap, getIndex, getItem, search } from './client'
export type { ClientOptions } from './client'
export { ICON_LIBRARY_NAMES, iconMapSchema, indexSchema, itemSchema } from './schemas'
export type { IconLibraryName, IconMap, IndexEntry, RegistryFile, RegistryItem, SearchResults } from './schemas'
export {
  addCommand,
  buildPrompt,
  CLI,
  docsPath,
  exampleItems,
  exampleNpmPackages,
  importedPackages,
  exampleSlug,
  examplesOf,
  ITEM_STATES,
  itemApiSchema,
  itemMarkdown,
  MCP_NAME,
  MCP_URL,
  packageName,
  reExportsOnly,
  REGISTRY_URL,
  SITE_URL,
  TIER_NAMES,
  tierOf,
  TIERS,
} from './api'
export type { ApiPart, ApiProp, ItemApi, ItemExport, ItemLink, ItemState, Tier } from './api'
