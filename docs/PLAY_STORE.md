# Rilis ke Google Play Store

Panduan lengkap merilis **Catatan Tahfidz** di Google Play. Bahan yang bisa
disiapkan dari repo **sudah siap** di folder [`docs/play-store/`](play-store/).
Yang tersisa adalah langkah yang harus dilakukan sendiri lewat akun Google:
membuat akun developer, membuat kunci upload, dan mengisi Play Console.

## Ringkasan: apa yang sudah siap dan apa yang perlu Anda lakukan

| Bahan | Status |
| --- | --- |
| Konfigurasi build rilis (`bundleRelease`, tanda tangan dari `keystore.properties`) | ✅ siap |
| `targetSdk` 36, tanpa izin khusus, cadangan otomatis mati | ✅ siap |
| Ikon listing 512×512 — [`icon-512.png`](play-store/icon-512.png) | ✅ siap |
| Feature graphic 1024×500 — [`feature-graphic.png`](play-store/feature-graphic.png) | ✅ siap |
| 6 screenshot ponsel 1080×1920 — `docs/play-store/screenshot-*.png` (catat, laporan, progres, sebaran nilai, kirim ke wali, rapor) | ✅ siap |
| Teks listing (judul, deskripsi singkat, deskripsi lengkap) | ✅ di bawah |
| Jawaban formulir Data Safety, rating konten, target audiens | ✅ di bawah |
| Halaman kebijakan privasi — [`docs/privacy-policy.html`](privacy-policy.html) | ✅ siap, **perlu diaktifkan** (langkah 2) |
| Akun Google Play Console (biaya pendaftaran sekali, USD 25) | ⬜ Anda |
| Kunci upload dan `android/keystore.properties` | ⬜ Anda (langkah 1) |
| Build AAB, unggah, kirim untuk ditinjau | ⬜ Anda (langkah 3–6) |

> **Penting untuk pengguna APK uji coba.** Versi Play Store ditandatangani
> dengan kunci yang berbeda dari APK debug di GitHub Releases. Android tidak
> bisa memperbarui APK debug menjadi versi Play Store; aplikasi lama harus
> dihapus dulu, dan **data ikut terhapus**. Minta semua guru yang memakai APK
> uji coba untuk **Ekspor Data** dulu (tab Setelan), memasang versi Play Store,
> lalu **Impor** file cadangannya.

## Langkah 1 — Buat kunci upload (sekali saja)

Ikuti [release-signing/README.md](../release-signing/README.md). Hasilnya:
file `upload-keystore.jks` (simpan baik-baik di luar repo) dan
`android/keystore.properties` (tidak ikut ter-commit).

## Langkah 2 — Aktifkan halaman kebijakan privasi

Play Console mewajibkan URL kebijakan privasi yang bisa dibuka publik.

1. Buka repo di GitHub → **Settings → Pages**.
2. Di **Build and deployment**, pilih **Deploy from a branch**, branch `main`,
   folder `/docs`, lalu **Save**.
3. Tunggu 1–2 menit. Halaman akan tersedia di:
   `https://abujafar-arsyad.github.io/setoran-tahfidz/privacy-policy.html`

Bila kebijakan privasi berubah, ubah **`PRIVACY_POLICY.md` dan
`docs/privacy-policy.html` bersamaan** agar isinya tetap sama.

## Langkah 3 — Build AAB bertanda tangan

Naikkan dulu `versionCode`/`versionName` di `android/app/build.gradle`
(pola: `1.3.0` → `130`), lalu:

```powershell
npm test
npm run test:ui
npx cap sync android
cd android
.\gradlew.bat bundleRelease
```

Hasil: `android/app/build/outputs/bundle/release/app-release.aab`.
Jika muncul peringatan `keystore.properties not found`, AAB **tidak
bertanda tangan** dan akan ditolak Play Console — ulangi langkah 1.

## Langkah 4 — Buat aplikasi dan isi Store listing

Play Console → **Create app**: nama `Catatan Tahfidz`, bahasa default
Indonesia, jenis **App**, **Free**.

**Main store listing**

- **App name** (maks. 30): `Catatan Tahfidz`
- **Short description** (maks. 80):

  ```
  Catat setoran hafalan santri, nilai, laporan & progres. Offline, tanpa iklan.
  ```

- **Full description** (maks. 4000):

  ```
  Catatan Tahfidz membantu guru tahfidz mencatat setoran hafalan Al-Qur'an santri setiap hari — tahsin, tahfidz, dan murojaah — langsung dari HP, tanpa internet.

  PENCATATAN HARIAN
  • Isi rentang ayat per baris: surah dan ayat awal sampai surah dan ayat akhir, termasuk lintas surah (mis. An-Naba 1 sampai An-Nazi'at 10).
  • Jumlah ayat dihitung otomatis dan dicek sesuai mushaf (mis. Al-Ikhlas hanya 4 ayat).
  • Nama surah muncul sebagai saran saat mengetik, dalam huruf Latin maupun Arab.
  • Catat keterangan Izin, Sakit, atau Ghoib.

  NILAI KELANCARAN
  • Beri nilai setiap setoran: Mumtaz, Jayyid Jiddan, Jayyid, Maqbul, atau Rasib.
  • Setoran tahfidz bernilai Rasib tidak dihitung sebagai hafalan sampai disetor ulang dan lulus.

  LAPORAN BULANAN
  • Tabel setoran sebulan lengkap dengan total kehadiran, label nilai, dan ringkasan ayat.
  • Unduh sebagai gambar dengan nama lembaga dan pengajar, siap dikirim ke wali santri.

  PROGRES HAFALAN
  • Total ayat dari 6.236 ayat, surah dan juz yang tuntas, diagram per bulan, sebaran nilai, dan peta 30 juz (Mushaf Madinah, riwayat Hafs).
  • Rapor progres satu halaman untuk wali santri.

  KIRIM KE WALI, SEKALI KETUK
  • Kirim gambar laporan bulanan atau rapor progres beserta pesan pembuka yang sudah tersusun langsung ke WhatsApp wali santri. Hafalan disebut per surah, mis. "sudah hafal 2 surah dan 6 ayat, yaitu Al-'Alaq ayat 1–6, Al-Qadr, dan Al-Bayyinah".
  • Template pesan bisa diedit dan disimpan sendiri di Setelan.

  KELOMPOK HALAQAH (OPSIONAL)
  • Untuk lembaga dengan beberapa kelompok: nyalakan di Setelan untuk mengelompokkan santri per halaqah (pagi, sore, kelas).

  PRIVASI
  • 100% offline: tidak ada akun, iklan, atau pelacak, dan tidak ada data yang dikirim ke server.
  • Semua data tersimpan hanya di HP Anda. Cadangkan dan pulihkan sendiri lewat Ekspor/Impor Data.

  Dibuat oleh pengajar tahfidz untuk para pengajar tahfidz.
  ```

- **Graphics**: unggah `icon-512.png`, `feature-graphic.png`, dan keenam
  `screenshot-*.png` (urutan sesuai nomor) dari `docs/play-store/`.
- **Category**: *Education*. **Tags**: Pendidikan, Agama/Religi bila tersedia.
- **Contact details**: email yang Anda pantau (wajib); situs web opsional
  (boleh halaman repo GitHub).

## Langkah 5 — Isi bagian App content

| Bagian | Jawaban |
| --- | --- |
| **Privacy policy** | URL dari langkah 2 |
| **App access** | *All functionality is available without special access* (tidak ada login) |
| **Ads** | *No, my app does not contain ads* |
| **Content rating** (kuesioner IARC) | Kategori *Reference, News, or Educational* (atau *Education*); jawab **No** untuk kekerasan, seksual, bahasa kasar, narkoba, perjudian, interaksi pengguna, berbagi lokasi, pembelian digital. Hasil yang diharapkan: semua umur. |
| **Target audience** | **18 tahun ke atas** (pengguna adalah guru). Jangan pilih rentang usia anak, agar tidak terkena kebijakan Families. |
| **News app / Government app / Financial features / Health** | No / No / Tidak ada / Tidak ada |
| **Data safety** | Lihat di bawah |

**Data safety** — isi sesuai perilaku aplikasi:

- *Does your app collect or share any of the required user data types?* → **No**.
  Aplikasi tidak punya server dan tidak mengirim data apa pun; nama santri
  dan catatan hanya tersimpan di `localStorage` perangkat.
- Ekspor data dan berbagi gambar laporan **dilakukan pengguna sendiri**
  lewat menu bagikan Android. Itu bukan pengumpulan data oleh pengembang.
- *Is all of the user data collected by your app encrypted in transit?* →
  tidak relevan (tidak ada data yang dikirim).
- *Do you provide a way for users to request that their data is deleted?* →
  tidak ada akun; pengguna bisa menghapus semua data dari tab Setelan
  (**Setel ulang**) atau dengan menghapus aplikasi.

## Langkah 6 — Uji internal, lalu Production

1. **Release → Testing → Internal testing → Create new release**, unggah
   `app-release.aab`, tambahkan email penguji, lalu *Review and roll out*.
2. Akun developer pribadi yang baru biasanya wajib menjalankan **closed
   testing** dengan sejumlah penguji selama beberapa hari sebelum boleh
   merilis ke Production. Ikuti syarat yang tampil di Play Console.
3. Setelah lolos pengujian, buat rilis di **Production**, isi catatan rilis,
   lalu kirim untuk ditinjau Google.
