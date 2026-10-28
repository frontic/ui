export class UnknownLibraryImportError extends Error {
  code: 'unknown-library-import'
}

export function registryDependencies(
  registry: { items?: { name: string; type: string; files?: { path: string; type: string }[] }[] },
  texts: Record<string, string | null | undefined>,
): Map<string, string[]>
