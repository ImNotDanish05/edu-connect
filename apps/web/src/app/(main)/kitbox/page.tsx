import type { Metadata } from "next";
import { KitboxPage } from "@/components/educonnect/kitbox/kitbox-page";

export const metadata: Metadata = { title: "Educational KitBox - Berbagi & Klaim Gratis" };

export default function Page() {
  return <KitboxPage />;
}
