import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Boxes,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  PackageOpen,
  ShieldAlert
} from "lucide-react";
import { GuideCheck } from "@/components/admin-guide-panel";

const workflow = [
  {
    step: "01",
    title: "Masukkan bahan dan kemasan",
    description: "Catat harga beli dan jumlah barang sesuai satuan yang nanti dipakai di resep, misalnya gram, ml, atau pcs.",
    href: "/admin/bahan",
    action: "Buka bahan & kemasan",
    icon: Boxes
  },
  {
    step: "02",
    title: "Masukkan biaya bulanan dan target keuntungan",
    description: "Catat sewa, gaji tetap, biaya alat, perkiraan gelas terjual per bulan, dan target keuntungan.",
    href: "/admin/pengaturan-hpp",
    action: "Buka biaya & harga jual",
    icon: Calculator
  },
  {
    step: "03",
    title: "Buat produk dan resep",
    description: "Untuk setiap pilihan ukuran, isi jumlah gelas yang dihasilkan lalu masukkan seluruh bahan dan kemasan. Harga jual belum perlu diisi.",
    href: "/admin/produk/tambah",
    action: "Tambah produk",
    icon: PackageOpen
  },
  {
    step: "04",
    title: "Periksa HPP lalu tentukan harga jual",
    description: "Setelah rincian dan total modal per gelas muncul, gunakan harga saran atau tentukan harga sendiri. Baru setelah itu tampilkan produk di katalog.",
    href: "/admin/produk/tambah",
    action: "Lanjutkan ke produk",
    icon: CircleDollarSign
  }
];

const terms = [
  {
    term: "HPP",
    meaning: "Total modal untuk membuat satu gelas atau satu porsi. HPP belum termasuk keuntungan yang ingin diambil."
  },
  {
    term: "Bagian yang bisa dipakai",
    meaning: "Persentase bahan yang benar-benar dapat digunakan setelah kulit, biji, atau bagian rusak dibuang. Di data teknis disebut yield."
  },
  {
    term: "Sekali produksi",
    meaning: "Satu kali membuat resep. Contoh: satu blender menghasilkan 4 gelas. Di data teknis disebut batch."
  },
  {
    term: "Tambahan karena sisa atau tumpah",
    meaning: "Tambahan bahan untuk mengganti bahan yang tertinggal di blender, menempel di alat, atau tumpah saat produksi."
  },
  {
    term: "Biaya bulanan per gelas",
    meaning: "Bagian sewa, gaji tetap, dan biaya alat yang dibebankan ke setiap gelas. Di data teknis disebut overhead."
  },
  {
    term: "Keuntungan (%)",
    meaning: "Persentase keuntungan yang tersisa dari harga jual setelah HPP dikurangi. Di data teknis disebut margin."
  },
  {
    term: "Kode barang",
    meaning: "Kode otomatis untuk membedakan bahan dan produk. Pengguna tidak perlu membuatnya sendiri. Di data teknis disebut SKU."
  },
  {
    term: "Pilihan produk",
    meaning: "Ukuran atau versi produk, misalnya Regular dan Large. Di data teknis disebut varian."
  }
];

export default function AdminGuidePage() {
  return (
    <section>
      <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#f15a16]">Pusat bantuan</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-[-.03em] text-[#17130f]">Cara menggunakan sistem</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-black/65">Ikuti urutan di bawah. Kamu tidak perlu memahami rumus akuntansi; cukup isi data pembelian dan resep sesuai kondisi sebenarnya.</p>

      <div className="mt-7 overflow-hidden rounded-2xl bg-[#17130f] text-white shadow-[0_20px_50px_rgba(23,19,15,.14)]">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-[#f15a16]"><BookOpenCheck className="size-5" /></span>
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-[#ff9d6e]">Urutan yang disarankan</p>
                <h2 className="mt-1 font-display text-2xl font-bold">Bahan → biaya bulanan → resep → periksa harga</h2>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-white/75">Mulai dari bahan terlebih dahulu. Saat membuat produk, masukkan resep dan biaya produksi lebih dulu. Harga jual selalu ditentukan paling akhir setelah HPP per gelas terlihat.</p>
          </div>
          <Link href="/admin/bahan" className="admin-button-primary bg-white text-[#17130f] hover:bg-[#f15a16] hover:text-white">Mulai dari bahan <ArrowRight className="size-4" /></Link>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {workflow.map(({ step, title, description, href, action, icon: Icon }) => (
          <article key={step} className="admin-card p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#fff0e7] text-[#f15a16]"><Icon className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#b83b05]">Langkah {step}</p>
                <h2 className="mt-1 font-display text-2xl font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-black/65">{description}</p>
                <Link href={href} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#d84909] hover:text-[#17130f]">{action} <ArrowRight className="size-4" /></Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <article className="admin-card p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Contoh bahan</p>
          <h2 className="mt-1 font-display text-2xl font-bold">Mangga 1 kg dibeli seharga Rp30.000</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ExampleRow label="Satuan resep" value="gram" />
            <ExampleRow label="Harga beli" value="Rp30.000" />
            <ExampleRow label="Jumlah pembelian" value="1.000 gram" />
            <ExampleRow label="Bagian yang bisa dipakai" value="70%" />
          </div>
          <div className="mt-4 rounded-xl bg-[#17130f] p-5 text-white">
            <p className="text-sm text-white/65">Biaya mangga yang benar-benar bisa dipakai</p>
            <p className="mt-2 text-2xl font-black">Rp30.000 ÷ 700 gram = Rp42,86 per gram</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-black/60">Dari 1.000 gram mangga, hanya 700 gram yang bisa dipakai karena kulit dan biji dibuang. Untuk cup dan sedotan, bagian yang bisa dipakai selalu 100%.</p>
        </article>

        <article className="admin-card p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Sebelum produk ditampilkan</p>
          <h2 className="mt-1 font-display text-2xl font-bold">Periksa enam hal ini</h2>
          <ul className="mt-5 space-y-2">
            <GuideCheck>Satuan pembelian sama dengan satuan yang dipakai di resep.</GuideCheck>
            <GuideCheck>Bagian bahan yang bisa dipakai berdasarkan hasil timbang, bukan tebakan.</GuideCheck>
            <GuideCheck>Jumlah hasil produksi adalah gelas yang benar-benar layak dijual.</GuideCheck>
            <GuideCheck>Tambahan bahan karena sisa atau tumpah tidak dihitung dua kali.</GuideCheck>
            <GuideCheck>Gaji, listrik, dan biaya lain tidak dimasukkan di dua tempat sekaligus.</GuideCheck>
            <GuideCheck>Harga jual baru ditentukan setelah total modal per gelas terlihat.</GuideCheck>
          </ul>
        </article>
      </div>


      <article className="admin-card mt-5 p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Urutan saat menambah produk</p>
        <h2 className="mt-1 font-display text-2xl font-bold">Jangan mulai dari harga jual</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {[
            ["1", "Nama & hasil", "Isi nama pilihan dan jumlah gelas sekali produksi."],
            ["2", "Bahan", "Masukkan seluruh bahan dan kemasan resep."],
            ["3", "Biaya proses", "Tambahkan upah, listrik, air, gas, atau biaya lain."],
            ["4", "Periksa HPP", "Lihat rincian, total sekali produksi, dan modal per gelas."],
            ["5", "Harga jual", "Gunakan harga saran atau isi harga sendiri, lalu tampilkan di katalog."]
          ].map(([number, title, description]) => (
            <div key={number} className="rounded-2xl border border-black/[.07] bg-[#fbf8f3] p-4">
              <span className="grid size-8 place-items-center rounded-lg bg-[#fff0e7] text-xs font-black text-[#d84909]">{number}</span>
              <p className="mt-3 font-black">{title}</p>
              <p className="mt-1 text-sm leading-6 text-black/60">{description}</p>
            </div>
          ))}
        </div>
      </article>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <FormulaCard title="Biaya bahan per satuan" explanation="Harga beli dibagi jumlah bahan yang benar-benar bisa dipakai." />
        <FormulaCard title="Modal satu gelas (HPP)" explanation="Biaya bahan, kemasan, proses, dan bagian biaya bulanan dijumlahkan." />
        <FormulaCard title="Saran harga jual" explanation="Sistem menambahkan ruang keuntungan sesuai target yang kamu tentukan." />
      </div>

      <article className="admin-card mt-5 p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Kamus istilah</p>
        <h2 className="mt-1 font-display text-2xl font-bold">Arti istilah yang muncul di sistem</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {terms.map((item) => (
            <div key={item.term} className="rounded-xl border border-black/[.07] bg-[#fbf8f3] p-4">
              <p className="font-black text-[#17130f]">{item.term}</p>
              <p className="mt-1 text-sm leading-6 text-black/60">{item.meaning}</p>
            </div>
          ))}
        </div>
      </article>

      <div className="mt-5 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
        <div>
          <h2 className="font-black text-amber-900">Jangan hitung kehilangan bahan dua kali</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900/75">Bagian kulit dan biji dicatat saat memasukkan bahan. Sisa di blender atau bahan yang tumpah dicatat di resep produk. Satu kehilangan hanya boleh dicatat di salah satu tempat.</p>
        </div>
      </div>
    </section>
  );
}

function ExampleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/[.07] bg-[#fbf8f3] p-4">
      <p className="text-sm font-bold text-black/50">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function FormulaCard({ title, explanation }: { title: string; explanation: string }) {
  return (
    <article className="admin-card p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-[#fff0e7] text-[#f15a16]"><CheckCircle2 className="size-4" /></span>
        <h2 className="font-black">{title}</h2>
      </div>
      <p className="mt-4 rounded-xl bg-[#f7f2ea] p-4 text-sm font-semibold leading-6 text-black/65">{explanation}</p>
    </article>
  );
}
