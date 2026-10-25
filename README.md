# NMS Frontend

Fondasi frontend privat Nirwana Management System untuk [NMS-69](https://waxarsatia.atlassian.net/browse/NMS-69). Dibangun ulang dari nol atas instruksi Faishal pada 25 Oktober 2026. Tidak mengimpor kode, aset, atau riwayat prototipe lama. Penghapusan repo lama dilakukan owner organisasi. Repo pengganti memakai nama yang sama, tetapi memiliki identitas GitHub dan riwayat baru; tautan PR lama tidak menjadi bukti implementasi baru.

## Menjalankan dari clone bersih

Gunakan Node **24.22.1 LTS** dan npm **11.19.1** bawaan distribusi tersebut. Node 26 bukan runtime pengujian proyek. Versi dependensi langsung dikunci di package.json; seluruh pohon dependensi dikunci di package-lock.json. Jangan memakai `--force` atau `--legacy-peer-deps`.

Selama PR fondasi belum digabung, clone branch `NMS-69/frontend-foundation` dengan `git clone --branch NMS-69/frontend-foundation https://github.com/nirwana-system/nms-frontend.git`. Setelah merge, clone default di bawah sudah memuat fondasi.

```powershell
git clone https://github.com/nirwana-system/nms-frontend.git
cd nms-frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Buka http://127.0.0.1:5173. `VITE_API_BASE_URL` adalah URL publik, bukan tempat menyimpan rahasia. Konfigurasi lokal memakai http://localhost:3000; contoh staging ada di `.env.staging.example`. Untuk build staging, salin contoh ke `.env.staging.local` lalu jalankan `npm run build -- --mode staging`. Variabel VITE masuk bundle browser. URL harus HTTP(S), tanpa kredensial, query, atau fragment. Semua nilai contoh dan fixture tes sintetis.

```powershell
npm run lint
npm run format
npm run typecheck
npm run test
npm run api:check
npm run build
npx playwright install chromium
npm run test:e2e
npm run check
```

`check` menjalankan lint, typecheck seluruh aplikasi, unit/component tests, pemeriksaan regenerasi API, dan build. `test:e2e` terpisah karena memerlukan browser Chromium; CI menjalankan keduanya. `format` menulis perbaikan format/import. `preview` menyajikan hasil build untuk pemeriksaan lokal. Hosting SPA kelak harus mengarahkan deep link ke index.html; deployment publik belum diaktifkan.

## Struktur dan batas tanggung jawab

- `src/app`: satu Data Router di luar React tree, layout, route beranda/tentang, 404 dan error boundary.
- `src/pages`: halaman fondasi yang menyatakan batas fitur secara eksplisit. Halaman ini bukan implementasi story layanan atau pengganti desain Hamiz.
- `src/shared/api`: konfigurasi origin, klien openapi-fetch, tipe hasil generator, schema/serializer kontrak tiket. Belum terhubung ke form produksi.
- `src/shared/query-client.ts`: satu pemilik cache server dan invalidasi, tanpa retry mutasi otomatis. Pembatalan query dan pembersihan cache dijalankan pada 401; alur logout mendatang wajib memanggil `clearUserSessionCache`.
- `contracts`: salinan artefak OpenAPI backend berversi beserta asal dan hash.
- `tests`: setup RTL dan uji browser desktop/mobile. Tidak memanggil endpoint produksi atau memakai data pelanggan.

React state menangani UI; Context hanya bila diperlukan. Query menangani data server. React Hook Form menangani form; Effect Schema menangani validasi. Effect dipakai untuk komposisi layanan yang memang membutuhkan alur tersebut, bukan runtime per komponen. Tidak ada Zod kedua, Effect Atom, global store, atau lapisan cache/retry lain.

## Stack dan kompatibilitas

Target mengikuti keputusan Denis pada 25 Oktober 2026: React 19, TypeScript strict seluruh aplikasi, Vite 8.3 dengan plugin resmi React, React Router Data Mode, TanStack Query 5, Effect 3.x, React Hook Form 7, openapi-typescript 7/openapi-fetch 0.17, Tailwind CSS 4/CSS variables/Lucide, Vitest/RTL/Playwright, Biome 2/tsc.

Resolver resmi `@hookform/resolvers/effect-ts` memakai seri **5**, karena seri 6 mensyaratkan Effect 4. TypeScript memakai seri **5.9**, sesuai peer dependency openapi-typescript 7. Uji komponen membuktikan input invalid ditolak dan input valid diterima melalui RHF dan Effect 3. Biome menjadi satu linter/formatter dengan aturan Hooks recommended; tidak ada ESLint/Prettier paralel.

MapLibre GL JS + PMTiles self-hosted wilayah Aceh sudah ditetapkan untuk story peta, tetapi dependensi dan fitur peta belum dimuat pada fondasi. Login/OTP, form nyata, pengelolaan peran, integrasi tiket dan layanan, serta handoff UI Hamiz mengikuti story masing-masing. Tidak ada login demo yang mengaku sebagai sesi nyata.

## Kontrak API dan autentikasi

Lihat [contracts/README.md](contracts/README.md). Regenerasi memakai artefak lokal yang dikunci, bukan URL staging yang bisa berubah:

```powershell
npm run api:generate
npm run api:check
```

Perubahan kontrak mengikuti versioning NMS-67. Ambil artefak backend dari commit yang ditinjau, perbarui asal/hash, regenerasi tipe, tinjau diff, dan jalankan seluruh check. CI menolak drift tipe. Pemeriksaan breaking changes kontrak tetap dimiliki CI backend; tidak diklaim diuji ulang oleh frontend.

`credentials: include` dipasang pada klien. Cookie sesi ditentukan backend: HttpOnly/Secure/SameSite=Lax, tanpa token di localStorage. Frontend tidak bisa menetapkan flag cookie server. Origin FE final, CORS allowlist, dan syarat satu situs tetap dikoordinasikan dengan NMS-68 sebelum uji sesi browser nyata. Tidak memakai Better Auth default.

Serializer tiket menjaga complaint asli terpisah dari description, serviceNumber API, categoryId opsional, dan foto File asli pada field photos berulang. Maksimal 5 JPEG/PNG, masing-masing 5 MiB; title 150, complaint/description 4.000 karakter. Pemeriksaan isi berkas dan otorisasi tetap backend. Satu Idempotency-Key dan payload identik dipakai ulang hanya atas tindakan caller ketika hasil belum pasti; tidak membuat kunci baru atau mengulang mutasi otomatis. Konflik 409 harus ditinjau pengguna, bukan diulang otomatis. Pesan error server tidak dicetak ke log atau UI tanpa pemetaan kode.

Endpoint fitur kontrak 0.1.1 masih draf dan dapat menjawab 501. Tes klien tidak membuktikan login, OTP, idempotensi tersimpan atau tiket operasional selesai. NMS-67 tetap Done berdasarkan penerimaan historisnya; reset frontend tidak membuka ulang kontrak itu.

## Workflow dan kepemilikan

Pemilik implementasi/review frontend: Faishal. Denis meninjau kontrak FE–BE, Hamiz handoff UI, Dimas verifikasi QA. Repo privat milik nirwana-system. Konfirmasi akses langsung/inherited dan GitHub for Jira harus memakai identitas repo baru, bukan bukti repo yang dihapus.

Branch `NMS-69/frontend-foundation`, commit dan judul PR mencantumkan key NMS. CI memasang dependensi dari lockfile lalu menjalankan check dan browser desktop/mobile. Workflow hanya memiliki contents:read, tidak deploy dan tidak memindahkan status Jira. Merge tidak menjadikan NMS-69 Done: README, keputusan stack, bukti clone bersih/CI/visual dan Verify Dimas masih menjadi gerbang penerimaan.

## Referensi implementasi

Dokumentasi resmi digunakan sebagai pengganti Context7/find-docs yang tidak tersedia:

- [NMS-69 dan persetujuan Denis](https://waxarsatia.atlassian.net/browse/NMS-69)
- [Keputusan teknologi](https://waxarsatia.atlassian.net/wiki/spaces/NMS/pages/3506186)
- [Konvensi API](https://waxarsatia.atlassian.net/wiki/spaces/NMS/pages/3440677)
- [React Router Data Mode](https://reactrouter.com/start/data/installation)
- [RHF resolver resmi](https://github.com/react-hook-form/resolvers#effect-ts)
- [openapi-fetch](https://openapi-ts.dev/openapi-fetch/)
