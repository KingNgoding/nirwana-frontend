import { Schema } from "effect";

const message = (text: string) => ({ message: () => text });
export const phone = Schema.String.pipe(
  Schema.minLength(1, message("Masukkan nomor WhatsApp.")),
  Schema.maxLength(32, message("Nomor maksimal 32 karakter.")),
);
const password = Schema.String.pipe(
  Schema.minLength(8, message("Password minimal 8 karakter.")),
  Schema.maxLength(128, message("Password maksimal 128 karakter.")),
);
const newPassword = password.pipe(
  Schema.filter((value) => {
    if (!/^\d{8}$/.test(value)) return true;
    const day = Number(value.slice(0, 2));
    const month = Number(value.slice(2, 4));
    const year = Number(value.slice(4));
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    );
  }, message("Gunakan password pribadi, bukan tanggal DDMMYYYY.")),
);
const confirmed = <
  T extends { password: string; passwordConfirmation: string },
>(
  value: T,
) =>
  value.password === value.passwordConfirmation || {
    path: ["passwordConfirmation"],
    message: "Konfirmasi password belum cocok.",
  };

export const loginSchema = Schema.Struct({ phone, password });
export const phoneSchema = Schema.Struct({ phone });
export const passwordSchema = Schema.Struct({
  password: newPassword,
  passwordConfirmation: password,
}).pipe(Schema.filter(confirmed));
export const recoverySchema = Schema.Struct({
  phone,
  otp: Schema.String.pipe(
    Schema.pattern(/^\d{6}$/, message("Masukkan enam digit kode verifikasi.")),
  ),
  password: newPassword,
  passwordConfirmation: password,
}).pipe(Schema.filter(confirmed));
export const changePasswordSchema = Schema.Struct({
  currentPassword: password,
  password: newPassword,
  passwordConfirmation: password,
}).pipe(
  Schema.filter(confirmed),
  Schema.filter(
    (value) =>
      value.currentPassword !== value.password || {
        path: ["password"],
        message: "Password baru harus berbeda dari password saat ini.",
      },
  ),
);
export const staffSchema = Schema.Struct({
  name: Schema.Trim.pipe(
    Schema.minLength(1, message("Masukkan nama staf.")),
    Schema.maxLength(150),
  ),
  phone,
  role: Schema.Literal("Admin", "Officer", "Teknisi"),
});
export const statusSchema = Schema.Struct({
  reason: Schema.Trim.pipe(
    Schema.minLength(1, message("Tuliskan alasan perubahan.")),
    Schema.maxLength(500),
  ),
});
