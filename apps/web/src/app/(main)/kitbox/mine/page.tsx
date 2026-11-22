import type { Metadata } from "next";
import { MyKitboxPage } from "@/components/educonnect/kitbox/my-kitbox-page";

export const metadata: Metadata = { title: "Riwayat KitBox Saya" };

export default function Page() {
  return <MyKitboxPage />;
}
