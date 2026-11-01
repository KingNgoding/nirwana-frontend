import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryClient } from "../shared/query-client";
import { routes } from "./routes";

describe("data routes", () => {
  beforeEach(() => queryClient.clear());
  it("shows login without prototype credentials or a role switcher", async () => {
    render(<RouterProvider router={createMemoryRouter(routes)} />);
    expect(
      await screen.findByRole("heading", { name: "Masuk ke akun Anda" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Nomor WhatsApp")).toBeVisible();
    expect(screen.queryByText("Mode demo")).toBeNull();
  });
  it("handles unknown deep links", async () => {
    render(
      <RouterProvider
        router={createMemoryRouter(routes, { initialEntries: ["/tidak-ada"] })}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "Halaman tidak ditemukan" }),
    ).toBeVisible();
  });
  it("refuses a direct Client navigation to the Admin route", async () => {
    vi.mocked(fetch).mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            user: {
              id: "synthetic-client",
              name: "Client sintetis",
              role: "Client",
              customerId: "0001",
            },
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
    );
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider
          router={createMemoryRouter(routes, {
            initialEntries: ["/admin/accounts"],
          })}
        />
      </QueryClientProvider>,
    );
    expect(
      await screen.findByRole("heading", { name: "Akses ditolak" }),
    ).toBeVisible();
    expect(
      vi
        .mocked(fetch)
        .mock.calls.every(
          ([request]) =>
            request instanceof Request &&
            !request.url.includes("staff-accounts"),
        ),
    ).toBe(true);
  });
});
