import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, requireFirebaseUser } from "@/lib/firebase/client";
import { defaultHppSettings } from "@/lib/hpp";
import type { HppSettings } from "@/types";

const SETTINGS_ID = "hpp";

async function requireAdminDb() {
  if (!db) throw new Error("Firebase client belum dikonfigurasi.");
  const user = await requireFirebaseUser();
  return { firestore: db, user };
}

export async function getHppSettings(): Promise<HppSettings> {
  const { firestore } = await requireAdminDb();
  const snapshot = await getDoc(doc(firestore, "settings", SETTINGS_ID));
  if (!snapshot.exists()) return defaultHppSettings;

  const data = snapshot.data() as Partial<HppSettings> & { monthlyFixedCosts?: number };
  const migratedOtherCost =
    data.monthlyOtherFixedCost ??
    (!data.monthlyRentCost && !data.monthlyFixedPayrollCost && !data.monthlyDepreciationCost
      ? Number(data.monthlyFixedCosts ?? 0)
      : 0);

  return {
    ...defaultHppSettings,
    ...data,
    monthlyOtherFixedCost: migratedOtherCost
  };
}

export async function saveHppSettings(settings: HppSettings) {
  const { firestore, user } = await requireAdminDb();
  const normalized: HppSettings = {
    monthlyRentCost: Math.max(0, Number(settings.monthlyRentCost) || 0),
    monthlyFixedPayrollCost: Math.max(0, Number(settings.monthlyFixedPayrollCost) || 0),
    monthlyDepreciationCost: Math.max(0, Number(settings.monthlyDepreciationCost) || 0),
    monthlyOtherFixedCost: Math.max(0, Number(settings.monthlyOtherFixedCost) || 0),
    monthlyTargetServings: Math.max(0, Number(settings.monthlyTargetServings) || 0),
    targetMarginPercent: Math.min(99.99, Math.max(0, Number(settings.targetMarginPercent) || 0)),
    priceRoundingStep: Math.max(1, Number(settings.priceRoundingStep) || 1)
  };

  return setDoc(doc(firestore, "settings", SETTINGS_ID), {
    ...normalized,
    updatedBy: user.uid,
    updatedAt: serverTimestamp()
  }, { merge: true });
}
