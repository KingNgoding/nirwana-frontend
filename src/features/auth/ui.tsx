import { Eye, EyeOff, Moon, Sun, Wifi } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { Link, NavLink } from "react-router";

export function Brand() {
  return (
    <Link to="/login" className="brand" aria-label="Nirwana, halaman masuk">
      <img src="/logo-nat.png" alt="" />
      <span>
        NIRWANA<small>AKSES TEKNOLOGI</small>
      </span>
    </Link>
  );
}
export function ThemeButton() {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === "dark",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={dark ? "Gunakan tema terang" : "Gunakan tema gelap"}
      onClick={() => setDark(!dark)}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
export function AuthFrame({
  children,
  mode = "login",
}: {
  children: ReactNode;
  mode?: "login" | "activation" | "recovery";
}) {
  useEffect(() => {
    document.title = `${mode === "login" ? "Masuk" : mode === "activation" ? "Aktivasi akun" : "Pemulihan akses"} — Nirwana`;
  }, [mode]);
  return (
    <div className="public-page">
      <a className="skip-link" href="#content">
        Lewati navigasi
      </a>
      <header className="public-header">
        <div className="container header-inner">
          <Brand />
          <nav aria-label="Bantuan akses">
            <Link to="/bantuan">Panduan & bantuan</Link>
            <ThemeButton />
          </nav>
        </div>
      </header>
      <main id="content" className="container auth-layout">
        <section className="auth-intro">
          <p className="kicker">PORTAL LAYANAN NIRWANA</p>
          <h1>
            Layanan Anda.
            <br />
            <span>
              Lebih mudah
              <br />
              dikelola.
            </span>
          </h1>
          <p>
            Lihat layanan, laporkan kendala, dan ikuti penanganannya. Semua
            dalam satu tempat.
          </p>
        </section>
        <section className="auth-card" aria-label="Akses akun">
          {mode !== "recovery" && (
            <nav className="auth-tabs" aria-label="Pilihan akses">
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/first-login">Aktifkan akun</NavLink>
            </nav>
          )}
          <div className="access-caption">
            <Wifi size={23} />
            <span>AKSES AKUN NIRWANA</span>
          </div>
          {children}
          <aside className="access-help">
            <strong>Kesulitan mengakses akun?</strong>
            <p>
              Pastikan nomor WhatsApp sesuai dengan yang didaftarkan.{" "}
              <Link to="/bantuan">Lihat panduan akses</Link>.
            </p>
          </aside>
        </section>
      </main>
      <footer className="public-footer container">
        <p>
          PT Nirwana Akses Teknologi
          <br />
          <span>Portal layanan pelanggan dan staf</span>
        </p>
        <small>© 2026 Nirwana</small>
      </footer>
    </div>
  );
}
export function Field({
  label,
  registration,
  error,
  type = "text",
  autoComplete,
  maxLength,
  placeholder,
  disabled,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  type?: string;
  autoComplete?: string;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  const id = `field-${registration.name}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          {...registration}
          id={id}
          type={type === "password" && show ? "text" : type}
          inputMode={
            type === "tel"
              ? "tel"
              : registration.name === "otp"
                ? "numeric"
                : undefined
          }
          autoComplete={autoComplete}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {type === "password" && (
          <button
            type="button"
            className="password-toggle"
            aria-label={`${show ? "Sembunyikan" : "Tampilkan"} ${label.toLowerCase()}`}
            onClick={() => setShow(!show)}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error.message ?? "Periksa isian ini."}
        </p>
      )}
    </div>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={error ? "notice error" : "notice"}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function useCountdown(until: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!until) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [until]);
  return Math.max(0, Math.ceil((until - now) / 1000));
}
export function timeLabel(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
