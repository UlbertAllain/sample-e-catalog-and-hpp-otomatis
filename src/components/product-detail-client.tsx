"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { getCatalogProductBySlug } from "@/lib/firestore/products";
import { formatRupiah } from "@/lib/hpp";
import { mockCatalogProducts } from "@/lib/mock-data";
import type { CatalogProduct } from "@/types";

export function ProductDetailClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<CatalogProduct | null>(() => isFirebaseConfigured ? null : mockCatalogProducts.find((item) => item.slug === slug) ?? null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [selectedVariantId, setSelectedVariantId] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    getCatalogProductBySlug(slug).then(setProduct).catch(() => setProduct(null)).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const first = product?.variants.find((variant) => variant.active);
    if (first) setSelectedVariantId(first.id);
  }, [product]);

  if (loading) return <main className="min-h-screen bg-[#fffdf9]"><SiteHeader /><div className="mx-auto max-w-7xl px-5 py-20 text-black/40">Memuat produk...</div></main>;
  if (!product) return <main className="min-h-screen bg-[#fffdf9]"><SiteHeader /><div className="mx-auto max-w-7xl px-5 py-20"><h1 className="font-display text-4xl font-bold">Produk tidak ditemukan</h1><Link href="/menu" className="mt-5 inline-flex items-center gap-2 font-bold"><ArrowLeft className="size-4" /> Kembali ke katalog</Link></div></main>;

  const variants = product.variants.filter((variant) => variant.active);
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281234567890";
  const message = encodeURIComponent(`Halo, saya ingin memesan ${product.name}${selectedVariant ? ` ukuran ${selectedVariant.name}` : ""}.`);

  return (
    <main className="min-h-screen bg-[#fffdf9]">
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1fr_.9fr] lg:px-8 lg:py-16">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-black/10 bg-[#f1e8dc] shadow-[0_22px_60px_rgba(73,43,24,.1)]"><Image src={product.imageUrl} alt={product.name} fill className="object-cover" /></div>
        <div className="flex flex-col justify-center">
          <Link href="/menu" className="mb-7 inline-flex w-fit items-center gap-2 text-sm font-bold text-black/50 hover:text-[#f15a16]"><ArrowLeft className="size-4" /> Kembali ke katalog</Link>
          <span className="w-fit rounded-lg bg-[#fff0e7] px-3 py-2 text-[11px] font-black uppercase tracking-[.1em] text-[#d84909]">{product.category}</span>
          <h1 className="mt-5 font-display text-5xl font-bold tracking-[-.045em]">{product.name}</h1>
          <p className="mt-5 text-base leading-7 text-black/50">{product.description}</p>
          <div className="mt-7 space-y-2 text-sm text-black/50"><p className="flex items-center gap-2"><Check className="size-4 text-[#f15a16]" /> Dibuat setelah pesanan diterima</p><p className="flex items-center gap-2"><Check className="size-4 text-[#f15a16]" /> Harga sesuai varian yang dipilih</p></div>

          <div className="mt-8 grid gap-3">
            {variants.map((variant) => (
              <button key={variant.id} onClick={() => setSelectedVariantId(variant.id)} className={`flex items-center justify-between rounded-xl border p-4 text-left ${selectedVariant?.id === variant.id ? "border-[#f15a16] bg-[#fff4eb]" : "border-black/10 bg-white hover:border-black/20"}`}>
                <div><p className="text-xs text-black/40">Varian</p><p className="mt-1 font-bold">{variant.name}</p></div>
                <p className="text-xl font-black text-[#d84909]">{formatRupiah(variant.sellingPrice)}</p>
              </button>
            ))}
          </div>

          {selectedVariant ? (
            <a href={`https://wa.me/${whatsappNumber}?text=${message}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#17130f] px-6 py-4 font-black text-white hover:bg-[#f15a16]"><MessageCircle className="size-5" /> Pesan via WhatsApp</a>
          ) : (
            <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">Belum ada varian aktif untuk produk ini.</p>
          )}
        </div>
      </section>
    </main>
  );
}
