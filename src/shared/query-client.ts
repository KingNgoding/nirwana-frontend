import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: false },
    mutations: { retry: false },
  },
});

// Call after logout or session expiry. Cancel before clearing user-scoped data.
export async function clearUserSessionCache() {
  await queryClient.cancelQueries();
  queryClient.clear();
}
