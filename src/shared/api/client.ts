import createClient from "openapi-fetch";
import { clearUserSessionCache } from "../query-client";
import { apiBaseUrl } from "./config";
import type { paths } from "./schema";

export const api = createClient<paths>({
  baseUrl: apiBaseUrl,
  credentials: "include",
});

api.use({
  async onResponse({ response }) {
    if (response.status === 401) await clearUserSessionCache();
    return response;
  },
});
