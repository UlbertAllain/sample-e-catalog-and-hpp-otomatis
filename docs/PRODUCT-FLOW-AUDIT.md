# Audit alur form produk dan HPP — v4.4

## Temuan sebelum perbaikan

1. Harga jual muncul di bagian awal sebelum bahan dan biaya produksi diisi.
2. Produk dan pilihan baru langsung berstatus aktif, sehingga pengguna awam dapat mengira data belum selesai sudah aman untuk dipublikasikan.
3. Delapan kolom diletakkan dalam satu grid. Judul dan catatan yang panjang membuat tinggi setiap kolom berbeda dan tampilan terlihat tidak rata.
4. Rincian HPP terlalu ringkas. Pengguna melihat beberapa angka, tetapi belum memperoleh urutan jelas dari biaya sekali produksi menuju modal per gelas.
5. Harga jual bernilai 0 tetap menghasilkan kalimat selisih rugi yang membingungkan meskipun pengguna memang belum sampai tahap menentukan harga.

## Keputusan perbaikan

Alur produk diubah menjadi:

```text
1. Nama pilihan dan jumlah hasil produksi
2. Bahan dan kemasan
3. Biaya proses sekali produksi
4. Rincian biaya dan total HPP
5. Penentuan harga jual
6. Publikasi ke katalog
```

Harga jual tidak lagi muncul di bagian awal. Sistem menghitung HPP secara langsung saat resep diisi, lalu menampilkan:

- biaya bahan;
- biaya kemasan;
- tambahan bahan karena sisa/tumpah;
- upah;
- utilitas;
- biaya lain;
- total biaya sekali produksi;
- biaya produksi per gelas;
- biaya bulanan per gelas;
- HPP per gelas;
- harga jual yang disarankan.

Pengguna dapat menekan tombol **Gunakan harga saran** atau memasukkan harga sendiri. Status keuntungan berubah menjadi merah, kuning, atau hijau berdasarkan hubungan harga jual, HPP, dan target keuntungan.

## Perubahan keamanan alur

Produk dan pilihan baru sekarang dimulai sebagai draft:

```text
product.active = false
variant.active = false
```

Data lama tidak diubah. Produk yang sebelumnya aktif tetap aktif ketika diedit.

Validasi harga jual tetap berlaku hanya ketika pilihan akan ditampilkan. Dengan demikian, pengguna dapat menyusun resep terlebih dahulu tanpa dipaksa mengisi harga jual sebelum HPP diketahui.

## Formula yang tidak berubah

Patch ini tidak mengubah formula HPP, struktur Firestore, atau data yang sudah tersimpan. Perubahan berfokus pada urutan pengisian, tampilan rincian, status draft, dan cara pengguna menentukan harga jual.
