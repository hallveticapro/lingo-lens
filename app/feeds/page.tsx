import Link from "next/link";
import { Rss } from "lucide-react";
import { CopyFeedButton } from "@/components/CopyFeedButton";
import { PublicShell } from "@/components/PublicChrome";
import { appUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { levelKeyToSlug } from "@/lib/level";
import { absoluteUrl } from "@/lib/rss";

export const dynamic = "force-dynamic";

export default async function FeedsPage() {
  const baseUrl = appUrl();
  const configs = await prisma.rssFeedConfig.findMany({
    where: { isEnabled: true, targetLocale: { bcp47Tag: "es-419" } },
    include: { targetLocale: true, readingLevel: true },
    orderBy: { readingLevel: { sortOrder: "asc" } }
  });

  return (
    <PublicShell>
      <section className="section-band">
        <div className="container">
          <h1 className="page-title" style={{ fontSize: 58, margin: 0 }}>
            Subscribe by reading level.
          </h1>
          <p className="dek" style={{ textAlign: "left", margin: "18px 0 0" }}>
            Follow exactly the Spanish level you want. Each feed item points to one published
            adaptation, with stable GUIDs that do not change after small edits.
          </p>
          <div className="feed-grid">
            {configs.map((config) => {
              const href = `/feeds/${config.targetLocale.bcp47Tag}/${levelKeyToSlug(
                config.readingLevel.key
              )}.xml`;
              const fullUrl = absoluteUrl(baseUrl, href);
              return (
                <article className="feed-card" key={config.id}>
                  <p className="kicker">{config.targetLocale.displayNameEn}</p>
                  <h2 className="section-title">{config.readingLevel.displayName}</h2>
                  <p className="muted">{config.description}</p>
                  <p className="input feed-url">
                    {fullUrl}
                  </p>
                  <div className="button-row" style={{ justifyContent: "flex-start" }}>
                    <Link className="btn btn-primary" href={href}>
                      <Rss size={16} /> Open Feed
                    </Link>
                    <CopyFeedButton url={fullUrl} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
