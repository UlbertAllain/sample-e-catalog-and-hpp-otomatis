import "server-only";

import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "juicelab_admin_session";
export const SESSION_EXPIRES_MS = 5 * 24 * 60 * 60 * 1000;

export async function verifyAdminSession() {
  const auth = getAdminAuth();
  if (!auth) return null;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    return decoded.admin === true ? decoded : null;
  } catch {
    return null;
  }
}
