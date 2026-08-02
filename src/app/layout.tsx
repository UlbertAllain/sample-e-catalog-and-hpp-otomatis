import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexty Juice — Fresh Juice Catalog",
  description: "E-catalog toko jus dengan dashboard HPP otomatis."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
