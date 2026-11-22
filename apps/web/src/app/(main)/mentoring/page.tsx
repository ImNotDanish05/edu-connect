import type { Metadata } from "next";
import { MentoringPage } from "@/components/educonnect/mentors/mentoring-page";

export const metadata: Metadata = { title: "Sesi Mentoring Saya" };

export default function Page() {
  return <MentoringPage />;
}
