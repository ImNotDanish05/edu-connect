import { describe, expect, it } from "vitest";
import { computeCompatibility } from "@/lib/educonnect/mentor-match";

describe("mentor compatibility score (Feature 1.3)", () => {
  const mentor = {
    educationLevels: ["SMA" as const, "KULIAH" as const],
    interests: ["akuntansi" as const, "ekonomi" as const, "persiapan-snbt" as const],
    specialties: ["Akuntansi Menengah", "Persiapan SNBT"],
    isVerified: true,
  };

  it("returns null when student has no educationLevel and no interests", () => {
    expect(
      computeCompatibility(
        { educationLevel: null, gradeYear: null, interests: [], learningGoals: null },
        mentor,
      ),
    ).toBeNull();
  });

  it("scores 100 on a full match (level 35 + 3 interests 45 + goal keyword 10 + verified 10)", () => {
    const res = computeCompatibility(
      {
        educationLevel: "SMA",
        gradeYear: 11,
        interests: ["akuntansi", "ekonomi", "persiapan-snbt"],
        learningGoals: "Lolos SNBT Akuntansi FEB UNDIP",
      },
      mentor,
    );
    expect(res).not.toBeNull();
    expect(res!.score).toBe(100);
    expect(res!.reasons).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Membimbing jenjang SMA/),
        expect.stringMatching(/3 minat sama/),
        expect.stringMatching(/Mentor terverifikasi/),
      ]),
    );
  });

  it("gives partial score when level does not match and mentor is unverified", () => {
    const res = computeCompatibility(
      {
        educationLevel: "SD",
        gradeYear: 5,
        interests: ["akuntansi", "biologi", "fisika"],
        learningGoals: null,
      },
      { ...mentor, isVerified: false },
    );
    expect(res).not.toBeNull();
    // 0 (level) + 15 (1 of 3 interests) + 0 (goal) + 0 (verified) = 15
    expect(res!.score).toBe(15);
  });
});
