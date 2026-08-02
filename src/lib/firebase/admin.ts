import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminCredentials() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

export function getFirebaseAdminApp(): App | null {
  const existing = getApps()[0];
  if (existing) return existing;

  const credentials = getAdminCredentials();
  if (!credentials) return null;

  return initializeApp({ credential: cert(credentials) });
}

export function getAdminAuth() {
  const app = getFirebaseAdminApp();
  return app ? getAuth(app) : null;
}

export function getAdminDb() {
  const app = getFirebaseAdminApp();
  return app ? getFirestore(app) : null;
}
