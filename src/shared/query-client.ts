import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: false },
    mutations: { retry: false },
  },
});

// Call after logout or session expiry. Cancel before clearing user-scoped data.
export async function clearUserSessionCache({
  cancelSession = true,
}: {
  cancelSession?: boolean;
} = {}) {
  // Do not cancel /auth/me from its own 401 response; let it settle to null.
  const userData = {
    predicate: (query: { queryKey: readonly unknown[] }) =>
      query.queryKey[0] !== "session",
  };
  await queryClient.cancelQueries(cancelSession ? {} : userData);
  queryClient.removeQueries(userData);
  queryClient.getMutationCache().clear();
  queryClient.setQueryData(["session"], null);
}
