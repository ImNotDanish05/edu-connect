/**
 * EduConnect MVP shared contracts (Features 1.1 – 1.8).
 * Re-exported from packages/types/src/index.ts.
 */

export const EDUCATION_LEVELS = ["SD", "SMP", "SMA", "KULIAH"] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  SD: "SD",
  SMP: "SMP",
  SMA: "SMA / SMK",
  KULIAH: "Kuliah",
};

/** Fixed interest vocabulary shared between student profiles and mentors. */
export const INTEREST_TAGS = [
  "matematika",
  "sains",
  "bahasa-inggris",
  "bahasa-indonesia",
  "akuntansi",
  "ekonomi",
  "biologi",
  "fisika",
  "kimia",
  "coding",
  "desain",
  "public-speaking",
  "persiapan-snbt",
  "olimpiade",
  "skripsi",
  "beasiswa",
] as const;
export type InterestTag = (typeof INTEREST_TAGS)[number];

export const INTEREST_TAG_LABELS: Record<InterestTag, string> = {
  matematika: "Matematika",
  sains: "Sains Terpadu",
  "bahasa-inggris": "Bahasa Inggris",
  "bahasa-indonesia": "Bahasa Indonesia",
  akuntansi: "Akuntansi",
  ekonomi: "Ekonomi",
  biologi: "Biologi",
  fisika: "Fisika",
  kimia: "Kimia",
  coding: "Coding & IT",
  desain: "Desain Grafis",
  "public-speaking": "Public Speaking",
  "persiapan-snbt": "Persiapan SNBT",
  olimpiade: "Olimpiade Sains",
  skripsi: "Riset & Skripsi",
  beasiswa: "Persiapan Beasiswa",
};

export interface StudentLearningProfile {
  educationLevel: EducationLevel | null;
  gradeYear: number | null;
  interests: InterestTag[];
  learningGoals: string | null;
}

// ─── Feature 1.3: 1-on-1 Mentoring ──────────────────────────────────────────

export type MentorSessionStatus = "PENDING" | "CONFIRMED" | "DECLINED" | "CANCELED" | "COMPLETED";

export interface Compatibility {
  score: number;
  reasons: string[];
}

export interface MentorAvailabilitySlot {
  /** 0 = Minggu .. 6 = Sabtu (in WIB / Asia/Jakarta, UTC+7) */
  weekday: number;
  /** Minutes from 00:00 WIB (0..1439) */
  startMinute: number;
  /** Minutes from 00:00 WIB (1..1440) */
  endMinute: number;
}

export interface MentorCard {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string;
  institution: string | null;
  specialties: string[];
  educationLevels: EducationLevel[];
  isVerified: boolean;
  isActive?: boolean;
  sessionsCompleted: number;
  pricePerSession: number;
  sessionMinutes: number;
  compatibility: Compatibility | null;
}

export interface MentorDetail extends MentorCard {
  bio: string | null;
  major: string | null;
  interests: InterestTag[];
  availability: MentorAvailabilitySlot[];
}

export interface MentorSlot {
  startsAt: string;
  endsAt: string;
}

export interface MentorSession {
  id: string;
  status: MentorSessionStatus;
  scheduledAt: string;
  durationMinutes: number;
  topic: string;
  message: string | null;
  meetingUrl: string | null;
  compatibilityScore: number | null;
  cancelReason: string | null;
  mentor: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    institution?: string | null;
  };
  student: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    educationLevel: EducationLevel | null;
  };
  viewerRole: "STUDENT" | "MENTOR";
  createdAt: string;
}

// ─── Features 1.4 & 1.5: Opportunity Hub (Scholarships & Competitions) ─────

export type OpportunityKind = "SCHOLARSHIP" | "COMPETITION";
export type OpportunityStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface OpportunityCard {
  id: string;
  slug: string;
  kind: OpportunityKind;
  title: string;
  organizer: string;
  summary: string;
  educationLevels: EducationLevel[];
  tags: string[];
  location: string | null;
  deadlineAt: string;
  isVerified: boolean;
  saved: boolean;
  saveCount: number;
  status?: OpportunityStatus;
}

export interface OpportunityDetail extends OpportunityCard {
  descriptionHtml: string;
  requirements: string[];
  benefits: string[];
  registrationUrl: string;
  sourceUrl?: string | null;
  opensAt: string | null;
}

// ─── Features 1.7 & 1.8: Educational KitBox & Impact Tracker ────────────────

export type KitboxStatus = "ACTIVE" | "ARCHIVED";
export type KitboxRequestStatus = "SUBMITTED" | "APPROVED" | "REJECTED" | "SHIPPED" | "DELIVERED" | "CANCELED";
export type DonationItemType = "BOOK" | "STATIONERY" | "OTHER";
export type DonationCondition = "NEW" | "LIKE_NEW" | "GOOD";
export type DonationDelivery = "DROP_POINT" | "COURIER" | "PICKUP";
export type DonationStatus = "PLEDGED" | "RECEIVED" | "DISTRIBUTED" | "REJECTED" | "CANCELED";

export interface KitboxPackage {
  id: string;
  slug: string;
  name: string;
  summary: string;
  contents: string[];
  educationLevels: EducationLevel[];
  stock: number;
  imageUrl: string | null;
  status?: KitboxStatus;
}

export interface KitboxRequest {
  id: string;
  package: { id: string; name: string; slug?: string };
  status: KitboxRequestStatus;
  recipientName: string;
  phone?: string;
  educationLevel?: EducationLevel;
  institution?: string | null;
  shippingAddress?: string;
  city: string;
  reason: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KitboxDonation {
  id: string;
  donorName?: string;
  donorContact?: string;
  isAnonymous?: boolean;
  itemType: DonationItemType;
  itemDescription: string;
  quantity: number;
  condition: DonationCondition;
  deliveryMethod: DonationDelivery;
  status: DonationStatus;
  adminNote?: string | null;
  photoUrl: string | null;
  createdAt: string;
}

export interface KitboxImpact {
  itemsDonated: number;
  donors: number;
  kitsDelivered: number;
  studentsHelped: number;
  recentDonors: { name: string; itemType: DonationItemType; quantity?: number; at: string }[];
}
