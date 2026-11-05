# Setoran Tahfidz

Aplikasi Android untuk **guru tahfidz** mencatat setoran hafalan Al-Qur'an
santri setiap hari: tahsin, tahfidz, dan murojaah, lengkap dengan nilai
kelancaran, laporan bulanan, dan diagram progres hafalan.

Aplikasi berjalan **sepenuhnya offline**. Tidak perlu akun, tidak ada iklan,
dan data tidak pernah dikirim ke server mana pun.

**[⬇️ Unduh APK terbaru](https://github.com/abujafar-arsyad/setoran-tahfidz/releases/latest)** · versi saat ini: 1.2.0 (uji coba) · [Riwayat rilis](https://github.com/abujafar-arsyad/setoran-tahfidz/releases)

## Tangkapan layar

Semua nama dan catatan pada gambar ini fiktif.

| Catat | Laporan | Progres | Sebaran nilai |
| :---: | :---: | :---: | :---: |
| <img src="docs/screenshots/catat.png" alt="Halaman Catat: rentang ayat dan nilai kelancaran" width="200"> | <img src="docs/screenshots/laporan.png" alt="Halaman Laporan: tabel bulanan dengan label nilai" width="200"> | <img src="docs/screenshots/progres.png" alt="Halaman Progres: ringkasan dan diagram hafalan per bulan" width="200"> | <img src="docs/screenshots/progres-nilai.png" alt="Halaman Progres: sebaran nilai per bulan dan progres per juz" width="200"> |

| Santri | Setelan | Gambar laporan (untuk wali santri) |
| :---: | :---: | :---: |
| <img src="docs/screenshots/santri.png" alt="Halaman Santri: daftar santri" width="200"> | <img src="docs/screenshots/setelan.png" alt="Halaman Setelan: tampilan, lembaga, dan laporan" width="200"> | <img src="docs/screenshots/laporan-gambar.png" alt="Contoh gambar laporan bulanan yang diunduh" width="300"> |

## Fitur

**Pencatatan harian**
- Catat tahsin, tahfidz, murojaah, dan keterangan (Izin, Sakit, Ghoib) per tanggal.
- Rentang ayat diisi per baris: surah dan ayat awal sampai surah dan ayat akhir. Bisa lebih dari satu baris, dan bisa lintas surah (mis. Al-Baqarah 200 → Ali 'Imran 23).
- Ayat boleh dikosongkan: surah tanpa nomor ayat dihitung satu surah penuh.
- Nama surah muncul sebagai saran saat mengetik, dan jumlah ayat dicek otomatis (mis. Al-Ikhlas hanya 1–4).
- Catatan Iqro atau buku lain tetap bisa ditulis sebagai teks bebas.

**Nilai kelancaran**
- Setiap kategori setoran bisa diberi nilai (tidak wajib):

  | Singkatan | Nilai | | Keterangan |
  | :---: | --- | :---: | --- |
  | M | Mumtaz | ممتاز | lulus |
  | JJ | Jayyid Jiddan | جيد جدا | lulus |
  | J | Jayyid | جيد | lulus |
  | Mq | Maqbul | مقبول | lulus |
  | R | Rasib | راسب | belum lulus |

- Nilai tampil sebagai label berwarna di tabel Laporan dan di gambar laporan.

**Laporan bulanan**
- Tabel per bulan dengan total Hadir, Izin, Sakit, dan Ghoib. Ketuk satu hari untuk mengedit.
- Unduh sebagai gambar untuk dikirim ke wali santri, lengkap dengan nama lembaga, nama pengajar, rekap nilai, dan watermark lembaga (opsional).

**Progres hafalan**
- Ringkasan per santri: ayat tercatat dari 6.236 ayat, surah tuntas, hari setoran, dan rata-rata ayat per hari.
- Diagram hafalan baru per pekan atau per bulan, total dari waktu ke waktu, dan sebaran nilai per bulan.
- Progres per surah dan per juz (30 juz, Mushaf Madinah riwayat Hafs).
- Bisa dilihat untuk Tahsin, Tahfidz, atau Murojaah, dan diunduh sebagai satu gambar.

**Setelan dan data**
- Mode terang, gelap, atau otomatis; lima warna tema; empat ukuran teks; halaman awal saat aplikasi dibuka.
- Ekspor dan impor cadangan data (file JSON), plus pengingat cadangan berkala.

## Cara pakai singkat

1. **Tab Santri:** tambahkan nama santri.
2. **Tab Catat:** pilih santri dan tanggal, isi rentang ayat untuk tahsin, tahfidz, atau murojaah, beri nilai bila perlu, lalu ketuk **Simpan Setoran**.
3. **Tab Laporan:** lihat rekap bulanan. Ketuk **Unduh Laporan (Gambar)** untuk membuat gambar laporan yang bisa dikirim ke wali santri.
4. **Tab Progres:** pantau perkembangan hafalan tiap santri. Ketuk **Unduh Progres** untuk menyimpannya sebagai gambar.
5. **Tab Setelan:** isi nama lembaga dan pengajar, dan ketuk **Ekspor Data** secara rutin untuk mencadangkan data.

## Cara Progres menghitung

- Angka dihitung dari rentang ayat yang dicatat. Ayat yang disetor ulang tidak menambah total hafalan.
- Setoran Tahfidz bernilai **Rasib** tidak dihitung sampai disetor ulang dengan nilai lulus (atau tanpa nilai).
- Murojaah dan Tahsin bernilai Rasib tidak masuk total ayat, tetapi harinya tetap terhitung sebagai hari setoran.
- Catatan Iqro, nomor halaman, atau tulisan seperti "Juz 30 halaman 3" tidak bisa dibaca sebagai ayat. Progres akan menampilkan peringatan untuk catatan seperti ini.
- Hafalan santri sebelum memakai aplikasi ini tidak ikut terhitung.

## Data dan privasi

- Semua data tersimpan **hanya di HP ini** (`localStorage`). Tidak ada server, akun, iklan, atau pelacak.
- Cadangan otomatis Android dimatikan, sehingga data **ikut terhapus** bila aplikasi di-uninstall atau datanya dihapus. Karena itu, ekspor cadangan secara rutin dari tab Setelan.
- Untuk pindah HP, ekspor cadangan di HP lama lalu impor di HP baru.
- Aplikasi tidak meminta izin khusus apa pun, termasuk izin internet.

Selengkapnya: [Kebijakan Privasi](PRIVACY_POLICY.md).

## Tentang proyek

- **Pemilik:** Abu Ja'far Putra Arsad, pengajar tahfidz Al-Qur'an
- **Peran saya:** menentukan fitur dan menguji aplikasi ini. Kode ditulis dengan bantuan AI.
- **Status:** uji coba. Tersedia sebagai APK debug dan belum dirilis ke Google Play.
- **Lisensi:** [MIT](LICENSE)

---

## Untuk pengembang

Aplikasi web-nya ada di satu file, `www/index.html`, dan dibungkus menjadi
aplikasi Android dengan [Capacitor](https://capacitorjs.com/).

- **Application ID:** `id.tahfidz.setoran`
- **Web dir:** `www/`
- **Native project:** `android/`

### Struktur proyek

```
www/index.html           # Aplikasi web (HTML + CSS + JS dalam satu file)
tests/                   # Tes logika rentang ayat, progres, dan nilai (npm test)
docs/screenshots/        # Tangkapan layar untuk README
docs/PLAY_STORE.md       # Panduan rilis ke Google Play Store
capacitor.config.json    # Konfigurasi Capacitor (appId, appName, webDir)
android/                 # Proyek Android native
assets-src/              # Sumber gambar ikon & splash (generate_icon.py)
resources/               # Input untuk @capacitor/assets
release-signing/         # Panduan membuat upload keystore & signing config
PRIVACY_POLICY.md        # Kebijakan privasi
```

### Menjalankan di browser

`www/index.html` bisa dibuka langsung di browser:

```powershell
start www\index.html
```

Jika browser membatasi akses melalui `file://`, jalankan server lokal:

```powershell
npx serve www
```

### Tes

```powershell
npm test
```

Jalankan sebelum setiap rilis. Semua tes harus lulus.

### Membuat Debug APK

Gunakan JDK 21 dan Android SDK dengan build-tools serta platform yang sesuai
`android/variables.gradle` (saat ini `compileSdk`/`targetSdk` 36 dan
`minSdk` 24).

```powershell
npx cap sync android
cd android
$env:JAVA_HOME = "<path ke JDK 21>"
.\gradlew.bat assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

`npx cap sync android` wajib dijalankan setiap kali `www/index.html` berubah,
agar perubahannya disalin ke `android/app/src/main/assets/public`.

### Alur rilis

1. Naikkan versi di `android/app/build.gradle`. Polanya: `versionName "1.2.0"` → `versionCode 120`.
2. Jalankan `npm test`, lalu build APK seperti di atas.
3. Buat GitHub Release dengan tag `vX.Y.Z-debug` dari `main`, unggah APK
   bernama `setoran-tahfidz-vX.Y.Z-debug.apk`, dan tandai sebagai
   **Latest release** agar tautan unduh di atas ikut berpindah.

### Membuat Release AAB

Google Play mewajibkan **Android App Bundle (.aab)** yang ditandatangani
dengan upload key milik Anda. Ikuti petunjuk di `release-signing/README.md`
untuk membuat keystore dan `android/keystore.properties`, lalu jalankan:

```powershell
cd android
.\gradlew.bat bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

> Keystore tidak disertakan di repo dan jangan di-commit. Buat keystore
> sendiri dan simpan dengan aman.

Langkah lengkap ke Google Play ada di [docs/PLAY_STORE.md](docs/PLAY_STORE.md).

### Membuka proyek di Android Studio

1. Install [Android Studio](https://developer.android.com/studio), termasuk
   Android SDK dan JDK yang kompatibel.
2. Pilih **File → Open** lalu buka folder `android/`.
3. Tunggu proses Gradle sync selesai, lalu klik **Run ▶** untuk menjalankan
   aplikasi di emulator atau perangkat.

### Ikon dan splash screen

Ikon dan splash screen saat ini masih placeholder: latar ungu plum
(`#5b2a6b`), motif buku terbuka, tanda centang emas, dan monogram "ST".
File dibuat oleh `assets-src/generate_icon.py` (Python + Pillow), lalu
`@capacitor/assets` menghasilkan ikon untuk semua densitas.

Untuk memakai desain sendiri, ganti `resources/icon.png`,
`resources/icon-foreground.png`, `resources/icon-background.png`, dan
`resources/splash.png`, lalu jalankan:

```powershell
npx capacitor-assets generate --android
```
