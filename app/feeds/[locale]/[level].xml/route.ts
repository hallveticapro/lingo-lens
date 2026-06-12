import { prisma } from "@/lib/prisma";
import { levelSlugToKey } from "@/lib/level";
import { appUrl as configuredAppUrl, rssMaxItems } from "@/lib/env";
import { absoluteUrl, publicReadingUrl, rssChannelImage, rssGuid, rssImageTags, xmlEscape } from "@/lib/rss";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; level: string }> }) {
  const { locale, level } = await params;
  const levelKey = levelSlugToKey(level.replace(/\.xml$/, ""));
  const appUrl = configuredAppUrl();

  const config = await prisma.rssFeedConfig.findFirst({
    where: {
      isEnabled: true,
      targetLocale: { bcp47Tag: locale },
      readingLevel: { key: levelKey }
    },
    include: { targetLocale: true, readingLevel: true }
  });

  if (!config) {
    return new Response("Feed not found", { status: 404 });
  }

  const items = await prisma.adaptation.findMany({
    where: {
      status: "published",
      targetLocaleId: config.targetLocaleId,
      readingLevelId: config.readingLevelId
    },
    include: {
      contentItem: { include: { headerMediaAsset: true } },
      targetLocale: true,
      readingLevel: true
    },
    orderBy: { publishedAt: "desc" },
    take: Math.min(config.maxItems, rssMaxItems())
  });

  const xmlItems = items
    .map((item) => {
      const link = publicReadingUrl(appUrl, item.targetLocale.bcp47Tag, item.readingLevel.key, item.contentItem.slug);
      const description = item.summary ?? item.contentItem.sourceSubtitle ?? item.title;
      const image = item.contentItem.headerMediaAsset?.publicUrl
        ? {
            url: absoluteUrl(appUrl, item.contentItem.headerMediaAsset.publicUrl),
            mimeType: item.contentItem.headerMediaAsset.mimeType ?? "image/jpeg",
            length: item.contentItem.headerMediaAsset.fileSizeBytes
          }
        : null;
      const mediaTags = rssImageTags(image);
      return `<item>
  <title>${xmlEscape(item.title)}</title>
  <link>${xmlEscape(link)}</link>
  <guid isPermaLink="false">${xmlEscape(rssGuid(item.contentItemId, item.targetLocale.bcp47Tag, item.readingLevel.key))}</guid>
  <description>${xmlEscape(description)}</description>
  <pubDate>${(item.publishedAt ?? item.updatedAt).toUTCString()}</pubDate>
  <category>${xmlEscape(item.contentItem.contentType)}</category>
  <source url="${xmlEscape(link)}">${xmlEscape(item.contentItem.sourceName ?? "LingoLens")}</source>${mediaTags}
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>${xmlEscape(config.title)}</title>
  <link>${xmlEscape(`${appUrl}/feeds`)}</link>
  <description>${xmlEscape(config.description)}</description>
  <language>${xmlEscape(config.targetLocale.bcp47Tag)}</language>
  ${rssChannelImage(appUrl, config.title)}
  ${xmlItems}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8"
    }
  });
}
