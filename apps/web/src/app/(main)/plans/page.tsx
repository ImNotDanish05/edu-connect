import type { Metadata } from "next";
import { PlansPage } from "@/components/plans/plans-page";

export const metadata: Metadata = { title: "Paket", description: "Satu langganan untuk mengakses seluruh modul yang termasuk dalam paket. Batalkan kapan saja." };

export default function Page() {
  return <PlansPage />;
}
