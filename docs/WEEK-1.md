# Week 1: akun, autentikasi, dan hak akses

Implementasi lokal di `KingNgoding/nirwana-frontend`, branch `NMS-20/week-1-auth`. Setup dan riwayat berasal dari `nirwana-system/nms-frontend` commit `b591ae908957a4d147d1486d00095f6f95a629de`. Repo resmi tidak diubah.

## Acuan yang diperiksa

1. `../nms-rencana-8-minggu.pdf`, halaman 2: FS03 dan FS04 pada Week 1. Dashboard operasional, pelanggan, tiket, peta, voucher, dan halaman publik lengkap mengikuti minggu berikutnya.
2. [Hamijeu/nirwana](https://github.com/hamijeu/nirwana), `src/AuthPages.jsx`, `src/auth-design.css`, `src/PublicChrome.jsx`, dan matriks peran: tata letak autentikasi dua kolom, logo, warna biru, formulir dan navigasi. Kode demo, role switcher, kredensial contoh dan localStorage sesi tidak dibawa.
3. [NMS-69](https://waxarsatia.atlassian.net/browse/NMS-69): stack dari fondasi dipertahankan, termasuk TypeScript strict, React Router Data Mode, Query, RHF/Effect Schema, Biome dan Playwright.
4. [NMS-67](https://waxarsatia.atlassian.net/browse/NMS-67), Konvensi API, serta kontrak backend aktual 0.2.0 pada commit `63008d7c6c01ea53859b277e70c75db135995e4c`: sumber tipe dan perilaku endpoint.
5. [Repo frontend resmi](https://github.com/nirwana-system/nms-frontend): sumber setup, CI dan lockfile.
6. [Repo percobaan](https://github.com/KingNgoding/nirwana-frontend): tujuan pekerjaan, dengan origin terpisah dari upstream.
7. `../Acceptance_Criteria_NMS_Final_UU_PDP.pdf`: salinan lokal dokumen SharePoint dari pengguna, US-002 sampai US-006 dan AC-PDP-10.

## Keputusan implementasi

- Form login memanggil API; identitas dan peran selalu dibaca kembali melalui `/auth/me`. Tidak ada pilihan peran, token browser storage, atau sesi demo.
- Kontrak 0.1.1 bawaan setup sudah tertinggal. Salinan OpenAPI diperbarui secara eksplisit ke 0.2.0, lalu tipe diregenerasi. Endpoint autentikasi pada versi ini bukan draf. Staging `/openapi.json` juga menjawab versi 0.2.0 saat diperiksa 1 November 2026.
- Aktivasi dan pemulihan terdiri dari permintaan nomor, lalu kode beserta password. Kontrak tidak punya operasi verifikasi OTP terpisah, sehingga UI tidak menyatakan kode benar sebelum `/auth/activate` berhasil.
- Respons 202 adalah permintaan diterima, bukan bukti pesan terkirim atau nomor terdaftar. Batas kirim ulang 60 detik, OTP lima menit; penolakan dan Retry-After dari server tetap berwenang. Tidak ada retry mutasi otomatis.
- Login untuk Belum Aktif dan Nonaktif memakai 401 netral menurut kontrak aktual. Tautan aktivasi dan bantuan tersedia tanpa menyimpulkan status dari respons tersebut. Ini perbedaan nyata terhadap AC-US002-04 yang meminta pengalihan berdasarkan status.
- Empat peran mendapat workspace dasar, profil keamanan dan navigasi sesuai kewenangan. Halaman operasional minggu berikutnya belum diimplementasikan dan tidak menampilkan data fiktif seolah nyata.
- Admin dapat membuat/mengubah staf dan mengubah status akun yang diketahui melalui API. Konflik versi menampilkan data terbaru untuk ditinjau, tanpa replay otomatis. Perubahan status memerlukan alasan dan konfirmasi.
- UI status pada tahap ini mencakup staf. Kontrak dapat mengubah status Client bila accountId dan versi akun diketahui, tetapi respons Customer tidak memuat keduanya dan tidak ada endpoint pembacaan akun Client. ID/versi pelanggan tidak boleh diperlakukan sebagai ID/versi akun. Pemilihan akun Client untuk perubahan status menunggu pemetaan baca dari backend.
- UI menolak password baru berbentuk tanggal DDMMYYYY. Backend tetap harus menegakkan AC-PDP-10 sendiri; skema 0.2.0 yang diperiksa hanya menetapkan panjang dan konfirmasi.
- Cache data pengguna dibuang ketika sesi berakhir, logout atau password berubah. Pemeriksaan saat navigasi/fokus tidak memakai polling yang memperpanjang sesi idle tanpa tindakan pengguna.

## Urutan pengerjaan dan pemeriksaan

1. Salin setup melalui Git, pertahankan origin repo percobaan dan tambahkan upstream repo resmi.
2. Perbarui kontrak yang dikunci dan tipe; uji batas autentikasi/validasi/cache.
3. Bangun form, workspace empat peran, guard dan pengelolaan akun Admin.
4. Jalankan `npm run check` dan Playwright desktop/mobile dengan API sintetis terkontrol. Periksa tangkapan layar, respons error, akses lintas peran, expiry, logout dan pemulihan.
5. Catat batas bukti. Tes browser dengan respons terkontrol tidak membuktikan pengiriman WhatsApp atau otorisasi server staging. UAT nyata memerlukan akun uji dan konfigurasi cookie/CORS yang benar.
