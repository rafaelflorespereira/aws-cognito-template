import { QueryCache, QueryClient, MutationCache } from "@tanstack/react-query";

// Keep a structured console trace without triggering React Native's red error
// overlay. Query consumers already expose these failures through their UI state.
function logFailure(kind: "query" | "mutation", key: unknown, error: unknown) {
  console.info(`[${kind}] ${JSON.stringify(key)} failed:`, error);
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
