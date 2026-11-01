import createClient from "openapi-fetch";
import { clearUserSessionCache } from "../query-client";
import { apiBaseUrl } from "./config";
import type { paths } from "./schema";

export const api = createClient<paths>({
  baseUrl: apiBaseUrl,
  credentials: "include",
});

api.use({
  async onResponse({ response, schemaPath }) {
    const publicAuth = [
      "/auth/login",
      "/auth/activate",
      "/auth/otp/request",
      "/auth/phone-change/confirm",
    ].includes(schemaPath);
    if (response.status === 401 && !publicAuth)
      await clearUserSessionCache({ cancelSession: schemaPath !== "/auth/me" });
    return response;
  },
});
