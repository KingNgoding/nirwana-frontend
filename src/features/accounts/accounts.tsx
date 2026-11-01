import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { useQuery } from "@tanstack/react-query";
import { Schema } from "effect";
import { Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type UseFormRegisterReturn, useForm } from "react-hook-form";
import { api } from "../../shared/api/client";
import { ApiError, errorText, readResult } from "../../shared/api/result";
import type { components } from "../../shared/api/schema";
import { queryClient } from "../../shared/query-client";
import { staffSchema, statusSchema } from "../auth/schemas";
import { refreshSession } from "../auth/session";
import { Field, Notice } from "../auth/ui";

type Account = components["schemas"]["Account"];
type StaffRole = components["schemas"]["StaffRole"];
type Selection =
  | { mode: "create" }
  | { mode: "edit" | "status"; account: Account };
const editSchema = Schema.Struct({
  name: staffSchema.fields.name,
  role: staffSchema.fields.role,
});
const accountSchema = Schema.Struct({
  accountId: Schema.String,
  name: Schema.String,
  phone: Schema.String,
  role: Schema.Literal("Admin", "Officer", "Teknisi", "Client"),
  status: Schema.Literal("Aktif", "Nonaktif", "Belum Aktif"),
  version: Schema.Number,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export function AccountsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<StaffRole | "">("");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  const list = useQuery({
    queryKey: ["staff-accounts", page, search, role],
    queryFn: async ({ signal }) =>
      readResult(
        await api.GET("/staff-accounts", {
          signal,
          params: {
            query: {
              page: String(page),
              pageSize: "20",
              ...(search ? { search } : {}),
              ...(role ? { role } : {}),
            },
          },
        }),
      ),
  });
  const saved = async (text: string) => {
    setSelection(null);
    setConflict(false);
    setMessage(text);
    await queryClient.invalidateQueries({ queryKey: ["staff-accounts"] });
    await refreshSession();
  };
  const failed = (error: unknown) => {
    if (
      error instanceof ApiError &&
      error.code === "VERSION_CONFLICT" &&
      Schema.is(accountSchema)(error.current)
    ) {
      const current = error.current;
      setSelection((previous) =>
        previous && previous.mode !== "create"
          ? { mode: previous.mode, account: current }
          : previous,
      );
      setConflict(true);
      setMessage(
        "Data berubah sejak dibuka. Form menampilkan data terbaru. Periksa kembali sebelum mengirim perubahan.",
      );
    }
  };
  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <p className="kicker">HAK AKSES ADMIN</p>
          <h1>Akun staf</h1>
          <p>Kelola akun dan satu peran untuk setiap petugas.</p>
        </div>
        <button
          type="button"
          className="button primary"
          onClick={() => {
            setMessage("");
            setSelection({ mode: "create" });
          }}
        >
          <Plus size={18} /> Tambah staf
        </button>
      </div>
      {message && <Notice error={conflict}>{message}</Notice>}
      <form
        className="list-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(draft.trim());
          setPage(1);
        }}
      >
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">Cari nama atau nomor staf</span>
          <input
            value={draft}
            maxLength={150}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Cari nama atau nomor WhatsApp"
          />
        </label>
        <label className="filter-label">
          Peran
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value as StaffRole | "");
              setPage(1);
            }}
          >
            <option value="">Semua peran</option>
            <option>Admin</option>
            <option>Officer</option>
            <option>Teknisi</option>
          </select>
        </label>
        <button type="submit" className="button secondary">
          Cari
        </button>
      </form>
      {list.isPending ? (
        <p role="status">Memuat akun staf…</p>
      ) : list.isError ? (
        <>
          <Notice error>{errorText(list.error)}</Notice>
          <button
            type="button"
            className="button secondary"
            onClick={() => list.refetch()}
          >
            Coba kembali
          </button>
        </>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <caption className="sr-only">Daftar akun staf Nirwana</caption>
              <thead>
                <tr>
                  <th>Nama & nomor WhatsApp</th>
                  <th>Peran</th>
                  <th>Status akun</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((account) => (
                  <tr key={account.accountId}>
                    <td>
                      <strong>{account.name}</strong>
                      <span className="cell-detail">{account.phone}</span>
                    </td>
                    <td>{account.role}</td>
                    <td>
                      <span
                        className={`badge ${account.status === "Aktif" ? "active" : account.status === "Nonaktif" ? "inactive" : "pending"}`}
                      >
                        {account.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setMessage("");
                            setSelection({ mode: "edit", account });
                          }}
                          aria-label={`Ubah akun ${account.name}`}
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setMessage("");
                            setSelection({ mode: "status", account });
                          }}
                          aria-label={`${account.status === "Nonaktif" ? "Aktifkan" : "Nonaktifkan"} akun ${account.name}`}
                        >
                          {account.status === "Nonaktif"
                            ? "Aktifkan"
                            : "Nonaktifkan"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.data.items.length === 0 && (
              <div className="empty-state">
                <h2>Belum ada akun yang cocok</h2>
                <p>Ubah pencarian atau tambahkan akun staf baru.</p>
              </div>
            )}
          </div>
          <div className="pagination">
            <span>
              {list.data.total} akun staf · Halaman {list.data.page}
            </span>
            <div>
              <button
                className="button secondary"
                type="button"
                disabled={page === 1 || list.isFetching}
                onClick={() => setPage(page - 1)}
              >
                Sebelumnya
              </button>
              <button
                className="button secondary"
                type="button"
                disabled={page * 20 >= list.data.total || list.isFetching}
                onClick={() => setPage(page + 1)}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </>
      )}
      {selection && (
        <AccountDialog
          key={
            selection.mode === "create"
              ? "create"
              : `${selection.mode}-${selection.account.accountId}-${selection.account.version}`
          }
          selection={selection}
          conflictMessage={conflict ? message : ""}
          close={() => {
            setSelection(null);
          }}
          saved={saved}
          failed={failed}
        />
      )}
    </section>
  );
}

function AccountDialog({
  selection,
  close,
  saved,
  failed,
  conflictMessage,
}: {
  selection: Selection;
  close: () => void;
  saved: (text: string) => Promise<void>;
  failed: (error: unknown) => void;
  conflictMessage: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const title =
    selection.mode === "create"
      ? "Tambah akun staf"
      : selection.mode === "edit"
        ? "Ubah akun staf"
        : selection.account.status === "Nonaktif"
          ? "Aktifkan kembali akun"
          : "Nonaktifkan akun";
  return (
    <dialog
      ref={ref}
      className="account-dialog"
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) close();
      }}
    >
      <div className="dialog-header">
        <h2 id="dialog-title">{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Tutup"
          disabled={busy}
          onClick={close}
        >
          <X size={20} />
        </button>
      </div>
      {conflictMessage && <Notice error>{conflictMessage}</Notice>}
      {selection.mode === "status" ? (
        <StatusForm
          account={selection.account}
          saved={saved}
          failed={failed}
          busy={setBusy}
        />
      ) : selection.mode === "create" ? (
        <CreateForm saved={saved} busy={setBusy} />
      ) : (
        <EditForm
          account={selection.account}
          saved={saved}
          failed={failed}
          busy={setBusy}
        />
      )}
    </dialog>
  );
}

function CreateForm({
  saved,
  busy,
}: {
  saved: (text: string) => Promise<void>;
  busy: (value: boolean) => void;
}) {
  const [error, setError] = useState("");
  const form = useForm({
    resolver: effectTsResolver(staffSchema),
    defaultValues: { name: "", phone: "", role: "Officer" as StaffRole },
  });
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (value) => {
        setError("");
        busy(true);
        try {
          readResult(await api.POST("/staff-accounts", { body: value }));
          await saved(
            "Akun staf dibuat dengan status Belum Aktif. Pemilik akun dapat meminta OTP dan membuat password sendiri.",
          );
        } catch (err) {
          setError(errorText(err));
          if (err instanceof ApiError)
            for (const path of err.fields)
              if (path === "name" || path === "phone" || path === "role")
                form.setError(path, {
                  message: "Periksa isian ini.",
                  type: "server",
                });
        } finally {
          busy(false);
        }
      })}
    >
      <p className="form-description">
        Akun baru berstatus Belum Aktif. Staf mengaktifkannya sendiri melalui
        WhatsApp. Anda tidak mengisi password atau OTP staf.
      </p>
      <Field
        label="Nama lengkap"
        registration={form.register("name")}
        error={form.formState.errors.name}
        maxLength={150}
      />
      <Field
        label="Nomor WhatsApp"
        registration={form.register("phone")}
        error={form.formState.errors.phone}
        type="tel"
        maxLength={32}
      />
      <RoleField registration={form.register("role")} />
      {error && <Notice error>{error}</Notice>}
      <button
        type="submit"
        className="button primary full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Menyimpan…" : "Buat akun staf"}
      </button>
    </form>
  );
}
function EditForm({
  account,
  saved,
  failed,
  busy,
}: {
  account: Account;
  saved: (text: string) => Promise<void>;
  failed: (error: unknown) => void;
  busy: (value: boolean) => void;
}) {
  const [error, setError] = useState("");
  const form = useForm({
    resolver: effectTsResolver(editSchema),
    defaultValues: { name: account.name, role: account.role as StaffRole },
  });
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (value) => {
        setError("");
        busy(true);
        try {
          readResult(
            await api.PATCH("/staff-accounts/{accountId}", {
              params: { path: { accountId: account.accountId } },
              body: { ...value, version: account.version },
            }),
          );
          await saved(
            "Perubahan akun tersimpan. Jika peran berubah, seluruh sesi akun tersebut diakhiri.",
          );
        } catch (err) {
          setError(errorText(err));
          failed(err);
        } finally {
          busy(false);
        }
      })}
    >
      <p className="form-description">
        {account.phone}
        <br />
        Mengubah peran mengakhiri seluruh sesi akun ini. Nomor tetap mengikuti
        data akun yang terdaftar.
      </p>
      <Field
        label="Nama lengkap"
        registration={form.register("name")}
        error={form.formState.errors.name}
        maxLength={150}
      />
      <RoleField registration={form.register("role")} />
      {error && <Notice error>{error}</Notice>}
      <button
        type="submit"
        className="button primary full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Menyimpan…" : "Simpan perubahan"}
      </button>
    </form>
  );
}
function StatusForm({
  account,
  saved,
  failed,
  busy,
}: {
  account: Account;
  saved: (text: string) => Promise<void>;
  failed: (error: unknown) => void;
  busy: (value: boolean) => void;
}) {
  const [error, setError] = useState("");
  const form = useForm({
    resolver: effectTsResolver(statusSchema),
    defaultValues: { reason: "" },
  });
  const activate = account.status === "Nonaktif";
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (value) => {
        setError("");
        busy(true);
        try {
          const result = readResult(
            await api.PUT("/accounts/{accountId}/status", {
              params: { path: { accountId: account.accountId } },
              body: {
                reason: value.reason,
                status: activate ? "Aktif" : "Nonaktif",
                version: account.version,
              },
            }),
          );
          await saved(
            `Status ${result.name} berubah menjadi ${result.status}.`,
          );
        } catch (err) {
          setError(errorText(err));
          failed(err);
        } finally {
          busy(false);
        }
      })}
    >
      <p>
        Konfirmasikan perubahan untuk <strong>{account.name}</strong> (
        {account.role}).
      </p>
      <Notice>
        {activate
          ? "Akun kembali Aktif jika sudah memiliki password, atau Belum Aktif jika belum pernah diaktivasi."
          : "Login akan ditolak dan seluruh sesi serta OTP akun diakhiri. Riwayat operasional dipertahankan. Tiket Teknisi tidak dipindahkan otomatis."}
      </Notice>
      <Field
        label="Alasan perubahan status"
        registration={form.register("reason")}
        error={form.formState.errors.reason}
        maxLength={500}
      />
      {error && <Notice error>{error}</Notice>}
      <button
        type="submit"
        className={`button full ${activate ? "primary" : "danger"}`}
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting
          ? "Menyimpan…"
          : activate
            ? "Konfirmasi aktifkan akun"
            : "Konfirmasi nonaktifkan akun"}
      </button>
    </form>
  );
}
function RoleField({ registration }: { registration: UseFormRegisterReturn }) {
  return (
    <div className="field">
      <label htmlFor="staff-role">Peran</label>
      <select {...registration} id="staff-role">
        <option>Admin</option>
        <option>Officer</option>
        <option>Teknisi</option>
      </select>
    </div>
  );
}
