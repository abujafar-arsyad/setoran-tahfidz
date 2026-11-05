# Rilis ke Google Play Store

Panduan ini melengkapi bagian **Untuk pengembang** di [README](../README.md).
Sebelum mulai, buat AAB bertanda tangan resmi (lihat
[release-signing/README.md](../release-signing/README.md)) dan pastikan
`versionCode` sudah dinaikkan.

## Langkah

1. Buat akun developer di [Google Play Console](https://play.google.com/console/).
   Biaya pendaftaran satu kali sebesar **USD 25** dan verifikasi identitas
   berlaku.
2. Pilih **Create app**, lalu isi nama "Setoran Tahfidz", bahasa Indonesia,
   kategori (misalnya Pendidikan/Education), dan status gratis (Free).
3. Lengkapi Store Listing:
   - Deskripsi singkat maksimal 80 karakter dan deskripsi lengkap maksimal
     4000 karakter, dalam Bahasa Indonesia. Jelaskan pencatatan setoran,
     nilai kelancaran, laporan bulanan, progres hafalan, penyimpanan
     lokal/offline, serta bahwa aplikasi tidak memakai iklan atau akun.
   - Minimal **2 screenshot ponsel** dalam format PNG/JPEG, rasio 16:9 atau
     portrait, sisi terpanjang 320–3840 px. Tangkapan layar di
     `docs/screenshots/` bisa dipakai sebagai awal.
   - **Feature graphic** berukuran 1024x500 px.
   - Ikon listing berukuran 512x512 px. Ekspor `assets-src/icon-1024.png`
     lalu ubah ukurannya; ikon adaptif hasil build tidak menggantikan ikon
     listing ini.
4. Isi **Content Rating Questionnaire** sesuai kondisi aplikasi untuk
   mendapatkan rating usia.
5. Isi **Data Safety form** sesuai perilaku aplikasi: data tidak dikumpulkan
   atau dibagikan dan hanya tersimpan di perangkat (`localStorage`), tanpa
   dikirim ke server. Cadangan otomatis Android dimatikan
   (`android:allowBackup="false"`). Gunakan
   [PRIVACY_POLICY.md](../PRIVACY_POLICY.md) sebagai referensi.
6. Publikasikan `PRIVACY_POLICY.md` di halaman web publik, misalnya GitHub
   Pages atau hosting statis lain. Masukkan URL-nya di **App content →
   Privacy Policy**.
7. Mulai dari **Internal testing** melalui **Release → Testing → Internal
   testing → Create new release**, lalu tambahkan email penguji.
8. Unggah `app-release.aab` hasil `bundleRelease` yang sudah ditandatangani.
9. Lengkapi rollout dan release notes, lalu kirim untuk ditinjau Google.
   Setelah pengujian internal, Anda bisa mempromosikan rilis ke
   **Production**; rilis ini juga perlu ditinjau Google.

Pembuatan akun, verifikasi identitas, pembayaran, screenshot dari perangkat,
dan persetujuan rilis harus dilakukan sendiri melalui akun Google Play Console.
