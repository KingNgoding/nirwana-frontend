import { queryOptions, useQuery } from "@tanstack/react-query";
import { Schema } from "effect";
import { api } from "../../shared/api/client";
import { readResult } from "../../shared/api/result";
import type { components } from "../../shared/api/schema";
import { clearUserSessionCache, queryClient } from "../../shared/query-client";

export type User = components["schemas"]["AuthUser"];
export type Role = User["role"];
export const homeFor: Record<Role, string> = {
  Admin: "/admin",
  Officer: "/officer",
  Teknisi: "/technician",
  Client: "/client",
};
const sessionSchema = Schema.Struct({
  user: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    role: Schema.Literal("Admin", "Officer", "Teknisi", "Client"),
    customerId: Schema.NullOr(Schema.String),
  }),
});
export const sessionOptions = queryOptions({
  queryKey: ["session"],
  queryFn: async ({ signal }): Promise<User | null> => {
    const result = await api.GET("/auth/me", { signal });
    if (result.response.status === 401) return null;
    return Schema.decodeUnknownSync(sessionSchema)(readResult(result)).user;
  },
  staleTime: 0,
  retry: false,
  refetchOnMount: false,
  // Revalidate on focus and route changes, never keep an idle session alive by polling.
  refetchOnWindowFocus: true,
});
export function useSession() {
  return useQuery(sessionOptions);
}
export async function refreshSession() {
  return queryClient.fetchQuery(sessionOptions);
}
export async function endLocalSession() {
  await clearUserSessionCache();
}
