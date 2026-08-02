export type Unit = "gram" | "ml" | "pcs";
export type IngredientCostType = "material" | "packaging";

export interface Ingredient {
  id: string;
  name: string;
  sku: string;
  unit: Unit;
  costType: IngredientCostType;
  purchasePrice: number;
  purchaseQuantity: number;
  yieldPercent: number;
  effectiveUnitCost: number;
  supplier?: string;
  notes?: string;
  active: boolean;
}

export interface RecipeItem {
  id: string;
  ingredientId: string;
  quantity: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  active: boolean;
  sellingPrice: number;
  batchYield: number;
  processLossPercent: number;
  laborCostPerBatch: number;
  utilityCostPerBatch: number;
  otherVariableCostPerBatch: number;
  recipe: RecipeItem[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  imageUrl: string;
  imagePublicId?: string;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  variants: ProductVariant[];
}

export interface CatalogVariant {
  id: string;
  name: string;
  sellingPrice: number;
  active: boolean;
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  imageUrl: string;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  variants: CatalogVariant[];
}

export interface HppSettings {
  monthlyRentCost: number;
  monthlyFixedPayrollCost: number;
  monthlyDepreciationCost: number;
  monthlyOtherFixedCost: number;
  monthlyTargetServings: number;
  targetMarginPercent: number;
  priceRoundingStep: number;
}

export interface HppBreakdown {
  rawMaterialCostPerBatch: number;
  rawProductionMaterialCostPerBatch: number;
  packagingCostPerBatch: number;
  processLossCostPerBatch: number;
  adjustedMaterialCostPerBatch: number;
  laborCostPerBatch: number;
  utilityCostPerBatch: number;
  otherVariableCostPerBatch: number;
  variableCostPerBatch: number;
  variableCostPerServing: number;
  fixedOverheadPerServing: number;
  hppPerServing: number;
  suggestedSellingPrice: number;
  currentProfitPerServing: number;
  currentMarginPercent: number;
  missingIngredientIds: string[];
  inactiveIngredientIds: string[];
  invalidIngredientIds: string[];
  auditIssues: string[];
  isValid: boolean;
}
