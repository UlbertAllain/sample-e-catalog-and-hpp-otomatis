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
    title: "Buat master bahan dan kemasan",
    description: "Masukkan harga beli, jumlah pembelian dalam satuan resep, serta yield bahan yang benar.",
    href: "/admin/bahan",
    action: "Kelola bahan",
    icon: Boxes
  },
  {
    step: "02",
    title: "Atur biaya tetap dan target margin",
    description: "Isi sewa, gaji tetap, penyusutan, target porsi bulanan, margin, dan pembulatan harga.",
    href: "/admin/pengaturan-hpp",
    action: "Atur HPP",
    icon: Calculator
  },
  {
    step: "03",
    title: "Buat produk, varian, dan resep",
    description: "Resep dicatat per batch. Masukkan jumlah porsi layak jual, bahan, kemasan, serta biaya produksi batch.",
    href: "/admin/produk/tambah",
    action: "Tambah produk",
    icon: PackageOpen
  },
  {
    step: "04",
    title: "Audit HPP dan harga jual",
    description: "Bandingkan HPP penuh, harga saran, margin saat ini, dan peringatan audit sebelum produk dipublikasikan.",
    href: "/admin",
    action: "Buka ringkasan",
    icon: CircleDollarSign
  }
];

export default function AdminGuidePage() {
  return (
    <section>
      <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#f15a16]">Pusat bantuan / HPP</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-[-.03em] text-[#17130f]">Panduan penggunaan sistem</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-black/50">Ikuti urutan ini agar HPP tidak salah karena satuan campur, yield ganda, process loss ganda, atau overhead yang dihitung dua kali.</p>

      <div className="mt-7 overflow-hidden rounded-2xl bg-[#17130f] text-white shadow-[0_20px_50px_rgba(23,19,15,.14)]">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-[#f15a16]"><BookOpenCheck className="size-5" /></span>
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-[#ff9d6e]">Urutan wajib</p>
                <h2 className="mt-1 font-display text-2xl font-bold">Bahan → biaya tetap → resep → audit harga</h2>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-white/60">Jangan mulai dari produk sebelum harga bahan dan pengaturan overhead tersedia. HPP produk selalu membaca data master terbaru.</p>
          </div>
          <Link href="/admin/bahan" className="admin-button-primary bg-white text-[#17130f] hover:bg-[#f15a16] hover:text-white">Mulai langkah pertama <ArrowRight className="size-4" /></Link>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {workflow.map(({ step, title, description, href, action, icon: Icon }) => (
          <article key={step} className="admin-card p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#fff0e7] text-[#f15a16]"><Icon className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#f15a16]">Langkah {step}</p>
                <h2 className="mt-1 font-display text-2xl font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-black/50">{description}</p>
                <Link href={href} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#d84909] hover:text-[#17130f]">{action} <ArrowRight className="size-4" /></Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <article className="admin-card p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Contoh pengisian bahan</p>
          <h2 className="mt-1 font-display text-2xl font-bold">Mangga dibeli 1 kg seharga Rp30.000</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ExampleRow label="Satuan dasar" value="gram" />
            <ExampleRow label="Harga beli" value="Rp30.000" />
            <ExampleRow label="Jumlah pembelian" value="1.000 gram" />
            <ExampleRow label="Yield bersih" value="70%" />
          </div>
          <div className="mt-4 rounded-xl bg-[#17130f] p-5 text-white">
            <p className="text-xs text-white/50">Biaya efektif per gram</p>
            <p className="mt-2 text-2xl font-black">Rp30.000 ÷ (1.000 × 70%) = Rp42,86</p>
          </div>
          <p className="mt-4 text-xs leading-5 text-black/45">Yield dipakai untuk kulit, biji, trimming, atau bagian bahan yang memang tidak dapat digunakan. Untuk cup dan sedotan, yield selalu 100%.</p>
        </article>

        <article className="admin-card p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Checklist sebelum publish</p>
          <h2 className="mt-1 font-display text-2xl font-bold">Pastikan semua data ini sudah benar</h2>
          <ul className="mt-5 space-y-2">
            <GuideCheck>Satuan pembelian sama dengan satuan yang dipakai pada resep.</GuideCheck>
            <GuideCheck>Yield bahan berdasarkan hasil timbang bersih, bukan perkiraan asal.</GuideCheck>
            <GuideCheck>Hasil batch adalah jumlah porsi yang benar-benar layak dijual.</GuideCheck>
            <GuideCheck>Process loss hanya diisi jika resep menggunakan kebutuhan bersih.</GuideCheck>
            <GuideCheck>Gaji atau listrik tidak dimasukkan sekaligus sebagai biaya bulanan dan biaya per batch.</GuideCheck>
            <GuideCheck>Harga jual menghasilkan margin minimal sesuai target bisnis.</GuideCheck>
          </ul>
        </article>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <FormulaCard title="Biaya bahan efektif" formula="Harga beli ÷ (jumlah beli × yield)" />
        <FormulaCard title="HPP penuh per porsi" formula="Biaya variabel batch ÷ hasil batch + overhead/porsi" />
        <FormulaCard title="Harga jual berdasarkan margin" formula="HPP ÷ (1 − target margin)" />
      </div>

      <div className="mt-5 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
        <div>
          <h2 className="font-black text-amber-900">Bedakan yield bahan dan process loss</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900/70"><strong>Yield bahan</strong> terjadi sebelum bahan masuk resep, misalnya kulit dan biji. <strong>Process loss</strong> terjadi saat produksi, misalnya tertinggal di blender atau tumpah. Jangan mencatat kerugian yang sama pada keduanya.</p>
        </div>
      </div>
    </section>
  );
}

function ExampleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/[.07] bg-[#fbf8f3] p-4">
      <p className="text-xs font-bold text-black/40">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function FormulaCard({ title, formula }: { title: string; formula: string }) {
  return (
    <article className="admin-card p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-[#fff0e7] text-[#f15a16]"><CheckCircle2 className="size-4" /></span>
        <h2 className="font-black">{title}</h2>
      </div>
      <p className="mt-4 rounded-xl bg-[#f7f2ea] p-4 font-mono text-xs font-bold leading-5 text-black/65">{formula}</p>
    </article>
  );
}
