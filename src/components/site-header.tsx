import Link from "next/link";
import { ArrowUpRight, Citrus } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#fffdf9]/92 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-[#f15a16] text-white"><Citrus className="size-[18px]" /></span>
          <span className="font-display text-lg font-bold tracking-[-.02em]">Nexty Juice</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-black/55 md:flex">
          <Link href="/" className="hover:text-[#f15a16]">Beranda</Link>
          <Link href="/menu" className="hover:text-[#f15a16]">Menu</Link>
          <Link href="/#about" className="hover:text-[#f15a16]">Tentang</Link>
        </nav>
        <Link href="/menu" className="inline-flex items-center gap-2 rounded-lg bg-[#17130f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#f15a16]">Lihat menu <ArrowUpRight className="size-4" /></Link>
      </div>
    </header>
  );
}
