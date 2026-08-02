import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME, SESSION_EXPIRES_MS } from "@/lib/auth/session";

export async function POST(request: Request) {
  const auth = getAdminAuth();
  if (!auth) {
    return NextResponse.json({ message: "Firebase Admin belum dikonfigurasi." }, { status: 503 });
  }

  try {
    const { idToken } = (await request.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ message: "ID token wajib diisi." }, { status: 400 });
    }

    const decoded = await auth.verifyIdToken(idToken, true);
    const signedInRecently = Math.floor(Date.now() / 1000) - decoded.auth_time <= 5 * 60;
    if (!signedInRecently) {
      return NextResponse.json({ message: "Silakan login ulang untuk membuat sesi admin." }, { status: 401 });
    }
    if (decoded.admin !== true) {
      return NextResponse.json({ message: "Akun ini tidak memiliki akses admin." }, { status: 403 });
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_MS
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_EXPIRES_MS / 1000)
    });
    return response;
  } catch {
    return NextResponse.json({ message: "Sesi admin tidak dapat dibuat." }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return response;
}
