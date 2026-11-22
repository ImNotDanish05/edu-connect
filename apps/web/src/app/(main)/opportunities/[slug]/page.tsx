import type { Metadata } from "next";
import { OpportunityDetailPage } from "@/components/educonnect/opportunities/opportunity-detail-page";

export const metadata: Metadata = { title: "Detail Peluang" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <OpportunityDetailPage slug={decodeURIComponent(slug)} />;
}
