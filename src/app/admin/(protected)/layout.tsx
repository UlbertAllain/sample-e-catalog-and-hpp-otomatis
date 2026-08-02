import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { verifyAdminSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Nexty Juice Admin",
  robots: { index: false, follow: false }
};

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await verifyAdminSession();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#f7f2ea] lg:flex">
      <AdminSidebar email={admin.email ?? "Admin"} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8 xl:p-10">{children}</div>
      </main>
    </div>
  );
}
