# Nexty Juice — E-Catalog + Admin HPP

Starter project toko jus dengan dua area yang benar-benar terpisah:

- **Publik:** `/`, `/menu`, `/menu/[slug]`
- **Admin privat:** `/admin/login`, `/admin/*`

Stack:

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Firebase Authentication
- Cloud Firestore
- Firebase Admin SDK untuk session cookie
- Cloudinary untuk gambar produk

> Menu admin tidak ditampilkan pada e-catalog. Pengunjung hanya membaca koleksi `catalogProducts`; resep dan HPP disimpan pada koleksi privat.

---

## 1. Jalankan project

Pastikan Node.js sudah terpasang, lalu buka terminal pada folder project:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka:

```text
Katalog : http://localhost:3000
Admin   : http://localhost:3000/admin/login
```

Untuk Windows PowerShell, jika `cp` tidak tersedia:

```powershell
Copy-Item .env.example .env.local
```

---

## 2. Buat project Firebase

### A. Buat project

1. Buka Firebase Console.
2. Klik **Add project**.
3. Buat Web App melalui **Project settings → General → Your apps → Web**.
4. Salin konfigurasi Firebase Web SDK.

Masukkan ke `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="isi_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="nama-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="nama-project"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="nama-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="isi_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="isi_app_id"
```

### B. Aktifkan Authentication

Buka:

```text
Firebase Console → Build → Authentication → Sign-in method
```

Aktifkan:

```text
Email/Password
```

Kemudian buka tab **Users** dan tambahkan akun admin, misalnya:

```text
Email    : admin@nextyjuice.com
Password : gunakan password kuat
```

### C. Aktifkan Firestore

Buka:

```text
Firebase Console → Build → Firestore Database → Create database
```

Pilih **Production mode**. Collection tidak perlu dibuat manual karena script seed dan halaman admin akan membuat dokumen pertama.

### D. Tambahkan Firebase Admin credential

Buka:

```text
Project settings → Service accounts → Generate new private key
```

Dari file JSON yang terunduh, masukkan tiga nilai berikut ke `.env.local`:

```env
FIREBASE_ADMIN_PROJECT_ID="nilai_project_id"
FIREBASE_ADMIN_CLIENT_EMAIL="nilai_client_email"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nISI_KEY\n-----END PRIVATE KEY-----\n"
```

Jangan commit file JSON service account atau `.env.local` ke GitHub.

---

## 3. Deploy Firestore Rules dan indexes

Install Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
```

Pilih project yang tadi dibuat, kemudian jalankan:

```bash
firebase deploy --only firestore
```

File yang digunakan:

```text
firestore.rules
firestore.indexes.json
firebase.json
```

Hak aksesnya:

| Collection | Pengunjung | Admin |
|---|---:|---:|
| `catalogProducts` aktif | baca | baca/tulis |
| `products` | ditolak | baca/tulis |
| `ingredients` | ditolak | baca/tulis |
| `ingredientCostHistory` | ditolak | baca + create |
| `settings` | ditolak | baca/tulis |

`ingredientCostHistory` tidak dapat diedit atau dihapus dari client supaya jejak perubahan harga tetap utuh.

---

## 4. Berikan role admin

Akun Firebase biasa belum dapat membuka dashboard. Jalankan:

```bash
npm run set-admin -- admin@nextyjuice.com
```

Setelah muncul pesan berhasil:

1. Logout dari halaman admin jika sedang login.
2. Login ulang melalui `/admin/login`.
3. Token baru akan memuat custom claim `admin: true`.

Jika muncul pesan akun tidak memiliki role admin, ulangi langkah tersebut dan login ulang.

---

## 5. Konfigurasi Cloudinary

Buat akun atau project Cloudinary, lalu ambil nilai dari dashboard Cloudinary:

```env
CLOUDINARY_CLOUD_NAME="cloud_name"
CLOUDINARY_API_KEY="api_key"
CLOUDINARY_API_SECRET="api_secret"
```

Upload dilakukan melalui server route berikut:

```text
POST /api/cloudinary/upload
POST /api/cloudinary/delete
```

Route memverifikasi session admin, hanya menerima gambar, dan membatasi file maksimal 5 MB. Secret Cloudinary tidak pernah dikirim ke browser.

Tambahkan nomor WhatsApp publik:

```env
NEXT_PUBLIC_WHATSAPP_NUMBER="6281234567890"
```

Gunakan format kode negara tanpa tanda `+`.

---

## 6. Masukkan data contoh

Setelah Firebase Admin terkonfigurasi:

```bash
npm run seed-demo
```

Script akan menambahkan:

- pengaturan HPP;
- bahan produksi;
- kemasan;
- satu produk contoh;
- proyeksi katalog publik.

Data dapat dilihat di:

```text
Firebase Console → Firestore Database → Data
```

---

## 7. Urutan penggunaan admin yang benar

### Langkah 1 — Isi bahan baku

Buka:

```text
/admin/bahan
```

Contoh pembelian mangga 1 kg seharga Rp35.000:

```text
Nama bahan       : Mangga harum manis
Jenis biaya      : Bahan produksi
Satuan dasar     : gram
Harga beli       : 35000
Jumlah pembelian : 1000
Yield            : 72
```

Jangan menulis `1` pada jumlah pembelian jika satuan dasarnya `gram`. Tulis `1000`.

Untuk cup isi:

```text
Jenis biaya      : Kemasan
Satuan dasar     : pcs
Harga beli       : 50000
Jumlah pembelian : 50
Yield            : otomatis 100%
```

Spinner/arrow bawaan pada seluruh input angka sudah disembunyikan melalui `src/app/globals.css`.

### Langkah 2 — Atur kebijakan HPP

Buka:

```text
/admin/pengaturan-hpp
```

Tambahkan:

- sewa bulanan;
- gaji tetap;
- penyusutan alat;
- biaya tetap lain;
- target porsi normal per bulan;
- target gross margin;
- kelipatan pembulatan harga.

Jangan masukkan biaya yang sama dua kali. Contoh: gaji pegawai tidak boleh dimasukkan ke gaji tetap sekaligus ke tenaga kerja per batch, kecuali memang ada dua komponen berbeda.

### Langkah 3 — Tambahkan produk dan resep

Buka:

```text
/admin/produk/tambah
```

Isi informasi katalog, gambar, lalu buat varian. Untuk setiap varian:

1. Isi harga jual.
2. Isi hasil batch berupa jumlah porsi layak jual.
3. Isi process loss jika resep merupakan **kebutuhan bersih**.
4. Tambahkan bahan dan kemasan pada resep.
5. Periksa HPP, saran harga, margin, dan panel audit.
6. Aktifkan produk hanya jika seluruh data sudah valid.

**Penting:** kuantitas resep pada aplikasi didefinisikan sebagai kebutuhan bersih untuk menghasilkan batch layak jual. Sistem menambah kebutuhan bahan produksi menggunakan process loss. Jika kuantitas yang kamu input sudah merupakan pemakaian aktual/gross, isi process loss `0` agar susut tidak dihitung dua kali.

### Langkah 4 — Audit dashboard

Buka:

```text
/admin
```

Dashboard menggunakan data nyata untuk menampilkan:

- jumlah produk dan bahan aktif;
- rata-rata HPP varian aktif;
- rata-rata margin varian aktif;
- komposisi biaya per porsi;
- varian yang memiliki masalah formula atau margin di bawah target.

Produk draft dan varian nonaktif tidak ikut menghitung rata-rata dashboard.

---

## 8. Struktur Firestore

```text
catalogProducts/{productId}
products/{productId}
ingredients/{ingredientId}
ingredientCostHistory/{historyId}
settings/hpp
```

### `catalogProducts`

Hanya menyimpan data yang aman untuk publik:

```text
name, slug, category, description, imageUrl,
featured, active, sortOrder, variants[].sellingPrice
```

### `products`

Menyimpan data privat:

```text
resep, hasil batch, process loss,
tenaga kerja, utilitas, biaya variabel,
harga jual dan pengaturan varian
```

### `ingredients`

Menyimpan harga beli, jumlah pembelian, yield, satuan, supplier, dan biaya efektif.

### `ingredientCostHistory`

Riwayat hanya ditambahkan saat salah satu dasar biaya berubah:

- harga beli;
- jumlah pembelian;
- yield;
- satuan;
- jenis biaya.

Penyimpanan master bahan dan riwayat dilakukan dalam satu Firestore batch agar tidak terjadi master berubah tetapi histori gagal dibuat.

---

## 9. Formula HPP

```text
Jumlah dapat dipakai
= jumlah pembelian × yield

Biaya efektif per satuan
= harga pembelian ÷ jumlah dapat dipakai

Bahan produksi setelah process loss
= kebutuhan bersih bahan produksi ÷ (1 − process loss)

Biaya variabel batch
= bahan produksi terkoreksi
+ kemasan
+ tenaga kerja langsung per batch
+ utilitas per batch
+ biaya variabel lain

Biaya variabel per porsi
= biaya variabel batch ÷ hasil batch

Overhead tetap per porsi
= biaya tetap bulanan ÷ target porsi bulanan

HPP penuh per porsi
= biaya variabel per porsi + overhead tetap per porsi

Saran harga jual
= HPP ÷ (1 − target margin)
```

Harga saran dibulatkan ke atas berdasarkan kelipatan yang dipilih admin.

Penjelasan lebih rinci:

```text
docs/HPP-METHODOLOGY.md
docs/LOGIC-AUDIT.md
```

---

## 10. Perintah yang tersedia

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run set-admin -- email@admin.com
npm run seed-demo
```

---

## 11. Troubleshooting

### Firebase client belum dikonfigurasi

Periksa seluruh variable `NEXT_PUBLIC_FIREBASE_*` pada `.env.local`, kemudian restart server:

```bash
Ctrl + C
npm run dev
```

### Missing or insufficient permissions

Pastikan:

1. Firestore rules sudah di-deploy.
2. Akun sudah diberi custom claim admin.
3. Admin sudah logout dan login ulang.

### Query requires an index

Jalankan:

```bash
firebase deploy --only firestore:indexes
```

### Gambar tidak dapat di-upload

Periksa `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, dan `CLOUDINARY_API_SECRET`, lalu pastikan file merupakan gambar dan ukurannya maksimal 5 MB.

### HPP terlalu besar

Periksa:

- jumlah pembelian ditulis dalam satuan dasar;
- yield tidak terlalu rendah;
- process loss tidak dihitung dua kali;
- target porsi bulanan tidak terlalu kecil;
- biaya tenaga kerja tidak masuk dua kali;
- hasil batch sesuai jumlah porsi layak jual.

---

## 12. Batasan MVP

Dasar harga bahan masih memakai **latest/replacement cost** pada master bahan, belum moving weighted average persediaan. Untuk sistem produksi penuh, tahap selanjutnya sebaiknya menambahkan:

```text
purchases
purchaseItems
stockMovements
hppSnapshots
recipeVersions
sales
saleItems
```

Dengan `hppSnapshots`, laporan penjualan lama tidak berubah ketika harga bahan hari ini diperbarui.
