# TRFBT PWA

PWA ringan untuk membuat dan mencetak struk transfer di printer thermal 58 mm. Tanpa backend; data di IndexedDB perangkat.

## Status (Sprint 1)

Sudah ada: formulir manual dengan validasi, pratinjau struk 32 kolom, simpan/riwayat/hapus/cetak ulang, pengaturan toko, ekspor/impor JSON, manifest + service worker, tab diagnostik printer BLE.
Belum ada: OCR (Sprint 3), uji fisik pada printer, uji instalasi di Android.

## Temuan kompatibilitas XP-58IIZ

- Belum terverifikasi. Pencarian web memberi sumber yang saling bertentangan: sebagian penjual mencantumkan XP-58IIZ hanya USB, sebagian lain Bluetooth.
- Web Bluetooth di Chrome Android hanya bisa memakai BLE GATT, bukan Bluetooth Classic SPP.
- Cara memastikan: buka tab **Printer** di Chrome Android (HTTPS), tekan "Cari & hubungkan printer", lalu catat daftar service/characteristic yang tampil.
- Jika tidak ada characteristic yang bisa ditulis, printer perlu jalur lain (mis. Android Print Bridge). Hentikan dan laporkan sebelum lanjut, sesuai blueprint.

## Deploy ke GitHub Pages

1. Push seluruh isi folder ke repositori, lalu Settings → Pages → deploy dari branch `main` (root).
2. Buka `https://<user>.github.io/<repo>/`. Semua path relatif, jadi aman di subfolder.
3. Naikkan `CACHE` di `sw.js` setiap kali berkas aplikasi berubah.

## Catatan cetak

Pengiriman byte yang selesai tanpa error hanya berarti data sampai ke stack BLE printer, bukan bahwa kertas tercetak. ESC/POS yang dipakai (init, bold, feed) belum diuji pada perangkat fisik.
