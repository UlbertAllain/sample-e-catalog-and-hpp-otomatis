import type { HppSettings, Ingredient } from "@/types";
import type { IngredientInput } from "@/lib/firestore/ingredients";
import type { ProductInput } from "@/lib/firestore/products";
import { calculateVariantHpp, slugify } from "@/lib/hpp";

export function validateIngredient(input: IngredientInput) {
  const errors: string[] = [];
  if (!input.name.trim()) errors.push("Nama bahan wajib diisi.");
  if (Number(input.purchasePrice) <= 0) errors.push("Harga beli harus lebih dari nol.");
  if (Number(input.purchaseQuantity) <= 0) errors.push("Jumlah pembelian harus lebih dari nol.");
  if (Number(input.yieldPercent) <= 0 || Number(input.yieldPercent) > 100) {
    errors.push("Yield bahan harus lebih dari 0% dan maksimal 100%.");
  }
  if (input.costType === "packaging" && Number(input.yieldPercent) !== 100) {
    errors.push("Yield kemasan harus 100%. Gunakan susut proses pada resep untuk kehilangan produksi.");
  }
  return errors;
}

export function validateHppSettings(settings: HppSettings) {
  const errors: string[] = [];
  const costs = [
    settings.monthlyRentCost,
    settings.monthlyFixedPayrollCost,
    settings.monthlyDepreciationCost,
    settings.monthlyOtherFixedCost
  ];
  if (costs.some((value) => Number(value) < 0)) errors.push("Biaya tetap tidak boleh negatif.");
  if (Number(settings.monthlyTargetServings) <= 0) errors.push("Target porsi bulanan harus lebih dari nol.");
  if (Number(settings.targetMarginPercent) < 0 || Number(settings.targetMarginPercent) >= 100) {
    errors.push("Target margin harus berada di antara 0% sampai kurang dari 100%.");
  }
  if (Number(settings.priceRoundingStep) <= 0) errors.push("Kelipatan pembulatan harga harus lebih dari nol.");
  return errors;
}

export function validateProduct(
  product: ProductInput,
  ingredients: Ingredient[],
  settings: HppSettings
) {
  const errors: string[] = [];
  if (!product.name.trim()) errors.push("Nama produk wajib diisi.");
  if (!slugify(product.slug || product.name)) errors.push("Slug produk tidak valid.");
  if (!product.category.trim()) errors.push("Kategori produk wajib diisi.");
  if (!product.description.trim()) errors.push("Deskripsi produk wajib diisi.");
  if (!product.imageUrl.trim()) errors.push("Gambar produk wajib diisi.");
  if (!product.variants.length) errors.push("Produk harus memiliki minimal satu varian.");
  if (product.active && !product.variants.some((variant) => variant.active)) {
    errors.push("Produk aktif harus memiliki minimal satu varian aktif.");
  }

  const variantNames = new Set<string>();
  const variantSkus = new Set<string>();

  for (const [index, variant] of product.variants.entries()) {
    const label = variant.name.trim() || `Varian ${index + 1}`;
    const normalizedName = label.toLowerCase();
    if (!variant.name.trim()) errors.push(`Nama ${label} wajib diisi.`);
    if (variantNames.has(normalizedName)) errors.push(`Nama varian "${label}" digunakan lebih dari sekali.`);
    variantNames.add(normalizedName);

    if (variant.sku.trim()) {
      const sku = variant.sku.trim().toLowerCase();
      if (variantSkus.has(sku)) errors.push(`SKU varian "${variant.sku}" digunakan lebih dari sekali.`);
      variantSkus.add(sku);
    }

    if (variant.active && Number(variant.sellingPrice) <= 0) {
      errors.push(`${label}: harga jual varian aktif harus lebih dari nol.`);
    }
    if (!Number.isInteger(Number(variant.batchYield)) || Number(variant.batchYield) <= 0) {
      errors.push(`${label}: hasil batch harus berupa bilangan bulat lebih dari nol.`);
    }
    if (Number(variant.processLossPercent) < 0 || Number(variant.processLossPercent) >= 100) {
      errors.push(`${label}: process loss harus berada di antara 0% sampai kurang dari 100%.`);
    }
    if ([variant.laborCostPerBatch, variant.utilityCostPerBatch, variant.otherVariableCostPerBatch].some((value) => Number(value) < 0)) {
      errors.push(`${label}: komponen biaya batch tidak boleh negatif.`);
    }
    if (!variant.recipe.length) errors.push(`${label}: resep belum memiliki bahan.`);

    const duplicateIngredient = variant.recipe.some((line, lineIndex, lines) =>
      lines.findIndex((candidate) => candidate.ingredientId === line.ingredientId) !== lineIndex
    );
    if (duplicateIngredient) errors.push(`${label}: satu bahan tidak boleh muncul dua kali dalam resep yang sama.`);
    if (variant.recipe.some((line) => Number(line.quantity) <= 0)) {
      errors.push(`${label}: jumlah pemakaian bahan harus lebih dari nol.`);
    }

    const hpp = calculateVariantHpp(variant, ingredients, settings);
    if (hpp.missingIngredientIds.length) errors.push(`${label}: ada bahan resep yang sudah tidak ditemukan.`);
    if (variant.active && hpp.inactiveIngredientIds.length) errors.push(`${label}: ada bahan nonaktif pada resep varian aktif.`);
    if (hpp.invalidIngredientIds.length) errors.push(`${label}: ada bahan dengan harga atau yield yang belum valid.`);
  }

  return [...new Set(errors)];
}

export function normalizeProduct(product: ProductInput): ProductInput {
  return {
    ...product,
    name: product.name.trim(),
    slug: slugify(product.slug || product.name),
    category: product.category.trim(),
    description: product.description.trim(),
    imageUrl: product.imageUrl.trim(),
    imagePublicId: product.imagePublicId?.trim() ?? "",
    sortOrder: Number.isFinite(Number(product.sortOrder)) ? Number(product.sortOrder) : 0,
    variants: product.variants.map((variant) => ({
      ...variant,
      name: variant.name.trim(),
      sku: variant.sku.trim(),
      sellingPrice: Math.max(0, Number(variant.sellingPrice) || 0),
      batchYield: Math.max(0, Number(variant.batchYield) || 0),
      processLossPercent: Math.max(0, Number(variant.processLossPercent) || 0),
      laborCostPerBatch: Math.max(0, Number(variant.laborCostPerBatch) || 0),
      utilityCostPerBatch: Math.max(0, Number(variant.utilityCostPerBatch) || 0),
      otherVariableCostPerBatch: Math.max(0, Number(variant.otherVariableCostPerBatch) || 0),
      recipe: variant.recipe.map((line) => ({
        ...line,
        quantity: Math.max(0, Number(line.quantity) || 0)
      }))
    }))
  };
}

