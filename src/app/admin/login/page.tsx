"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { LockKeyhole } from "lucide-react";
import { auth } from "@/lib/firebase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!auth) {
      setError("Firebase client belum dikonfigurasi di .env.local.");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData(event.currentTarget);
      const credential = await signInWithEmailAndPassword(
        auth,
        String(data.get("email")),
        String(data.get("password"))
      );
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Login gagal.");

      router.replace("/admin");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Email atau password tidak valid.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#17130f] p-5">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#fffdf9] p-8 shadow-2xl">
        <span className="grid size-12 place-items-center rounded-xl bg-[#f15a16] text-white">
          <LockKeyhole className="size-5" />
        </span>
        <p className="mt-6 text-sm font-black uppercase tracking-[.2em] text-[#f15a16]">Private admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-.035em] text-[#17130f]">Masuk ke dashboard</h1>
        <p className="mt-3 text-sm leading-6 text-black/50">Hanya akun Firebase yang memiliki custom claim <code>admin: true</code>.</p>
        {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-7 grid gap-4">
          <input required name="email" type="email" autoComplete="email" placeholder="Email admin" className="admin-field" />
          <input required name="password" type="password" autoComplete="current-password" placeholder="Password" className="admin-field" />
          <button disabled={loading} className="admin-button-primary w-full">
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>
        </div>
      </form>
    </main>
  );
}
