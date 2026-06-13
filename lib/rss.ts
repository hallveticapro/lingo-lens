import { levelKeyToSlug } from "@/lib/level";
import { localeTagToSlug } from "@/lib/locale";

export function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function publicReadingUrl(appUrl: string, locale: string, levelKey: string, slug: string) {
  return `${appUrl}/read/${localeTagToSlug(locale)}/${levelKeyToSlug(levelKey)}/${slug}`;
}

export function rssGuid(contentId: string, locale: string, levelKey: string) {
  return `content:${contentId}:locale:${locale}:level:${levelKey}`;
}

export function absoluteUrl(appUrl: string, value: string) {
  return new URL(value, appUrl).toString();
}

export type RssImage = {
  url: string;
  mimeType: string;
  length?: number | null;
};

export function rssImageTags(image: RssImage | null) {
  if (!image) return "";
  return `
  <media:content url="${xmlEscape(image.url)}" medium="image" type="${xmlEscape(image.mimeType)}" />
  <media:thumbnail url="${xmlEscape(image.url)}" />${
    image.length ? `
  <enclosure url="${xmlEscape(image.url)}" type="${xmlEscape(image.mimeType)}" length="${image.length}" />` : ""
  }`;
}

export function rssChannelImage(appUrl: string, title: string) {
  return `<image>
    <url>${xmlEscape(absoluteUrl(appUrl, "/brand/logo-mark.png"))}</url>
    <title>${xmlEscape(title)}</title>
    <link>${xmlEscape(`${appUrl}/feeds`)}</link>
  </image>`;
}
