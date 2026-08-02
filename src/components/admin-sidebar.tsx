"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpenCheck,
  Boxes,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  PackageOpen,
  Settings2,
  Store
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const links = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/admin/panduan", label: "Panduan sistem", icon: BookOpenCheck },
  { href: "/admin/produk", label: "Produk & resep", icon: PackageOpen },
  { href: "/admin/bahan", label: "Bahan baku", icon: Boxes },
  { href: "/admin/pengaturan-hpp", label: "Pengaturan HPP", icon: Settings2 }
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    if (auth) await signOut(auth).catch(() => undefined);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <aside className="border-b border-black/10 bg-[#fffdf9] lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-5 py-5 lg:block lg:px-6 lg:py-7">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#f15a16] text-white shadow-[0_8px_20px_rgba(241,90,22,.25)]">
            <Store className="size-5" />
          </span>
          <span>
            <strong className="block font-display text-lg leading-none">Nexty Juice</strong>
            <small className="mt-1 block text-[10px] font-bold uppercase tracking-[.18em] text-black/40">Admin workspace</small>
          </span>
        </Link>
        <Link href="/" target="_blank" className="admin-button-secondary px-3 py-2 lg:mt-6 lg:w-full">
          <ExternalLink className="size-4" />
          <span className="hidden sm:inline">Buka katalog</span>
        </Link>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:grid lg:overflow-visible lg:px-4 lg:pb-0">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${
                active
                  ? "bg-[#f15a16] text-white shadow-[0_8px_22px_rgba(241,90,22,.22)]"
                  : "text-black/50 hover:bg-black/[.04] hover:text-black"
              }`}
            >
              <Icon className="size-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-black/10 p-4 lg:block">
        <div className="rounded-xl bg-[#f7f2ea] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-black/35">Akun aktif</p>
          <p className="mt-1 truncate text-xs font-semibold text-black/65">{email}</p>
        </div>
        <button onClick={logout} className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-black/50 hover:bg-red-50 hover:text-red-600">
          <LogOut className="size-[18px]" /> Keluar
        </button>
      </div>
    </aside>
  );
}
