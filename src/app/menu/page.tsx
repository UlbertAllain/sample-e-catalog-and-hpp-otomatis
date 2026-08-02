import { CatalogGrid } from "@/components/catalog-grid";
import { SiteHeader } from "@/components/site-header";

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-[#fffdf9]">
      <SiteHeader />
      <section className="border-b border-black/10 bg-[#f7f2ea]">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
          <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#f15a16]">E-Catalog</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold tracking-[-.045em]">Pilih minuman favoritmu.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-black/50">Harga dan varian ditampilkan langsung. Buka produk untuk memilih ukuran lalu teruskan pesanan melalui WhatsApp.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><CatalogGrid /></section>
    </main>
  );
}
