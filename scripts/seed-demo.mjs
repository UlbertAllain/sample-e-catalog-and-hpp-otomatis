import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } = process.env;
if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error("Environment Firebase Admin belum lengkap di .env.local.");
  process.exit(1);
}

const app = initializeApp({
  credential: cert({
    projectId: FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
  })
});
const db = getFirestore(app);
const now = FieldValue.serverTimestamp();

const ingredients = [
  { id: "mangga", name: "Mangga Harum Manis", sku: "FR-MNG", unit: "gram", costType: "material", purchasePrice: 35000, purchaseQuantity: 1000, yieldPercent: 72, supplier: "Pasar Buah", notes: "Harga acuan per kg", active: true },
  { id: "gula-cair", name: "Gula Cair", sku: "SC-GLA", unit: "ml", costType: "material", purchasePrice: 18000, purchaseQuantity: 1000, yieldPercent: 100, supplier: "Supplier F&B", notes: "", active: true },
  { id: "air-mineral", name: "Air Mineral", sku: "SC-AIR", unit: "ml", costType: "material", purchasePrice: 6000, purchaseQuantity: 19000, yieldPercent: 100, supplier: "Depot", notes: "Galon 19 liter", active: true },
  { id: "es-batu", name: "Es Batu", sku: "SC-ICE", unit: "gram", costType: "material", purchasePrice: 15000, purchaseQuantity: 10000, yieldPercent: 95, supplier: "Ice supplier", notes: "Yield memperhitungkan es mencair", active: true },
  { id: "cup-16", name: "Cup 16 oz + Tutup", sku: "PK-C16", unit: "pcs", costType: "packaging", purchasePrice: 65000, purchaseQuantity: 50, yieldPercent: 100, supplier: "Packaging supplier", notes: "", active: true },
  { id: "sedotan", name: "Sedotan", sku: "PK-STD", unit: "pcs", costType: "packaging", purchasePrice: 12000, purchaseQuantity: 100, yieldPercent: 100, supplier: "Packaging supplier", notes: "", active: true }
].map((item) => ({
  ...item,
  effectiveUnitCost: item.purchasePrice / (item.purchaseQuantity * item.yieldPercent / 100),
  createdAt: now,
  updatedAt: now
}));

const product = {
  name: "Mango Sunshine",
  slug: "mango-sunshine",
  category: "Fresh Juice",
  description: "Jus mangga segar dengan rasa manis alami dan tekstur lembut.",
  imageUrl: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=1200&q=85",
  imagePublicId: "",
  featured: true,
  active: true,
  sortOrder: 1,
  variants: [
    {
      id: "regular",
      name: "Regular",
      sku: "MNG-REG",
      active: true,
      sellingPrice: 24000,
      batchYield: 1,
      processLossPercent: 3,
      laborCostPerBatch: 800,
      utilityCostPerBatch: 350,
      otherVariableCostPerBatch: 0,
      recipe: [
        { id: "r-mangga", ingredientId: "mangga", quantity: 180 },
        { id: "r-gula", ingredientId: "gula-cair", quantity: 15 },
        { id: "r-air", ingredientId: "air-mineral", quantity: 120 },
        { id: "r-es", ingredientId: "es-batu", quantity: 180 },
        { id: "r-cup", ingredientId: "cup-16", quantity: 1 },
        { id: "r-straw", ingredientId: "sedotan", quantity: 1 }
      ]
    }
  ],
  createdAt: now,
  updatedAt: now
};

const catalogProduct = {
  name: product.name,
  slug: product.slug,
  category: product.category,
  description: product.description,
  imageUrl: product.imageUrl,
  featured: product.featured,
  active: product.active,
  sortOrder: product.sortOrder,
  variants: product.variants.map(({ id, name, sellingPrice, active }) => ({ id, name, sellingPrice, active })),
  createdAt: now,
  updatedAt: now
};

const batch = db.batch();
for (const ingredient of ingredients) {
  const { id, ...data } = ingredient;
  batch.set(db.collection("ingredients").doc(id), data, { merge: true });
}
batch.set(db.collection("products").doc("mango-sunshine"), product, { merge: true });
batch.set(db.collection("catalogProducts").doc("mango-sunshine"), catalogProduct, { merge: true });
batch.set(db.collection("settings").doc("hpp"), {
  monthlyRentCost: 2000000,
  monthlyFixedPayrollCost: 1000000,
  monthlyDepreciationCost: 300000,
  monthlyOtherFixedCost: 200000,
  monthlyTargetServings: 2000,
  targetMarginPercent: 40,
  priceRoundingStep: 500,
  updatedAt: now
}, { merge: true });

await batch.commit();
console.log("Data demo berhasil ditulis ke Firestore.");
