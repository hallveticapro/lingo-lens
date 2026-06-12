export function levelKeyToSlug(key: string) {
  return key.replaceAll("_", "-");
}

export function levelSlugToKey(slug: string) {
  return slug.replaceAll("-", "_");
}
