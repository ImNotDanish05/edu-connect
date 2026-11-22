import type { Metadata } from "next";
import { OpportunityHubPage } from "@/components/educonnect/opportunities/opportunity-hub-page";

export const metadata: Metadata = { title: "Opportunity Hub - Beasiswa & Lomba" };

export default function Page() {
  return <OpportunityHubPage />;
}
