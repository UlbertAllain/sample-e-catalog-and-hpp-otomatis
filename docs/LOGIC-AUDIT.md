# Audit Logika dan Flow

## Perbaikan yang sudah diterapkan

### 1. Spinner input angka

Arrow atas/bawah bawaan `input[type=number]` disembunyikan secara global untuk Chrome, Edge, Safari, dan Firefox. Input tetap memakai `type="number"` dan `inputMode="decimal"` agar validasi angka serta keyboard numerik tetap bekerja.

### 2. Dashboard tidak lagi mencampur data draft

Rata-rata HPP dan margin hanya menggunakan produk aktif serta varian aktif. Varian tanpa harga tidak dimasukkan ke rata-rata margin.

### 3. Yield kemasan

Kemasan dipaksa menggunakan yield 100%. Yield hanya berlaku pada bahan produksi yang memiliki kulit, biji, trimming, atau bagian tidak terpakai.

### 4. Definisi process loss

Resep didefinisikan sebagai kebutuhan bersih. Process loss mengubah kebutuhan bersih bahan produksi menjadi kebutuhan gross. UI dan dokumentasi memperingatkan admin agar tidak memasukkan kuantitas gross sekaligus process loss.

### 5. Validasi produk

Sebelum produk disimpan, sistem memeriksa:

- nama, slug, kategori, deskripsi, dan gambar;
- minimal satu varian;
- minimal satu varian aktif untuk produk aktif;
- nama varian dan SKU tidak duplikat dalam produk;
- harga jual varian aktif lebih dari nol;
- hasil batch berupa bilangan bulat positif;
- process loss kurang dari 100%;
- biaya batch tidak negatif;
- resep tidak kosong;
- kuantitas bahan lebih dari nol;
- bahan tidak duplikat;
- bahan tersedia, aktif, dan memiliki biaya valid.

### 6. Audit formula per varian

`calculateVariantHpp()` menghasilkan status audit berisi bahan hilang, bahan nonaktif, biaya bahan invalid, target overhead belum lengkap, dan harga jual yang belum diisi.

### 7. Riwayat biaya bahan atomik

Perubahan master bahan dan pembuatan riwayat biaya sekarang menggunakan satu Firestore batch. Jika salah satu gagal, keduanya tidak tersimpan. Riwayat hanya dibuat jika dasar biaya benar-benar berubah.

### 8. Role admin pada client

Client tidak hanya memeriksa apakah pengguna login, tetapi juga memeriksa claim `admin: true` sebelum mengakses Firestore admin. Firestore Rules tetap menjadi lapisan keamanan utama.

### 9. Penghapusan produk

Firestore dihapus lebih dahulu, kemudian gambar Cloudinary dibersihkan sebagai best effort. Urutan ini mencegah produk tertinggal dengan URL gambar yang sudah dihapus saat commit database gagal.

### 10. Koleksi publik dibatasi

Rules `catalogProducts` membatasi top-level field yang boleh ditulis. Data resep dan komponen biaya tetap berada di `products`.

## Flow aplikasi setelah audit

```text
Admin login
  ↓
Verifikasi Firebase ID token + custom claim
  ↓
Server membuat HTTP-only session cookie
  ↓
Admin mengisi bahan baku
  ↓
Master bahan + riwayat biaya disimpan atomik
  ↓
Admin mengisi biaya tetap dan kebijakan margin
  ↓
Admin membuat produk, varian, dan resep bersih per batch
  ↓
Validasi struktur + audit formula
  ↓
Batch menyimpan products + catalogProducts
  ↓
Dashboard menghitung HPP dari data biaya terbaru
  ↓
Pengunjung hanya membaca catalogProducts aktif
```

## Risiko yang masih tersisa pada MVP

### 1. Harga bahan belum berbasis stok

Perhitungan menggunakan harga acuan terakhir, bukan nilai persediaan. Untuk akuntansi persediaan dibutuhkan purchase receipt dan moving weighted average.

### 2. HPP historis belum dibekukan

Ketika harga bahan berubah, seluruh tampilan HPP produk ikut berubah. Transaksi penjualan production harus menyimpan `hppSnapshot` saat transaksi dibuat.

### 3. Pemeriksaan bahan dipakai masih client-side

Sebelum bahan dihapus, client memeriksa seluruh produk. Untuk banyak admin atau trafik tinggi, pengecekan ini sebaiknya dipindah ke server transaction atau menggunakan usage index.

### 4. Slug unik memiliki race condition kecil

UI mengecek slug sebelum penyimpanan, tetapi dua admin yang menyimpan slug sama pada saat yang hampir bersamaan masih dapat bentrok. Versi production dapat memakai dokumen reservation `productSlugs/{slug}` dalam transaction server.

### 5. Gambar upload yang tidak jadi disimpan

Gambar baru yang sudah di-upload tetapi form dibatalkan dapat menjadi orphan asset. Production dapat memakai folder temporary dan job cleanup berkala.

## Rekomendasi tahap berikutnya

1. Tambahkan pembelian dan pergerakan stok.
2. Tambahkan moving weighted average cost.
3. Tambahkan recipe version dan HPP snapshot.
4. Tambahkan audit log aktivitas admin.
5. Pindahkan mutation kritis ke server route menggunakan Firebase Admin SDK.
6. Tambahkan test unit untuk formula dan test emulator untuk Firestore Rules.
