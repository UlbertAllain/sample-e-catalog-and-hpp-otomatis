# Metodologi HPP Nexty Juice

Dokumen ini menetapkan definisi setiap input agar yield, susut proses, dan hasil batch tidak dihitung dua kali.

## 1. Satuan dasar

Setiap bahan menggunakan salah satu satuan dasar:

- `gram`
- `ml`
- `pcs`

Jumlah pembelian harus langsung dikonversi ke satuan tersebut. Pembelian 1 kg pada bahan bersatuan gram ditulis `1000`, bukan `1`.

## 2. Biaya efektif bahan

```text
jumlah dapat dipakai = jumlah pembelian × yield
biaya efektif per satuan = harga pembelian ÷ jumlah dapat dipakai
```

Contoh:

```text
Harga mangga       = Rp35.000
Jumlah bruto       = 1.000 gram
Yield              = 72%
Jumlah dapat dipakai = 720 gram
Biaya efektif      = Rp48,61/gram
```

Yield hanya digunakan untuk kulit, biji, trimming, atau bagian bahan yang tidak dapat digunakan sebelum produksi. Kemasan selalu memakai yield 100%.

## 3. Definisi resep per batch

Kuantitas resep adalah **kebutuhan bersih** untuk menghasilkan jumlah porsi layak jual pada `batchYield`.

```text
subtotal bahan bersih = kuantitas resep × biaya efektif per satuan
```

Cup, tutup, sedotan, stiker, dan kemasan lain tetap dimasukkan ke resep sebagai `packaging`.

## 4. Process loss

Process loss digunakan untuk sisa blender, tumpah, atau kehilangan selama proses produksi. Koreksi hanya diterapkan pada bahan produksi.

```text
bahan produksi gross = bahan produksi bersih ÷ (1 − process loss)
biaya process loss = bahan produksi gross − bahan produksi bersih
```

Kemasan tidak dikoreksi karena jumlah cup mengikuti jumlah porsi layak jual.

### Pencegahan double counting

Jika resep yang diinput sudah berupa pemakaian aktual/gross, isi process loss `0`. Jangan memasukkan pemakaian gross lalu mengisi persentase loss lagi.

## 5. Biaya variabel batch

```text
biaya variabel batch =
  bahan produksi gross
  + kemasan
  + tenaga kerja langsung per batch
  + utilitas per batch
  + biaya variabel lain per batch
```

Tenaga kerja per batch hanya digunakan untuk biaya yang berubah mengikuti jumlah produksi. Gaji tetap bulanan tidak boleh dimasukkan lagi pada bagian ini.

## 6. Biaya variabel per porsi

```text
biaya variabel per porsi = biaya variabel batch ÷ hasil batch
```

Hasil batch harus merupakan jumlah porsi layak jual, bukan jumlah cup teoritis sebelum kegagalan produksi.

## 7. Overhead tetap

```text
total biaya tetap bulanan =
  sewa
  + gaji tetap
  + penyusutan alat
  + biaya tetap lain

overhead per porsi = total biaya tetap bulanan ÷ target porsi normal per bulan
```

Jika target porsi belum diisi, overhead tidak dialokasikan dan dashboard memberikan peringatan audit.

## 8. HPP penuh

```text
HPP penuh per porsi = biaya variabel per porsi + overhead per porsi
```

Pajak keluaran, diskon, service charge, dan laba tidak termasuk HPP. Komisi marketplace dapat dimasukkan sebagai biaya variabel lain untuk MVP, tetapi pada versi lanjutan sebaiknya dimodelkan per kanal penjualan.

## 9. Harga jual dan margin

```text
harga sebelum pembulatan = HPP ÷ (1 − target gross margin)
margin aktual = (harga jual − HPP) ÷ harga jual
```

Aplikasi memakai margin, bukan markup. Harga saran dibulatkan ke atas berdasarkan `priceRoundingStep`.

## 10. Validasi audit

Varian ditandai perlu ditinjau ketika:

- resep kosong;
- bahan hilang;
- bahan nonaktif masih dipakai;
- biaya efektif bahan nol;
- jumlah hasil batch nol;
- harga jual varian aktif nol;
- target porsi bulanan belum diisi saat biaya tetap tersedia;
- margin di bawah target.

## 11. Dasar biaya pada MVP

MVP menggunakan **latest/replacement purchase cost**. Perubahan dasar harga dicatat pada `ingredientCostHistory` secara atomik bersama perubahan master bahan.

Untuk inventory production, sumber biaya sebaiknya diganti menjadi moving weighted average dan setiap transaksi penjualan menyimpan snapshot HPP pada saat penjualan.
