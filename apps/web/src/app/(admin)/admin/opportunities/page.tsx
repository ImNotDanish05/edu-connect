import type { Metadata } from "next";
import { AdminOpportunitiesPage } from "@/components/admin/educonnect/admin-opportunities-page";

export const metadata: Metadata = { title: "Opportunities · Admin" };

export default function Page() {
  return <AdminOpportunitiesPage />;
}
