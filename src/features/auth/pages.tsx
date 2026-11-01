import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import { api } from "../../shared/api/client";
import {
  ApiError,
  errorText,
  readEmpty,
  readResult,
} from "../../shared/api/result";
import {
  changePasswordSchema,
  loginSchema,
  phoneSchema,
  recoverySchema,
} from "./schemas";
import { endLocalSession, homeFor, refreshSession } from "./session";
import { useSessionActions } from "./session-actions";
import { AuthFrame, Field, Notice, timeLabel, useCountdown } from "./ui";

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const [blockedUntil, setBlockedUntil] = useState(0);
  const remaining = useCountdown(blockedUntil);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: effectTsResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });
  return (
    <AuthFrame>
      <h2>Masuk ke akun Anda</h2>
      <p className="form-description">
        Gunakan nomor WhatsApp dan password akun Nirwana Anda.
      </p>
      {params.get("reason") === "expired" && (
        <Notice error>Sesi berakhir. Masuk kembali untuk melanjutkan.</Notice>
      )}
      {params.get("reason") === "password" && (
        <Notice>
          Password berhasil diubah. Silakan masuk dengan password baru.
        </Notice>
      )}
      <form
        noValidate
        onSubmit={handleSubmit(async (value) => {
          setError("");
          try {
            readResult(await api.POST("/auth/login", { body: value }));
            await endLocalSession();
            const user = await refreshSession();
            if (!user) {
              setError(
                "Sesi belum dapat dibuka. Pastikan cookie diizinkan, lalu coba kembali.",
              );
              return;
            }
            navigate(homeFor[user.role], { replace: true });
          } catch (err) {
            setError(errorText(err));
            if (err instanceof ApiError && err.status === 429)
              setBlockedUntil(
                Date.now() + Math.max(1, err.retryAfterSeconds) * 1000,
              );
          }
        })}
      >
        <Field
          label="Nomor WhatsApp"
          registration={register("phone")}
          error={errors.phone}
          type="tel"
          autoComplete="username"
          maxLength={32}
          placeholder="0812 3456 7890"
        />
        <Field
          label="Password"
          registration={register("password")}
          error={errors.password}
          type="password"
          autoComplete="current-password"
          maxLength={128}
          placeholder="Masukkan password"
        />
        {error && <Notice error>{error}</Notice>}
        {remaining > 0 && (
          <p role="timer">Coba kembali dalam {timeLabel(remaining)}.</p>
        )}
        <div className="align-right">
          <Link to="/forgot-password">Lupa password? Pulihkan akses</Link>
        </div>
        <button
          className="button primary full"
          type="submit"
          disabled={isSubmitting || remaining > 0}
        >
          {isSubmitting ? "Memeriksa akun…" : "Masuk"}
          <ArrowRight size={18} />
        </button>
      </form>
    </AuthFrame>
  );
}

export function RecoveryPage({ activate = false }: { activate?: boolean }) {
  const [request, setRequest] = useState<{
    phone: string;
    expires: number;
    resendAt: number;
  } | null>(null);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [requestBlocked, setRequestBlocked] = useState(0);
  const cooldown = useCountdown(request?.resendAt ?? requestBlocked);
  const expiry = useCountdown(request?.expires ?? 0);
  const phoneForm = useForm({
    resolver: effectTsResolver(phoneSchema),
    defaultValues: { phone: "" },
  });
  const finalForm = useForm({
    resolver: effectTsResolver(recoverySchema),
    defaultValues: {
      phone: "",
      otp: "",
      password: "",
      passwordConfirmation: "",
    },
  });
  const send = async (phone: string) => {
    setError("");
    setSending(true);
    try {
      readResult(
        await api.POST("/auth/otp/request", {
          body: { phone, purpose: activate ? "activation" : "recovery" },
        }),
      );
      const now = Date.now();
      setRequest({ phone, expires: now + 300000, resendAt: now + 60000 });
      finalForm.reset({
        phone,
        otp: "",
        password: "",
        passwordConfirmation: "",
      });
    } catch (err) {
      setError(errorText(err));
      if (err instanceof ApiError && err.status === 429) {
        const until = Date.now() + Math.max(1, err.retryAfterSeconds) * 1000;
        setRequestBlocked(until);
        setRequest((previous) =>
          previous ? { ...previous, resendAt: until } : null,
        );
      }
    } finally {
      setSending(false);
    }
  };
  return (
    <AuthFrame mode={activate ? "activation" : "recovery"}>
      <Link to="/login" className="back-link">
        <ArrowLeft size={16} /> Kembali ke login
      </Link>
      <p className="kicker">{activate ? "AKTIVASI AKUN" : "PEMULIHAN AKSES"}</p>
      <h2>
        {complete
          ? activate
            ? "Aktivasi berhasil"
            : "Password berhasil diperbarui"
          : request
            ? "Verifikasi dan buat password"
            : "Verifikasi akun Anda"}
      </h2>
      {complete ? (
        <>
          <Notice>
            <CheckCircle2 size={20} /> Semua sesi dan kode lama telah diakhiri.
            Masuk kembali dengan password baru Anda.
          </Notice>
          <Link className="button primary full" to="/login">
            Kembali ke login
            <ArrowRight size={18} />
          </Link>
        </>
      ) : !request ? (
        <>
          <p className="form-description">
            Gunakan nomor WhatsApp yang telah didaftarkan. Kode baru dibuat
            setelah Anda memintanya.
          </p>
          <form
            noValidate
            onSubmit={phoneForm.handleSubmit((value) => send(value.phone))}
          >
            <Field
              label="Nomor WhatsApp terdaftar"
              registration={phoneForm.register("phone")}
              error={phoneForm.formState.errors.phone}
              type="tel"
              autoComplete="tel"
              maxLength={32}
              placeholder="0812 3456 7890"
            />
            {error && <Notice error>{error}</Notice>}
            {cooldown > 0 && (
              <p role="timer">Coba kembali dalam {timeLabel(cooldown)}.</p>
            )}
            <button
              type="submit"
              className="button primary full"
              disabled={sending || cooldown > 0}
            >
              {sending ? "Mengirim permintaan…" : "Minta kode verifikasi"}
              <ArrowRight size={18} />
            </button>
          </form>
        </>
      ) : (
        <>
          <Notice>
            Permintaan diterima. Jika nomor terdaftar dan memenuhi syarat, kode
            akan dikirim melalui WhatsApp. Ini belum memastikan pesan diterima.
          </Notice>
          <p className="form-description">
            Kode berlaku lima menit. Masukkan kode dan password pribadi Anda
            untuk menyelesaikan {activate ? "aktivasi" : "pemulihan"}.
          </p>
          <form
            noValidate
            onSubmit={finalForm.handleSubmit(async (value) => {
              setError("");
              if (expiry === 0) {
                setError("Kode sudah melewati lima menit. Minta kode baru.");
                return;
              }
              try {
                readEmpty(await api.POST("/auth/activate", { body: value }));
                finalForm.reset();
                await endLocalSession();
                setComplete(true);
              } catch (err) {
                setError(errorText(err));
                if (err instanceof ApiError)
                  for (const field of err.fields) {
                    if (
                      field === "password" ||
                      field === "passwordConfirmation" ||
                      field === "phone" ||
                      field === "otp"
                    )
                      finalForm.setError(field, {
                        type: "server",
                        message:
                          field === "password"
                            ? "Gunakan password yang berbeda dari password aktif dan sesuai aturan."
                            : "Periksa isian ini.",
                      });
                  }
              }
            })}
          >
            <Field
              label="Kode verifikasi enam digit"
              registration={finalForm.register("otp")}
              error={finalForm.formState.errors.otp}
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              disabled={expiry === 0}
            />
            <div className="otp-footer">
              <span role="timer">
                {expiry > 0
                  ? `Perkiraan sisa waktu ${timeLabel(expiry)}`
                  : "Kode kedaluwarsa"}
              </span>
              <button
                type="button"
                className="text-button"
                disabled={
                  sending || cooldown > 0 || finalForm.formState.isSubmitting
                }
                onClick={() => send(request.phone)}
              >
                {sending
                  ? "Meminta…"
                  : cooldown > 0
                    ? `Kirim ulang (${cooldown} dtk)`
                    : "Kirim ulang"}
              </button>
            </div>
            <Field
              label="Password baru"
              registration={finalForm.register("password")}
              error={finalForm.formState.errors.password}
              type="password"
              autoComplete="new-password"
              maxLength={128}
            />
            <Field
              label="Konfirmasi password baru"
              registration={finalForm.register("passwordConfirmation")}
              error={finalForm.formState.errors.passwordConfirmation}
              type="password"
              autoComplete="new-password"
              maxLength={128}
            />
            <p className="small-note">
              Gunakan 8–128 karakter. Hindari tanggal lahir dalam format
              DDMMYYYY.
            </p>
            {error && <Notice error>{error}</Notice>}
            <button
              type="submit"
              className="button primary full"
              disabled={
                finalForm.formState.isSubmitting || sending || expiry === 0
              }
            >
              {finalForm.formState.isSubmitting
                ? "Menyimpan…"
                : activate
                  ? "Aktifkan akun"
                  : "Simpan password"}
              <ArrowRight size={18} />
            </button>
            <button
              className="text-button change-phone"
              type="button"
              disabled={finalForm.formState.isSubmitting || sending}
              onClick={() => {
                finalForm.reset();
                setRequest(null);
                setRequestBlocked(request.resendAt);
                setError("");
              }}
            >
              Ubah nomor WhatsApp
            </button>
          </form>
          <p className="small-note">
            Belum menerima kode? Tunggu batas kirim ulang, periksa WhatsApp,
            atau ikuti <Link to="/bantuan">panduan bantuan</Link>.
          </p>
        </>
      )}
    </AuthFrame>
  );
}

export function ActivationPage() {
  return <RecoveryPage activate />;
}

export function ChangePasswordPage() {
  const sessionActions = useSessionActions();
  const [error, setError] = useState("");
  const [until, setUntil] = useState(0);
  const remaining = useCountdown(until);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: effectTsResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      passwordConfirmation: "",
    },
  });
  return (
    <section className="content-section narrow">
      <p className="kicker">KEAMANAN AKUN</p>
      <h1>Ganti password</h1>
      <p>
        Password baru mengakhiri seluruh sesi akun, termasuk sesi ini. Anda akan
        diminta masuk kembali.
      </p>
      <form
        className="panel"
        noValidate
        onSubmit={handleSubmit(async (value) => {
          setError("");
          try {
            readEmpty(await api.POST("/auth/password", { body: value }));
            reset();
            await sessionActions.end("password");
          } catch (err) {
            setError(errorText(err));
            if (err instanceof ApiError) {
              if (err.status === 429)
                setUntil(
                  Date.now() + Math.max(1, err.retryAfterSeconds) * 1000,
                );
              for (const field of err.fields)
                if (
                  field === "currentPassword" ||
                  field === "password" ||
                  field === "passwordConfirmation"
                )
                  setFieldError(field, {
                    type: "server",
                    message:
                      field === "currentPassword"
                        ? "Password saat ini tidak cocok."
                        : "Periksa password dan konfirmasinya.",
                  });
            }
          }
        })}
      >
        <Field
          label="Password saat ini"
          registration={register("currentPassword")}
          error={errors.currentPassword}
          type="password"
          autoComplete="current-password"
          maxLength={128}
        />
        <Field
          label="Password baru"
          registration={register("password")}
          error={errors.password}
          type="password"
          autoComplete="new-password"
          maxLength={128}
        />
        <Field
          label="Konfirmasi password baru"
          registration={register("passwordConfirmation")}
          error={errors.passwordConfirmation}
          type="password"
          autoComplete="new-password"
          maxLength={128}
        />
        <p className="small-note">
          8–128 karakter, berbeda dari password saat ini, dan bukan tanggal
          DDMMYYYY.
        </p>
        {error && <Notice error>{error}</Notice>}
        {remaining > 0 && (
          <p role="timer">Coba kembali dalam {timeLabel(remaining)}.</p>
        )}
        <button
          type="submit"
          className="button primary"
          disabled={isSubmitting || remaining > 0}
        >
          {isSubmitting ? "Menyimpan…" : "Simpan password baru"}
        </button>
      </form>
    </section>
  );
}

export function HelpPage() {
  return (
    <AuthFrame>
      <h2>Panduan akses akun</h2>
      <ol className="help-list">
        <li>
          <strong>Belum pernah masuk?</strong> Pilih Aktifkan akun. Gunakan
          nomor yang didaftarkan petugas, minta OTP, lalu buat password pribadi.
        </li>
        <li>
          <strong>Lupa password?</strong> Gunakan pemulihan akses. Jangan
          bagikan kode WhatsApp atau password kepada siapa pun.
        </li>
        <li>
          <strong>Kode belum tiba?</strong> Respons permintaan tidak menjamin
          pesan terkirim. Tunggu 60 detik sebelum mengirim ulang. Kode berlaku
          lima menit.
        </li>
        <li>
          <strong>Akun Nonaktif atau nomor keliru?</strong> Minta bantuan
          petugas Nirwana melalui kanal resmi yang sudah Anda kenal. Kontak
          bantuan pada aplikasi belum dikonfirmasi.
        </li>
      </ol>
      <Link className="button primary full" to="/login">
        Kembali ke login
        <ArrowRight size={18} />
      </Link>
    </AuthFrame>
  );
}
