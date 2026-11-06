# Panduan Tanda Tangan Rilis — Setoran Tahfidz

Google Play mewajibkan setiap aplikasi ditandatangani, dan aplikasi baru harus
diunggah sebagai **Android App Bundle (`.aab`)** yang ditandatangani dengan
**kunci upload** (*upload key*) milik Anda. Folder ini hanya berisi panduan:
**tidak ada** keystore atau kata sandi asli di sini. Jangan pernah meng-commit
file `.jks` atau kata sandinya ke git (keduanya sudah dikecualikan lewat
`.gitignore`).

## Dua jenis kunci: jangan tertukar

| Kunci | Lokasi | Dipakai untuk |
| --- | --- | --- |
| **Kunci debug** | `C:\Users\<nama>\.android\debug.keystore` (dibuat otomatis oleh Android SDK) | APK uji coba di GitHub Releases (`assembleDebug`) |
| **Kunci upload** | `upload-keystore.jks` yang Anda buat di langkah 1 | AAB untuk Google Play (`bundleRelease`) |

Setiap rilis APK uji coba harus dibuild di PC yang sama dengan
`debug.keystore` yang sama. Jika kuncinya berbeda, Android menolak pembaruan:
aplikasi lama harus dihapus dulu dan **data santri ikut terhapus**. Sebaiknya
salin `debug.keystore` ke tempat aman sebagai cadangan.

## 1. Buat keystore upload (sekali saja)

Jalankan dari PC yang sudah terpasang JDK (folder `bin` JDK harus ada di
`PATH`, atau tulis lokasi lengkap `keytool.exe`):

```powershell
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Anda akan diminta mengisi:
- Kata sandi keystore (**catat baik-baik**, tidak bisa dipulihkan bila lupa)
- Kata sandi kunci untuk alias `upload` (boleh sama dengan kata sandi keystore)
- Nama, organisasi, kota, provinsi, dan kode negara (`ID`) untuk sertifikat (hanya keterangan)

Hasilnya file `upload-keystore.jks`. **Simpan di luar folder repo**, misalnya
di pengelola kata sandi atau penyimpanan pribadi yang aman.

Google Play App Signing (aktif otomatis untuk aplikasi baru) menyimpan kunci
tanda tangan yang sebenarnya di server Google. Anda cukup menjaga kunci upload
ini. Bila kunci upload hilang, Anda bisa meminta reset lewat dukungan Google
Play, karena kunci ini bukan kunci yang dipakai menandatangani APK yang
diterima pengguna.

## 2. Buat `android/keystore.properties`

File ini **tidak ikut ter-commit** (ada di `.gitignore`). Buat sendiri di PC
Anda dengan isi seperti ini:

```properties
storeFile=C:\\path\\ke\\upload-keystore.jks
storePassword=kata-sandi-keystore
keyAlias=upload
keyPassword=kata-sandi-kunci
```

Simpan di `android/keystore.properties` (sejajar dengan folder `android/app/`).
Perhatikan garis miring terbalik di Windows ditulis dua kali (`\\`).

## 3. Build AAB bertanda tangan

`android/app/build.gradle` sudah membaca `keystore.properties` **bila file itu
ada**. Setelah langkah 2:

```powershell
cd android
.\gradlew.bat bundleRelease
```

Hasilnya AAB **bertanda tangan** yang siap diunggah ke Google Play:

```
android/app/build/outputs/bundle/release/app-release.aab
```

Jika `keystore.properties` tidak ditemukan, Gradle menampilkan peringatan
`android/keystore.properties not found` dan AAB yang dihasilkan **tidak
bertanda tangan**, sehingga akan ditolak Play Console. Build debug
(`assembleDebug`) tetap berjalan normal tanpa file ini.

## 4. (Opsional) APK rilis untuk dicoba manual

```powershell
cd android
.\gradlew.bat assembleRelease
```

Hasilnya `android/app/build/outputs/apk/release/app-release.apk`, ditandatangani
dengan kunci upload yang sama. Berguna untuk mencoba sebelum mengirim ke Play.
APK ini **tidak bisa** dipasang di atas APK debug tanpa menghapusnya dulu.

## Yang tidak boleh di-commit

- `upload-keystore.jks` (atau file `*.jks` / `*.keystore` apa pun)
- `android/keystore.properties`
- Kata sandi dalam bentuk teks biasa

Semua di atas sudah tercakup di `.gitignore` root repo.
