import { expect, test } from "@playwright/test";

test("foundation, navigation, deep link and responsive width", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Fondasi baru/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Tentang aplikasi" }).click();
  await expect(page).toHaveURL(/\/tentang$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Fondasi untuk layanan Nirwana." }),
  ).toBeVisible();
  await page.goto("/tidak-ada");
  await expect(
    page.getByRole("heading", { name: "Halaman tidak ditemukan" }),
  ).toBeVisible();
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `test-results/foundation-${test.info().project.name}.png`,
    fullPage: true,
  });
});
