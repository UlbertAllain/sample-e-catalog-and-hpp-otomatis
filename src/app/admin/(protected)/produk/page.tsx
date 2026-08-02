"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { calculateVariantHpp, defaultHppSettings, formatRupiah } from "@/lib/hpp";
import { getIngredients } from "@/lib/firestore/ingredients";
import { deleteProduct, getProducts } from "@/lib/firestore/products";
import { getHppSettings } from "@/lib/firestore/settings";
import type { HppSettings, Ingredient, Product } from "@/types";

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [settings, setSettings] = useState<HppSettings>(defaultHppSettings);
  const [message, setMessage] = useState("");

  async function load() {
    const [productData, ingredientData, settingData] = await Promise.all([getProducts(), getIngredients(), getHppSettings()]);
    setProducts(productData);
    setIngredients(ingredientData);
    setSettings(settingData);
  }

  useEffect(() => {
    load().catch((cause) => setMessage(cause instanceof Error ? cause.message : "Produk gagal dimuat."));
  }, []);

  const rows = useMemo(() => products.map((product) => {
    const activeVariants = product.variants.filter((variant) => variant.active);
    const displayVariant = activeVariants[0] ?? product.variants[0];
    const minPrice = activeVariants.length
      ? Math.min(...activeVariants.map((variant) => variant.sellingPrice))
      : product.variants.length
        ? Math.min(...product.variants.map((variant) => variant.sellingPrice))
        : 0;
    return {
      product,
      displayVariant,
      minPrice,
      hpp: displayVariant ? calculateVariantHpp(displayVariant, ingredients, settings) : null
    };
  }), [products, ingredients, settings]);

  async function remove(product: Product) {
    if (!window.confirm(`Hapus produk ${product.name} beserta data katalog publiknya?`)) return;
    setMessage("");
    try {
      // Data Firestore dihapus lebih dahulu. Gambar hanya dibersihkan setelah commit
      // berhasil agar produk tidak tertinggal dengan URL gambar yang sudah rusak.
      await deleteProduct(product.id);
      if (product.imagePublicId) {
        await fetch("/api/cloudinary/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: product.imagePublicId })
        }).catch(() => undefined);
      }
      await load();
      setMessage("Produk berhasil dihapus.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Produk gagal dihapus.");
    }
  }

  return (
    <section>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#f15a16]">Master data / Produk</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-.03em]">Produk dan resep</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-black/50">Data resep dan HPP tetap privat. Saat disimpan, sistem hanya menyalin informasi aman ke katalog publik.</p>
        </div>
        <Link href="/admin/produk/tambah" className="admin-button-primary"><Plus className="size-4" /> Tambah produk</Link>
      </div>

      {message && <p className="mt-5 rounded-xl border border-[#f3c7a9] bg-[#fff4eb] p-4 text-sm font-bold text-[#9a3b0d]">{message}</p>}

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="admin-card p-5"><p className="text-xs font-bold text-black/40">Total produk</p><p className="mt-2 text-2xl font-black">{products.length}</p></div>
        <div className="admin-card p-5"><p className="text-xs font-bold text-black/40">Produk publik</p><p className="mt-2 text-2xl font-black">{products.filter((item) => item.active).length}</p></div>
        <div className="admin-card p-5"><p className="text-xs font-bold text-black/40">Total varian</p><p className="mt-2 text-2xl font-black">{products.reduce((sum, item) => sum + item.variants.length, 0)}</p></div>
      </div>

      <div className="admin-card mt-5 overflow-hidden">
        <div className="border-b border-black/10 p-5 sm:px-6">
          <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Produk tersimpan</p>
          <h2 className="mt-1 font-display text-2xl font-bold">Daftar produk</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[#fbf8f3] text-[11px] uppercase tracking-[.08em] text-black/40">
              <tr><th className="px-6 py-3.5">Produk</th><th className="px-6 py-3.5">Kategori</th><th className="px-6 py-3.5">Varian</th><th className="px-6 py-3.5">Harga mulai</th><th className="px-6 py-3.5">HPP acuan</th><th className="px-6 py-3.5">Margin acuan</th><th className="px-6 py-3.5">Status</th><th className="px-6 py-3.5" /></tr>
            </thead>
            <tbody>
              {rows.map(({ product, displayVariant, minPrice, hpp }) => (
                <tr key={product.id} className="border-t border-black/10 hover:bg-[#fffaf5]">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="relative size-12 overflow-hidden rounded-xl bg-black/5">{product.imageUrl && <Image src={product.imageUrl} alt="" fill className="object-cover" />}</div><div><p className="font-bold">{product.name}</p><p className="mt-0.5 text-xs text-black/40">/{product.slug}</p></div></div></td>
                  <td className="px-6 py-4">{product.category}</td>
                  <td className="px-6 py-4">{product.variants.length}</td>
                  <td className="px-6 py-4 font-black">{displayVariant ? formatRupiah(minPrice) : "-"}</td>
                  <td className="px-6 py-4">{hpp ? formatRupiah(hpp.hppPerServing) : "-"}</td>
                  <td className="px-6 py-4 font-black">{hpp ? `${hpp.currentMarginPercent.toFixed(1)}%` : "-"}</td>
                  <td className="px-6 py-4"><span className={`rounded-lg px-2.5 py-1 text-xs font-black ${product.active ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/45"}`}>{product.active ? "Publik" : "Draft"}</span></td>
                  <td className="px-6 py-4"><div className="flex justify-end gap-1"><Link href={`/admin/produk/${product.id}/edit`} className="rounded-lg p-2 hover:bg-black/5" aria-label={`Edit ${product.name}`}><Pencil className="size-4" /></Link><button onClick={() => remove(product)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label={`Hapus ${product.name}`}><Trash2 className="size-4" /></button></div></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={8} className="px-6 py-12 text-center text-black/40">Belum ada produk.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
