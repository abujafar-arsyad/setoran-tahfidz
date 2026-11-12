# Kebijakan Privasi — Catatan Tahfidz

*Berlaku sejak: 4 November 2026 · diperbarui 6 November 2026*

Versi halaman web: https://abujafar-arsyad.github.io/setoran-tahfidz/privacy-policy.html
(isi `docs/privacy-policy.html` harus selalu sama dengan file ini).

**Catatan Tahfidz** adalah aplikasi pencatat hafalan Al-Qur'an yang berjalan
sepenuhnya secara **offline** di perangkat Anda.

## Data yang Dikumpulkan

**Tidak ada.** Aplikasi ini tidak mengumpulkan, mengirim, membagikan, atau
menyimpan data pengguna di server manapun. Aplikasi tidak memiliki backend,
tidak melakukan panggilan jaringan (network request) apa pun, dan tidak
menyertakan SDK analitik, iklan, atau pelacak pihak ketiga.

## Penyimpanan Data

Seluruh data yang Anda masukkan (misalnya nama santri dan halaqah, catatan
setoran, nilai, dan pengaturan) disimpan **hanya di perangkat Anda sendiri**,
menggunakan penyimpanan lokal WebView (`localStorage`). Data tersebut:

- Tidak pernah dikirim ke server dan tidak dapat diakses oleh pengembang aplikasi.
- Tidak ikut dicadangkan otomatis oleh Android (cadangan otomatis dimatikan).
- Akan terhapus jika Anda menghapus data aplikasi (clear app data) atau
  meng-uninstall aplikasi.

Data hanya keluar dari perangkat bila **Anda sendiri** memilih mengekspor file
cadangan atau membagikan gambar laporan/rapor lewat menu bagikan Android. File
tersebut dikirim ke aplikasi atau tujuan yang Anda pilih, bukan ke pengembang.

## Izin Aplikasi

Aplikasi ini **tidak meminta izin khusus** apa pun (tidak ada akses kamera,
lokasi, kontak, penyimpanan eksternal, internet, dsb.) selain izin standar
yang otomatis diberikan oleh sistem Android untuk menjalankan aplikasi.

## Pihak Ketiga

Aplikasi ini tidak mengintegrasikan layanan pihak ketiga manapun (tidak ada
Google Analytics, Firebase, AdMob, atau layanan sejenis).

## Anak-anak

Aplikasi ini ditujukan untuk guru/pengajar. Nama santri yang dicatat guru hanya
tersimpan di perangkat guru dan tidak dikirim ke mana pun.

## Perubahan pada Kebijakan Ini

Jika kebijakan privasi ini berubah di masa depan (misalnya karena
penambahan fitur baru), perubahan akan dipublikasikan di halaman ini dan
di listing aplikasi pada Google Play Store.

## Kontak

Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi
pengembang melalui halaman Issues repository GitHub proyek ini:
https://github.com/abujafar-arsyad/setoran-tahfidz/issues

---

# Privacy Policy — Catatan Tahfidz (English summary)

Catatan Tahfidz is an offline-only Qur'an memorization tracker. It collects
**no data whatsoever**. All information you enter is stored exclusively in
your device's local storage (`localStorage`), is never transmitted to any
server, is excluded from Android auto-backup, and cannot be accessed by the
developer. Data leaves the device only when you yourself export a backup file
or share a report image.
The app requests no special permissions and includes no third-party
analytics, ads, or trackers.
