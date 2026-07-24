export enum ApplicationStatus {
  PENDING = 'PENDING',
  SHORTLISTED = 'SHORTLISTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum InternshipTrack {
  FRONTEND_DEVELOPMENT = 'FRONTEND_DEVELOPMENT',
  BACKEND_DEVELOPMENT = 'BACKEND_DEVELOPMENT',
  MOBILE_DEVELOPMENT = 'MOBILE_DEVELOPMENT',
  UI_UX_DESIGN = 'UI_UX_DESIGN',
  DATA_ANALYTICS = 'DATA_ANALYTICS',
}

/**
 * Allowed status transitions. Business rule: an applicant cannot move
 * directly from Rejected to Accepted. All other transitions (including
 * re-opening a rejected applicant to Pending/Shortlisted) are allowed.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<
  ApplicationStatus,
  ApplicationStatus[]
> = {
  [ApplicationStatus.PENDING]: [
    ApplicationStatus.PENDING,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.SHORTLISTED]: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.PENDING,
  ],
  [ApplicationStatus.ACCEPTED]: [
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.REJECTED]: [
    ApplicationStatus.REJECTED,
    ApplicationStatus.PENDING,
    ApplicationStatus.SHORTLISTED,
    // Note: REJECTED -> ACCEPTED is intentionally NOT allowed.
  ],
};
