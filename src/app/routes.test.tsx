import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { routes } from "./routes";

describe("data routes", () => {
  it("shows the foundation and its operational limits", async () => {
    render(<RouterProvider router={createMemoryRouter(routes)} />);
    expect(
      await screen.findByRole("heading", { name: /Fondasi baru/ }),
    ).toBeVisible();
    expect(screen.getByText(/Belum tersedia layanan pelanggan/)).toBeVisible();
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
});
