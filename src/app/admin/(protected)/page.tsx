"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpenCheck,
  CheckCircle2,
  Boxes,
  CircleDollarSign,
  GlassWater,
  PackageCheck,
  TrendingUp
} from "lucide-react";
import { calculateVariantHpp, defaultHppSettings, formatRupiah } from "@/lib/hpp";
import { getIngredients } from "@/lib/firestore/ingredients";
import { getProducts } from "@/lib/firestore/products";
import { getHppSettings } from "@/lib/firestore/settings";
import type { HppSettings, Ingredient, Product } from "@/types";

export default function AdminDashboardPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<HppSettings>(defaultHppSettings);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getIngredients(), getProducts(), getHppSettings()])
      .then(([ingredientData, productData, settingData]) => {
        setIngredients(ingredientData);
        setProducts(productData);
        setSettings(settingData);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Data dashboard gagal dimuat."))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => products.flatMap((product) =>
    product.variants.map((variant) => ({
      product,
      variant,
      hpp: calculateVariantHpp(variant, ingredients, settings)
    }))
  ), [products, ingredients, settings]);

  const activeRows = rows.filter(({ product, variant }) => product.active && variant.active);
  const pricedRows = activeRows.filter(({ variant }) => variant.sellingPrice > 0);
  const averageMargin = pricedRows.length
    ? pricedRows.reduce((sum, row) => sum + row.hpp.currentMarginPercent, 0) / pricedRows.length
    : 0;
  const averageHpp = activeRows.length
    ? activeRows.reduce((sum, row) => sum + row.hpp.hppPerServing, 0) / activeRows.length
    : 0;
  const attentionRows = activeRows
    .filter((row) => !row.hpp.isValid || row.hpp.currentMarginPercent < settings.targetMarginPercent)
    .sort((a, b) => a.hpp.currentMarginPercent - b.hpp.currentMarginPercent);

  const average = (selector: (row: (typeof activeRows)[number]) => number) => activeRows.length
    ? activeRows.reduce((sum, row) => sum + selector(row), 0) / activeRows.length
    : 0;

  const costComposition = [
    {
      label: "Bahan produksi",
      value: average((row) => (row.hpp.rawProductionMaterialCostPerBatch + row.hpp.processLossCostPerBatch) / Math.max(1, row.variant.batchYield))
    },
    {
      label: "Kemasan",
      value: average((row) => row.hpp.packagingCostPerBatch / Math.max(1, row.variant.batchYield))
    },
    {
      label: "Operasional variabel",
      value: average((row) => (row.hpp.laborCostPerBatch + row.hpp.utilityCostPerBatch + row.hpp.otherVariableCostPerBatch) / Math.max(1, row.variant.batchYield))
    },
    { label: "Overhead tetap", value: average((row) => row.hpp.fixedOverheadPerServing) }
  ];
  const maxComposition = Math.max(1, ...costComposition.map((item) => item.value));

  const cards = [
    { icon: GlassWater, label: "Produk aktif", value: String(products.filter((product) => product.active).length), note: `${activeRows.length} varian aktif` },
    { icon: Boxes, label: "Bahan aktif", value: String(ingredients.filter((ingredient) => ingredient.active).length), note: `${ingredients.length} total master` },
    { icon: CircleDollarSign, label: "Rata-rata HPP", value: formatRupiah(averageHpp), note: "per varian aktif" },
    { icon: TrendingUp, label: "Rata-rata margin", value: `${averageMargin.toFixed(1)}%`, note: `target ${settings.targetMarginPercent}%` }
  ];

  return (
    <section>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#f15a16]">Dashboard / Ringkasan</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-.03em] text-[#17130f]">Ringkasan bisnis</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/50">Angka di bawah dihitung dari harga bahan terbaru, resep bersih per batch, susut proses, serta alokasi overhead.</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-black/35">Status perhitungan</p>
          <p className="mt-1 flex items-center gap-2 font-bold"><PackageCheck className="size-4 text-[#f15a16]" /> {loading ? "Memuat data..." : `${activeRows.length} varian diaudit`}</p>
        </div>
      </div>

      {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}

      <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-[#efc7aa] bg-[#fff8f1] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f15a16] text-white"><BookOpenCheck className="size-5" /></span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#d84909]">Panduan cepat</p>
            <h2 className="mt-1 font-display text-2xl font-bold">Urutan setup HPP yang benar</h2>
            <p className="mt-2 text-sm leading-6 text-black/50">Mulai dari bahan, lanjut biaya tetap, lalu susun resep per batch. Jangan mengisi produk sebelum master bahan siap.</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-black/55">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-[#f15a16]" /> Bahan & kemasan</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-[#f15a16]" /> Overhead & margin</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-[#f15a16]" /> Produk & resep</span>
            </div>
          </div>
        </div>
        <Link href="/admin/panduan" className="admin-button-primary shrink-0">Buka panduan lengkap <ArrowUpRight className="size-4" /></Link>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ icon: Icon, label, value, note }) => (
          <article key={label} className="admin-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-black/40">{label}</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[#17130f]">{value}</p>
                <p className="mt-1 text-[11px] text-black/35">{note}</p>
              </div>
              <span className="grid size-9 place-items-center rounded-lg bg-[#fff0e7] text-[#f15a16]"><Icon className="size-[18px]" /></span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_.85fr]">
        <article className="admin-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Komposisi biaya</p>
              <h2 className="mt-1 font-display text-2xl font-bold">Rata-rata biaya per porsi</h2>
            </div>
            <span className="rounded-lg bg-[#f7f2ea] px-3 py-2 text-xs font-bold text-black/45">Varian aktif</span>
          </div>

          <div className="mt-7 space-y-5">
            {costComposition.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                  <span className="font-semibold text-black/60">{item.label}</span>
                  <span className="font-black">{formatRupiah(item.value)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#eee6dc]">
                  <div className="h-full rounded-full bg-[#f15a16]" style={{ width: `${Math.max(2, (item.value / maxComposition) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[#17130f] p-4 text-white">
              <p className="text-xs text-white/50">HPP rata-rata</p>
              <p className="mt-1 text-xl font-black">{formatRupiah(averageHpp)}</p>
            </div>
            <div className="rounded-xl bg-[#fff0e7] p-4">
              <p className="text-xs text-black/40">Margin rata-rata</p>
              <p className="mt-1 text-xl font-black text-[#d84909]">{averageMargin.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-white p-4">
              <p className="text-xs text-black/40">Perlu ditinjau</p>
              <p className="mt-1 text-xl font-black">{attentionRows.length} varian</p>
            </div>
          </div>
        </article>

        <aside className="admin-card overflow-hidden">
          <div className="border-b border-black/10 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Audit cepat</p>
                <h2 className="mt-1 font-display text-2xl font-bold">Butuh perhatian</h2>
              </div>
              <AlertTriangle className="size-5 text-[#f15a16]" />
            </div>
          </div>
          <div className="divide-y divide-black/10">
            {attentionRows.slice(0, 6).map(({ product, variant, hpp }) => (
              <div key={`${product.id}-${variant.id}`} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{product.name}</p>
                  <p className="mt-0.5 truncate text-xs text-black/40">{variant.name} · {hpp.auditIssues[0] || `Margin di bawah ${settings.targetMarginPercent}%`}</p>
                </div>
                <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black ${hpp.currentMarginPercent < 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                  {hpp.currentMarginPercent.toFixed(1)}%
                </span>
              </div>
            ))}
            {!attentionRows.length && (
              <div className="p-7 text-center">
                <PackageCheck className="mx-auto size-7 text-emerald-600" />
                <p className="mt-3 text-sm font-bold">Semua varian aktif sehat.</p>
                <p className="mt-1 text-xs text-black/40">Tidak ada masalah formula atau margin.</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="admin-card mt-5 overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-black/10 p-5 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Produk / varian</p>
            <h2 className="mt-1 font-display text-2xl font-bold">Performa harga</h2>
          </div>
          <a href="/admin/produk" className="admin-button-secondary">Kelola produk <ArrowUpRight className="size-4" /></a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#fbf8f3] text-[11px] uppercase tracking-[.08em] text-black/40">
              <tr><th className="px-6 py-3.5">Produk / varian</th><th className="px-6 py-3.5">Harga jual</th><th className="px-6 py-3.5">HPP penuh</th><th className="px-6 py-3.5">Saran harga</th><th className="px-6 py-3.5">Margin</th><th className="px-6 py-3.5">Status</th></tr>
            </thead>
            <tbody>
              {activeRows.map(({ product, variant, hpp }) => {
                const healthy = hpp.isValid && hpp.currentMarginPercent >= settings.targetMarginPercent;
                return (
                  <tr key={`${product.id}-${variant.id}`} className="border-t border-black/10 hover:bg-[#fffaf5]">
                    <td className="px-6 py-4"><p className="font-bold">{product.name}</p><p className="mt-0.5 text-xs text-black/40">{variant.name}</p></td>
                    <td className="px-6 py-4">{formatRupiah(variant.sellingPrice)}</td>
                    <td className="px-6 py-4 font-bold">{formatRupiah(hpp.hppPerServing)}</td>
                    <td className="px-6 py-4">{formatRupiah(hpp.suggestedSellingPrice)}</td>
                    <td className="px-6 py-4 font-black">{hpp.currentMarginPercent.toFixed(1)}%</td>
                    <td className="px-6 py-4"><span className={`rounded-lg px-2.5 py-1 text-xs font-black ${healthy ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{healthy ? "Sehat" : "Tinjau"}</span></td>
                  </tr>
                );
              })}
              {!activeRows.length && <tr><td colSpan={6} className="px-6 py-12 text-center text-black/40">Belum ada produk dan varian aktif.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
