import { QueryCache, QueryClient, MutationCache } from "@tanstack/react-query";

// Single place all query/mutation failures pass through — sync.ts's own
// try/catch swallows network errors into `null` (best-effort sync), so
// without this a 404/500 from a stale backend deploy looks identical to
// "user is offline" and never surfaces anywhere.
function logFailure(kind: "query" | "mutation", key: unknown, error: unknown) {
  console.error(`[${kind}] ${JSON.stringify(key)} failed:`, error);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => logFailure("query", query.queryKey, error),
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) =>
      logFailure("mutation", mutation.options.mutationKey, error),
  }),
});
