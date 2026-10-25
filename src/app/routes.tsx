import { ArrowLeft, Network } from "lucide-react";
import {
  Link,
  NavLink,
  Outlet,
  type RouteObject,
  useRouteError,
} from "react-router";
import { FoundationPage } from "../pages/foundation";

function Layout() {
  return (
    <div className="min-h-screen">
      <a href="#content" className="skip-link">
        Lewati navigasi
      </a>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-5 px-6 py-5">
          <Link
            to="/"
            className="flex items-center gap-3 font-semibold tracking-tight"
          >
            <span className="rounded-lg bg-brand p-2 text-white">
              <Network aria-hidden size={22} />
            </span>
            Nirwana <span className="font-normal text-muted">/ NMS</span>
          </Link>
          <nav aria-label="Navigasi utama" className="flex gap-6 text-sm">
            <NavLink to="/" end>
              Beranda
            </NavLink>
            <NavLink to="/tentang">Tentang</NavLink>
          </nav>
        </div>
      </header>
      <main id="content" className="mx-auto max-w-5xl px-6 py-14">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-5xl border-t border-line px-6 py-6 text-sm text-muted">
        Nirwana Management System · Fondasi pengembangan
      </footer>
    </div>
  );
}

function RouteError() {
  useRouteError();
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1>Halaman gagal dimuat</h1>
      <p>Silakan muat ulang halaman.</p>
      <Link to="/">Kembali ke beranda</Link>
    </main>
  );
}

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <FoundationPage /> },
      {
        path: "tentang",
        element: (
          <section>
            <p className="eyebrow">Tentang</p>
            <h1>Fondasi untuk layanan Nirwana.</h1>
            <p className="mt-5 max-w-xl text-muted">
              Aplikasi ini sedang disiapkan. Fitur pelanggan, tiket,
              autentikasi, dan peta akan ditambahkan melalui story
              masing-masing.
            </p>
          </section>
        ),
      },
      {
        path: "*",
        element: (
          <section>
            <h1>Halaman tidak ditemukan</h1>
            <Link to="/" className="mt-6 inline-flex items-center gap-2">
              <ArrowLeft aria-hidden size={18} />
              Kembali ke beranda
            </Link>
          </section>
        ),
      },
    ],
  },
];
