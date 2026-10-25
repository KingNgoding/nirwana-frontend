import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Install before importing clients: openapi-fetch captures fetch at construction.
vi.stubGlobal(
  "fetch",
  vi.fn(async () => {
    throw new Error("Unexpected network request in unit test");
  }),
);

afterEach(cleanup);
