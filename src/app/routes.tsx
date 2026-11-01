import {
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  type RouteObject,
  redirect,
  useNavigate,
  useRouteError,
} from "react-router";
import {
  homeFor,
  type Role,
  refreshSession,
  useSession,
} from "../features/auth/session";
import {
  SessionBoundary,
  useSessionActions,
} from "../features/auth/session-actions";
import { AuthFrame, Brand, Notice, ThemeButton } from "../features/auth/ui";
import { api } from "../shared/api/client";
import { errorText, readEmpty } from "../shared/api/result";

const descriptions: Record<Role, string> = {
  Admin: "Kelola akun staf dan kewenangan akses Nirwana.",
  Officer:
    "Akses ruang kerja pelayanan dan administrasi sesuai kewenangan Anda.",
  Teknisi: "Akses ruang kerja penanganan gangguan sesuai tugas Anda.",
  Client: "Akses ruang layanan pribadi Anda dengan aman.",
};

function Workspace({ role }: { role: Role }) {
  const session = useSession();
  const sessionActions = useSessionActions();
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    document.title = `Ruang ${role} — Nirwana`;
  }, [role]);
  if (session.isError)
    return (
      <AuthFrame>
        <h2>Sesi gagal diperiksa</h2>
        <Notice error>{errorText(session.error)}</Notice>
        <button
          type="button"
          className="button primary"
          onClick={() => session.refetch()}
        >
          Coba kembali
        </button>
      </AuthFrame>
    );
  if (session.isPending)
    return (
      <main className="loading-screen" role="status">
        Memeriksa sesi…
      </main>
    );
  if (!session.data)
    return (
      <Navigate
        to={
          sessionActions.reason === "password"
            ? "/login?reason=password"
            : sessionActions.reason === "logout"
              ? "/login"
              : "/login?reason=expired"
        }
        replace
      />
    );
  if (session.data.role !== role)
    return <Navigate to="/akses-ditolak" replace />;
  const user = session.data;
  return (
    <div className="workspace">
      <a href="#content" className="skip-link">
        Lewati navigasi
      </a>
      <aside className={`sidebar ${menu ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-only"
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMenu(false)}
          >
            <X size={20} />
          </button>
        </div>
        <p className="sidebar-label">RUANG {role.toUpperCase()}</p>
        <nav aria-label={`Navigasi ${role}`}>
          <NavLink to={homeFor[role]} end onClick={() => setMenu(false)}>
            <LayoutDashboard size={19} />
            Beranda
          </NavLink>
          {role === "Admin" && (
            <NavLink to="/admin/accounts" onClick={() => setMenu(false)}>
              <Users size={19} />
              Akun staf
            </NavLink>
          )}
          <NavLink
            to={`${homeFor[role]}/security`}
            onClick={() => setMenu(false)}
          >
            <LockKeyhole size={19} />
            Keamanan akun
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <ShieldCheck size={20} />
          <p>
            Akses sesuai peran.
            <br />
            Jaga kerahasiaan akun Anda.
          </p>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-header">
          <button
            className="icon-button mobile-only"
            type="button"
            aria-label="Buka menu"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            <Menu size={22} />
          </button>
          <span className="workspace-title">Portal Nirwana</span>
          <div className="user-summary">
            <span>
              <strong>{user.name}</strong>
              <small>{role}</small>
            </span>
            <ThemeButton />
            <button
              className="icon-button logout"
              type="button"
              disabled={busy}
              aria-label="Keluar dari akun"
              onClick={async () => {
                setError("");
                setBusy(true);
                try {
                  readEmpty(await api.POST("/auth/logout"));
                  await sessionActions.end("logout");
                } catch (err) {
                  setError(errorText(err));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        {error && (
          <div className="workspace-notice">
            <Notice error>{error} Anda belum keluar. Coba kembali.</Notice>
          </div>
        )}
        <main id="content" className="workspace-content">
          <Outlet />
        </main>
        <footer className="workspace-footer">PT Nirwana Akses Teknologi</footer>
      </div>
    </div>
  );
}

function WelcomePage({ role }: { role: Role }) {
  const session = useSession();
  return (
    <section className="content-section">
      <p className="kicker">RUANG {role.toUpperCase()}</p>
      <h1>Selamat datang, {session.data?.name}.</h1>
      <p className="welcome-description">{descriptions[role]}</p>
      <div className="welcome-panel">
        <div className="welcome-icon">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h2>Akun Anda siap digunakan</h2>
          <p>
            Anda masuk sebagai <strong>{role}</strong>. Periksa keamanan akun
            dan gunakan navigasi sesuai kewenangan.
          </p>
          <Link className="button secondary" to={`${homeFor[role]}/security`}>
            Kelola keamanan akun
            <LockKeyhole size={16} />
          </Link>
        </div>
      </div>
      {role === "Admin" && (
        <Link className="action-row" to="/admin/accounts">
          <Users size={24} />
          <div>
            <h2>Kelola akun staf</h2>
            <p>Tambah petugas, sesuaikan peran, dan atur status akses.</p>
          </div>
          <span aria-hidden>→</span>
        </Link>
      )}
      <p className="scope-note">
        Dashboard operasional{" "}
        {role === "Client" ? "layanan dan tiket" : "dan modul pekerjaan"}{" "}
        tersedia pada tahap pengembangan berikutnya.
      </p>
    </section>
  );
}

function AccessDenied() {
  const session = useSession();
  return (
    <AuthFrame>
      <div className="error-symbol">
        <ShieldCheck size={30} />
      </div>
      <h2>Akses ditolak</h2>
      <p className="form-description">
        Halaman ini tidak tersedia untuk peran akun Anda. Kembali ke ruang kerja
        yang sesuai.
      </p>
      <Link
        className="button primary full"
        to={session.data ? homeFor[session.data.role] : "/login"}
      >
        Kembali ke {session.data ? "ruang kerja" : "login"}
      </Link>
    </AuthFrame>
  );
}
function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  return (
    <AuthFrame>
      <h2>Halaman gagal dimuat</h2>
      <Notice error>{errorText(error)}</Notice>
      <button
        className="button primary full"
        type="button"
        onClick={() => navigate(0)}
      >
        Coba kembali
      </button>
      <Link className="text-button" to="/login">
        Kembali ke login
      </Link>
    </AuthFrame>
  );
}

const authPage =
  (name: keyof typeof import("../features/auth/pages")) => async () => ({
    Component: (await import("../features/auth/pages"))[name],
  });
const workspaceRoutes: RouteObject[] = (Object.keys(homeFor) as Role[]).map(
  (role) => ({
    path: homeFor[role],
    loader: async () => {
      const user = await refreshSession();
      if (!user) throw redirect("/login?reason=expired");
      if (user.role !== role) throw redirect("/akses-ditolak");
      return null;
    },
    shouldRevalidate: () => true,
    element: <Workspace role={role} />,
    children: [
      { index: true, element: <WelcomePage role={role} /> },
      { path: "security", lazy: authPage("ChangePasswordPage") },
      ...(role === "Admin"
        ? [
            {
              path: "accounts",
              lazy: async () => ({
                Component: (await import("../features/accounts/accounts"))
                  .AccountsPage,
              }),
            },
          ]
        : []),
    ],
  }),
);
export const routes: RouteObject[] = [
  {
    errorElement: <RouteError />,
    element: <SessionBoundary />,
    hydrateFallbackElement: (
      <main className="loading-screen" role="status">
        Memuat halaman…
      </main>
    ),
    children: [
      { path: "/", element: <Navigate to="/login" replace /> },
      { path: "/login", lazy: authPage("LoginPage") },
      { path: "/first-login", lazy: authPage("ActivationPage") },
      { path: "/forgot-password", lazy: authPage("RecoveryPage") },
      {
        path: "/reset-password",
        element: <Navigate to="/forgot-password" replace />,
      },
      { path: "/bantuan", lazy: authPage("HelpPage") },
      { path: "/akses-ditolak", element: <AccessDenied /> },
      ...workspaceRoutes,
      {
        path: "*",
        element: (
          <AuthFrame>
            <h2>Halaman tidak ditemukan</h2>
            <p className="form-description">
              Periksa alamat halaman atau kembali ke login.
            </p>
            <Link className="button primary full" to="/login">
              Kembali ke login
            </Link>
          </AuthFrame>
        ),
      },
    ],
  },
];
