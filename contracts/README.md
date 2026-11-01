# OpenAPI 0.2.0

Source: `nirwana-system/nms-backend`, commit `63008d7c6c01ea53859b277e70c75db135995e4c`, path `openapi.json`.

SHA256 (LF): `048faee39334adc2254aa32d72c463d770b9392970a205246aefd0c263708c26`.

Disalin tanpa perubahan semantik pada 1 November 2026 untuk implementasi Week 1 di repo percobaan. Artefak 0.2.0 menggantikan 0.1.1 dari fondasi resmi; perubahan kontrak ini dicatat secara eksplisit dan tidak dianggap sebagai persetujuan baru NMS-67. `npm run api:generate` menghasilkan `src/shared/api/schema.d.ts`; `npm run api:check` menolak drift tipe. Staging juga menjawab versi 0.2.0 saat diperiksa.

Perbedaan yang dipakai frontend: request nomor menerima bentuk yang diketik pengguna dan server menormalisasikannya; `/auth/me` mengembalikan customerId untuk Client; tersedia logout, ganti password, serta CRUD/perubahan status staf. OTP aktivasi dan pemulihan berbagi `/auth/activate`. Respons permintaan OTP selalu netral, termasuk ketika pengirim WhatsApp gagal. Hanya respons 204 menandai penyelesaian password/aktivasi.

Endpoint bertanda `x-nms-draft` masih dapat menjawab 501. Jangan menyatakan fitur tiket atau integrasi lain selesai hanya karena tipe tersedia. Kontrak ini dikunci pada commit di atas, bukan mengikuti staging secara otomatis. Perubahan berikutnya harus memperbarui asal/hash, menghasilkan tipe baru, meninjau diff, dan menjalankan pemeriksaan. Breaking-change CI backend tetap dimiliki backend.
