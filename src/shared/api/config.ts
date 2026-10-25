export function parseApiBaseUrl(value: string): string {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "VITE_API_BASE_URL must be an HTTP(S) URL without credentials, query or fragment",
    );
  }
  return url.href.replace(/\/$/, "");
}

export const apiBaseUrl = parseApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
);
