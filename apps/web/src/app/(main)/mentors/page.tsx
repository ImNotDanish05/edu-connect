import type { Metadata } from "next";
import { MentorDirectoryPage } from "@/components/educonnect/mentors/mentor-directory-page";

export const metadata: Metadata = { title: "Mentor 1-on-1" };

export default function Page() {
  return <MentorDirectoryPage />;
}
