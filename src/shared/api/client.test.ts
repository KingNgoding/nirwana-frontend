import { describe, expect, it, vi } from "vitest";
import { queryClient } from "../query-client";
import { api } from "./client";
import { parseApiBaseUrl } from "./config";

describe("API boundary", () => {
  it("clears cached user data on session expiry", async () => {
    queryClient.setQueryData(["user", "synthetic"], { name: "Synthetic" });
    vi.mocked(fetch).mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            error: { code: "UNAUTHENTICATED", message: "Sesi berakhir." },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
    );
    await api.GET("/customers", { params: { query: { page: "1" } } });
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
  it.each([
    "file:///secret",
    "https://user:pass@example.com",
    "https://example.com?a=b",
    "not-a-url",
  ])("rejects unsafe API config %s", (url) => {
    expect(() => parseApiBaseUrl(url)).toThrow();
  });
  it("normalizes a valid base URL", () => {
    expect(parseApiBaseUrl("https://api-staging.nirwana.id/")).toBe(
      "https://api-staging.nirwana.id",
    );
  });
});
