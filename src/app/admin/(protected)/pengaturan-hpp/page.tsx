"use client";

import { FormEvent, useEffect, useState } from "react";
import { Calculator, Info, Save } from "lucide-react";
import { AdminGuidePanel } from "@/components/admin-guide-panel";
import { FriendlyNumberInput } from "@/components/friendly-number-input";
import { calculateFixedOverheadPerServing, calculateMonthlyFixedCosts, defaultHppSettings, formatRupiah } from "@/lib/hpp";
import { getHppSettings, saveHppSettings } from "@/lib/firestore/settings";
import { validateHppSettings } from "@/lib/validation";
import type { HppSettings } from "@/types";

export default function HppSettingsPage() {
  const [settings, setSettings] = useState<HppSettings>(defaultHppSettings);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getHppSettings().then(setSettings).catch(() => setMessage("Pengaturan biaya belum berhasil dimuat. Coba muat ulang halaman."));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const errors = validateHppSettings(settings);
    if (errors.length) {
      setMessage(errors[0]);
      return;
    }

    setSaving(true);
    try {
      await saveHppSettings(settings);
      setMessage("Pengaturan biaya dan harga jual berhasil disimpan.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Pengaturan belum berhasil disimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  const monthlyFixedCosts = calculateMonthlyFixedCosts(settings);
  const overheadPerServing = calculateFixedOverheadPerServing(settings);

  return (
    <section>
      <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#f15a16]">Biaya & harga jual</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-[-.03em]">Atur biaya bulanan dan target keuntungan</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-black/65">Masukkan biaya yang tetap dibayar setiap bulan. Sistem akan membagi biaya tersebut ke setiap gelas untuk mendapatkan modal yang lebih lengkap.</p>

      <AdminGuidePanel
        className="mt-6"
        defaultOpen
        eyebrow="Langkah 2 dari 4"
        title="Bagikan biaya bulanan ke setiap gelas"
        description="Contoh: jika biaya bulanan Rp3.000.000 dan biasanya terjual 3.000 gelas, maka setiap gelas mendapat bagian biaya bulanan Rp1.000."
        steps={[
          { title: "Isi biaya bulanan", description: "Masukkan sewa, gaji tetap, cadangan penggantian alat, dan biaya lain yang tetap dibayar." },
          { title: "Isi perkiraan penjualan", description: "Masukkan jumlah gelas yang biasanya terjual dalam satu bulan. Gunakan angka yang realistis." },
          { title: "Tentukan target keuntungan", description: "Contoh 40% berarti dari harga jual, sekitar 40% diharapkan menjadi keuntungan kotor setelah modal dikurangi." },
          { title: "Periksa hasil di sebelah kanan", description: "Sistem langsung menampilkan total biaya bulanan dan bagian biaya untuk satu gelas." }
        ]}
        note="Jangan masukkan biaya yang sama di dua tempat. Misalnya gaji pegawai dicatat sebagai gaji bulanan atau upah sekali produksi, bukan keduanya. Nilai 0 akan kosong saat kolom diklik, jadi kamu bisa langsung mengetik angka baru."
      />

      {message && <p className="mt-5 rounded-xl border border-[#f3c7a9] bg-[#fff4eb] p-4 text-sm font-bold leading-6 text-[#9a3b0d]">{message}</p>}

      <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="admin-card p-5 sm:p-6">
          <div className="border-b border-black/10 pb-5">
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Bagian A</p>
            <h2 className="mt-1 font-display text-2xl font-bold">Biaya yang dibayar setiap bulan</h2>
            <p className="mt-2 text-sm leading-6 text-black/55">Isi biaya yang tetap muncul walaupun jumlah pesanan sedang sedikit.</p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Sewa tempat" note="Sewa tempat produksi, kios, atau outlet per bulan.">
              <NumberInput value={settings.monthlyRentCost} onChange={(value) => setSettings((current) => ({ ...current, monthlyRentCost: value }))} prefix="Rp" />
            </Field>
            <Field label="Gaji tetap bulanan" note="Gaji yang jumlahnya tetap walaupun produksi naik atau turun.">
              <NumberInput value={settings.monthlyFixedPayrollCost} onChange={(value) => setSettings((current) => ({ ...current, monthlyFixedPayrollCost: value }))} prefix="Rp" />
            </Field>
            <Field label="Cadangan penggantian alat" note="Bagian biaya blender, freezer, sealer, dan alat lain per bulan. Dalam akuntansi disebut penyusutan.">
              <NumberInput value={settings.monthlyDepreciationCost} onChange={(value) => setSettings((current) => ({ ...current, monthlyDepreciationCost: value }))} prefix="Rp" />
            </Field>
            <Field label="Biaya bulanan lainnya" note="Contoh: internet, aplikasi kasir, izin, atau biaya tetap lain.">
              <NumberInput value={settings.monthlyOtherFixedCost} onChange={(value) => setSettings((current) => ({ ...current, monthlyOtherFixedCost: value }))} prefix="Rp" />
            </Field>
          </div>

          <div className="mt-8 border-b border-black/10 pb-5">
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#f15a16]">Bagian B</p>
            <h2 className="mt-1 font-display text-2xl font-bold">Perkiraan penjualan dan harga</h2>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Perkiraan gelas terjual per bulan" note="Gunakan rata-rata penjualan yang masuk akal, bukan kemampuan maksimum mesin.">
              <NumberInput value={settings.monthlyTargetServings} min={1} step="1" onChange={(value) => setSettings((current) => ({ ...current, monthlyTargetServings: value }))} suffix="gelas" />
            </Field>
            <Field label="Target keuntungan dari harga jual" note="Contoh: isi 40 untuk target keuntungan kotor 40% dari harga jual.">
              <NumberInput value={settings.targetMarginPercent} min={0} max={99.99} step="0.01" onChange={(value) => setSettings((current) => ({ ...current, targetMarginPercent: value }))} suffix="%" />
            </Field>
            <Field label="Pembulatan saran harga" note="Contoh: isi Rp500 agar saran harga menjadi Rp15.000, Rp15.500, Rp16.000, dan seterusnya.">
              <NumberInput value={settings.priceRoundingStep} min={1} step="1" onChange={(value) => setSettings((current) => ({ ...current, priceRoundingStep: value }))} prefix="Rp" />
            </Field>
          </div>
          <button disabled={saving} className="admin-button-primary mt-7"><Save className="size-4" /> {saving ? "Sedang menyimpan..." : "Simpan pengaturan"}</button>
        </form>

        <aside className="space-y-5">
          <div className="overflow-hidden rounded-2xl bg-[#17130f] text-white shadow-[0_18px_45px_rgba(23,19,15,.16)]">
            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-[.16em] text-[#ff9d6e]">Cara sistem menghitung</p>
              <div className="mt-6 space-y-5 text-sm leading-6 text-white/75">
                <p><strong className="block text-white">Biaya bahan</strong>Harga beli dibagi jumlah bahan yang benar-benar bisa dipakai.</p>
                <p><strong className="block text-white">Tambahan bahan saat produksi</strong>Sistem dapat menambah biaya untuk bahan yang tertinggal di alat atau tumpah.</p>
                <p><strong className="block text-white">Modal satu gelas (HPP)</strong>Biaya bahan, kemasan, proses, dan bagian biaya bulanan dijumlahkan.</p>
              </div>
            </div>
            <div className="grid gap-px bg-white/10">
              <div className="bg-white/[.04] p-5"><p className="text-sm text-white/65">Total biaya bulanan</p><p className="mt-1 text-2xl font-black">{formatRupiah(monthlyFixedCosts)}</p></div>
              <div className="bg-[#f15a16] p-5"><p className="text-sm font-bold text-white">Bagian biaya bulanan untuk 1 gelas</p><p className="mt-1 text-3xl font-black">{formatRupiah(overheadPerServing)}</p></div>
            </div>
          </div>

          <div className="admin-card p-5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 size-5 shrink-0 text-[#f15a16]" />
              <div>
                <h3 className="font-bold">Jangan hitung biaya dua kali</h3>
                <p className="mt-2 text-sm leading-6 text-black/60">Gaji pegawai jangan dimasukkan sebagai gaji bulanan sekaligus sebagai upah sekali produksi, kecuali memang ada dua pembayaran yang berbeda.</p>
              </div>
            </div>
          </div>

          <div className="admin-card flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-xl bg-[#fff0e7] text-[#f15a16]"><Calculator className="size-5" /></span>
            <div><p className="text-sm text-black/55">Target keuntungan</p><p className="mt-1 text-xl font-black">{settings.targetMarginPercent}%</p></div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Field({ label, note, children }: { label: string; note: string; children: React.ReactNode }) {
  return <label className="admin-label"><span>{label}</span>{children}<span className="text-sm font-normal leading-6 text-black/55">{note}</span></label>;
}

function NumberInput({ value, onChange, min = 0, max, prefix, suffix, step = "1" }: { value: number; onChange: (value: number) => void; min?: number; max?: number; prefix?: string; suffix?: string; step?: string }) {
  return <div className="admin-field flex items-center px-3 py-0"><span className="text-xs font-bold text-black/45">{prefix}</span><FriendlyNumberInput required value={value} min={min} max={max} step={step} onChange={onChange} className="min-w-0 flex-1 bg-transparent px-2 py-3 font-normal outline-none" /><span className="text-xs font-bold text-black/45">{suffix}</span></div>;
}
