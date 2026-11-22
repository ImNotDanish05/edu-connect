import type { Metadata } from "next";
import { AdminKitboxPage } from "@/components/admin/educonnect/admin-kitbox-page";

export const metadata: Metadata = { title: "KitBox · Admin" };

export default function Page() {
  return <AdminKitboxPage />;
}
