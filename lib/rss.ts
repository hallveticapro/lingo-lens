import { levelKeyToSlug } from "@/lib/level";

export function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function publicReadingUrl(appUrl: string, locale: string, levelKey: string, slug: string) {
  return `${appUrl}/read/${locale}/${levelKeyToSlug(levelKey)}/${slug}`;
}

export function rssGuid(contentId: string, locale: string, levelKey: string) {
  return `content:${contentId}:locale:${locale}:level:${levelKey}`;
}

export function absoluteUrl(appUrl: string, value: string) {
  return new URL(value, appUrl).toString();
}
