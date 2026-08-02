import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Citrus, Droplets, Sparkles } from "lucide-react";
import { CatalogGrid } from "@/components/catalog-grid";
import { SiteHeader } from "@/components/site-header";
import { mockCatalogProducts } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <main className="bg-[#fffdf9]">
      <SiteHeader />
      <section className="overflow-hidden border-b border-black/10">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:py-24">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#f15a16]">Fresh juice · dibuat setelah dipesan</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl font-bold leading-[.96] tracking-[-.05em] text-[#17130f] sm:text-7xl">Jus segar untuk hari yang terasa lebih ringan.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-black/50">Pilih rasa, ukuran, dan harga yang sesuai. Pesanan dapat langsung diteruskan melalui WhatsApp tanpa proses yang ribet.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/menu" className="inline-flex items-center gap-2 rounded-lg bg-[#17130f] px-5 py-3.5 font-bold text-white hover:bg-[#f15a16]">Lihat semua menu <ArrowRight className="size-4" /></Link>
              <Link href="#about" className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-5 py-3.5 font-bold hover:border-[#f15a16] hover:text-[#d84909]">Kenapa pilih kami</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-black/50">
              {['Buah dipilih harian', 'Dibuat saat dipesan', 'Pesan lewat WhatsApp'].map((item) => <span key={item} className="flex items-center gap-2"><Check className="size-4 text-[#f15a16]" /> {item}</span>)}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl pb-8 pr-5">
            <div className="absolute -right-10 top-10 h-56 w-56 rounded-full bg-[#f15a16]/10 blur-3xl" />
            <div className="relative ml-auto aspect-[5/4] w-[90%] overflow-hidden rounded-2xl border border-black/10 bg-[#f2eadf] shadow-[0_25px_70px_rgba(73,43,24,.14)]">
              <Image src={mockCatalogProducts[0].imageUrl} alt="Jus mangga segar" fill priority className="object-cover" />
            </div>
            <div className="absolute bottom-0 left-0 w-56 rotate-[-3deg] rounded-sm border border-black/10 bg-[#fff8ea] p-5 shadow-[0_16px_45px_rgba(73,43,24,.18)]">
              <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#f15a16]">Favorit pelanggan</p>
              <p className="mt-2 font-display text-xl font-bold">Mango Sunshine</p>
              <div className="mt-4 space-y-2 text-xs text-black/50"><p className="flex gap-2"><Check className="size-3.5 text-[#f15a16]" /> Rasa buah lebih dominan</p><p className="flex gap-2"><Check className="size-3.5 text-[#f15a16]" /> Pilihan ukuran tersedia</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-[11px] font-black uppercase tracking-[.2em] text-[#f15a16]">Pilihan utama</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-.035em]">Menu favorit pelanggan</h2></div>
          <Link href="/menu" className="text-sm font-bold hover:text-[#f15a16]">Lihat semua menu →</Link>
        </div>
        <CatalogGrid featuredOnly limit={3} />
      </section>

      <section id="about" className="border-y border-black/10 bg-[#f7f2ea] py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
            <div><p className="text-[11px] font-black uppercase tracking-[.2em] text-[#f15a16]">Tentang Nexty Juice</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-.035em]">Sederhana, segar, dan jelas harganya.</h2></div>
            <p className="max-w-2xl text-sm leading-7 text-black/50">Kami menyajikan katalog yang mudah dibaca dan proses pemesanan yang singkat. Setiap minuman diracik setelah pesanan diterima agar rasa dan kualitas tetap terjaga.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              [Citrus, "Buah pilihan", "Bahan dipilih untuk menjaga rasa yang konsisten di setiap pesanan."],
              [Droplets, "Dibuat segar", "Minuman diproses setelah pesanan diterima, bukan disimpan terlalu lama."],
              [Sparkles, "Varian fleksibel", "Ukuran dan varian harga ditampilkan jelas sebelum kamu memesan."]
            ].map(([Icon, title, text]) => {
              const C = Icon as typeof Citrus;
              return <article key={String(title)} className="rounded-2xl border border-black/10 bg-[#fffdf9] p-6"><span className="grid size-10 place-items-center rounded-lg bg-[#fff0e7] text-[#f15a16]"><C className="size-[18px]" /></span><h3 className="mt-5 font-display text-xl font-bold">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-black/50">{String(text)}</p></article>;
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
