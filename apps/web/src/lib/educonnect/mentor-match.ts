import {
  EDUCATION_LEVEL_LABELS,
  INTEREST_TAG_LABELS,
  type Compatibility,
  type EducationLevel,
  type InterestTag,
  type StudentLearningProfile,
} from "@open-lms/types";

export interface MatchableMentor {
  educationLevels: EducationLevel[];
  interests: InterestTag[];
  specialties: string[];
  isVerified: boolean;
}

/**
 * Pure compatibility scoring algorithm (CORE_PLAN.md Feature 1.3):
 * - Education level match: 35 pts (or 15 pts if mentor has empty educationLevels)
 * - Interest overlap: 45 * |overlap| / min(|student.interests|, 3), capped at 45
 * - Learning goals keyword match against mentor specialties: 10 pts
 * - Verified mentor badge: 10 pts
 *
 * Returns null when the student has neither educationLevel nor any interests set.
 */
export function computeCompatibility(
  student: StudentLearningProfile | null | undefined,
  mentor: MatchableMentor,
): Compatibility | null {
  if (!student) return null;
  const hasLevel = !!student.educationLevel;
  const studentInterests = student.interests ?? [];
  if (!hasLevel && studentInterests.length === 0) return null;

  let score = 0;
  const reasons: string[] = [];

  // 1. Jenjang (35 pts)
  if (student.educationLevel) {
    if (mentor.educationLevels.includes(student.educationLevel)) {
      score += 35;
      reasons.push(`Membimbing jenjang ${EDUCATION_LEVEL_LABELS[student.educationLevel]}`);
    } else if (mentor.educationLevels.length === 0) {
      score += 15;
      reasons.push("Membimbing lintas jenjang");
    }
  }

  // 2. Minat (45 pts)
  if (studentInterests.length > 0) {
    const mentorInterestSet = new Set<InterestTag>(mentor.interests);
    const overlap = studentInterests.filter((t) => mentorInterestSet.has(t));
    if (overlap.length > 0) {
      const denom = Math.min(studentInterests.length, 3);
      const pts = Math.min(45, Math.round((45 * overlap.length) / denom));
      score += pts;
      const labels = overlap.slice(0, 3).map((t) => INTEREST_TAG_LABELS[t] ?? t);
      reasons.push(`${overlap.length} minat sama: ${labels.join(", ")}`);
    }
  }

  // 3. Target belajar (10 pts)
  const goals = (student.learningGoals ?? "").trim().toLowerCase();
  if (goals.length >= 3 && mentor.specialties.length > 0) {
    const matchedSpecialty = mentor.specialties.find((spec) => {
      const tokens = spec
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .filter((w) => w.length >= 3);
      return tokens.some((tok) => goals.includes(tok));
    });
    if (matchedSpecialty) {
      score += 10;
      reasons.push(`Spesialisasi ${matchedSpecialty} sesuai target belajarmu`);
    }
  }

  // 4. Terverifikasi (10 pts)
  if (mentor.isVerified) {
    score += 10;
    reasons.push("Mentor terverifikasi");
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return { score: clamped, reasons };
}
