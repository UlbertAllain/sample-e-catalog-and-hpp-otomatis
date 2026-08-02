import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2];
if (!email) {
  console.error("Gunakan: npm run set-admin -- admin@contoh.com");
  process.exit(1);
}

const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } = process.env;
if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error("Environment Firebase Admin belum lengkap.");
  process.exit(1);
}

const app = initializeApp({
  credential: cert({
    projectId: FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
  })
});

const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: true });
console.log(`Custom claim admin berhasil dipasang untuk ${email}. Silakan login ulang.`);
