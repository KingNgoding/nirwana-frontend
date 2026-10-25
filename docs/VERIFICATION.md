# NMS-69 — Bukti reset fondasi frontend

Tanggal: 25 Oktober 2026. Pemilik implementasi: Faishal. Bukti ini mencatat pemeriksaan teknis, bukan persetujuan QA Dimas.

## Keputusan reset dan identitas repo

Faishal meminta penghapusan repo frontend lama dan pembuatan ulang tanpa mempertahankan kode/aset/riwayat. Owner organisasi mengonfirmasi telah menghapus repo lama. Instruksi langsung ini menggantikan klausul preservation pada deskripsi NMS-69 dan komentar Denis yang lebih lama.

Repo pengganti privat: nirwana-system/nms-frontend, GitHub repository ID **1433094033**, dibuat 25 Oktober 2026. Root commit **007012a** hanya bootstrap baru; implementasi fondasi **dabe704** ada pada branch `NMS-69/frontend-foundation`, diajukan melalui **PR #1 baru**. Nama dan nomor PR dapat sama dengan tautan historis repo yang telah dihapus. Bukti PR #1/#2 lama tidak boleh dianggap bukti PR baru atau persetujuan terhadap reset ini.

Tidak ada kode, aset, atau riwayat aplikasi lama yang diimpor. Artefak OpenAPI adalah kontrak backend yang masih berlaku, bukan kode frontend lama. UI dasar adalah placeholder baru; handoff/desain Hamiz tetap menjadi masukan story implementasi berikutnya, bukan klaim telah dipertahankan di repo ini.

## Penyesuaian terhadap gap yang dicatat Denis

| Gap snapshot lama yang disebut Denis | Fondasi baru                                                                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Vite 6.4.5                           | Vite 8.3.5, plugin resmi React 6.1.2                                                                                        |
| JSX dan typecheck API saja           | React 19.3.1, TypeScript 5.9.3 strict seluruh src, konfigurasi dan tes                                                      |
| ESLint                               | Biome 2.6.3, preset recommended termasuk aturan Hooks; parser Tailwind aktif                                                |
| Target routing/data/state            | React Router 7.18.4 Data Mode; Query 5.104.5 menjadi pemilik cache server; React state untuk UI                             |
| Target schema/form                   | Effect 3.22.4, RHF 7.91.0, resolver resmi 5.9.2; kombinasi diuji pada komponen                                              |
| Regenerasi klien                     | openapi-typescript 7.13.0, openapi-fetch 0.17.0; kontrak backend 0.1.1 dari commit cd97392df246e6a8fdfc406b64649480ebb928d4 |
| Styling                              | Tailwind 4.3.3, CSS variables dan Lucide; tidak ada migrasi massal @apply                                                   |
| Runtime/lockfile                     | Node 24.22.1 LTS, npm 11.19.1, versi langsung exact dan package-lock.json                                                   |

Resolver terbaru seri 6 mengharuskan Effect 4; instalasi awal menolak kombinasi itu. Seri 5.9.2 mendukung Effect 3 dan RHF 7. TypeScript 7 terbaru tidak sesuai peer openapi-typescript 7; dipilih 5.9.3. Tidak memakai force atau legacy-peer-deps. Distribusi Node diambil dari nodejs.org dan SHA256 diverifikasi terhadap SHASUMS256.txt resmi.

## Verifikasi lokal dan clone bersih

Commit aplikasi yang diuji: **dabe7041dc9919ba3320f59333c7ab6cea9965b8**. Clone bersih berasal dari remote GitHub dengan branch tersebut, bukan salinan node_modules atau worktree pengembangan.

| Pemeriksaan                                  | Hasil                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| npm ci pada clone bersih                     | Lulus; audit instalasi melaporkan 0 vulnerabilities                     |
| npm run lint                                 | Lulus, preset recommended aktif, tanpa warning/error                    |
| npm run typecheck                            | Lulus untuk seluruh aplikasi/config/tes                                 |
| npm run test                                 | 19 tes lulus, 0 gagal                                                   |
| npm run api:check                            | Tipe dihasilkan ulang identik dengan tipe yang dikomit                  |
| npm run build                                | Lulus pada Vite 8.3.5                                                   |
| npm run test:e2e                             | 2 tes lulus: desktop Chromium dan emulasi mobile Pixel 7                |
| git status clone bersih setelah pemeriksaan  | Bersih; output build/browser diabaikan Git                              |
| Pemeriksaan visual screenshot desktop/mobile | Ditinjau; teks terbaca, layout tidak terpotong, tanpa scroll horizontal |

Unit/komponen menguji batas field/foto, File multipart berulang, complaint terpisah, credentials include, header idempotensi caller dan satu request tanpa retry tersembunyi, pembersihan cache saat 401, penolakan URL API tidak valid, validasi RHF–Effect, route dasar dan 404. Uji browser memeriksa navigasi, reload deep link, 404, page errors dan lebar halaman. Fixture sintetis; tidak ada kredensial atau pelanggan nyata.

Pemeriksaan lokal mencakup mock kontrak dan halaman fondasi. Tidak membuktikan sesi server, OTP, upload server, idempotensi tersimpan atau tiket operasional; endpoint fitur masih draf 501. Foto dalam tes adalah data sintetis untuk kontrak, bukan bukti validasi magic bytes server.

## CI dan akses

[PR #1 baru](https://github.com/nirwana-system/nms-frontend/pull/1) menjalankan workflow Frontend CI. [Run awal implementasi](https://github.com/nirwana-system/nms-frontend/actions/runs/40187351353) mencakup konvensi key NMS pada branch/judul PR/commit, npm ci, seluruh check, Chromium desktop/mobile dan artefak screenshot. Status run final harus dibaca langsung di GitHub; perubahan dokumentasi berikutnya memicu run baru pada head terbaru. Actions resmi dikunci ke SHA v7 yang diverifikasi dari tag upstream. Workflow tidak deploy dan tidak mengubah status Jira.

Snapshot akses GitHub sesudah pembuatan repo: KingNgoding dan WaxArsatia memiliki admin; Hamijeu dan wilboh memiliki write. Ini akses efektif yang ditampilkan API, bukan klaim bahwa semua anggota telah menerima atau menguji setup. Repo privat dan GitHub Pages tidak diaktifkan.

GitHub for Jira perlu dikonfirmasi ulang untuk repository ID baru. Akses saat ini tidak dapat memeriksa konfigurasi GitHub App organisasi; panel Development NMS-69 belum memberikan bukti tautan baru saat pemeriksaan. Atas arahan Faishal, tindak lanjut ini dicatat pada komentar Jira untuk owner organisasi, tanpa menganggapnya selesai.

## Gerbang penerimaan yang tersisa

- Review implementasi, README, dan kesesuaian stack oleh pemilik frontend; review kontrak oleh Denis serta handoff oleh Hamiz sesuai kebutuhan.
- Owner organisasi memastikan repo baru dipilih pada integrasi resmi GitHub for Jira dan memverifikasi tautan pada panel Development.
- Dimas memverifikasi bukti AC sebelum Done. PR/CI hijau atau merge tidak menggantikan Verify.
- Origin final/CORS/deployment tetap NMS-68; fitur peta, form produksi dan sesi nyata tetap story pemiliknya.

NMS-69 tetap Review. NMS-67 tidak dibuka ulang dan penerimaan historisnya tidak diubah.
