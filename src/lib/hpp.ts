import type {
  HppBreakdown,
  HppSettings,
  Ingredient,
  ProductVariant
} from "@/types";

export const defaultHppSettings: HppSettings = {
  monthlyRentCost: 0,
  monthlyFixedPayrollCost: 0,
  monthlyDepreciationCost: 0,
  monthlyOtherFixedCost: 0,
  monthlyTargetServings: 0,
  targetMarginPercent: 40,
  priceRoundingStep: 500
};

function safeNonNegative(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function calculateEffectiveUnitCost(
  input: Pick<Ingredient, "purchasePrice" | "purchaseQuantity" | "yieldPercent">
) {
  const purchasePrice = safeNonNegative(input.purchasePrice);
  const purchaseQuantity = safeNonNegative(input.purchaseQuantity);
  const yieldRate = Math.min(100, safeNonNegative(input.yieldPercent)) / 100;
  const usableQuantity = purchaseQuantity * yieldRate;

  return usableQuantity > 0 ? purchasePrice / usableQuantity : 0;
}

export function calculateMonthlyFixedCosts(settings: HppSettings) {
  return (
    safeNonNegative(settings.monthlyRentCost) +
    safeNonNegative(settings.monthlyFixedPayrollCost) +
    safeNonNegative(settings.monthlyDepreciationCost) +
    safeNonNegative(settings.monthlyOtherFixedCost)
  );
}

export function calculateFixedOverheadPerServing(settings: HppSettings) {
  const target = safeNonNegative(settings.monthlyTargetServings);
  return target > 0 ? calculateMonthlyFixedCosts(settings) / target : 0;
}

export function calculateSuggestedSellingPrice(
  hpp: number,
  targetMarginPercent: number,
  roundingStep: number
) {
  const safeHpp = safeNonNegative(hpp);
  if (safeHpp <= 0) return 0;

  const margin = Math.min(99.99, safeNonNegative(targetMarginPercent)) / 100;
  const unrounded = safeHpp / (1 - margin);
  const step = Math.max(1, safeNonNegative(roundingStep) || 1);
  return Math.ceil(unrounded / step) * step;
}

export function calculateVariantHpp(
  variant: ProductVariant,
  ingredients: Ingredient[],
  settings: HppSettings = defaultHppSettings
): HppBreakdown {
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const missingIngredientIds: string[] = [];
  const inactiveIngredientIds: string[] = [];
  const invalidIngredientIds: string[] = [];
  const auditIssues: string[] = [];

  let rawProductionMaterialCostPerBatch = 0;
  let packagingCostPerBatch = 0;

  const duplicateIds = variant.recipe
    .map((line) => line.ingredientId)
    .filter((id, index, all) => all.indexOf(id) !== index);
  if (duplicateIds.length) auditIssues.push("Ada bahan yang muncul lebih dari sekali pada resep.");

  for (const line of variant.recipe) {
    const ingredient = ingredientMap.get(line.ingredientId);
    if (!ingredient) {
      missingIngredientIds.push(line.ingredientId);
      continue;
    }

    if (!ingredient.active) inactiveIngredientIds.push(ingredient.id);

    const currentUnitCost = calculateEffectiveUnitCost(ingredient);
    if (currentUnitCost <= 0) invalidIngredientIds.push(ingredient.id);

    const quantity = safeNonNegative(line.quantity);
    const lineCost = quantity * currentUnitCost;
    if (ingredient.costType === "packaging") packagingCostPerBatch += lineCost;
    else rawProductionMaterialCostPerBatch += lineCost;
  }

  const rawMaterialCostPerBatch = rawProductionMaterialCostPerBatch + packagingCostPerBatch;

  /*
   * Definisi input yang dipakai aplikasi:
   * - Kuantitas resep = kebutuhan bersih bahan untuk menghasilkan batch layak jual.
   * - Process loss = tambahan bahan produksi yang dibutuhkan karena sisa blender,
   *   tumpah, atau kehilangan proses. Kemasan tidak dikoreksi.
   * Bila admin menginput kuantitas aktual/gross yang sudah termasuk susut, process loss
   * harus diisi 0 agar biaya tidak dihitung dua kali.
   */
  const processLossPercent = Math.min(99.99, safeNonNegative(variant.processLossPercent));
  const processLossRate = processLossPercent / 100;
  const adjustedProductionMaterialCostPerBatch =
    rawProductionMaterialCostPerBatch / (1 - processLossRate);
  const processLossCostPerBatch =
    adjustedProductionMaterialCostPerBatch - rawProductionMaterialCostPerBatch;
  const adjustedMaterialCostPerBatch =
    adjustedProductionMaterialCostPerBatch + packagingCostPerBatch;

  const laborCostPerBatch = safeNonNegative(variant.laborCostPerBatch);
  const utilityCostPerBatch = safeNonNegative(variant.utilityCostPerBatch);
  const otherVariableCostPerBatch = safeNonNegative(variant.otherVariableCostPerBatch);
  const variableCostPerBatch =
    adjustedMaterialCostPerBatch +
    laborCostPerBatch +
    utilityCostPerBatch +
    otherVariableCostPerBatch;

  const batchYield = safeNonNegative(variant.batchYield);
  const variableCostPerServing = batchYield > 0 ? variableCostPerBatch / batchYield : 0;
  const fixedOverheadPerServing = calculateFixedOverheadPerServing(settings);
  const hppPerServing = variableCostPerServing + fixedOverheadPerServing;
  const suggestedSellingPrice = calculateSuggestedSellingPrice(
    hppPerServing,
    settings.targetMarginPercent,
    settings.priceRoundingStep
  );
  const currentProfitPerServing = safeNonNegative(variant.sellingPrice) - hppPerServing;
  const currentMarginPercent = safeNonNegative(variant.sellingPrice) > 0
    ? (currentProfitPerServing / safeNonNegative(variant.sellingPrice)) * 100
    : 0;

  if (!variant.recipe.length) auditIssues.push("Resep belum memiliki bahan.");
  if (batchYield <= 0) auditIssues.push("Hasil batch harus lebih dari nol.");
  if (missingIngredientIds.length) auditIssues.push("Ada bahan resep yang tidak ditemukan.");
  if (inactiveIngredientIds.length) auditIssues.push("Ada bahan nonaktif yang masih dipakai resep.");
  if (invalidIngredientIds.length) auditIssues.push("Ada bahan dengan biaya efektif nol atau tidak valid.");
  if (safeNonNegative(settings.monthlyTargetServings) <= 0 && calculateMonthlyFixedCosts(settings) > 0) {
    auditIssues.push("Target porsi bulanan belum diisi sehingga overhead belum dialokasikan.");
  }
  if (variant.active && safeNonNegative(variant.sellingPrice) <= 0) {
    auditIssues.push("Varian aktif belum memiliki harga jual.");
  }

  return {
    rawMaterialCostPerBatch,
    rawProductionMaterialCostPerBatch,
    packagingCostPerBatch,
    processLossCostPerBatch,
    adjustedMaterialCostPerBatch,
    laborCostPerBatch,
    utilityCostPerBatch,
    otherVariableCostPerBatch,
    variableCostPerBatch,
    variableCostPerServing,
    fixedOverheadPerServing,
    hppPerServing,
    suggestedSellingPrice,
    currentProfitPerServing,
    currentMarginPercent,
    missingIngredientIds: [...new Set(missingIngredientIds)],
    inactiveIngredientIds: [...new Set(inactiveIngredientIds)],
    invalidIngredientIds: [...new Set(invalidIngredientIds)],
    auditIssues: [...new Set(auditIssues)],
    isValid: auditIssues.length === 0
  };
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
