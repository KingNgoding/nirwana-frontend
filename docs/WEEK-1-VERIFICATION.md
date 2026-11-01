# Bukti pemeriksaan Week 1

Tanggal: 1 November 2026. Workspace: `KingNgoding/nirwana-frontend`, branch lokal `NMS-20/week-1-auth`. Bukti ini mencatat pengujian frontend; belum merupakan penerimaan Dimas atau hasil UAT produksi.

## Hasil lokal

- `npm ci` berhasil dari lockfile fondasi, memakai Node 24.22.1/npm 11.19.1. Runtime Node 24 diunduh dari nodejs.org dan hash arsip cocok dengan daftar checksum resmi. PATH sistem tidak diubah.
- `npm run check` berhasil: Biome tanpa error/warning, TypeScript strict, **28 tes unit/komponen**, pemeriksaan tipe hasil OpenAPI, dan build Vite.
- `npm run test:e2e` berhasil: **34 tes**, 17 skenario pada Chromium desktop dan Pixel 7. API dikendalikan oleh fixture sintetis, tanpa mutasi staging.
- `git diff --check` berhasil. Working tree referensi frontend resmi, backend, dan desain tetap bersih.
- Build berhasil dengan chunk utama sekitar 533 kB sebelum gzip (169 kB gzip), serta lazy chunks untuk halaman dan akun. Peringatan ukuran chunk masih ada, tidak disembunyikan.
- Audit lockfile melaporkan tiga temuan moderate berantai pada tool generator OpenAPI (`minimatch`, `@redocly/openapi-core`, `openapi-typescript`). Dependensi dipertahankan sesuai setup; tidak menjalankan pembaruan paksa atau downgrade generator.

## Perilaku yang diuji

Empat peran dapat login memakai respons API yang sesuai, memuat ulang halaman dengan sesi server, dan logout. Guard menolak navigasi langsung Client, Officer, serta Teknisi ke pengelolaan staf tanpa memanggil daftar staf. Navigasi setelah sesi kedaluwarsa menghilangkan halaman terlindungi. Browser storage tidak menyimpan token atau identitas.

Aktivasi dan pemulihan mengirim payload `phone`, `purpose`, kemudian `phone`, `otp`, `password`, `passwordConfirmation` sesuai kontrak 0.2.0. Konfirmasi salah ditolak sebelum request. Kode salah tidak menjadi keberhasilan. Permintaan OTP gagal tidak memajukan alur; kedaluwarsa lima menit mematikan tombol simpan, dan permintaan baru bisa dilakukan sesudah cooldown. UI mengikuti batas server pada 429 dan tidak menampilkan pesan backend arbitrer.

Ganti password mempertahankan sesi ketika validasi server gagal dan mengakhiri sesi pada keberhasilan. Admin dapat membuat staf tanpa password/OTP, meninjau konflik versi tanpa retry otomatis, menyimpan versi terbaru atas tindakan eksplisit, serta menonaktifkan/mengaktifkan staf dengan alasan dan konfirmasi.

Tes regresi cache mula-mula gagal ketika respons pemeriksaan sesi lama mengembalikan pengguna setelah logout. Setelah perbaikan, permintaan sesi lama dibatalkan dan identitas tetap null. Tes terpisah memastikan `/auth/me` yang menerima 401 tetap dapat selesai dan membuang data privat tanpa membatalkan query dirinya sendiri. Login baru juga membersihkan pemeriksaan sesi sebelumnya sebelum membaca identitas baru.

Pemeriksaan browser menemukan pengalihan logout yang berlomba dengan guard saat sesi menjadi null. Maksud logout/perubahan password kini menjadi state UI pada Context di batas router, sehingga guard dan tindakan selesai memakai tujuan yang sama, termasuk ketika halaman dimuat lewat lazy route. Tes logout/password melewati kasus ini.

## Pemeriksaan visual

Tangkapan layar berikut diperiksa secara visual: `test-results/login-desktop.png`, `login-mobile.png`, `accounts-mobile.png`; juga tersedia varian login gelap dan akun desktop. Login memakai tata letak dua kolom pada desktop dan satu kolom pada ponsel. Tabel staf memakai scroll internal pada ponsel; lebar dokumen tidak melampaui viewport. Tidak ada elemen login demo atau switcher peran.

## Staging, hanya pembacaan

- `/openapi.json`: versi 0.2.0.
- `/auth/me` tanpa cookie, dengan Origin `http://127.0.0.1:5173`: 401, origin tersebut diizinkan, credentials true.
- Preflight OPTIONS `/auth/login` untuk POST/Content-Type: 204 dengan origin dan credentials diizinkan.

Tidak ada kredensial atau OTP yang diminta/digunakan untuk staging. Hasil ini belum membuktikan cookie setelah login, pengiriman WhatsApp, revokasi sesi di server, atau otorisasi API lintas peran. Akun uji dan kesiapan backend diperlukan untuk verifikasi tersebut. Mode stub dan fixed code pada dokumentasi backend tidak dianggap sebagai gateway nyata.

## Pekerjaan yang masih memerlukan backend/QA

Status akun Client memerlukan pemetaan accountId dan versi akun melalui endpoint baca. Kontrak login netral berbeda dari pengalihan berdasarkan status pada AC-US002-04. Backend harus menegakkan penolakan password DDMMYYYY secara mandiri. Detail dan sumber tercatat di `WEEK-1.md` dan README.

Atas instruksi Faishal, hasil Week 1 disiapkan untuk commit dan push ke KingNgoding/nirwana-frontend, pada main dan branch kerja NMS-20/week-1-auth. Bukti di atas adalah pemeriksaan lokal; status CI remote diperiksa terpisah. Repo resmi, status Jira, dan deployment publik tidak diubah.
