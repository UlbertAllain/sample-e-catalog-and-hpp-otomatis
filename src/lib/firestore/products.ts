import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { db, requireFirebaseUser } from "@/lib/firebase/client";
import type { CatalogProduct, Product } from "@/types";

export type ProductInput = Omit<Product, "id">;

function requirePublicDb() {
  if (!db) throw new Error("Firebase client belum dikonfigurasi.");
  return db;
}

async function requireAdminDb() {
  const firestore = requirePublicDb();
  await requireFirebaseUser();
  return firestore;
}

function mapProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    name: String(data.name ?? ""),
    slug: String(data.slug ?? ""),
    category: String(data.category ?? ""),
    description: String(data.description ?? ""),
    imageUrl: String(data.imageUrl ?? ""),
    imagePublicId: data.imagePublicId ? String(data.imagePublicId) : "",
    featured: data.featured === true,
    active: data.active !== false,
    sortOrder: Number(data.sortOrder ?? 0),
    variants: Array.isArray(data.variants) ? data.variants as Product["variants"] : []
  };
}

function mapCatalogProduct(id: string, data: Record<string, unknown>): CatalogProduct {
  return {
    id,
    name: String(data.name ?? ""),
    slug: String(data.slug ?? ""),
    category: String(data.category ?? ""),
    description: String(data.description ?? ""),
    imageUrl: String(data.imageUrl ?? ""),
    featured: data.featured === true,
    active: data.active !== false,
    sortOrder: Number(data.sortOrder ?? 0),
    variants: Array.isArray(data.variants) ? data.variants as CatalogProduct["variants"] : []
  };
}

export function toCatalogProduct(product: ProductInput | Product): Omit<CatalogProduct, "id"> {
  return {
    name: product.name,
    slug: product.slug,
    category: product.category,
    description: product.description,
    imageUrl: product.imageUrl,
    featured: product.featured,
    active: product.active,
    sortOrder: product.sortOrder,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sellingPrice: variant.sellingPrice,
      active: variant.active
    }))
  };
}

export async function getProducts(): Promise<Product[]> {
  const firestore = await requireAdminDb();
  const snapshot = await getDocs(query(collection(firestore, "products"), orderBy("sortOrder")));
  return snapshot.docs.map((item) => mapProduct(item.id, item.data()));
}

export async function getProduct(id: string): Promise<Product | null> {
  const firestore = await requireAdminDb();
  const snapshot = await getDoc(doc(firestore, "products", id));
  return snapshot.exists() ? mapProduct(snapshot.id, snapshot.data()) : null;
}

export async function isProductSlugTaken(slug: string, excludeId?: string) {
  const firestore = await requireAdminDb();
  const snapshot = await getDocs(query(
    collection(firestore, "products"),
    where("slug", "==", slug),
    limit(2)
  ));
  return snapshot.docs.some((item) => item.id !== excludeId);
}

export async function saveProduct(input: ProductInput, id?: string) {
  const firestore = await requireAdminDb();
  const productRef = id ? doc(firestore, "products", id) : doc(collection(firestore, "products"));
  const catalogRef = doc(firestore, "catalogProducts", productRef.id);
  const batch = writeBatch(firestore);

  batch.set(productRef, {
    ...input,
    updatedAt: serverTimestamp(),
    ...(id ? {} : { createdAt: serverTimestamp() })
  }, { merge: true });
  batch.set(catalogRef, {
    ...toCatalogProduct(input),
    updatedAt: serverTimestamp(),
    ...(id ? {} : { createdAt: serverTimestamp() })
  }, { merge: true });

  await batch.commit();
  return productRef.id;
}

export async function deleteProduct(id: string) {
  const firestore = await requireAdminDb();
  const batch = writeBatch(firestore);
  batch.delete(doc(firestore, "products", id));
  batch.delete(doc(firestore, "catalogProducts", id));
  return batch.commit();
}

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  const firestore = requirePublicDb();
  const snapshot = await getDocs(query(
    collection(firestore, "catalogProducts"),
    where("active", "==", true),
    orderBy("sortOrder")
  ));
  return snapshot.docs.map((item) => mapCatalogProduct(item.id, item.data()));
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const firestore = requirePublicDb();
  const snapshot = await getDocs(query(
    collection(firestore, "catalogProducts"),
    where("slug", "==", slug),
    where("active", "==", true)
  ));
  const first = snapshot.docs[0];
  return first ? mapCatalogProduct(first.id, first.data()) : null;
}

export async function isIngredientUsed(ingredientId: string) {
  const products = await getProducts();
  return products.some((product) =>
    product.variants.some((variant) =>
      variant.recipe.some((line) => line.ingredientId === ingredientId)
    )
  );
}

// Kept for explicit one-off catalog repair/migration tasks.
export async function syncCatalogProduct(product: Product) {
  const firestore = await requireAdminDb();
  return setDoc(doc(firestore, "catalogProducts", product.id), {
    ...toCatalogProduct(product),
    updatedAt: serverTimestamp()
  }, { merge: true });
}
