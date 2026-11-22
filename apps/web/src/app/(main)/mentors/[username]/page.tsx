import type { Metadata } from "next";
import { MentorProfilePage } from "@/components/educonnect/mentors/mentor-profile-page";

export const metadata: Metadata = { title: "Profil & Jadwal Mentor" };

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <MentorProfilePage username={decodeURIComponent(username)} />;
}
