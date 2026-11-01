const messages: Record<string, string> = {
  VALIDATION_ERROR: "Periksa isian yang ditandai, lalu coba kembali.",
  INVALID_CREDENTIALS:
    "Nomor atau password tidak cocok. Jika belum pernah masuk, gunakan aktivasi akun. Akun Nonaktif memerlukan bantuan Admin.",
  OTP_INVALID:
    "Kode salah, kedaluwarsa, sudah digunakan, atau tidak dapat dipakai. Periksa kode atau minta kode baru.",
  UNAUTHENTICATED: "Sesi Anda sudah berakhir. Silakan masuk kembali.",
  FORBIDDEN: "Anda tidak memiliki izin untuk tindakan ini.",
  FORBIDDEN_ORIGIN:
    "Akses dari alamat aplikasi ini belum diizinkan. Hubungi pengelola.",
  PHONE_TAKEN: "Nomor tersebut sudah digunakan akun lain.",
  VERSION_CONFLICT:
    "Data sudah berubah. Tinjau data terbaru sebelum menyimpan kembali.",
  INVALID_STATE:
    "Status akun tidak mendukung perubahan ini. Muat data terbaru.",
  RATE_LIMITED: "Terlalu banyak percobaan. Tunggu sebelum mencoba kembali.",
  NOT_IMPLEMENTED: "Layanan ini belum tersedia. Silakan coba kembali nanti.",
  NOT_FOUND: "Data tidak ditemukan atau tidak dapat Anda akses.",
};

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export class ApiError extends Error {
  code: string;
  fields: string[];
  retryAfterSeconds: number;
  current: unknown;
  constructor(
    public status: number,
    body: unknown,
    headers = new Headers(),
  ) {
    const payload = object(body);
    const detail = object(payload.error);
    const code =
      typeof detail.code === "string" ? detail.code : "INTERNAL_ERROR";
    super(messages[code] ?? "Layanan gagal merespons. Coba kembali.");
    this.code = code;
    this.fields = Array.isArray(detail.issues)
      ? detail.issues.flatMap((issue: unknown) => {
          const path = object(issue).path;
          return typeof path === "string" ? [path] : [];
        })
      : [];
    const header = headers.get("Retry-After");
    const seconds =
      header && /^\d+$/.test(header)
        ? Number(header)
        : header
          ? Math.ceil((Date.parse(header) - Date.now()) / 1000)
          : 0;
    const bodySeconds =
      typeof detail.retryAfterSeconds === "number"
        ? detail.retryAfterSeconds
        : 0;
    this.retryAfterSeconds = Math.max(
      0,
      Number.isFinite(seconds) ? seconds : 0,
      Number.isFinite(bodySeconds) ? bodySeconds : 0,
    );
    this.current = payload.current;
  }
}

export function readResult<T>(result: {
  data?: T;
  error?: unknown;
  response: Response;
}): T {
  if (!result.response.ok)
    throw new ApiError(
      result.response.status,
      result.error,
      result.response.headers,
    );
  if (result.data === undefined) throw new ApiError(502, null);
  return result.data;
}

export function readEmpty(result: { error?: unknown; response: Response }) {
  if (!result.response.ok)
    throw new ApiError(
      result.response.status,
      result.error,
      result.response.headers,
    );
  if (result.response.status !== 204) throw new ApiError(502, null);
}

export function errorText(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Koneksi ke layanan terputus. Periksa koneksi dan coba kembali.";
}
