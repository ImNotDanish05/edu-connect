import { Suspense } from "react";
import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog/catalog-page";

export const metadata: Metadata = { title: "Modul", description: "Jelajahi seluruh modul pembelajaran: cari dan filter berdasarkan topik, tingkat kesulitan, bahasa, dan harga." };

export default function CoursesPage() {
  return (
    <Suspense>
      <CatalogPage />
    </Suspense>
  );
}
