# NMS Frontend: Week 1

Frontend akun, autentikasi, dan hak akses Nirwana untuk FS03/FS04. Pekerjaan berada di salinan lokal [KingNgoding/nirwana-frontend](https://github.com/KingNgoding/nirwana-frontend), branch `NMS-20/week-1-auth`. Fondasi dan riwayat disalin dari [repo resmi](https://github.com/nirwana-system/nms-frontend), commit `b591ae908957a4d147d1486d00095f6f95a629de`. Repo resmi, backend, Jira, dan deployment tidak diubah. Publikasi diarahkan ke repo percobaan ini atas instruksi Faishal. Bukti CI remote diperiksa terpisah dari hasil lokal.

Ketujuh acuan, keputusan implementasi, dan selisih kebutuhan/kontrak tercatat di [docs/WEEK-1.md](docs/WEEK-1.md). Tampilan mengikuti halaman autentikasi Hamijeu, termasuk logo, susunan dua kolom, warna biru, dan tema terang/gelap. Kredensial serta role switcher demo tidak diimpor.

## Menjalankan

Gunakan **Node 24.22.1 LTS dan npm 11.19.1**. Runtime mesin yang berada di PATH saat pengerjaan adalah Node 26, sehingga pengujian memakai distribusi resmi Node 24 yang diunduh ke folder `../.tools/node-v24.22.1-win-x64`. SHA256 arsip diperiksa terhadap `SHASUMS256.txt` resmi. PATH sistem tidak diubah.

```powershell
# Khusus workspace sesi ini, bila Node di PATH masih versi 26:
$env:PATH = (Resolve-Path '../.tools/node-v24.22.1-win-x64').Path + ';' + $env:PATH

npm ci
# Pada clone baru, pilih konfigurasi lokal atau staging:
Copy-Item .env.example .env.local
npm run dev
```

Buka `http://127.0.0.1:5173`. Contoh lokal memakai `http://localhost:3000`. Untuk API staging, isi `.env.local` dengan `VITE_API_BASE_URL=https://api-staging.nirwana.id`; konfigurasi lokal sesi ini sudah memakai alamat tersebut. Restart Vite setelah mengubah konfigurasi. Tidak ada rahasia di konfigurasi frontend. Semua `VITE_*` masuk ke bundle browser.

Untuk clone mandiri, pasang Node 24 melalui distribusi resmi atau pengelola versi yang Anda gunakan; folder `.tools` adalah runtime lokal sesi, bukan bagian dari repo. Instalasi dependency tetap dari `package-lock.json`, tanpa `--force` atau `--legacy-peer-deps`.

## Halaman dan perilaku

| Halaman                                        | Kegunaan                                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/login`                                       | Nomor WhatsApp, password, pesan kredensial netral, dan cooldown dari server         |
| `/first-login`                                 | Permintaan OTP aktivasi lalu kode dan password baru                                 |
| `/forgot-password`                             | Pemulihan akses dengan bentuk kontrak yang sama                                     |
| `/bantuan`                                     | Panduan aktivasi, pemulihan, dan kendala WhatsApp                                   |
| `/admin`, `/officer`, `/technician`, `/client` | Workspace dasar sesuai peran dari server                                            |
| `/<workspace>/security`                        | Ganti password dengan password saat ini dan konfirmasi                              |
| `/admin/accounts`                              | Daftar/cari/filter/page staf, tambah, ubah nama/peran, aktif/nonaktif dengan alasan |
| `/akses-ditolak`                               | Penolakan halaman untuk peran yang tidak sesuai                                     |

`/` menuju login; `/reset-password` menuju pemulihan. Dashboard operasional, data pelanggan, tiket, peta, voucher, dan profil perusahaan lengkap mengikuti minggu berikutnya. Workspace tidak menampilkan metrik atau data operasional palsu.

Login dan navigasi terlindungi memeriksa `/auth/me`. Cookie disertakan dengan `credentials: include`; tidak ada token, peran pilihan, atau sesi di localStorage/sessionStorage. React state/Context menangani UI dan maksud logout; Query menangani data server. Form memakai RHF dan resolver resmi Effect Schema, tanpa Zod atau cache tambahan. Mutasi tidak diulang otomatis.

Logout, perubahan password, dan 401 pada operasi terlindungi membuang data pengguna. Permintaan sesi lama dibatalkan supaya respons terlambat tidak mengembalikan identitas sebelumnya. Pengecualian pembatalan hanya berlaku ketika `/auth/me` sendiri sedang menyelesaikan respons 401. Kode OTP salah pada endpoint publik tidak dianggap sebagai kedaluwarsa sesi pengguna lain.

OTP hanya diminta lewat tindakan pengguna. UI menunggu 60 detik untuk kirim ulang dan memakai lima menit sebagai perkiraan masa kode; keputusan server tetap berlaku. Respons 202 tidak membuktikan nomor terdaftar atau pesan terkirim. UI baru menyatakan aktivasi/pemulihan berhasil setelah respons 204, lalu meminta login baru. Tidak ada endpoint verifikasi OTP terpisah yang dibuat oleh frontend.

Konflik versi akun menampilkan data terbaru untuk ditinjau. Penyimpanan ulang membutuhkan tindakan pengguna. Alasan dan konfirmasi wajib untuk perubahan status. Admin tidak melihat atau menetapkan OTP/password milik staf.

## Kontrak dan konfigurasi sesi

[contracts/README.md](contracts/README.md) mencatat asal dan hash OpenAPI **0.2.0** dari backend commit `63008d7c6c01ea53859b277e70c75db135995e4c`. Tipe diregenerasi dari artefak lokal yang dikunci. Endpoint akun dan autentikasi pada versi ini sudah diimplementasikan; operasi tiket tetap draf. Menerapkan kontrak di repo percobaan ini tidak mengubah penerimaan NMS-67.

```powershell
npm run api:generate
npm run api:check
```

Pada 1 November 2026, pembacaan staging `/openapi.json` menjawab versi 0.2.0. Pemeriksaan anonim `/auth/me` menjawab 401 dan preflight `/auth/login` menjawab 204, dengan origin `http://127.0.0.1:5173` dan credentials diizinkan. Ini membuktikan endpoint dan header CORS pada waktu pemeriksaan, belum membuktikan sesi login browser atau pengiriman WhatsApp.

Cookie produksi tetap ditetapkan backend: `__Host-nms_session`, HttpOnly, Secure, SameSite=Lax. Dokumentasi backend menjelaskan mode staging yang bisa memakai SameSite=None dan pengirim stub. Frontend tidak mengubah atau mengasumsikan mode tersebut. Akun uji, kesiapan gateway, pembatasan origin, dan pengujian cookie browser nyata perlu dikoordinasikan dengan backend. Jangan menaruh fixed OTP atau password akun ke kode frontend.

## Pemeriksaan

```powershell
npm run lint
npm run format
npm run typecheck
npm test
npm run api:check
npm run build
npx playwright install chromium
npm run test:e2e
npm run check
```

`check` mencakup lint, typecheck, tes unit/komponen, regenerasi tipe, dan build. Playwright menjalankan Chromium desktop dan Pixel 7 dengan respons API sintetis terkontrol. Server tes selalu memakai URL API `http://localhost:3000`, terlepas dari `.env.local`, dan menolak memakai ulang server lain. Tangkapan layar ada di `test-results/`; trace disimpan ketika gagal. Pengujian tidak memanggil mutasi staging atau mengirim WhatsApp.

CI bawaan fondasi dipertahankan: lockfile, `check`, dan tes browser; tidak melakukan deployment atau perubahan Jira. Hasil historis di `docs/VERIFICATION.md` adalah bukti fondasi 25 Oktober, bukan bukti perubahan Week 1. Bukti baru ada di [docs/WEEK-1-VERIFICATION.md](docs/WEEK-1-VERIFICATION.md).

## Batas penerimaan

- **Status Client:** API mutasi status ada, tetapi respons Customer tidak menyediakan `accountId` dan versi akun, sedangkan daftar staf mengecualikan Client. UI pengelolaan status saat ini hanya untuk staf. ID/versi pelanggan tidak boleh dipakai sebagai ID/versi akun.
- **Pengalihan akun Belum Aktif:** AC-US002-04 meminta pengalihan sesuai status. Backend 0.2.0 sengaja memberi 401 netral untuk Belum Aktif, Nonaktif, dan kredensial salah. UI menyediakan tautan aktivasi dan bantuan tanpa menebak status.
- **Password DDMMYYYY:** UI menolak password baru berbentuk tanggal kalender. Backend yang diperiksa belum menegakkan aturan ini; pemeriksaan UI tidak menggantikan validasi server AC-PDP-10.
- **UAT nyata:** empat peran, OTP WhatsApp, pencabutan sesi server, dan penolakan akses langsung di server belum diuji memakai akun staging. Lulus tes frontend tidak menjadikan Week 1 diterima QA.
- **Toolchain:** lockfile bawaan memiliki tiga temuan moderate yang berantai dari minimatch melalui alat generator OpenAPI. Tidak ada dependency produksi yang dilaporkan oleh audit tersebut. Versi tidak diturunkan otomatis melalui `audit fix --force`. Build juga masih memberi peringatan chunk utama lebih dari 500 kB; halaman auth dan akun sudah dipisah lewat lazy routes.

Dokumentasi resmi dipakai sebagai fallback karena Context7/find-docs tidak tersedia: [React Router Data Mode](https://reactrouter.com/7.18.4/start/data/routing), [RHF Effect resolver](https://github.com/react-hook-form/resolvers#effect-ts), dan [openapi-fetch](https://openapi-ts.dev/openapi-fetch/).
