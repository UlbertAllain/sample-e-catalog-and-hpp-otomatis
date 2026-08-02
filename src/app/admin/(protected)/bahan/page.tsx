"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CircleDollarSign, Info, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { AdminGuidePanel } from "@/components/admin-guide-panel";
import { FriendlyNumberInput } from "@/components/friendly-number-input";
import { calculateEffectiveUnitCost, formatRupiah } from "@/lib/hpp";
import { deleteIngredient, getIngredients, saveIngredient, type IngredientInput } from "@/lib/firestore/ingredients";
import { isIngredientUsed } from "@/lib/firestore/products";
import { validateIngredient } from "@/lib/validation";
import type { Ingredient, IngredientCostType, Unit } from "@/types";

const emptyForm: IngredientInput = {
  name: "",
  sku: "",
  unit: "gram",
  costType: "material",
  purchasePrice: 0,
  purchaseQuantity: 0,
  yieldPercent: 100,
  supplier: "",
  notes: "",
  active: true
};

export default function IngredientsPage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [form, setForm] = useState<IngredientInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const effectiveUnitCost = useMemo(() => calculateEffectiveUnitCost(form), [form]);
  const usableQuantity = Math.max(0, form.purchaseQuantity) * (Math.max(0, Math.min(100, form.yieldPercent)) / 100);

  async function load() {
    setItems(await getIngredients());
  }

  useEffect(() => {
    getIngredients().then(setItems).catch(() => setMessage("Daftar bahan belum berhasil dimuat. Coba muat ulang halaman."));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const normalized = form.costType === "packaging" ? { ...form, yieldPercent: 100 } : form;
    const errors = validateIngredient(normalized);
    if (errors.length) {
      setMessage(errors[0]);
      return;
    }

    setSaving(true);
    try {
      const wasEditing = Boolean(editingId);
      await saveIngredient(normalized, editingId ?? undefined);
      await load();
      resetForm();
      setMessage(wasEditing ? "Perubahan bahan berhasil disimpan." : "Bahan baru berhasil ditambahkan.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Bahan belum berhasil disimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item: Ingredient) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      sku: item.sku,
      unit: item.unit,
      costType: item.costType,
      purchasePrice: item.purchasePrice,
      purchaseQuantity: item.purchaseQuantity,
      yieldPercent: item.costType === "packaging" ? 100 : item.yieldPercent,
      supplier: item.supplier ?? "",
      notes: item.notes ?? "",
      active: item.active
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  async function remove(item: Ingredient) {
    setMessage("");
    try {
      if (await isIngredientUsed(item.id)) {
        setMessage(`${item.name} masih dipakai di resep produk. Hapus bahan ini dari resep terlebih dahulu, atau cukup sembunyikan dengan mematikan status aktif.`);
        return;
      }
      if (!window.confirm(`Yakin ingin menghapus ${item.name}? Riwayat perubahan harganya tetap disimpan.`)) return;
      await deleteIngredient(item.id);
      await load();
      setMessage("Bahan berhasil dihapus.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Bahan belum berhasil dihapus. Coba lagi.");
    }
  }

  return (
    <section>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#f15a16]">Bahan & kemasan</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-.03em]">Daftar bahan dan kemasan</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-black/65">Masukkan data sesuai nota pembelian. Gunakan satuan yang sama dengan resep, misalnya 1 kg mangga ditulis sebagai 1.000 gram.</p>
      </div>

      <AdminGuidePanel
        className="mt-6"
        defaultOpen
        eyebrow="Langkah 1 dari 4"
        title="Masukkan data pembelian dengan satuan yang sama seperti resep"
        description="Dari data ini, sistem menghitung biaya setiap gram, ml, atau pcs. Hasilnya dipakai untuk menghitung modal semua produk."
        steps={[
          { title: "Pilih satuan resep", description: "Ubah kilogram menjadi gram dan liter menjadi ml. Contoh: 1 kg ditulis 1.000 gram." },
          { title: "Isi harga dan jumlah beli", description: "Salin harga dari nota, lalu isi jumlah barang yang didapat dengan satuan yang sudah dipilih." },
          { title: "Isi bagian yang bisa dipakai", description: "Untuk buah, hitung bagian setelah kulit, biji, atau bagian rusak dibuang. Kemasan selalu 100%." },
          { title: "Periksa perkiraan biaya", description: "Lihat panel di sebelah kanan. Pastikan biaya per gram, ml, atau pcs terasa masuk akal sebelum disimpan." }
        ]}
        note="Kulit dan biji dicatat di halaman ini. Bahan yang tertinggal di blender atau tumpah dicatat nanti di resep produk, supaya tidak dihitung dua kali. Kamu boleh mengetik 30.000 untuk tiga puluh ribu; scroll mouse tidak akan mengubah angka."
      />

      {message && <p className="mt-5 rounded-xl border border-[#f3c7a9] bg-[#fff4eb] p-4 text-sm font-bold leading-6 text-[#9a3b0d]">{message}</p>}

      <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_320px]">
        <form onSubmit={submit} className="admin-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Form bahan</p>
              <h2 className="mt-1 font-display text-2xl font-bold">{editingId ? "Ubah data bahan" : "Tambah bahan baru"}</h2>
            </div>
            {editingId && (
              <button type="button" onClick={resetForm} className="admin-button-secondary">
                <RotateCcw className="size-4" /> Batal mengubah
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Input label="Nama bahan atau kemasan" placeholder="Contoh: Mangga harum manis" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
            <AutoSkuField value={form.sku} />
            <label className="admin-label">Kelompok
              <select
                value={form.costType}
                onChange={(event) => {
                  const costType = event.target.value as IngredientCostType;
                  setForm((current) => ({ ...current, costType, yieldPercent: costType === "packaging" ? 100 : current.yieldPercent }));
                }}
                className="admin-field font-normal"
              >
                <option value="material">Bahan minuman/makanan</option>
                <option value="packaging">Kemasan, cup, atau sedotan</option>
              </select>
            </label>
            <label className="admin-label">Satuan yang dipakai di resep
              <select value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value as Unit }))} className="admin-field font-normal">
                <option value="gram">gram</option>
                <option value="ml">ml</option>
                <option value="pcs">pcs</option>
              </select>
              <span className="text-xs font-normal leading-5 text-black/50">Pilih gram untuk bahan timbang, ml untuk cairan, dan pcs untuk barang satuan.</span>
            </label>
            <NumberField label="Harga yang dibayar" value={form.purchasePrice} onChange={(value) => setForm((current) => ({ ...current, purchasePrice: value }))} prefix="Rp" note="Isi total harga pada satu kali pembelian." />
            <NumberField label={`Jumlah barang yang didapat (${form.unit})`} value={form.purchaseQuantity} min={0} step="any" onChange={(value) => setForm((current) => ({ ...current, purchaseQuantity: value }))} note={`Contoh: 1 kg ditulis 1.000 ${form.unit === "gram" ? "gram" : form.unit}.`} />
            <NumberField
              label="Bagian yang bisa dipakai"
              value={form.costType === "packaging" ? 100 : form.yieldPercent}
              min={0}
              max={100}
              step="0.01"
              suffix="%"
              disabled={form.costType === "packaging"}
              note={form.costType === "packaging" ? "Kemasan selalu dihitung 100% bisa dipakai." : "Contoh: setelah kulit dan biji dibuang, mangga yang tersisa 70%, maka isi 70."}
              onChange={(value) => setForm((current) => ({ ...current, yieldPercent: value }))}
            />
            <Input label="Tempat beli / pemasok" required={false} placeholder="Opsional, contoh: Pasar Buah A" value={form.supplier ?? ""} onChange={(value) => setForm((current) => ({ ...current, supplier: value }))} />
          </div>

          <label className="admin-label mt-5">Catatan tambahan
            <textarea value={form.notes ?? ""} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} placeholder="Contoh: harga dari nota tanggal 2 Agustus" className="admin-field resize-y font-normal" />
          </label>

          <div className="mt-5 flex flex-col justify-between gap-4 rounded-xl border border-black/10 bg-[#fbf8f3] p-4 sm:flex-row sm:items-center">
            <label className="inline-flex items-center gap-3 text-sm font-bold">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} className="size-4 accent-[#f15a16]" />
              Bahan boleh dipilih saat membuat resep
            </label>
            <button disabled={saving} className="admin-button-primary">
              <Plus className="size-4" /> {saving ? "Sedang menyimpan..." : editingId ? "Simpan perubahan" : "Tambah bahan"}
            </button>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="admin-card overflow-hidden">
            <div className="bg-[#17130f] p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[.14em] text-[#ff9d6e]">Perkiraan biaya</p>
              <p className="mt-4 text-sm text-white/70">Biaya untuk setiap 1 {form.unit}</p>
              <p className="mt-1 text-3xl font-black">{formatRupiah(effectiveUnitCost)}</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-black/10">
              <div className="p-4">
                <p className="text-xs font-bold text-black/50">Jumlah sebelum dibersihkan</p>
                <p className="mt-1 font-black">{form.purchaseQuantity || 0} {form.unit}</p>
              </div>
              <div className="p-4">
                <p className="text-xs font-bold text-black/50">Jumlah yang bisa dipakai</p>
                <p className="mt-1 font-black">{usableQuantity.toFixed(2)} {form.unit}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#f2c4a7] bg-[#fff4eb] p-5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 size-5 shrink-0 text-[#f15a16]" />
              <div>
                <h3 className="font-bold">Contoh sederhana</h3>
                <p className="mt-2 text-sm leading-6 text-black/65">Beli mangga 1.000 gram seharga Rp30.000. Setelah dibersihkan tersisa 700 gram, berarti bagian yang bisa dipakai adalah 70%.</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5">
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Ringkasan daftar</p>
            <div className="mt-4 flex items-center justify-between"><span className="text-sm text-black/60">Bisa dipakai di resep</span><strong>{items.filter((item) => item.active).length}</strong></div>
            <div className="mt-3 flex items-center justify-between"><span className="text-sm text-black/60">Bahan produksi</span><strong>{items.filter((item) => item.costType === "material").length}</strong></div>
            <div className="mt-3 flex items-center justify-between"><span className="text-sm text-black/60">Kemasan</span><strong>{items.filter((item) => item.costType === "packaging").length}</strong></div>
          </div>
        </aside>
      </div>

      <div className="admin-card mt-5 overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-black/10 p-5 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Data tersimpan</p>
            <h2 className="mt-1 font-display text-2xl font-bold">Daftar bahan dan kemasan</h2>
          </div>
          <span className="flex items-center gap-2 rounded-lg bg-[#f7f2ea] px-3 py-2 text-xs font-bold text-black/55"><CircleDollarSign className="size-4" /> {items.length} data</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#fbf8f3] text-[11px] uppercase tracking-[.08em] text-black/50">
              <tr><th className="px-6 py-3.5">Nama</th><th className="px-6 py-3.5">Kelompok</th><th className="px-6 py-3.5">Harga beli</th><th className="px-6 py-3.5">Jumlah</th><th className="px-6 py-3.5">Bisa dipakai</th><th className="px-6 py-3.5">Biaya per satuan</th><th className="px-6 py-3.5">Status</th><th className="px-6 py-3.5" /></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-black/10 hover:bg-[#fffaf5]">
                  <td className="px-6 py-4"><p className="font-bold">{item.name}</p><p className="mt-0.5 text-xs text-black/50">Kode: {item.sku || "belum dibuat"} {item.supplier ? `· ${item.supplier}` : ""}</p></td>
                  <td className="px-6 py-4">{item.costType === "packaging" ? "Kemasan" : "Bahan produksi"}</td>
                  <td className="px-6 py-4">{formatRupiah(item.purchasePrice)}</td>
                  <td className="px-6 py-4">{item.purchaseQuantity} {item.unit}</td>
                  <td className="px-6 py-4">{item.yieldPercent}%</td>
                  <td className="px-6 py-4 font-black">{formatRupiah(calculateEffectiveUnitCost(item))} / {item.unit}</td>
                  <td className="px-6 py-4"><span className={`rounded-lg px-2.5 py-1 text-xs font-black ${item.active ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/55"}`}>{item.active ? "Bisa dipakai" : "Disembunyikan"}</span></td>
                  <td className="px-6 py-4"><div className="flex justify-end gap-1"><button onClick={() => startEdit(item)} className="rounded-lg p-2 hover:bg-black/5" aria-label={`Ubah ${item.name}`}><Pencil className="size-4" /></button><button onClick={() => remove(item)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label={`Hapus ${item.name}`}><Trash2 className="size-4" /></button></div></td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={8} className="px-6 py-12 text-center text-black/50">Belum ada bahan. Gunakan form di atas untuk menambahkan bahan pertama.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Input({ label, value, onChange, required = true, placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string }) {
  return <label className="admin-label">{label}<input required={required} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="admin-field font-normal" /></label>;
}

function AutoSkuField({ value }: { value: string }) {
  return (
    <label className="admin-label">Kode barang
      <div className="admin-field flex min-h-12 items-center bg-black/[.025] font-mono text-sm font-bold text-black/60">
        {value || "Dibuat otomatis setelah disimpan"}
      </div>
      <span className="text-xs font-normal leading-5 text-black/50">Tidak perlu diisi. Kode ini dipakai sistem untuk membedakan setiap bahan.</span>
    </label>
  );
}

function NumberField({ label, value, onChange, min = 0, max, step = "1", prefix, suffix, disabled = false, note }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: string; prefix?: string; suffix?: string; disabled?: boolean; note?: string }) {
  return (
    <label className="admin-label">{label}
      <div className={`admin-field flex items-center px-3 py-0 ${disabled ? "bg-black/[.035] text-black/50" : ""}`}>
        {prefix && <span className="text-xs font-bold text-black/45">{prefix}</span>}
        <FriendlyNumberInput required disabled={disabled} value={value} min={min} max={max} step={step} onChange={onChange} ariaLabel={label} className="min-w-0 flex-1 bg-transparent px-2 py-3 font-normal outline-none disabled:cursor-not-allowed" />
        {suffix && <span className="text-xs font-bold text-black/45">{suffix}</span>}
      </div>
      {note && <span className="text-xs font-normal leading-5 text-black/50">{note}</span>}
    </label>
  );
}
