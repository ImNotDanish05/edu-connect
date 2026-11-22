import { BookOpen, Compass, Gift, GraduationCap, Sparkles, Trophy, Users } from "lucide-react";

/** The header's primary destinations. `plans` only shows when a plan is on sale. */
export const PRIMARY_NAV = [
  { href: "/courses", label: "Modul", icon: Compass, match: (p: string) => p.startsWith("/courses") || p.startsWith("/bundles") || p.startsWith("/instructors"), signedInOnly: false, plans: false, mobileTab: true },
  { href: "/mentors", label: "Mentor", icon: Users, match: (p: string) => p.startsWith("/mentors") || p.startsWith("/mentoring"), signedInOnly: false, plans: false, mobileTab: true },
  { href: "/opportunities", label: "Peluang", icon: Trophy, match: (p: string) => p.startsWith("/opportunities"), signedInOnly: false, plans: false, mobileTab: true },
  { href: "/kitbox", label: "KitBox", icon: Gift, match: (p: string) => p.startsWith("/kitbox"), signedInOnly: false, plans: false, mobileTab: false },
  { href: "/plans", label: "Paket", icon: Sparkles, match: (p: string) => p.startsWith("/plans"), signedInOnly: false, plans: true, mobileTab: false },
  { href: "/my-learning", label: "Belajarku", icon: GraduationCap, match: (p: string) => p.startsWith("/my-learning"), signedInOnly: true, plans: false, mobileTab: true },
] as const;

export const HOME_NAV = { href: "/", label: "Beranda", icon: BookOpen, match: (p: string) => p === "/" } as const;
