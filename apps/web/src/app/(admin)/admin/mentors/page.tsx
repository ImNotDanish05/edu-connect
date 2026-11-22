import type { Metadata } from "next";
import { AdminMentorsPage } from "@/components/admin/educonnect/admin-mentors-page";

export const metadata: Metadata = { title: "Mentors · Admin" };

export default function Page() {
  return <AdminMentorsPage />;
}
