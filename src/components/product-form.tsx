"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Plus,
  Save,
  Trash2
} from "lucide-react";
import { AdminGuidePanel } from "@/components/admin-guide-panel";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { FriendlyNumberInput } from "@/components/friendly-number-input";
import { getIngredients } from "@/lib/firestore/ingredients";
import {
  getProduct,
  isProductSlugTaken,
  saveProduct,
  type ProductInput
} from "@/lib/firestore/products";
import { getHppSettings } from "@/lib/firestore/settings";
import {
  calculateEffectiveUnitCost,
  calculateVariantHpp,
  defaultHppSettings,
  formatRupiah,
  slugify
} from "@/lib/hpp";
import { normalizeProduct, validateProduct } from "@/lib/validation";
import type { HppBreakdown, HppSettings, Ingredient, ProductVariant, RecipeItem } from "@/types";

function randomId(prefix: string) {
  return `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)}`;
}

function emptyVariant(index = 1): ProductVariant {
  return {
    id: `variant-${index}`,
    name: index === 1 ? "Regular" : `Pilihan ${index}`,
    sku: "",
    active: false,
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
  active: false,
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
    ])
      .then(([ingredientData, settingData, existing]) => {
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
      })
      .catch((cause) =>
        setMessage(
          cause instanceof Error
            ? cause.message
            : "Data produk belum berhasil dimuat. Coba muat ulang halaman."
        )
      )
      .finally(() => setLoading(false));
  }, [productId]);

  const ingredientMap = useMemo(
    () => new Map(ingredients.map((item) => [item.id, item])),
    [ingredients]
  );

  function updateBase<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setProduct((current) => ({ ...current, [key]: value }));
  }

  function updateVariant(variantId: string, patch: Partial<ProductVariant>) {
    setProduct((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === variantId ? { ...variant, ...patch } : variant
      )
    }));
  }

  function addVariant() {
    setProduct((current) => ({
      ...current,
      variants: [
        ...current.variants,
        { ...emptyVariant(current.variants.length + 1), id: randomId("variant") }
      ]
    }));
  }

  function removeVariant(variantId: string) {
    setProduct((current) => ({
      ...current,
      variants: current.variants.filter((variant) => variant.id !== variantId)
    }));
  }

  function addRecipeLine(variantId: string) {
    const firstIngredient = ingredients.find((item) => item.active) ?? ingredients[0];
    if (!firstIngredient) {
      setMessage("Tambahkan bahan atau kemasan terlebih dahulu sebelum membuat resep.");
      return;
    }

    const line: RecipeItem = {
      id: randomId("recipe"),
      ingredientId: firstIngredient.id,
      quantity: 0
    };
    const variant = product.variants.find((item) => item.id === variantId);
    if (variant) updateVariant(variantId, { recipe: [...variant.recipe, line] });
  }

  function updateRecipeLine(
    variantId: string,
    lineId: string,
    patch: Partial<RecipeItem>
  ) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (!variant) return;
    updateVariant(variantId, {
      recipe: variant.recipe.map((line) =>
        line.id === lineId ? { ...line, ...patch } : line
      )
    });
  }

  function removeRecipeLine(variantId: string, lineId: string) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (!variant) return;
    updateVariant(variantId, {
      recipe: variant.recipe.filter((line) => line.id !== lineId)
    });
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
        throw new Error(
          "Alamat halaman produk ini sudah dipakai. Buka pengaturan teknis lalu gunakan alamat lain."
        );
      }
      await saveProduct(cleanProduct, productId);
      if (
        originalImagePublicId &&
        originalImagePublicId !== cleanProduct.imagePublicId
      ) {
        await fetch("/api/cloudinary/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: originalImagePublicId })
        }).catch(() => undefined);
      }
      router.push("/admin/produk");
      router.refresh();
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Produk belum berhasil disimpan. Periksa kembali data yang diisi lalu coba lagi."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="admin-card p-8 text-black/60">Sedang memuat data produk...</p>;
  }

  return (
    <form onSubmit={submit}>
      <button
        type="button"
        onClick={() => router.push("/admin/produk")}
        className="admin-button-secondary"
      >
        <ArrowLeft className="size-4" /> Kembali ke daftar produk
      </button>

      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#f15a16]">
            Produk & resep
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-.03em] text-[#17130f]">
            {productId ? "Ubah produk" : "Tambah produk baru"}
          </h1>
        </div>
        <button disabled={saving} className="admin-button-primary">
          <Save className="size-4" />
          {saving ? "Sedang menyimpan..." : "Simpan produk"}
        </button>
      </div>

      {message && (
        <p className="mt-5 rounded-xl border border-[#f3c7a9] bg-[#fff4eb] p-4 text-sm font-bold leading-6 text-[#9a3b0d]">
          {message}
        </p>
      )}

      <AdminGuidePanel
        className="mt-6"
        defaultOpen
        eyebrow="Langkah 3 dari 4"
        title="Masukkan resep dahulu, tentukan harga jual paling akhir"
        description="Sistem menghitung modal dari bahan, kemasan, biaya produksi, dan biaya bulanan. Setelah total modal per gelas muncul, barulah pilih harga jual."
        steps={[
          {
            title: "Isi informasi katalog",
            description:
              "Masukkan nama, kategori, deskripsi, gambar, dan urutan tampil produk."
          },
          {
            title: "Tentukan hasil sekali produksi",
            description:
              "Contoh: satu blender menghasilkan 4 gelas, maka isi 4."
          },
          {
            title: "Masukkan seluruh bahan dan kemasan",
            description:
              "Pilih bahan resep dan isi jumlah yang benar-benar dipakai sekali produksi."
          },
          {
            title: "Tambahkan biaya proses",
            description:
              "Isi upah, listrik, air, gas, dan biaya lain yang keluar saat resep dibuat."
          },
          {
            title: "Periksa HPP lalu tentukan harga jual",
            description:
              "Gunakan saran harga sistem atau masukkan harga sendiri setelah modal satu gelas diketahui."
          }
        ]}
        note="Produk baru disimpan sebagai tersembunyi. Aktifkan katalog dan pilihan produk hanya setelah resep, HPP, serta harga jual sudah diperiksa."
      />

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="admin-card p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">
            Bagian A
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-[#17130f]">
            Informasi yang tampil di katalog
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nama produk"
              value={product.name}
              onChange={(value) => {
                updateBase("name", value);
                if (!productId) updateBase("slug", slugify(value));
              }}
            />
            <TextField
              label="Kategori"
              value={product.category}
              onChange={(value) => updateBase("category", value)}
            />
            <NumberField
              label="Urutan di katalog"
              value={product.sortOrder}
              note="Angka kecil tampil lebih dahulu. Contoh: 1 sebelum 2."
              onChange={(value) => updateBase("sortOrder", value)}
            />
          </div>

          <label className="mt-4 grid gap-2 text-sm font-bold">
            Deskripsi untuk pengunjung
            <textarea
              required
              rows={4}
              value={product.description}
              onChange={(event) => updateBase("description", event.target.value)}
              placeholder="Contoh: Jus mangga segar dengan rasa manis alami."
              className="admin-field font-normal"
            />
          </label>

          <details className="mt-4 rounded-xl border border-black/10 bg-white p-4">
            <summary className="cursor-pointer text-sm font-bold">
              Pengaturan teknis — biasanya tidak perlu diubah
            </summary>
            <div className="mt-4">
              <TextField
                label="Alamat halaman produk"
                value={product.slug}
                onChange={(value) => updateBase("slug", slugify(value))}
              />
              <p className="mt-2 text-sm leading-6 text-black/55">
                Sistem membuat alamat otomatis dari nama produk. Ubah hanya jika benar-benar diperlukan.
              </p>
            </div>
          </details>
        </div>

        <aside className="admin-card p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">
            Foto produk
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-[#17130f]">
            Gambar yang dilihat pengunjung
          </h2>
          <div className="relative mt-5 aspect-square overflow-hidden rounded-2xl bg-black/5">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name || "Gambar produk"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-black/45">
                Belum ada gambar
              </div>
            )}
          </div>
          <div className="mt-4">
            <CloudinaryUpload
              onUploaded={({ url, publicId }) =>
                setProduct((current) => ({
                  ...current,
                  imageUrl: url,
                  imagePublicId: publicId
                }))
              }
            />
          </div>
          <details className="mt-4 rounded-xl border border-black/10 p-3">
            <summary className="cursor-pointer text-sm font-bold">
              Gunakan tautan gambar
            </summary>
            <label className="mt-3 grid gap-2 text-sm font-bold">
              Tautan gambar
              <input
                value={product.imageUrl}
                onChange={(event) =>
                  setProduct((current) => ({
                    ...current,
                    imageUrl: event.target.value,
                    imagePublicId: ""
                  }))
                }
                placeholder="https://..."
                className="admin-field px-3 py-2 font-normal text-black"
              />
            </label>
          </details>
        </aside>
      </section>

      <section className="mt-6 space-y-6">
        {product.variants.map((variant, index) => {
          const hpp = calculateVariantHpp(variant, ingredients, settings);
          const hppReady =
            variant.recipe.length > 0 &&
            variant.batchYield > 0 &&
            hpp.hppPerServing > 0 &&
            hpp.missingIngredientIds.length === 0 &&
            hpp.invalidIngredientIds.length === 0;

          return (
            <article key={variant.id} className="admin-card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[.07] p-5 sm:p-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#f15a16]">
                    Pilihan produk {index + 1}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-[#17130f]">
                    {variant.name || "Belum diberi nama"}
                  </h2>
                </div>
                {product.variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(variant.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600"
                  >
                    <Trash2 className="size-4" /> Hapus pilihan
                  </button>
                )}
              </div>

              <div className="p-5 sm:p-6">
                <SectionHeading
                  step="1"
                  title="Tentukan pilihan dan hasil produksi"
                  description="Belum perlu menentukan harga jual. Cukup isi nama pilihan dan jumlah gelas yang dihasilkan."
                />
                <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-3">
                  <FieldCard>
                    <TextField
                      label="Nama pilihan / ukuran"
                      value={variant.name}
                      note="Contoh: Regular, Large, atau Botol 250 ml."
                      onChange={(value) => updateVariant(variant.id, { name: value })}
                    />
                  </FieldCard>
                  <FieldCard>
                    <AutoSkuField label="Kode produk" value={variant.sku} />
                  </FieldCard>
                  <FieldCard>
                    <NumberField
                      label="Jumlah gelas dari sekali produksi"
                      value={variant.batchYield}
                      min={1}
                      suffix="gelas"
                      note="Contoh: satu blender menghasilkan 4 gelas, maka isi 4."
                      onChange={(value) =>
                        updateVariant(variant.id, { batchYield: value })
                      }
                    />
                  </FieldCard>
                </div>

                <div className="mt-8">
                  <SectionHeading
                    step="2"
                    title="Masukkan bahan dan kemasan"
                    description="Isi seluruh kebutuhan untuk sekali produksi. Total biaya akan dihitung otomatis dari harga bahan di master bahan."
                    action={
                      <button
                        type="button"
                        onClick={() => addRecipeLine(variant.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#fff0e7] px-4 py-2 text-sm font-black text-[#d84909]"
                      >
                        <Plus className="size-4" /> Tambah bahan
                      </button>
                    }
                  />

                  <div className="mt-4 overflow-hidden rounded-2xl border border-black/10">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-black/[.025] text-black/55">
                          <tr>
                            <th className="px-5 py-3">Bahan / kemasan</th>
                            <th className="px-5 py-3">Jumlah dipakai</th>
                            <th className="px-5 py-3">Biaya per satuan</th>
                            <th className="px-5 py-3">Total biaya</th>
                            <th className="px-5 py-3" />
                          </tr>
                        </thead>
                        <tbody>
                          {variant.recipe.map((line) => {
                            const ingredient = ingredientMap.get(line.ingredientId);
                            const unitCost = ingredient
                              ? calculateEffectiveUnitCost(ingredient)
                              : 0;
                            return (
                              <tr key={line.id} className="border-t border-black/5">
                                <td className="px-5 py-3">
                                  <select
                                    value={line.ingredientId}
                                    onChange={(event) =>
                                      updateRecipeLine(variant.id, line.id, {
                                        ingredientId: event.target.value
                                      })
                                    }
                                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2"
                                  >
                                    {ingredients.map((item) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}
                                        {item.active ? "" : " (disembunyikan)"} ·{" "}
                                        {item.costType === "packaging"
                                          ? "kemasan"
                                          : "bahan"}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-5 py-3">
                                  <div className="flex items-center rounded-lg border border-black/10 bg-white px-3">
                                    <FriendlyNumberInput
                                      value={line.quantity}
                                      min={0.0001}
                                      step="any"
                                      onChange={(quantity) =>
                                        updateRecipeLine(variant.id, line.id, {
                                          quantity
                                        })
                                      }
                                      ariaLabel={`Jumlah ${ingredient?.name ?? "bahan"} yang dipakai`}
                                      className="min-w-0 flex-1 py-2 outline-none"
                                    />
                                    <span className="text-xs text-black/50">
                                      {ingredient?.unit}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-5 py-3">{formatRupiah(unitCost)}</td>
                                <td className="px-5 py-3 font-black">
                                  {formatRupiah(line.quantity * unitCost)}
                                </td>
                                <td className="px-5 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeRecipeLine(variant.id, line.id)
                                    }
                                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                                    aria-label="Hapus bahan dari resep"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {!variant.recipe.length && (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-5 py-10 text-center text-black/50"
                              >
                                Belum ada bahan. Klik “Tambah bahan” untuk mulai membuat resep.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <SectionHeading
                    step="3"
                    title="Tambahkan biaya saat produksi"
                    description="Bagian ini hanya untuk biaya yang benar-benar muncul setiap kali resep dibuat. Isi 0 jika tidak ada."
                  />
                  <div className="mt-4 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <FieldCard>
                      <NumberField
                        label="Tambahan bahan karena sisa / tumpah"
                        value={variant.processLossPercent}
                        max={99}
                        step="0.01"
                        suffix="%"
                        note="Isi 0 jika jumlah resep sudah sesuai pemakaian nyata."
                        onChange={(value) =>
                          updateVariant(variant.id, { processLossPercent: value })
                        }
                      />
                    </FieldCard>
                    <FieldCard>
                      <NumberField
                        label="Upah untuk sekali produksi"
                        value={variant.laborCostPerBatch}
                        prefix="Rp"
                        note="Isi hanya upah tambahan yang muncul setiap kali resep dibuat."
                        onChange={(value) =>
                          updateVariant(variant.id, { laborCostPerBatch: value })
                        }
                      />
                    </FieldCard>
                    <FieldCard>
                      <NumberField
                        label="Listrik, air, atau gas sekali produksi"
                        value={variant.utilityCostPerBatch}
                        prefix="Rp"
                        note="Perkiraan biaya pemakaian saat satu kali membuat resep."
                        onChange={(value) =>
                          updateVariant(variant.id, { utilityCostPerBatch: value })
                        }
                      />
                    </FieldCard>
                    <FieldCard>
                      <NumberField
                        label="Biaya lain untuk sekali produksi"
                        value={variant.otherVariableCostPerBatch}
                        prefix="Rp"
                        note="Contoh: stiker khusus atau biaya lain di luar bahan."
                        onChange={(value) =>
                          updateVariant(variant.id, {
                            otherVariableCostPerBatch: value
                          })
                        }
                      />
                    </FieldCard>
                  </div>
                </div>

                <div className="mt-8">
                  <SectionHeading
                    step="4"
                    title="Periksa rincian dan total modal"
                    description="Pastikan semua biaya masuk dengan benar sebelum menentukan harga jual."
                  />

                  <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
                    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                      <div className="border-b border-black/[.07] bg-black/[.025] px-5 py-4">
                        <h4 className="font-black">Rincian biaya sekali produksi</h4>
                        <p className="mt-1 text-sm text-black/55">
                          Untuk menghasilkan {variant.batchYield || 0} gelas.
                        </p>
                      </div>
                      <div className="p-5">
                        <CostRow
                          label="Bahan minuman / makanan"
                          value={hpp.rawProductionMaterialCostPerBatch}
                        />
                        <CostRow label="Kemasan" value={hpp.packagingCostPerBatch} />
                        <CostRow
                          label="Tambahan bahan karena sisa / tumpah"
                          value={hpp.processLossCostPerBatch}
                        />
                        <CostRow
                          label="Upah sekali produksi"
                          value={hpp.laborCostPerBatch}
                        />
                        <CostRow
                          label="Listrik, air, atau gas"
                          value={hpp.utilityCostPerBatch}
                        />
                        <CostRow
                          label="Biaya lain"
                          value={hpp.otherVariableCostPerBatch}
                        />
                        <div className="mt-4 flex items-center justify-between gap-4 border-t border-black/10 pt-4">
                          <span className="font-black">Total biaya sekali produksi</span>
                          <span className="text-lg font-black">
                            {formatRupiah(hpp.variableCostPerBatch)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Metric
                        label="Biaya produksi per gelas"
                        value={formatRupiah(hpp.variableCostPerServing)}
                      />
                      <Metric
                        label="Bagian biaya bulanan per gelas"
                        value={formatRupiah(hpp.fixedOverheadPerServing)}
                      />
                      <Metric
                        label="Total modal per gelas (HPP)"
                        value={formatRupiah(hpp.hppPerServing)}
                        emphasis
                        className="sm:col-span-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <SectionHeading
                    step="5"
                    title="Tentukan harga jual"
                    description="Harga jual ditempatkan paling akhir karena keputusan harga harus berdasarkan total modal per gelas."
                  />

                  <div className="mt-4 overflow-hidden rounded-2xl border border-[#f0c4aa] bg-[#fff8f3]">
                    <div className="grid gap-5 p-5 lg:grid-cols-[.85fr_1.15fr] lg:p-6">
                      <div className="rounded-2xl bg-[#17130f] p-5 text-white">
                        <div className="flex items-center gap-3">
                          <span className="grid size-10 place-items-center rounded-xl bg-[#f15a16]">
                            <CircleDollarSign className="size-5" />
                          </span>
                          <div>
                            <p className="text-xs font-black uppercase tracking-[.14em] text-white/55">
                              Saran sistem
                            </p>
                            <p className="mt-1 text-sm text-white/70">
                              Target keuntungan {settings.targetMarginPercent}%
                            </p>
                          </div>
                        </div>
                        <p className="mt-5 text-sm text-white/65">
                          Harga jual yang disarankan
                        </p>
                        <p className="mt-1 text-3xl font-black">
                          {formatRupiah(hpp.suggestedSellingPrice)}
                        </p>
                        <button
                          type="button"
                          disabled={!hppReady || hpp.suggestedSellingPrice <= 0}
                          onClick={() =>
                            updateVariant(variant.id, {
                              sellingPrice: hpp.suggestedSellingPrice
                            })
                          }
                          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17130f] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <CheckCircle2 className="size-4" /> Gunakan harga saran
                        </button>
                      </div>

                      <div>
                        {!hppReady && (
                          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                            Lengkapi resep dan jumlah hasil produksi terlebih dahulu agar saran harga dapat dihitung dengan benar.
                          </div>
                        )}
                        <NumberField
                          label="Harga jual yang dipilih"
                          value={variant.sellingPrice}
                          prefix="Rp"
                          disabled={!hppReady}
                          note="Gunakan saran sistem atau isi harga sendiri sesuai strategi usaha."
                          onChange={(value) =>
                            updateVariant(variant.id, { sellingPrice: value })
                          }
                        />

                        <PriceResult
                          sellingPrice={variant.sellingPrice}
                          hpp={hpp}
                          targetMarginPercent={settings.targetMarginPercent}
                        />

                        <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
                          <Checkbox
                            label="Tampilkan pilihan ini di katalog"
                            checked={variant.active}
                            onChange={(value) =>
                              updateVariant(variant.id, { active: value })
                            }
                          />
                          <p className="mt-2 text-sm leading-6 text-black/55">
                            Aktifkan hanya setelah harga jual dan seluruh perhitungan sudah diperiksa.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {hpp.auditIssues.length > 0 && (
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="font-black">Hal yang perlu diperbaiki</p>
                      <p className="mt-1 text-sm leading-6">
                        {hpp.auditIssues.join(" ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}

        <button
          type="button"
          onClick={addVariant}
          className="admin-button-secondary border-dashed border-[#f15a16]/40 text-[#d84909]"
        >
          <Plus className="size-4" /> Tambah pilihan ukuran
        </button>

        <article className="admin-card overflow-hidden">
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Langkah terakhir</p>
              <h2 className="mt-1 font-display text-2xl font-bold">Publikasikan produk ke katalog</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-black/60">Aktifkan setelah setiap pilihan memiliki resep, HPP, dan harga jual yang sudah diperiksa. Selama belum aktif, produk tetap tersimpan sebagai draft.</p>
            </div>
            <div className="grid gap-3 rounded-2xl border border-black/[.08] bg-[#fbf8f3] p-4">
              <Checkbox
                label="Tampilkan produk di katalog"
                checked={product.active}
                onChange={(value) => updateBase("active", value)}
              />
              <Checkbox
                label="Tampilkan sebagai produk unggulan"
                checked={product.featured}
                onChange={(value) => updateBase("featured", value)}
              />
            </div>
          </div>
          <div className={`border-t px-5 py-3 text-sm font-bold sm:px-6 ${product.active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-black/[.06] bg-black/[.025] text-black/55"}`}>
            {product.active ? "Produk akan terlihat oleh pengunjung setelah disimpan." : "Status saat ini: draft, belum terlihat oleh pengunjung."}
          </div>
        </article>
      </section>
    </form>
  );
}

function SectionHeading({
  step,
  title,
  description,
  action
}: {
  step: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#fff0e7] text-xs font-black text-[#d84909]">
          {step}
        </span>
        <div>
          <h3 className="font-display text-2xl font-bold text-[#17130f]">{title}</h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-black/60">
            {description}
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}

function FieldCard({ children }: { children: ReactNode }) {
  return (
    <div className="h-full rounded-2xl border border-black/[.08] bg-[#fbf8f3] p-4">
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = true,
  note
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  note?: string;
}) {
  return (
    <label className="grid h-full content-start gap-2 text-sm font-bold">
      <span className="min-h-5 leading-5">{label}</span>
      <input
        required={required}
        value={value}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => onChange(event.target.value)}
        className="admin-field min-h-12 font-normal"
      />
      {note && (
        <span className="text-xs font-normal leading-5 text-black/50">{note}</span>
      )}
    </label>
  );
}

function AutoSkuField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid h-full content-start gap-2 text-sm font-bold">
      <span className="min-h-5 leading-5">{label}</span>
      <div className="admin-field flex min-h-12 items-center bg-white font-mono text-sm font-bold text-black/60">
        {value || "Dibuat otomatis setelah disimpan"}
      </div>
      <span className="text-xs font-normal leading-5 text-black/50">
        Tidak perlu diisi. Sistem membuat kode yang berbeda untuk setiap pilihan.
      </span>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = "1",
  prefix,
  suffix,
  note,
  disabled = false
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: string;
  prefix?: string;
  suffix?: string;
  note?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid h-full content-start gap-2 text-sm font-bold">
      <span className="min-h-5 leading-5">{label}</span>
      <div
        className={`admin-field flex min-h-12 items-center px-3 py-0 ${
          disabled ? "bg-black/[.035] opacity-65" : "bg-white"
        }`}
      >
        {prefix && <span className="shrink-0 text-black/45">{prefix}</span>}
        <FriendlyNumberInput
          required
          disabled={disabled}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          ariaLabel={label}
          className="min-w-0 flex-1 bg-transparent px-2 py-3 font-normal outline-none disabled:cursor-not-allowed"
        />
        {suffix && <span className="shrink-0 text-black/45">{suffix}</span>}
      </div>
      {note && (
        <span className="text-xs font-normal leading-5 text-black/50">{note}</span>
      )}
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-3 text-sm font-bold">
      <input
        className="size-4 accent-[#f15a16]"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />{" "}
      {label}
    </label>
  );
}

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/[.06] py-3 first:pt-0">
      <span className="text-sm text-black/60">{label}</span>
      <span className="text-sm font-black">{formatRupiah(value)}</span>
    </div>
  );
}

function Metric({
  label,
  value,
  emphasis = false,
  className = ""
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${
        emphasis ? "bg-[#17130f] text-white" : "bg-[#fbf8f3]"
      } ${className}`}
    >
      <p
        className={`text-sm font-bold leading-5 ${
          emphasis ? "text-white/70" : "text-black/55"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

function PriceResult({
  sellingPrice,
  hpp,
  targetMarginPercent
}: {
  sellingPrice: number;
  hpp: HppBreakdown;
  targetMarginPercent: number;
}) {
  if (sellingPrice <= 0) {
    return (
      <p className="mt-4 rounded-xl bg-black/[.04] p-4 text-sm leading-6 text-black/60">
        Harga jual belum dipilih. Gunakan harga saran atau masukkan harga sendiri.
      </p>
    );
  }

  const belowCost = sellingPrice < hpp.hppPerServing;
  const reachesTarget = hpp.currentMarginPercent >= targetMarginPercent;
  const style = belowCost
    ? "border-red-200 bg-red-50 text-red-800"
    : reachesTarget
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  const title = belowCost
    ? "Harga jual lebih rendah dari modal"
    : reachesTarget
      ? "Harga jual sudah mencapai target"
      : "Harga jual masih di bawah target keuntungan";

  return (
    <div className={`mt-4 rounded-xl border p-4 ${style}`}>
      <p className="font-black">{title}</p>
      <p className="mt-1 text-sm leading-6">
        Keuntungan sekitar {formatRupiah(hpp.currentProfitPerServing)} per gelas ·{" "}
        {hpp.currentMarginPercent.toFixed(1)}% dari harga jual.
      </p>
    </div>
  );
}
