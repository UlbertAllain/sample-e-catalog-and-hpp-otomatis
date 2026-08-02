import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatRupiah } from "@/lib/hpp";
import type { CatalogProduct } from "@/types";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const activeVariants = product.variants.filter((variant) => variant.active);
  const price = activeVariants.length ? Math.min(...activeVariants.map((variant) => variant.sellingPrice)) : 0;

  return (
    <Link href={`/menu/${product.slug}`} className="group overflow-hidden rounded-2xl border border-black/10 bg-[#fffdf9] shadow-[0_14px_40px_rgba(73,43,24,.07)] hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(73,43,24,.12)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f1e8dc]">
        <Image src={product.imageUrl} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute left-4 top-4 rounded-lg bg-[#fffdf9]/92 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.08em] backdrop-blur">{product.category}</span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div><h3 className="font-display text-2xl font-bold">{product.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-black/50">{product.description}</p></div>
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#fff0e7] text-[#f15a16] group-hover:bg-[#f15a16] group-hover:text-white"><ArrowUpRight className="size-4" /></span>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4">
          <span className="text-xs font-semibold text-black/40">Mulai dari</span>
          <p className="font-black text-[#d84909]">{formatRupiah(price)}</p>
        </div>
      </div>
    </Link>
  );
}
