"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { getCatalogProducts } from "@/lib/firestore/products";
import { mockCatalogProducts } from "@/lib/mock-data";
import type { CatalogProduct } from "@/types";

export function CatalogGrid({ featuredOnly = false, limit }: { featuredOnly?: boolean; limit?: number }) {
  const [products, setProducts] = useState<CatalogProduct[]>(isFirebaseConfigured ? [] : mockCatalogProducts);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    getCatalogProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products
    .filter((product) => !featuredOnly || product.featured)
    .slice(0, limit ?? products.length);

  if (loading) return <div className="rounded-2xl border border-black/10 bg-[#f7f2ea] p-10 text-center text-black/40">Memuat katalog...</div>;
  if (!filtered.length) return <div className="rounded-2xl border border-black/10 bg-[#f7f2ea] p-10 text-center text-black/40">Belum ada produk aktif.</div>;
  return <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}
