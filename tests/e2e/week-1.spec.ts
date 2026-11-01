import { expect, type Page, test } from "@playwright/test";

type Role = "Admin" | "Officer" | "Teknisi" | "Client";
const home: Record<Role, string> = {
  Admin: "/admin",
  Officer: "/officer",
  Teknisi: "/technician",
  Client: "/client",
};
const staff = {
  accountId: "11111111-1111-4111-8111-111111111111",
  name: "Petugas Sintetis",
  phone: "+62811000001",
  role: "Officer",
  status: "Aktif",
  version: 1,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
};
async function installApi(page: Page, role: Role = "Client", signedIn = false) {
  const state = {
    signedIn,
    loginStatus: 200,
    otpStatus: 202,
    activateStatus: 204,
    expired: false,
    passwordFailure: false,
    conflict: false,
    status: staff.status,
    version: 1,
    calls: [] as {
      path: string;
      method: string;
      body: Record<string, unknown>;
    }[],
  };
  await page.route("http://localhost:3000/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
    state.calls.push({ path, method, body });
    const headers = {
      "Access-Control-Allow-Origin": "http://127.0.0.1:4173",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    const json = (status: number, data: unknown) =>
      route.fulfill({ status, json: data, headers });
    const empty = () => route.fulfill({ status: 204, headers });
    const fail = (status: number, code: string, extra = {}) =>
      json(status, {
        error: {
          code,
          message: "Private backend detail must never render",
          ...extra,
        },
      });
    if (method === "OPTIONS") return empty();
    if (path === "/auth/login") {
      if (state.loginStatus === 429)
        return fail(429, "RATE_LIMITED", { retryAfterSeconds: 3 });
      if (state.loginStatus !== 200)
        return fail(state.loginStatus, "INVALID_CREDENTIALS");
      state.signedIn = true;
      return json(200, {
        user: {
          id: "synthetic",
          name: `${role} Sintetis`,
          role,
          customerId: role === "Client" ? "0001" : null,
        },
      });
    }
    if (path === "/auth/me")
      return state.signedIn && !state.expired
        ? json(200, {
            user: {
              id: "synthetic",
              name: `${role} Sintetis`,
              role,
              customerId: role === "Client" ? "0001" : null,
            },
          })
        : fail(401, "UNAUTHENTICATED");
    if (path === "/auth/logout") {
      state.signedIn = false;
      return empty();
    }
    if (path === "/auth/otp/request")
      return state.otpStatus === 202
        ? json(202, { message: "neutral" })
        : fail(
            state.otpStatus,
            state.otpStatus === 429 ? "RATE_LIMITED" : "INTERNAL_ERROR",
            { retryAfterSeconds: 3 },
          );
    if (path === "/auth/activate")
      return state.activateStatus === 204
        ? empty()
        : fail(state.activateStatus, "OTP_INVALID");
    if (path === "/auth/password") {
      if (state.passwordFailure)
        return json(400, {
          error: {
            code: "VALIDATION_ERROR",
            message: "hidden",
            issues: [{ path: "currentPassword" }],
          },
        });
      state.signedIn = false;
      return empty();
    }
    if (!state.signedIn || state.expired) return fail(401, "UNAUTHENTICATED");
    if (path === "/staff-accounts" && method === "GET")
      return role === "Admin"
        ? json(200, {
            items: [{ ...staff, status: state.status, version: state.version }],
            page: 1,
            pageSize: 20,
            total: 1,
          })
        : fail(403, "FORBIDDEN");
    if (path === "/staff-accounts" && method === "POST")
      return json(201, { ...staff, ...body, status: "Belum Aktif" });
    if (path.startsWith("/staff-accounts/") && method === "PATCH") {
      if (state.conflict) {
        state.conflict = false;
        state.version = 2;
        return json(409, {
          error: { code: "VERSION_CONFLICT", message: "hidden" },
          current: { ...staff, name: "Nama Terbaru", version: 2 },
        });
      }
      state.version++;
      return json(200, { ...staff, ...body, version: state.version });
    }
    if (path.startsWith("/accounts/") && method === "PUT") {
      state.status = String(body.status);
      state.version++;
      return json(200, {
        ...staff,
        status: state.status,
        version: state.version,
      });
    }
    return fail(404, "NOT_FOUND");
  });
  return state;
}

test("login layout, theme, validation, keyboard and mobile width", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const state = await installApi(page);
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Masuk ke akun Anda" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(
    page.getByText("Masukkan nomor WhatsApp.", { exact: true }),
  ).toBeVisible();
  expect(
    state.calls.filter((call) => call.path === "/auth/login"),
  ).toHaveLength(0);
  await page.getByRole("button", { name: "Gunakan tema gelap" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: `test-results/login-dark-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Gunakan tema terang" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Masuk ke akun Anda" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/login-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
for (const role of Object.keys(home) as Role[])
  test(`${role} logs in, reloads with server session and signs out`, async ({
    page,
  }) => {
    const state = await installApi(page, role);
    await page.goto("/login");
    await page
      .getByLabel("Nomor WhatsApp", { exact: true })
      .fill("0811 000 001");
    await page
      .getByLabel("Password", { exact: true })
      .fill("synthetic-password");
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${home[role]}$`));
    await expect(
      page.getByRole("heading", { name: `Selamat datang, ${role} Sintetis.` }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: /Selamat datang/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => [
        ...Object.keys(localStorage),
        ...Object.keys(sessionStorage),
      ]),
    ).toEqual([]);
    if (role !== "Admin")
      await expect(
        page.getByRole("link", { name: "Akun staf", exact: true }),
      ).toHaveCount(0);
    await page.getByRole("button", { name: "Keluar dari akun" }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(state.signedIn).toBe(false);
    await page.goto(home[role]);
    await expect(page).toHaveURL(/reason=expired/);
  });
for (const role of ["Client", "Officer", "Teknisi"] as Role[])
  test(`${role} cannot load staff management through a URL`, async ({
    page,
  }) => {
    const state = await installApi(page, role, true);
    await page.goto("/admin/accounts");
    await expect(
      page.getByRole("heading", { name: "Akses ditolak" }),
    ).toBeVisible();
    expect(state.calls.some((call) => call.path === "/staff-accounts")).toBe(
      false,
    );
  });
test("server lockout is respected and internal messages stay hidden", async ({
  page,
}) => {
  const state = await installApi(page);
  state.loginStatus = 429;
  await page.goto("/login");
  await page.getByLabel("Nomor WhatsApp", { exact: true }).fill("0811000001");
  await page.getByLabel("Password", { exact: true }).fill("synthetic-password");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Terlalu banyak percobaan",
  );
  await expect(
    page.getByRole("button", { name: "Masuk", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText(/Private backend detail/)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Masuk", exact: true }),
  ).toBeEnabled({ timeout: 7000 });
});
for (const activate of [true, false])
  test(`${activate ? "activation" : "recovery"} uses real contract payload, confirmation and success`, async ({
    page,
  }) => {
    const state = await installApi(page);
    await page.goto(activate ? "/first-login" : "/forgot-password");
    await page.getByLabel("Nomor WhatsApp terdaftar").fill("0811000001");
    await page.getByRole("button", { name: "Minta kode verifikasi" }).click();
    await expect(
      page.getByText(/Ini belum memastikan pesan diterima/),
    ).toBeVisible();
    await page.getByLabel("Kode verifikasi enam digit").fill("123456");
    await page
      .getByLabel("Password baru", { exact: true })
      .fill("new-synthetic-password");
    await page
      .getByLabel("Konfirmasi password baru", { exact: true })
      .fill("wrong-password");
    const submit = page.getByRole("button", {
      name: activate ? "Aktifkan akun" : "Simpan password",
      exact: true,
    });
    await submit.click();
    await expect(
      page.getByText("Konfirmasi password belum cocok."),
    ).toBeVisible();
    expect(state.calls.some((call) => call.path === "/auth/activate")).toBe(
      false,
    );
    await page
      .getByLabel("Konfirmasi password baru", { exact: true })
      .fill("new-synthetic-password");
    await submit.click();
    await expect(
      page.getByRole("heading", {
        name: activate ? "Aktivasi berhasil" : "Password berhasil diperbarui",
      }),
    ).toBeVisible();
    expect(
      state.calls.find((call) => call.path === "/auth/otp/request")?.body,
    ).toEqual({
      phone: "0811000001",
      purpose: activate ? "activation" : "recovery",
    });
    expect(
      state.calls.find((call) => call.path === "/auth/activate")?.body,
    ).toEqual({
      phone: "0811000001",
      otp: "123456",
      password: "new-synthetic-password",
      passwordConfirmation: "new-synthetic-password",
    });
  });
test("failed OTP request does not show delivery or advance the flow", async ({
  page,
}) => {
  const state = await installApi(page);
  state.otpStatus = 500;
  await page.goto("/forgot-password");
  await page.getByLabel("Nomor WhatsApp terdaftar").fill("0811000001");
  await page.getByRole("button", { name: "Minta kode verifikasi" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Kode verifikasi enam digit")).toHaveCount(0);
  state.otpStatus = 202;
  await page.getByRole("button", { name: "Minta kode verifikasi" }).click();
  await expect(page.getByLabel("Kode verifikasi enam digit")).toBeVisible();
});
test("expired OTP disables submit and enables a new request", async ({
  page,
}) => {
  await page.clock.install();
  await installApi(page);
  await page.goto("/first-login");
  await page.getByLabel("Nomor WhatsApp terdaftar").fill("0811000001");
  await page.getByRole("button", { name: "Minta kode verifikasi" }).click();
  await expect(page.getByLabel("Kode verifikasi enam digit")).toBeVisible();
  await page.clock.fastForward(301000);
  await expect(page.getByRole("timer")).toHaveText("Kode kedaluwarsa");
  await expect(
    page.getByRole("button", { name: "Aktifkan akun", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Kirim ulang", exact: true }).click();
  await expect(page.getByRole("timer")).toContainText("Perkiraan sisa waktu");
});
test("session expiry on navigation removes protected content", async ({
  page,
}) => {
  const state = await installApi(page, "Client", true);
  await page.goto("/client");
  await expect(
    page.getByRole("heading", { name: /Selamat datang/ }),
  ).toBeVisible();
  state.expired = true;
  await page.getByRole("link", { name: "Kelola keamanan akun" }).click();
  await expect(page).toHaveURL(/reason=expired/);
  await expect(
    page.getByRole("heading", { name: /Selamat datang/ }),
  ).toHaveCount(0);
});
test("password change keeps session on rejection and ends it on success", async ({
  page,
}) => {
  const state = await installApi(page, "Client", true);
  state.passwordFailure = true;
  await page.goto("/client/security");
  await page
    .getByLabel("Password saat ini", { exact: true })
    .fill("old-synthetic-password");
  await page
    .getByLabel("Password baru", { exact: true })
    .fill("new-synthetic-password");
  await page
    .getByLabel("Konfirmasi password baru", { exact: true })
    .fill("new-synthetic-password");
  await page.getByRole("button", { name: "Simpan password baru" }).click();
  await expect(page.getByText("Password saat ini tidak cocok.")).toBeVisible();
  expect(state.signedIn).toBe(true);
  state.passwordFailure = false;
  await page.getByRole("button", { name: "Simpan password baru" }).click();
  await expect(page).toHaveURL(/reason=password/);
  await expect(page.getByText(/Password berhasil diubah/)).toBeVisible();
  expect(state.signedIn).toBe(false);
});
test("Admin creates staff, reviews a conflict and confirms a status change", async ({
  page,
}) => {
  const state = await installApi(page, "Admin", true);
  await page.goto("/admin/accounts");
  await page.getByRole("button", { name: "Tambah staf" }).click();
  await page.getByLabel("Nama lengkap").fill("Staf Baru Sintetis");
  await page.getByLabel("Nomor WhatsApp", { exact: true }).fill("0811000002");
  await page
    .getByRole("dialog")
    .getByLabel("Peran", { exact: true })
    .selectOption("Teknisi");
  await page.getByRole("button", { name: "Buat akun staf" }).click();
  await expect(page.getByRole("status")).toContainText("Belum Aktif");
  const created = state.calls.find(
    (call) => call.path === "/staff-accounts" && call.method === "POST",
  );
  expect(created?.body).toEqual({
    name: "Staf Baru Sintetis",
    phone: "0811000002",
    role: "Teknisi",
  });
  state.conflict = true;
  await page
    .getByRole("button", { name: "Ubah akun Petugas Sintetis" })
    .click();
  await page.getByLabel("Nama lengkap").fill("Nama Lokal");
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "data terbaru",
  );
  await expect(page.getByLabel("Nama lengkap")).toHaveValue("Nama Terbaru");
  expect(state.calls.filter((call) => call.method === "PATCH")).toHaveLength(1);
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    state.calls.filter((call) => call.method === "PATCH").at(-1)?.body.version,
  ).toBe(2);
  await page
    .getByRole("button", { name: "Nonaktifkan akun Petugas Sintetis" })
    .click();
  await page
    .getByRole("button", { name: "Konfirmasi nonaktifkan akun" })
    .click();
  await expect(page.getByText("Tuliskan alasan perubahan.")).toBeVisible();
  await page.getByLabel("Alasan perubahan status").fill("Akses uji selesai");
  await page
    .getByRole("button", { name: "Konfirmasi nonaktifkan akun" })
    .click();
  await expect(page.getByRole("status")).toContainText("Nonaktif");
  await expect(
    page.getByRole("button", { name: "Aktifkan akun Petugas Sintetis" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Aktifkan akun Petugas Sintetis" })
    .click();
  await page.getByLabel("Alasan perubahan status").fill("Kembali bertugas");
  await page.getByRole("button", { name: "Konfirmasi aktifkan akun" }).click();
  await expect(page.getByRole("status")).toContainText("Aktif");
  await page.screenshot({
    path: `test-results/accounts-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("invalid OTP keeps the flow open and never reports success", async ({
  page,
}) => {
  const state = await installApi(page);
  state.activateStatus = 401;
  await page.goto("/first-login");
  await page.getByLabel("Nomor WhatsApp terdaftar").fill("0811000001");
  await page.getByRole("button", { name: "Minta kode verifikasi" }).click();
  await page.getByLabel("Kode verifikasi enam digit").fill("000000");
  await page
    .getByLabel("Password baru", { exact: true })
    .fill("new-synthetic-password");
  await page
    .getByLabel("Konfirmasi password baru", { exact: true })
    .fill("new-synthetic-password");
  await page
    .getByRole("button", { name: "Aktifkan akun", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Kode salah");
  await expect(
    page.getByRole("heading", { name: "Aktivasi berhasil" }),
  ).toHaveCount(0);
  expect(
    state.calls.filter((call) => call.path === "/auth/activate"),
  ).toHaveLength(1);
});
