// The types of the runtime's lib/source.ts, for checks that run without the runtime.
export type FronticFilter =
  | { field: string; type: "equals" | "contains"; value: (string | number)[] }
  | { field: string; type: "range"; from?: number; to?: number }
  | { type: "and" | "or" | "not"; filter: FronticFilter[] };
export type FronticSourceContext = { domain: string } | { key: string };
export type FronticListingQuery = {
  param?: Record<string, unknown>;
  page?: number;
  limit?: number;
  search?: string;
  sort?: { field: string; order: "asc" | "desc" };
  filter?: FronticFilter[];
};
export type FronticSource =
  | { kind: "listing"; name: string; query?: FronticListingQuery; context?: FronticSourceContext }
  | { kind: "block"; name: string; key: string; context?: FronticSourceContext }
  | {
      kind: "tree";
      name: string;
      query?: { key?: string; depth?: number };
      context?: FronticSourceContext;
    }
  | { kind: "page"; url: string; context?: FronticSourceContext };

export type ResolveOptions = { fetchDomain?: string | null };

export declare function resolveSource<T = unknown>(
  source: FronticSource,
  options?: ResolveOptions,
): Promise<T | null>;

export declare function resolveExampleData(
  data: Record<string, { source?: FronticSource; static?: unknown }> | null,
  forms?: Record<string, string>,
  options?: ResolveOptions,
): Promise<Record<string, unknown>>;
