# Nexty Juice — E-Catalog & HPP Management

Website katalog produk jus dengan panel admin untuk mengelola resep, bahan, biaya, dan harga jual. Data katalog publik dipisahkan dari rincian resep dan perhitungan harga pokok produksi (HPP) yang hanya boleh diakses admin.

## Fungsi utama

- `/`, `/menu`, dan `/menu/[slug]`: katalog produk publik.
- `/admin/login` dan `/admin/*`: area administrasi.
- Data bahan, kemasan, resep, varian, HPP, margin, dan usulan harga.
- History biaya bahan serta proyeksi produk aktif ke katalog publik.
- Upload gambar melalui Cloudinary.

Metode perhitungan, asumsi yield, process loss, serta pembagian biaya tetap dicatat terpisah di [HPP Methodology](docs/HPP-METHODOLOGY.md). Jangan mengubah rumus tanpa pengujian kasus bisnis yang relevan.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Firebase Authentication, Cloud Firestore, Firebase Admin SDK, dan Cloudinary.

## Menjalankan secara lokal

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Di Windows PowerShell gunakan `Copy-Item .env.example .env.local`. Pengaturan Firebase client/admin, Firestore Rules, serta Cloudinary dibutuhkan untuk fitur CMS. Jangan commit credential di repository.

## Bootstrap admin dan data contoh

Setelah Firebase Authentication, Firestore, Rules, dan environment siap:

```bash
npm run set-admin -- admin@example.com
npm run seed-demo
```

Gunakan email admin yang benar; jalankan seed hanya pada database pengembangan/yang diizinkan. Jangan menjalankan script setup pada data produksi tanpa backup.

## Struktur

```text
src/app/                 Public/admin routes
src/components/          Catalog dan admin UI
src/lib/hpp.ts           Perhitungan HPP
src/lib/validation.ts    Validasi
src/types/               Kontrak domain
scripts/                 Set admin dan demo seed
firestore.rules          Database access rules
docs/                   Metodologi dan audit logika
```

## Verifikasi

```bash
npm run lint
npm run build
```

Audit perhitungan dan alur tersedia di [Logic Audit](docs/LOGIC-AUDIT.md) dan [Product Flow Audit](docs/PRODUCT-FLOW-AUDIT.md). Belum ada skrip automated test khusus di manifest; verifikasi HPP, role admin, dan publikasi produk sebelum penggunaan operasional.
