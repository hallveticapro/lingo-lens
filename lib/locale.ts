const localeSlugAliases: Record<string, string> = {
  latam: "es-419",
  "es-419": "es-419"
};

const localeTagSlugs: Record<string, string> = {
  "es-419": "latam"
};

export function localeSlugToTag(slug: string) {
  return localeSlugAliases[slug.toLowerCase()] ?? slug;
}

export function localeTagToSlug(tag: string) {
  return localeTagSlugs[tag] ?? tag;
}

export function canonicalLocaleSlug(slug: string) {
  return localeTagToSlug(localeSlugToTag(slug));
}

export function isCanonicalLocaleSlug(slug: string) {
  return canonicalLocaleSlug(slug) === slug;
}
