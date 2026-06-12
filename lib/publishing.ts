import type { RightsStatus } from "@prisma/client";

const approvedRightsStatuses: RightsStatus[] = [
  "original_owned",
  "licensed",
  "public_domain_verified",
  "creative_commons_allowed",
  "government_work_verified"
];

export type PublishRights = {
  textRightsStatus: RightsStatus;
  imageRightsStatus: RightsStatus;
} | null;

export function canPublishWithRights(rights: PublishRights, requireApproval: boolean) {
  if (!requireApproval) return true;
  if (!rights) return false;
  const textApproved = approvedRightsStatuses.includes(rights.textRightsStatus);
  const imageApproved =
    rights.imageRightsStatus === "not_applicable" || approvedRightsStatuses.includes(rights.imageRightsStatus);
  return textApproved && imageApproved;
}

export function hasPublishableAdaptations(count: number) {
  return count > 0;
}
