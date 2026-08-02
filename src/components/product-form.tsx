"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { AdminGuidePanel } from "@/components/admin-guide-panel";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { FriendlyNumberInput } from "@/components/friendly-number-input";
import { getIngredients } from "@/lib/firestore/ingredients";
import { getProduct, isProductSlugTaken, saveProduct, type ProductInput } from "@/lib/firestore/products";
import { getHppSettings } from "@/lib/firestore/settings";
import { calculateEffectiveUnitCost, calculateVariantHpp, defaultHppSettings, formatRupiah, slugify } from "@/lib/hpp";
import { normalizeProduct, validateProduct } from "@/lib/validation";
import type { HppSettings, Ingredient, ProductVariant, RecipeItem } from "@/types";

function randomId(prefix: string) {
  return `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
}

function emptyVariant(index = 1): ProductVariant {
  return {
    id: `variant-${index}`,
    name: index === 1 ? "Regular" : `Varian ${index}`,
    sku: "",
    active: true,
    sellingPrice: 0,
    batchYield: 1,
    processLossPercent: 0,
    laborCostPerBatch: 0,
    utilityCostPerBatch: 0,
    otherVariableCostPerBatch: 0,
    recipe: []
  };
}

const emptyProduct: ProductInput = {
  name: "",
  slug: "",
  category: "Fresh Juice",
  description: "",
  imageUrl: "",
  imagePublicId: "",
  featured: false,
  active: true,
  sortOrder: 0,
  variants: [emptyVariant()]
};

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductInput>(emptyProduct);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [settings, setSettings] = useState<HppSettings>(defaultHppSettings);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [originalImagePublicId, setOriginalImagePublicId] = useState("");

  useEffect(() => {
    Promise.all([
      getIngredients(),
      getHppSettings(),
      productId ? getProduct(productId) : Promise.resolve(null)
    ]).then(([ingredientData, settingData, existing]) => {
      setIngredients(ingredientData);
      setSettings(settingData);
      if (existing) {
        setProduct({
          name: existing.name,
          slug: existing.slug,
          category: existing.category,
          description: existing.description,
          imageUrl: existing.imageUrl,
          imagePublicId: existing.imagePublicId ?? "",
          featured: existing.featured,
          active: existing.active,
          sortOrder: existing.sortOrder,
          variants: existing.variants
        });
        setOriginalImagePublicId(existing.imagePublicId ?? "");
      }
    }).catch((cause) => setMessage(cause instanceof Error ? cause.message : "Data produk belum berhasil dimuat. Coba muat ulang halaman."))
      .finally(() => setLoading(false));
  }, [productId]);

  const ingredientMap = useMemo(() => new Map(ingredients.map((item) => [item.id, item])), [ingredients]);

  function updateBase<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setProduct((current) => ({ ...current, [key]: value }));
  }

  function updateVariant(variantId: string, patch: Partial<ProductVariant>) {
    setProduct((current) => ({
      ...current,
      variants: current.variants.map((variant) => variant.id === variantId ? { ...variant, ...patch } : variant)
    }));
  }

  function addVariant() {
    setProduct((current) => ({
      ...current,
      variants: [...current.variants, { ...emptyVariant(current.variants.length + 1), id: randomId("variant") }]
    }));
  }

  function removeVariant(variantId: string) {
    setProduct((current) => ({ ...current, variants: current.variants.filter((variant) => variant.id !== variantId) }));
  }

  function addRecipeLine(variantId: string) {
    const firstIngredient = ingredients.find((item) => item.active) ?? ingredients[0];
    if (!firstIngredient) {
      setMessage("Tambahkan bahan atau kemasan terlebih dahulu sebelum membuat resep.");
      return;
    }
    const line: RecipeItem = { id: randomId("recipe"), ingredientId: firstIngredient.id, quantity: 0 };
    const variant = product.variants.find((item) => item.id === variantId);
    if (variant) updateVariant(variantId, { recipe: [...variant.recipe, line] });
  }

  function updateRecipeLine(variantId: string, lineId: string, patch: Partial<RecipeItem>) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (!variant) return;
    updateVariant(variantId, {
      recipe: variant.recipe.map((line) => line.id === lineId ? { ...line, ...patch } : line)
    });
  }

  function removeRecipeLine(variantId: string, lineId: string) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (!variant) return;
    updateVariant(variantId, { recipe: variant.recipe.filter((line) => line.id !== lineId) });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const cleanProduct = normalizeProduct(product);
    const errors = validateProduct(cleanProduct, ingredients, settings);
    if (errors.length) {
      setMessage(errors[0]);
      return;
    }

    setSaving(true);
    try {
      if (await isProductSlugTaken(cleanProduct.slug, productId)) {
        throw new Error("Alamat halaman produk ini sudah dipakai. Buka pengaturan teknis lalu gunakan alamat lain.");
      }
      await saveProduct(cleanProduct, productId);
      if (originalImagePublicId && originalImagePublicId !== cleanProduct.imagePublicId) {
        await fetch("/api/cloudinary/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: originalImagePublicId })
        }).catch(() => undefined);
      }
      router.push("/admin/produk");
      router.refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Produk belum berhasil disimpan. Periksa kembali data yang diisi lalu coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="admin-card p-8 text-black/60">Sedang memuat data produk...</p>;

  return (
    <form onSubmit={submit}>
      <button type="button" onClick={() => router.push("/admin/produk")} className="admin-button-secondary"><ArrowLeft className="size-4" /> Kembali ke daftar produk</button>
      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-[11px] font-black uppercase tracking-[.2em] text-[#f15a16]">Produk & resep</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-.03em] text-[#17130f]">{productId ? "Ubah produk" : "Tambah produk baru"}</h1></div>
        <button disabled={saving} className="inline-flex items-center justify-center gap-2 admin-button-primary"><Save className="size-4" /> {saving ? "Sedang menyimpan..." : "Simpan produk"}</button>
      </div>
      {message && <p className="mt-5 rounded-xl border border-[#f3c7a9] bg-[#fff4eb] p-4 text-sm font-bold leading-6 text-[#9a3b0d]">{message}</p>}

      <AdminGuidePanel
        className="mt-6"
        defaultOpen
        eyebrow="Langkah 3 dari 4"
        title="Isi produk, resep sekali produksi, lalu periksa modal satu gelas"
        description="Setiap ukuran produk dapat mempunyai resep, jumlah hasil, dan harga jual yang berbeda. Sistem menghitung modal secara otomatis dari data yang kamu masukkan."
        steps={[
          { title: "Isi informasi yang dilihat pengunjung", description: "Masukkan nama, kategori, deskripsi, gambar, dan tentukan apakah produk ditampilkan di katalog." },
          { title: "Buat pilihan ukuran", description: "Contoh: Regular dan Large. Isi harga jual serta jumlah gelas yang dihasilkan dari sekali membuat resep." },
          { title: "Masukkan bahan resep", description: "Pilih bahan dan kemasan, lalu isi jumlah yang dipakai dalam sekali produksi." },
          { title: "Masukkan biaya proses", description: "Isi upah, listrik, air, gas, atau biaya lain yang khusus keluar setiap kali produksi." },
          { title: "Periksa hasil", description: "Lihat modal satu gelas, saran harga jual, persentase keuntungan, dan hal yang perlu diperbaiki." }
        ]}
        note="Kolom tambahan bahan karena sisa atau tumpah hanya diisi jika jumlah resep belum memasukkan kehilangan tersebut. Jika jumlah resep sudah sesuai pemakaian nyata, isi 0%. Saat kolom angka bernilai 0 diklik, angka 0 otomatis hilang dan bisa langsung diganti."
      />

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="admin-card p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Bagian A</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-[#17130f]">Informasi yang tampil di katalog</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <TextField label="Nama produk" value={product.name} onChange={(value) => { updateBase("name", value); if (!productId) updateBase("slug", slugify(value)); }} />
            <TextField label="Kategori" value={product.category} onChange={(value) => updateBase("category", value)} />
            <NumberField label="Urutan di katalog" value={product.sortOrder} note="Angka kecil tampil lebih dahulu. Contoh: 1 sebelum 2." onChange={(value) => updateBase("sortOrder", value)} />
          </div>
          <label className="mt-4 grid gap-2 text-sm font-bold">Deskripsi untuk pengunjung<textarea required rows={4} value={product.description} onChange={(event) => updateBase("description", event.target.value)} placeholder="Contoh: Jus mangga segar dengan rasa manis alami." className="admin-field font-normal" /></label>
          <div className="mt-4 grid gap-3 rounded-xl border border-black/10 bg-[#fbf8f3] p-4 sm:grid-cols-2">
            <Checkbox label="Tampilkan produk di katalog" checked={product.active} onChange={(value) => updateBase("active", value)} />
            <Checkbox label="Tampilkan di bagian produk unggulan" checked={product.featured} onChange={(value) => updateBase("featured", value)} />
          </div>
          <details className="mt-4 rounded-xl border border-black/10 bg-white p-4">
            <summary className="cursor-pointer text-sm font-bold">Pengaturan teknis — biasanya tidak perlu diubah</summary>
            <div className="mt-4">
              <TextField label="Alamat halaman produk" value={product.slug} onChange={(value) => updateBase("slug", slugify(value))} />
              <p className="mt-2 text-sm leading-6 text-black/55">Sistem membuat alamat otomatis dari nama produk. Ubah hanya jika benar-benar diperlukan.</p>
            </div>
          </details>
        </div>

        <aside className="admin-card p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Foto produk</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-[#17130f]">Gambar yang dilihat pengunjung</h2>
          <div className="relative mt-5 aspect-square overflow-hidden rounded-2xl bg-black/5">
            {product.imageUrl ? <Image src={product.imageUrl} alt={product.name || "Gambar produk"} fill className="object-cover" /> : <div className="grid h-full place-items-center text-sm text-black/45">Belum ada gambar</div>}
          </div>
          <div className="mt-4"><CloudinaryUpload onUploaded={({ url, publicId }) => setProduct((current) => ({ ...current, imageUrl: url, imagePublicId: publicId }))} /></div>
          <details className="mt-4 rounded-xl border border-black/10 p-3">
            <summary className="cursor-pointer text-sm font-bold">Gunakan tautan gambar</summary>
            <label className="mt-3 grid gap-2 text-sm font-bold">Tautan gambar<input value={product.imageUrl} onChange={(event) => setProduct((current) => ({ ...current, imageUrl: event.target.value, imagePublicId: "" }))} placeholder="https://..." className="admin-field px-3 py-2 font-normal text-black" /></label>
          </details>
        </aside>
      </section>

      <section className="mt-6 space-y-6">
        {product.variants.map((variant, index) => {
          const hpp = calculateVariantHpp(variant, ingredients, settings);
          return (
            <article key={variant.id} className="admin-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-[#f15a16]">Pilihan produk {index + 1}</p><h2 className="mt-1 font-display text-2xl font-bold text-[#17130f]">{variant.name || "Belum diberi nama"}</h2></div>{product.variants.length > 1 && <button type="button" onClick={() => removeVariant(variant.id)} className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600"><Trash2 className="size-4" /> Hapus pilihan</button>}</div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <TextField label="Nama pilihan / ukuran" value={variant.name} onChange={(value) => updateVariant(variant.id, { name: value })} />
                <AutoSkuField label="Kode produk" value={variant.sku} />
                <NumberField label="Harga jual per gelas" value={variant.sellingPrice} prefix="Rp" note="Harga yang akan dilihat pengunjung." onChange={(value) => updateVariant(variant.id, { sellingPrice: value })} />
                <NumberField label="Jumlah gelas dari sekali produksi" value={variant.batchYield} min={1} suffix="gelas" note="Contoh: satu blender menghasilkan 4 gelas, maka isi 4." onChange={(value) => updateVariant(variant.id, { batchYield: value })} />
                <NumberField label="Tambahan bahan karena sisa/tumpah" value={variant.processLossPercent} max={99} step="0.01" suffix="%" note="Isi 0 jika jumlah resep sudah sesuai pemakaian nyata." onChange={(value) => updateVariant(variant.id, { processLossPercent: value })} />
                <NumberField label="Upah untuk sekali produksi" value={variant.laborCostPerBatch} prefix="Rp" note="Isi hanya upah yang bertambah setiap kali produk dibuat." onChange={(value) => updateVariant(variant.id, { laborCostPerBatch: value })} />
                <NumberField label="Listrik, air, atau gas sekali produksi" value={variant.utilityCostPerBatch} prefix="Rp" note="Perkiraan biaya yang dipakai saat satu kali membuat resep." onChange={(value) => updateVariant(variant.id, { utilityCostPerBatch: value })} />
                <NumberField label="Biaya lain untuk sekali produksi" value={variant.otherVariableCostPerBatch} prefix="Rp" note="Contoh: stiker khusus atau biaya lain yang belum masuk bahan dan kemasan." onChange={(value) => updateVariant(variant.id, { otherVariableCostPerBatch: value })} />
              </div>
              <div className="mt-4 rounded-xl border border-black/10 bg-[#fbf8f3] p-4"><Checkbox label="Tampilkan pilihan ini di katalog" checked={variant.active} onChange={(value) => updateVariant(variant.id, { active: value })} /></div>

              <div className="mt-7 overflow-hidden rounded-2xl border border-black/10">
                <div className="flex flex-col justify-between gap-4 border-b border-black/10 bg-black/[.02] px-5 py-4 sm:flex-row sm:items-center"><div><h3 className="font-black">Bahan untuk sekali produksi</h3><p className="mt-1 text-sm leading-6 text-black/60">Masukkan jumlah bahan dan kemasan yang dipakai untuk menghasilkan jumlah gelas di atas.</p></div><button type="button" onClick={() => addRecipeLine(variant.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#fff0e7] px-4 py-2 text-sm font-black text-[#d84909]"><Plus className="size-4" /> Tambah bahan</button></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-black/55"><tr><th className="px-5 py-3">Bahan / kemasan</th><th className="px-5 py-3">Jumlah dipakai</th><th className="px-5 py-3">Biaya per satuan</th><th className="px-5 py-3">Total biaya</th><th className="px-5 py-3" /></tr></thead><tbody>{variant.recipe.map((line) => { const ingredient = ingredientMap.get(line.ingredientId); const unitCost = ingredient ? calculateEffectiveUnitCost(ingredient) : 0; return <tr key={line.id} className="border-t border-black/5"><td className="px-5 py-3"><select value={line.ingredientId} onChange={(event) => updateRecipeLine(variant.id, line.id, { ingredientId: event.target.value })} className="w-full rounded-lg border border-black/10 px-3 py-2">{ingredients.map((item) => <option key={item.id} value={item.id}>{item.name}{item.active ? "" : " (disembunyikan)"} · {item.costType === "packaging" ? "kemasan" : "bahan"}</option>)}</select></td><td className="px-5 py-3"><div className="flex items-center rounded-lg border border-black/10 px-3"><FriendlyNumberInput value={line.quantity} min={0.0001} step="any" onChange={(quantity) => updateRecipeLine(variant.id, line.id, { quantity })} ariaLabel={`Jumlah ${ingredient?.name ?? "bahan"} yang dipakai`} className="min-w-0 flex-1 py-2 outline-none" /><span className="text-xs text-black/50">{ingredient?.unit}</span></div></td><td className="px-5 py-3">{formatRupiah(unitCost)}</td><td className="px-5 py-3 font-black">{formatRupiah(line.quantity * unitCost)}</td><td className="px-5 py-3 text-right"><button type="button" onClick={() => removeRecipeLine(variant.id, line.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Hapus bahan dari resep"><Trash2 className="size-4" /></button></td></tr>; })}{!variant.recipe.length && <tr><td colSpan={5} className="px-5 py-8 text-center text-black/50">Belum ada bahan. Klik “Tambah bahan” untuk mulai membuat resep.</td></tr>}</tbody></table></div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Hasil perhitungan otomatis</p>
                <h3 className="mt-1 font-display text-2xl font-bold">Modal dan saran harga</h3>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
                <Metric label="Bahan" value={formatRupiah(hpp.rawProductionMaterialCostPerBatch)} />
                <Metric label="Kemasan" value={formatRupiah(hpp.packagingCostPerBatch)} />
                <Metric label="Tambahan karena sisa/tumpah" value={formatRupiah(hpp.processLossCostPerBatch)} />
                <Metric label="Biaya produksi per gelas" value={formatRupiah(hpp.variableCostPerServing)} />
                <Metric label="Biaya bulanan per gelas" value={formatRupiah(hpp.fixedOverheadPerServing)} />
                <Metric label="Total modal per gelas (HPP)" value={formatRupiah(hpp.hppPerServing)} emphasis />
                <Metric label="Harga jual yang disarankan" value={formatRupiah(hpp.suggestedSellingPrice)} emphasis />
              </div>
              <p className={`mt-4 text-sm font-bold leading-6 ${hpp.currentMarginPercent >= settings.targetMarginPercent ? "text-emerald-700" : "text-amber-700"}`}>Perkiraan keuntungan dari harga jual sekarang: {hpp.currentMarginPercent.toFixed(1)}% · Selisih harga jual dan modal: {formatRupiah(hpp.currentProfitPerServing)} per gelas.</p>
              {hpp.auditIssues.length > 0 && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <div><p className="font-black">Hal yang perlu diperbaiki</p><p className="mt-1 text-sm leading-6">{hpp.auditIssues.join(" ")}</p></div>
                </div>
              )}
            </article>
          );
        })}
        <button type="button" onClick={addVariant} className="inline-flex items-center gap-2 admin-button-secondary border-dashed border-[#f15a16]/40 text-[#d84909]"><Plus className="size-4" /> Tambah pilihan ukuran</button>
      </section>
    </form>
  );
}

function TextField({ label, value, onChange, required = true }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="grid gap-2 text-sm font-bold">{label}<input required={required} value={value} onFocus={(event) => event.currentTarget.select()} onChange={(event) => onChange(event.target.value)} className="admin-field font-normal" /></label>;
}
function AutoSkuField({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold">{label}
      <div className="admin-field flex min-h-12 items-center bg-black/[.025] font-mono text-sm font-bold text-black/60">
        {value || "Dibuat otomatis setelah disimpan"}
      </div>
      <span className="text-xs font-normal leading-5 text-black/50">Tidak perlu diisi. Kode dipakai sistem untuk membedakan setiap pilihan produk.</span>
    </label>
  );
}
function NumberField({ label, value, onChange, min = 0, max, step = "1", prefix, suffix, note }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: string; prefix?: string; suffix?: string; note?: string }) {
  return (
    <label className="grid content-start gap-2 text-sm font-bold">
      {label}
      <div className="admin-field flex items-center px-3 py-0">
        <span className="text-black/45">{prefix}</span>
        <FriendlyNumberInput required value={value} min={min} max={max} step={step} onChange={onChange} ariaLabel={label} className="min-w-0 flex-1 px-2 py-3 font-normal outline-none" />
        <span className="text-black/45">{suffix}</span>
      </div>
      {note && <span className="text-xs font-normal leading-5 text-black/50">{note}</span>}
    </label>
  );
}
function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="inline-flex items-center gap-3 text-sm font-bold"><input className="size-4 accent-[#f15a16]" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /> {label}</label>;
}
function Metric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div className={`rounded-2xl p-4 ${emphasis ? "bg-[#17130f] text-white" : "bg-[#fbf8f3]"}`}><p className={`text-sm font-bold leading-5 ${emphasis ? "text-white/70" : "text-black/55"}`}>{label}</p><p className="mt-2 text-lg font-black">{value}</p></div>;
}
