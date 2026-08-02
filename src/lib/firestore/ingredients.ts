import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db, requireFirebaseUser } from "@/lib/firebase/client";
import { calculateEffectiveUnitCost } from "@/lib/hpp";
import type { Ingredient } from "@/types";

export type IngredientInput = Omit<Ingredient, "id" | "effectiveUnitCost">;

async function requireAdminDb() {
  if (!db) throw new Error("Firebase client belum dikonfigurasi.");
  const user = await requireFirebaseUser();
  return { firestore: db, user };
}

function mapIngredient(id: string, data: Record<string, unknown>): Ingredient {
  return {
    id,
    name: String(data.name ?? ""),
    sku: String(data.sku ?? ""),
    unit: (data.unit ?? "gram") as Ingredient["unit"],
    costType: (data.costType ?? "material") as Ingredient["costType"],
    purchasePrice: Number(data.purchasePrice ?? 0),
    purchaseQuantity: Number(data.purchaseQuantity ?? 0),
    yieldPercent: Number(data.yieldPercent ?? 100),
    effectiveUnitCost: Number(data.effectiveUnitCost ?? 0),
    supplier: data.supplier ? String(data.supplier) : "",
    notes: data.notes ? String(data.notes) : "",
    active: data.active !== false
  };
}

export async function getIngredients(): Promise<Ingredient[]> {
  const { firestore } = await requireAdminDb();
  const snapshot = await getDocs(query(collection(firestore, "ingredients"), orderBy("name")));
  return snapshot.docs.map((item) => mapIngredient(item.id, item.data()));
}

export async function getIngredient(id: string): Promise<Ingredient | null> {
  const { firestore } = await requireAdminDb();
  const snapshot = await getDoc(doc(firestore, "ingredients", id));
  return snapshot.exists() ? mapIngredient(snapshot.id, snapshot.data()) : null;
}

export async function saveIngredient(input: IngredientInput, id?: string) {
  const { firestore, user } = await requireAdminDb();
  const target = id ? doc(firestore, "ingredients", id) : doc(collection(firestore, "ingredients"));
  const existingSnapshot = id ? await getDoc(target) : null;
  const existing = existingSnapshot?.exists()
    ? mapIngredient(existingSnapshot.id, existingSnapshot.data())
    : null;

  const normalized: IngredientInput = {
    ...input,
    name: input.name.trim(),
    sku: input.sku.trim(),
    supplier: input.supplier?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
    purchasePrice: Math.max(0, Number(input.purchasePrice) || 0),
    purchaseQuantity: Math.max(0, Number(input.purchaseQuantity) || 0),
    yieldPercent: input.costType === "packaging"
      ? 100
      : Math.min(100, Math.max(0, Number(input.yieldPercent) || 0))
  };
  const effectiveUnitCost = calculateEffectiveUnitCost(normalized);
  const costChanged = !existing ||
    existing.purchasePrice !== normalized.purchasePrice ||
    existing.purchaseQuantity !== normalized.purchaseQuantity ||
    existing.yieldPercent !== normalized.yieldPercent ||
    existing.unit !== normalized.unit ||
    existing.costType !== normalized.costType;

  const batch = writeBatch(firestore);
  batch.set(target, {
    ...normalized,
    effectiveUnitCost,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
    ...(id ? {} : { createdAt: serverTimestamp(), createdBy: user.uid })
  }, { merge: true });

  if (costChanged) {
    const historyRef = doc(collection(firestore, "ingredientCostHistory"));
    batch.set(historyRef, {
      ingredientId: target.id,
      ingredientName: normalized.name,
      unit: normalized.unit,
      costType: normalized.costType,
      purchasePrice: normalized.purchasePrice,
      purchaseQuantity: normalized.purchaseQuantity,
      yieldPercent: normalized.yieldPercent,
      effectiveUnitCost,
      previousCost: existing ? {
        unit: existing.unit,
        costType: existing.costType,
        purchasePrice: existing.purchasePrice,
        purchaseQuantity: existing.purchaseQuantity,
        yieldPercent: existing.yieldPercent,
        effectiveUnitCost: calculateEffectiveUnitCost(existing)
      } : null,
      recordedBy: user.uid,
      recordedAt: serverTimestamp()
    });
  }

  await batch.commit();
  return target.id;
}

export async function deleteIngredient(id: string) {
  const { firestore } = await requireAdminDb();
  return deleteDoc(doc(firestore, "ingredients", id));
}
