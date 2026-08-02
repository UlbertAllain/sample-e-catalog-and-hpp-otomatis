import type { CatalogProduct } from "@/types";

export const mockCatalogProducts: CatalogProduct[] = [
  {
    id: "demo-mango",
    name: "Mango Sunshine",
    slug: "mango-sunshine",
    category: "Fresh Juice",
    description: "Jus mangga segar dengan rasa manis alami dan tekstur lembut.",
    imageUrl: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=1200&q=85",
    featured: true,
    active: true,
    sortOrder: 1,
    variants: [
      { id: "regular", name: "Regular", sellingPrice: 24000, active: true },
      { id: "large", name: "Large", sellingPrice: 29000, active: true }
    ]
  },
  {
    id: "demo-avocado",
    name: "Avocado Cream",
    slug: "avocado-cream",
    category: "Creamy Series",
    description: "Perpaduan alpukat matang dan susu dengan tekstur creamy.",
    imageUrl: "https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=1200&q=85",
    featured: true,
    active: true,
    sortOrder: 2,
    variants: [{ id: "regular", name: "Regular", sellingPrice: 22000, active: true }]
  },
  {
    id: "demo-orange",
    name: "Orange Boost",
    slug: "orange-boost",
    category: "Fresh Juice",
    description: "Jeruk peras segar dengan rasa ringan untuk menemani aktivitas harian.",
    imageUrl: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=1200&q=85",
    featured: false,
    active: true,
    sortOrder: 3,
    variants: [{ id: "regular", name: "Regular", sellingPrice: 17000, active: true }]
  }
];
