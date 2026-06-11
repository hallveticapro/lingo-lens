export const levelSlugs = {
  super_beginner: "super-beginner",
  beginner: "beginner",
  intermediate: "intermediate",
  natural: "natural"
} as const;

export type ReadingLevelKey = keyof typeof levelSlugs;

export function levelKeyToSlug(key: string) {
  return key.replaceAll("_", "-");
}

export function levelSlugToKey(slug: string) {
  return slug.replaceAll("-", "_");
}

export function labelInitials(key: string) {
  if (key === "super_beginner") return "SB";
  if (key === "beginner") return "B";
  if (key === "intermediate") return "I";
  return "N";
}
