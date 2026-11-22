"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MentorSessionStatus, StudentLearningProfile } from "@open-lms/types";
import { qk } from "@/lib/query-keys";
import {
  adminListMentors,
  adminListOpportunities,
  adminUpdateKitboxDonationStatus,
  adminUpdateKitboxRequestStatus,
  adminUpsertKitboxPackage,
  adminUpsertMentor,
  adminUpsertOpportunity,
  cancelKitboxDonation,
  cancelKitboxRequest,
  cancelMentorSession,
  completeMentorSession,
  confirmMentorSession,
  declineMentorSession,
  getActiveMentorProfile,
  getEduconnectCounts,
  getKitboxImpact,
  getMentorByUsername,
  getMentorSlots,
  getOpportunityBySlug,
  getStudentProfile,
  listKitboxPackages,
  listMentors,
  listMyKitboxDonations,
  listMyKitboxRequests,
  listMySessions,
  listPublicOpportunities,
  listSavedOpportunities,
  requestMentorSession,
  resetDemoData,
  setActiveMentorId,
  submitKitboxDonation,
  submitKitboxRequest,
  toggleSaveOpportunity,
  updateMentorAvailability,
  updateStudentProfile,
  type MentorListFilter,
  type OpportunityFilter,
} from "./mock-store";

export function useStudentProfile() {
  return useQuery({
    queryKey: qk.educonnectProfile,
    queryFn: () => getStudentProfile(),
  });
}

export function useUpdateStudentProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<StudentLearningProfile>) => updateStudentProfile(patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.educonnectProfile });
      void qc.invalidateQueries({ queryKey: qk.mentorsAll });
    },
  });
}

export function useMentors(filter: MentorListFilter = {}) {
  return useQuery({
    queryKey: qk.mentors(filter as Record<string, unknown>),
    queryFn: () => listMentors(filter),
  });
}

export function useMentorDetail(username: string) {
  return useQuery({
    queryKey: qk.mentor(username),
    queryFn: () => getMentorByUsername(username),
    enabled: !!username,
  });
}

export function useMentorSlots(username: string) {
  return useQuery({
    queryKey: qk.mentorSlots(username),
    queryFn: () => getMentorSlots(username),
    enabled: !!username,
  });
}

export function useMySessions(asRole: "student" | "mentor", status: MentorSessionStatus | "ALL" = "ALL") {
  return useQuery({
    queryKey: qk.mySessions(asRole, status),
    queryFn: () => listMySessions({ as: asRole, status }),
  });
}

export function useActiveMentor() {
  return useQuery({
    queryKey: ["educonnect-active-mentor"],
    queryFn: () => getActiveMentorProfile(),
  });
}

export function useSwitchActiveMentor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mentorId: string) => {
      setActiveMentorId(mentorId);
      return getActiveMentorProfile();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educonnect-active-mentor"] });
      void qc.invalidateQueries({ queryKey: qk.mySessionsAll });
    },
  });
}

export function useRequestSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<typeof requestMentorSession>[0]) => requestMentorSession(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.mySessionsAll });
      void qc.invalidateQueries({ queryKey: qk.mentorsAll });
      void qc.invalidateQueries({ queryKey: qk.educonnectCounts });
      void qc.invalidateQueries({ queryKey: ["educonnect-active-mentor"] });
    },
  });
}

export function useConfirmSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sessionId: string; meetingUrl: string }) => confirmMentorSession(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.mySessionsAll });
      void qc.invalidateQueries({ queryKey: qk.educonnectCounts });
    },
  });
}

export function useDeclineSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sessionId: string; reason?: string }) => declineMentorSession(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.mySessionsAll });
      void qc.invalidateQueries({ queryKey: qk.mentorsAll });
    },
  });
}

export function useCancelSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sessionId: string; reason?: string }) => cancelMentorSession(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.mySessionsAll });
      void qc.invalidateQueries({ queryKey: qk.mentorsAll });
      void qc.invalidateQueries({ queryKey: qk.educonnectCounts });
    },
  });
}

export function useCompleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => completeMentorSession(sessionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.mySessionsAll });
      void qc.invalidateQueries({ queryKey: qk.mentorsAll });
      void qc.invalidateQueries({ queryKey: qk.educonnectCounts });
    },
  });
}

export function useUpdateMentorAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { mentorId: string; slots: Parameters<typeof updateMentorAvailability>[1] }) =>
      updateMentorAvailability(input.mentorId, input.slots),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["educonnect-active-mentor"] });
      void qc.invalidateQueries({ queryKey: qk.mentorsAll });
    },
  });
}

// ─── Opportunities ──────────────────────────────────────────────────────────

export function useOpportunities(filter: OpportunityFilter = {}) {
  return useQuery({
    queryKey: qk.opportunities(filter as Record<string, unknown>),
    queryFn: () => listPublicOpportunities(filter),
  });
}

export function useOpportunityDetail(slug: string) {
  return useQuery({
    queryKey: qk.opportunity(slug),
    queryFn: () => getOpportunityBySlug(slug),
    enabled: !!slug,
  });
}

export function useSavedOpportunities() {
  return useQuery({
    queryKey: qk.mySavedOpportunities,
    queryFn: () => listSavedOpportunities(),
  });
}

export function useToggleSaveOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slugOrId: string) => toggleSaveOpportunity(slugOrId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.opportunitiesAll });
      void qc.invalidateQueries({ queryKey: qk.mySavedOpportunities });
      void qc.invalidateQueries({ queryKey: qk.educonnectCounts });
    },
  });
}

// ─── Stats & Counts ─────────────────────────────────────────────────────────

export function useEduconnectCounts() {
  return useQuery({
    queryKey: qk.educonnectCounts,
    queryFn: () => getEduconnectCounts(),
  });
}

// ─── KitBox ─────────────────────────────────────────────────────────────────

export function useKitboxPackages(includeArchived = false) {
  return useQuery({
    queryKey: [...qk.kitboxPackages, includeArchived],
    queryFn: () => listKitboxPackages(includeArchived),
  });
}

export function useKitboxImpact() {
  return useQuery({
    queryKey: qk.kitboxImpact,
    queryFn: () => getKitboxImpact(),
  });
}

export function useMyKitbox() {
  return useQuery({
    queryKey: qk.myKitbox,
    queryFn: () => ({
      requests: listMyKitboxRequests(),
      donations: listMyKitboxDonations(),
    }),
  });
}

export function useSubmitKitboxRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<typeof submitKitboxRequest>[0]) => submitKitboxRequest(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.myKitbox });
      void qc.invalidateQueries({ queryKey: qk.kitboxPackages });
      void qc.invalidateQueries({ queryKey: qk.kitboxImpact });
    },
  });
}

export function useCancelKitboxRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => cancelKitboxRequest(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.myKitbox });
    },
  });
}

export function useSubmitKitboxDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<typeof submitKitboxDonation>[0]) => submitKitboxDonation(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.myKitbox });
      void qc.invalidateQueries({ queryKey: qk.kitboxImpact });
    },
  });
}

export function useCancelKitboxDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => cancelKitboxDonation(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.myKitbox });
      void qc.invalidateQueries({ queryKey: qk.kitboxImpact });
    },
  });
}

// ─── Admin Hooks ────────────────────────────────────────────────────────────

export function useAdminMentors() {
  return useQuery({
    queryKey: qk.admin.list("mentoring"),
    queryFn: () => adminListMentors(),
  });
}

export function useAdminUpsertMentor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<typeof adminUpsertMentor>[0]) => adminUpsertMentor(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.admin.area("mentoring") });
      void qc.invalidateQueries({ queryKey: qk.mentorsAll });
    },
  });
}

export function useAdminOpportunities() {
  return useQuery({
    queryKey: qk.admin.list("opportunities"),
    queryFn: () => adminListOpportunities(),
  });
}

export function useAdminUpsertOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<typeof adminUpsertOpportunity>[0]) => adminUpsertOpportunity(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.admin.area("opportunities") });
      void qc.invalidateQueries({ queryKey: qk.opportunitiesAll });
      void qc.invalidateQueries({ queryKey: qk.mySavedOpportunities });
    },
  });
}

export function useAdminUpdateKitboxRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<typeof adminUpdateKitboxRequestStatus>[0]) =>
      adminUpdateKitboxRequestStatus(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.myKitbox });
      void qc.invalidateQueries({ queryKey: qk.kitboxPackages });
      void qc.invalidateQueries({ queryKey: qk.kitboxImpact });
    },
  });
}

export function useAdminUpdateKitboxDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<typeof adminUpdateKitboxDonationStatus>[0]) =>
      adminUpdateKitboxDonationStatus(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.myKitbox });
      void qc.invalidateQueries({ queryKey: qk.kitboxImpact });
    },
  });
}

export function useAdminUpsertKitboxPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<typeof adminUpsertKitboxPackage>[0]) => adminUpsertKitboxPackage(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.kitboxPackages });
    },
  });
}

export function useResetEduconnectDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => resetDemoData(),
    onSuccess: () => {
      void qc.invalidateQueries();
    },
  });
}
